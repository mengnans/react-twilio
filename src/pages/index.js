import React from "react";
import { render } from "react-dom";
import ReactTwilioChat from "@components/ReactTwilioChat";

const chatContainer = document.getElementById("react-twilio-chat-container");

if (chatContainer) {
  render(<ReactTwilioChat />, chatContainer);
}
