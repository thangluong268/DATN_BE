export const WS_EVENT = {
  CONVERSATION: {
    SEND_MESSAGE: 'sendMessage',
    GET_CONVERSATION: 'getConversation',
    GET_PREVIEW_CONVERSATIONS: 'getPreviewConversations',
    DELETE_MESSAGE: 'deleteMessage',
    COUNT_UNREAD: 'countUnread',
    IS_TYPING: 'isTyping',
    IS_ONLINE: 'isOnline',
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',
  },
  NOTIFICATION: {
    SEND_NOTIFICATION: 'sendNotification',
    GET_NOTIFICATIONS: 'getNotifications',
    READ_NOTIFICATION: 'readNotification',
    JOIN_ROOM_NOTIFICATION: 'joinRoomNotification',
    COUNT_NEW_NOTIFICATIONS: 'countNewNotifications',
    SENT_ADD_FRIEND_NOTIFICATION: 'sendAddFriendNotification',
  },
};
