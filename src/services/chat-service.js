import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import UseTwilioClientService from "./twilio-client-service";

const PAGE_SIZE = 10;

const UseChatService = ({ identity }) => {
  const [channelMessages, setChannelMessages] = useState(null);
  const [channelUsers, setChannelUsers] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(-1);
  const [newMessageIndex, setNewMessageIndex] = useState(-1);
  const [chatErrorInfo, setChatErrorInfo] = useState(null);

  const [channel, setChannel] = useState(null);
  const [currentPageInfo, setCurrentPageInfo] = useState(null);
  const messageListRef = useRef(null);
  const channelMessagesRef = useRef(null);
  const channelUsersRef = useRef(null);

  const { twilioClient } = UseTwilioClientService({ identity });

  useEffect(() => {
    let activeChannel = null;
    if (twilioClient) {
      const channelIdentifier = "";

      initChat(channelIdentifier)
        .then(channel => {
          activeChannel = channel;
          subscribeEvent(channel, identity);
        })
        .catch(e => {
          setChatErrorInfo((e.body && e.body.message) || "error");
        });
    }

    return () => {
      activeChannel && activeChannel.removeAllListeners();
    };
  }, [twilioClient]);

  useEffect(() => {
    // when channelMessages update, update the ref
    if (channelMessages) {
      channelMessagesRef.current = channelMessages;
    }
  }, [channelMessages]);

  useEffect(() => {
    // when channelUsers update, update the ref
    if (channelUsers) {
      channelUsersRef.current = channelUsers;
    }
  }, [channelUsers]);

  /**
   * if the room is closed, get all messages from our server and display
   */
  const initMessagesForClosedRoom = () => {
    request(
      {
        url: GET_ROOM_MESSAGES,
        requireDeserialization: false,
        params: { roomId }
      },
      result => {
        const messageList = result.ChatMessages;

        if (messageList && messageList.length > 0) {
          messageList.map((message, index) => {
            const { Attributes, TimeStamp, Author, Body } = message;

            // Uniform field name
            message.attributes = JSON.parse(Attributes);
            message.timestamp = new Date(TimeStamp);
            message.author = Author;
            message.body = Body;

            // set displayDate info
            if (index === 0) {
              message.displayDate = true;
            } else {
              const preMessage = messageList[index - 1];
              if (!isSameDay(message.timestamp, preMessage.timestamp)) {
                message.displayDate = true;
              }
            }
          });
        }
        setChannelMessages(messageList);
        setScrollDown();
      }
    );
  };

  /**
   * client register and init all info of this room
   */
  const initChat = async channelId => {
    const channel = await twilioClient.getChannelBySid(channelId);

    await Promise.all([
      initMessages(channel),
      //      initChannelUsers(),
      initMessageCountInfo(channel)
    ]);

    setChannel(channel);

    return channel;
  };

  /**
   *  subscribe channel event
   */
  const subscribeEvent = channel => {
    channel.on(
      "messageAdded",
      async message => await onMessageAdd(channel, message, identity)
    );
    channel.on("updated", onChannelUpdated);
    channel.on("memberJoined", onMemberJoined);
    channel.on(
      "memberLeft",
      async member => await onMemberLeft(member, identity)
    );
  };

  const onMessageAdd = async (channel, message, identity) => {
    const isDown = isScrollDown();
    await addMessage(message);

    if (message.author === identity) {
      setScrollDown();
      setUnreadMessageCount(0);
      await channel.setAllMessagesConsumed();
    } else {
      const unConsumedMessagesCount = getUnconsumedMessagesCount(
        channel,
        message.index
      );

      if (channel.lastConsumedMessageIndex === null) {
        await channel.setAllMessagesConsumed();
        return;
      }

      setNewMessageIndex(channel.lastConsumedMessageIndex + 1);
      setUnreadMessageCount(unConsumedMessagesCount);
    }
  };

  const onChannelUpdated = async e => {
    const updateReasons = e.updateReasons;
    if (
      updateReasons &&
      updateReasons.indexOf("lastConsumedMessageIndex") > -1
    ) {
      const unConsumedMessagesCount = getUnconsumedMessagesCount(e.channel);
      setUnreadMessageCount(unConsumedMessagesCount);

      if (unConsumedMessagesCount === 0) {
        setScrollDown();
      }
    }
  };

  const onMemberJoined = async () => {
    const roomsMembers = await getRoomMembers();
    setChannelUsers([...roomsMembers]);
  };
  const onMemberLeft = async (member, identity) => {
    if (member.identity === identity) {
      setChatErrorInfo(MemberRemovedMsg);
      return;
    }

    const roomsMembers = await getRoomMembers();
    setChannelUsers([...roomsMembers]);
  };

  /**
   *  init first page messages in this room
   */
  const initMessages = async targetChannel => {
    const currentChannel = targetChannel || channel;

    const channelMessagesInfo = await currentChannel.getMessages(PAGE_SIZE);

    const channelMessagesInfoWithFriendlyName = await getMessagesWithFriendlyName(
      channelMessagesInfo
    );

    setCurrentPageInfo(channelMessagesInfoWithFriendlyName);

    setChannelMessages(channelMessagesInfoWithFriendlyName.items || []);

    setScrollDown();
  };

  /**
   * init current room members
   */
  const initChannelUsers = async () => {
    const users = await getRoomMembers();
    setChannelUsers([...users]);
  };

  /**
   * get members in this room including deleted
   */
  const getRoomMembers = async () => {};

  const getUnconsumedMessagesCount = (channel, lastIndex) => {
    if (!channel) return 0;
    const lastMessageIndex =
      (lastIndex ? lastIndex : channel.lastMessage.index) || 0;
    const lastConsumedMessageIndex = channel.lastConsumedMessageIndex || 0;

    return lastMessageIndex - lastConsumedMessageIndex;
  };

  /**
   * init current login user unread message count and new message mark index
   */
  const initMessageCountInfo = async channel => {
    const unConsumedMessagesCount = getUnconsumedMessagesCount(channel);
    setUnreadMessageCount(unConsumedMessagesCount);

    if (unConsumedMessagesCount > 0) {
      setNewMessageIndex(channel.lastConsumedMessageIndex + 1);
    }
  };

  /**
   * when current login user send message
   */
  const sendMessage = async (value, messageAttributes = {}) => {
    channel && (await channel.sendMessage(value, messageAttributes));
    setNewMessageIndex(-1);
    setUnreadMessageCount(0);
    await channel.setAllMessagesConsumed();
  };

  /**
   * subscribe scroll event
   */
  const onScrollChat = async () => {
    const $chat = messageListRef.current;
    if (!$chat) return;

    if ($chat.scrollTop === 0) {
      getMoreHistoryMessages();
    }

    if (isScrollDown() && unreadMessageCount > 0) {
      setUnreadMessageCount(0);
      await channel.setAllMessagesConsumed();
    }
  };

  const clearUnreadMessage = async () => {
    setUnreadMessageCount(0);
    setScrollDown();

    setNewMessageIndex(channel.lastConsumedMessageIndex + 1);
    await channel.setAllMessagesConsumed();
  };

  const addMessage = async message => {
    // const messageWithFriendlyName = await setMessageFriendlyName(message);
    const messageWithFriendlyName = message;

    const currentMessages = channelMessagesRef.current;
    if (!currentMessages || currentMessages.length === 0) {
      messageWithFriendlyName.displayDate = true;
      setChannelMessages([messageWithFriendlyName]);
      return;
    }

    if (
      !isSameDay(
        messageWithFriendlyName.timestamp,
        currentMessages[currentMessages.length - 1].timestamp
      )
    ) {
      messageWithFriendlyName.displayDate = true;
    }

    setChannelMessages([
      ...channelMessagesRef.current,
      messageWithFriendlyName
    ]);
  };

  /**
   * get pre page messages
   */
  const getMoreHistoryMessages = async () => {
    const $chat = messageListRef.current;
    if (!$chat) return;

    if (!channel || !currentPageInfo.hasPrevPage) {
      return;
    }

    const preScrollBottom = $chat.scrollHeight - $chat.scrollTop;

    const prevPageInfo = await currentPageInfo.prevPage();
    setCurrentPageInfo(prevPageInfo);

    if (prevPageInfo && prevPageInfo.items.length > 0) {
      const channelMessagesWithFriendlyName = await getMessagesWithFriendlyName(
        prevPageInfo
      );

      setChannelMessages([
        ...channelMessagesWithFriendlyName.items,
        ...channelMessages
      ]);

      $chat.scrollTop = $chat.scrollHeight - preScrollBottom;
    }
  };

  /**
   * get messages with user friendlyName
   */
  const getMessagesWithFriendlyName = async channelMessagesInfo => {
    if (channelMessagesInfo.items.length > 0) {
      const channelMessageList = channelMessagesInfo.items;
      await Promise.all(
        channelMessageList.map(async (message, index) => {
          if (message.index === 0) {
            message.displayDate = true;
          }
          if (index > 0) {
            const preMessageTime = channelMessageList[index - 1].timestamp;
            if (!isSameDay(message.timestamp, preMessageTime)) {
              message.displayDate = true;
            }
          }
          // await setMessageFriendlyName(message);
        })
      );

      // Handle the boundary cases
      if (
        channelMessages &&
        channelMessages.length > channelMessageList.length
      ) {
        const lastMessageTimeInCurrentPage =
          channelMessageList[channelMessageList.length - 1].timestamp;
        const firstMessageTimeInNextPage = channelMessages[0].timestamp;

        if (
          !isSameDay(firstMessageTimeInNextPage, lastMessageTimeInCurrentPage)
        ) {
          channelMessages[0].displayDate = true;
          setChannelMessages([...channelMessages]);
        }
      }
    }

    return channelMessagesInfo;
  };

  /**
   * set messages with user friendlyName
   */
  const setMessageFriendlyName = async message => {
    if (!message.memberSid) {
      // this message is from system
      message.friendlyName = message.author;
      return message;
    }

    let currentChannelUsers = channelUsersRef.current || [];

    const currentMessageUser = currentChannelUsers.find(user => {
      return user.ChatMemberIdentifier === message.author;
    });

    if (currentMessageUser && currentMessageUser.Name != null) {
      message.friendlyName = currentMessageUser.Name;
    }
    return message;
  };

  const isScrollDown = () => {
    const $chat = messageListRef.current;
    if (!$chat) return false;

    return (
      $chat.offsetHeight === $chat.scrollHeight ||
      $chat.scrollTop + $chat.offsetHeight >= $chat.scrollHeight
    );
  };

  const setScrollDown = async () => {
    const $chat = messageListRef.current;
    if (!$chat) return;

    $chat.scrollTop = $chat.scrollHeight;
  };

  return {
    channelMessages,
    sendMessage,
    channelUsers,
    unreadMessageCount,
    newMessageIndex,
    onScrollChat,
    messageListRef,
    clearUnreadMessage,
    chatErrorInfo
  };
};

UseChatService.propTypes = {
  roomId: PropTypes.number,
};

export default UseChatService;
