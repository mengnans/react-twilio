import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const UseRoomNotificationService = ({ twilioClient }) => {
  const [roomNotifications, setRoomNotifications] = useState({});
  const roomNotificationsRef = useRef({});

  useEffect(() => {
    if (twilioClient) {
      initRoomNotifications();

      twilioClient.on('channelUpdated', onChannelUpdated);
      twilioClient.on('channelLeft', onChannelLeft);
    }

    return () => {
      twilioClient && twilioClient.removeAllListeners();
    };
  }, [twilioClient]);

  const initRoomNotifications = async () => {
    const subscribeChannels = await twilioClient.getSubscribedChannels();

    if (subscribeChannels?.items ?? [].length > 0) {
      for (const channel of subscribeChannels.items) {
        const channelIdentifier = channel.sid;
        const unConsumedMessagesCount = getUnconsumedMessagesCount(channel);

        updateNotifications(
          channelIdentifier,
          channel.friendlyName,
          unConsumedMessagesCount,
          roomNotificationsRef.current
        );
      }
    }
  };

  const onChannelLeft = async (channel) => {
    let roomNotifications = roomNotificationsRef.current;

    const channelIdentifier = channel.sid;
    const channelNotificationInfo = roomNotifications[channelIdentifier];

    if (channelNotificationInfo) {
      delete roomNotifications[channelIdentifier];
      setRoomNotifications({ ...roomNotifications });
    }
  };

  const onChannelUpdated = async (e) => {
    const channel = e.channel;
    const updateReasons = e.updateReasons;

    const isOwnLastMessage = false;

    if (updateReasons && updateReasons.indexOf('lastMessage') > -1) {
      const lastMessage = e.channel.lastMessage;
      const user = await twilioClient.user;
      if (lastMessage.author === user.identity) {
        isOwnLastMessage = true;
      }
    }
    if (
      updateReasons &&
      (updateReasons.indexOf('lastConsumedMessageIndex') > -1 ||
        !isOwnLastMessage)
    ) {
      const channelIdentifier = channel.sid;
      const friendlyName = channel.friendlyName;
      const unConsumedMessagesCount = getUnconsumedMessagesCount(channel);

      updateNotifications(
        channelIdentifier,
        friendlyName,
        unConsumedMessagesCount,
        roomNotificationsRef.current
      );
    }
  };

  const updateNotifications = (
    channelIdentifier,
    roomName,
    unConsumedMessagesCount,
    roomNotifications
  ) => {
    if (unConsumedMessagesCount && unConsumedMessagesCount > 0) {
      let currentRoomNotifications = roomNotifications[channelIdentifier];

      currentRoomNotifications = currentRoomNotifications
        ? { ...currentRoomNotifications, unConsumedMessagesCount }
        : { roomName, unConsumedMessagesCount };

      roomNotifications[channelIdentifier] = currentRoomNotifications;
    } else {
      delete roomNotifications[channelIdentifier];
    }
    setRoomNotifications({ ...roomNotifications });
    roomNotificationsRef.current = { ...roomNotifications };
  };

  const getUnconsumedMessagesCount = (channel) => {
    if (!channel) return 0;
    const lastMessageIndex = channel.lastMessage.index || 0;
    const lastConsumedMessageIndex = channel.lastConsumedMessageIndex || 0;

    return lastMessageIndex - lastConsumedMessageIndex;
  };

  return { roomNotifications };
};

UseRoomNotificationService.propTypes = {
  twilioClient: PropTypes.object,
};

export default UseRoomNotificationService;
