import React from "react";
import PropTypes from "prop-types";

const ChatMessageItem = ({
  message,
  displayNewMessageIndex,
  lastMessageIndex
}) => {
  return (
    <>
      <div className="chat-message-card d-flex position-relative">
        {message.index === displayNewMessageIndex && (
          <div className="new-message-mark position-absolute danger-color">
            {displayNewMessageIndex === lastMessageIndex
              ? "new message"
              : "new messages"}
          </div>
        )}

        {message.displayDate && (
          <div className="display-date position-absolute info-color">
            <div className="timeStr">
              {getDateDisplayString(message.timestamp)}
            </div>
          </div>
        )}

        <div className="user-photo-container">
          <Avatar
            absoluteUrl={
              message.attributes ? message.attributes.SystemImage : null
            }
            imageToken={
              message.attributes
                ? message.attributes.accountLoginAvatarToken
                : null
            }
            defaultFontAwesomeClassName="fal text-muted font-30px fa-user-circle fa-fw login-display-avatar"
          />
        </div>

        <div className="message-content flex-fill">
          <div className="message-content-header">
            <span className="author-name mr-1">
              <strong>{message.friendlyName || message.author}</strong>
            </span>
            <span className="send-time">
              {getTimeStrWithAmPm(message.timestamp)}
            </span>
          </div>
          <div
            className="message-content-body mt-1"
            dangerouslySetInnerHTML={{
              __html: parseTextLinkToHtml(message.body)
            }}
          ></div>

          {/* {message.attributes.link && <LinkMessage />} */}
        </div>
      </div>
    </>
  );
};

ChatMessageItem.propTypes = {
  message: PropTypes.object,
  displayNewMessageIndex: PropTypes.number
};

const LinkMessage = link => {
  const onClickLink = () => {};

  return (
    <a
      className="link-message-container d-flex mt-2"
      href="https://myprosperity.com.au"
      target="_blank"
    >
      <i className="fas fa-fw fa-clipboard-list danger-color ml-2 mr-2 font-18px"></i>

      <div className="link-message-info mr-3 flex-fill">
        <div className="link-message-info-title mb-1">Will inquiry form</div>
        <div className="link-message-info-comment text-muted">
          Assigned to Rob. Not yet started
        </div>
      </div>
      <div className="link-arrow mr-2">
        <i className="fas fa-fw fa-play text-muted"></i>
      </div>
    </a>
  );
};
export default ChatMessageItem;
