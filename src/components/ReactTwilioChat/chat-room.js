import React, { useState, useEffect, useContext, useRef } from "react";
import ChatMessageItem from "./chat-message-item";

import PropTypes from "prop-types";
import UseChatService from "../../services/chat-service";

const ReactTwilioChat = ( ) => {
  const {
    channelMessages,
    channelUsers,
    sendMessage,
    newMessageIndex,
    onScrollChat,
    messageListRef,
    accountLoginAvatarToken,
    clearUnreadMessage,
    unreadMessageCount,
    chatErrorInfo
  } = UseChatService({ identity: "ida" });

  if (!channelMessages && !chatErrorInfo) {
    return (
      <div className={`room-tab-container chat-tab`}>
        loading...
      </div>
    );
  }

  return (
    <div className={`room-tab-container chat-tab`}>
      {chatErrorInfo ? (
        chatErrorInfo
      ) : (
        <>
          <div
            className="message-list-container d-flex flex-column pt-2"
            ref={messageListRef}
            onScroll={onScrollChat}
          >
            <div className="dummy-box"></div>
            {unreadMessageCount > 0 && (
              <div
                className="new-message-bar text-center"
                onClick={async () => {
                  await clearUnreadMessage();
                }}
              >
                {unreadMessageCount} new message
                <i className="fas fa-arrow-down ml-2 font-10px"></i>
              </div>
            )}

            {channelMessages.length > 0 &&
              channelMessages.map((message, index) => {
                return (
                  <ChatMessageItem
                    displayNewMessageIndex={newMessageIndex}
                    key={index}
                    message={message}
                    lastMessageIndex={
                      channelMessages[channelMessages.length - 1].index
                    }
                  />
                );
              })}
          </div>
          {/* {roomDetail && roomDetail.Status !== RoomStatus.Closed && (
            <MessageSendContainer
              channelUsers={channelUsers}
              accountLoginAvatarToken={accountLoginAvatarToken}
              sendMessage={sendMessage}
            />
          )} */}
        </>
      )}
    </div>
  );
};

const MessageSendContainer = ({
  channelUsers,
  accountLoginAvatarToken,
  sendMessage
}) => {
  const [openUserSelector, setOpenUserSelector] = useState(false);
  const [openEmojiSelector, setOpenEmojiSelector] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const onChoseUser = user => {
    setInputValue(`${inputValue} @${user.Name} `);
    setOpenUserSelector(false);
    inputRef.current.focus();
  };

  const onSendClick = async () => {
    if (inputValue.length === 0) {
      return;
    }

    setInputValue("");

    const messageAttributes = { accountLoginAvatarToken };

    await sendMessage(inputValue, messageAttributes);

    setOpenUserSelector(false);
  };

  const onSelectEmoji = inputValue => {
    setInputValue(inputValue);
    setOpenEmojiSelector(false);
    inputRef.current.focus();
  };
  return (
    <div className="message-send-container">
      <div className="d-flex">
        <div
          className="send-button mention action-button-light-gray-none"
          onClick={() => setOpenUserSelector(!openUserSelector)}
        >
          <span className="text-muted">@</span>
        </div>

        <div
          className="send-button emoji action-button-light-gray-none"
          onClick={() => setOpenEmojiSelector(!openEmojiSelector)}
        >
          <span className="text-muted">
            <i className="fal fa-smile"></i>
          </span>
        </div>

        <input
          ref={inputRef}
          className="message-input"
          placeholder="Type your message to the room here."
          type="textarea"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") onSendClick();
          }}
        />

        <div
          className="send-button send action-button-light-gray-none"
          onClick={onSendClick}
        >
          <span className="text-muted">Send</span>
        </div>
      </div>
      {/* 
      <EmojiSelector
        openEmojiSelector={openEmojiSelector}
        onSelectEmoji={onSelectEmoji}
        currentInputValue={inputValue}
        onCloseClick={() => setOpenEmojiSelector(false)}
      /> */}

      {openUserSelector && (
        <ChannelUserSelector
          channelUsers={channelUsers}
          onChoseUser={onChoseUser}
          onCloseClick={() => setOpenUserSelector(false)}
        />
      )}
    </div>
  );
};

// const EmojiSelector = ({
//   openEmojiSelector,
//   onSelectEmoji,
//   currentInputValue,
//   onCloseClick
// }) => {
//   const preValue = useRef(currentInputValue);

//   useEffect(() => {
//     preValue.current = currentInputValue;
//   }, [currentInputValue]);

//   return (
//     <div
//       className={`select-container emoji-select-container ${
//         openEmojiSelector ? "" : "hidden"
//       }`}
//     >
//       <div className="close-button" onClick={onCloseClick}>
//         <i className="fal fa-times"></i>
//       </div>
//       <Picker
//         onEmojiClick={(e, chosenEmoji) => {
//           onSelectEmoji(preValue.current + chosenEmoji.emoji);
//         }}
//         skinTone={SKIN_TONE_MEDIUM_DARK}
//       />
//     </div>
//   );
// };

const ChannelUserSelector = ({
  channelUsers = [],
  onChoseUser,
  onCloseClick
}) => {
  return (
    <>
      <div className="select-container user-select-container shadow p-4 mp-scroll-bar">
        <div className="close-button" onClick={onCloseClick}>
          <i className="fal fa-times"></i>
        </div>
        {channelUsers.map((user, index) => {
          if (!user.IsDeleted) {
            return (
              <div
                key={index}
                className="user-select-item hover-pointer p-2 border-bottom hover-bg-info"
                onClick={() => onChoseUser(user)}
              >
                {user.Name}
              </div>
            );
          }
        })}
      </div>
    </>
  );
};

ReactTwilioChat.propTypes = {
  className: PropTypes.string
};

export default ReactTwilioChat;
