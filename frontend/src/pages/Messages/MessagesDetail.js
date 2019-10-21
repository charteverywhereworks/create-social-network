import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@apollo/react-hooks';

import { LoadingDots } from 'components/Loading';
import MessageConversation from './MessagesConversation';
import MessagesDetailHeading from './MessagesDetailHeading';

import { GET_MESSAGES, GET_MESSAGES_SUBSCRIPTION } from 'graphql/messages';
import { GET_USER } from 'graphql/user';

import * as Routes from 'routes';

const Root = styled.div`
  width: 100%;
  height: 100%;
`;

const MessagesDetail = ({ match, authUser }) => {
  const { data, loading } = useQuery(GET_USER, {
    variables: { id: match.params.userId },
    skip: match.params.userId === Routes.NEW_ID_VALUE,
  });

  const {
    subscribeToMore,
    data: messages,
    loading: messagesLoading,
  } = useQuery(GET_MESSAGES, {
    variables: { authUserId: authUser.id, userId: match.params.userId },
    skip: match.params.userId === Routes.NEW_ID_VALUE,
  });

  useEffect(() => {
    const subscribeToNewMessages = () => {
      return subscribeToMore({
        document: GET_MESSAGES_SUBSCRIPTION,
        variables: { authUserId: authUser.id, userId: match.params.userId },
        skip: match.params.userId === Routes.NEW_ID_VALUE,
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;

          // Check if are not duplicating
          const msgId = subscriptionData.data.messageCreated.id;
          let prevMsgId = null;
          if (prev.getMessages && prev.getMessages.length > 0) {
            prevMsgId = prev.getMessages[prev.getMessages.length - 1].id;
          }
          if (msgId === prevMsgId) return prev;

          // Merge messages
          const newMessage = subscriptionData.data.messageCreated;
          const mergedMessages = [...prev.getMessages, newMessage];

          return { getMessages: mergedMessages };
        },
      });
    };

    subscribeToNewMessages();
  }, [authUser.id, match.params.userId, subscribeToMore]);

  if (loading || messagesLoading) {
    return (
      <Root>
        <LoadingDots />
      </Root>
    );
  }

  let chatUser = null;
  if (data && data.getUser) {
    chatUser = data.getUser;
  }

  return (
    <Root>
      <MessagesDetailHeading match={match} chatUser={chatUser} />

      <MessageConversation
        authUser={authUser}
        messages={messages ? messages.getMessages : []}
        chatUser={chatUser}
        data={messages}
        match={match}
      />
    </Root>
  );
};

MessagesDetail.propTypes = {
  match: PropTypes.object.isRequired,
  authUser: PropTypes.object.isRequired,
};

export default MessagesDetail;
