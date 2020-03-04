import React, { useState, useEffect } from "react";
import twilio from "twilio";
import Client from 'twilio-chat';

const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const credentials = require("./credentials.json");

const UseTwilioClientService = ({ identity }) => {
  const [twilioClient, setTwilioClient] = useState(null);

  useEffect(() => {
    initClient().then(client => {
      client && setTwilioClient(client);
    });

    return () => {
      twilioClient && twilioClient.removeAllListeners();
    };
  }, []);

  const initClient = async () => {
    const generatedToken = createToken(identity);    

    if (generatedToken) {
      const client = await Client.create(generatedToken);

      client.on("tokenAboutToExpire", async () => {
        const newToken = await createToken(identity);
        newToken && client.updateToken(newToken);
      });

      return client;
    }

    return null;
  };

  /**
   * create token for current channel member
   */
  const createToken = identity => {
    const chatGrant = new ChatGrant({
      serviceSid: credentials.serviceSid
    });

    const token = new AccessToken(
      credentials.accountSid,
      credentials.signingKeySid,
      credentials.signingKeySecret
    );

    token.addGrant(chatGrant);

    token.identity = identity;

    return token.toJwt();
  };

  return {
    twilioClient
  };
};

export default UseTwilioClientService;
