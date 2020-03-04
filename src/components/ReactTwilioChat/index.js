import React, { useState, useEffect } from "react";
import UseTwilioClientService from "../../services/twilio-client-service";
import PropTypes from "prop-types";

const Index = props => {
  const [channelList, setChannelList] = useState(null);
  const { twilioClient } = UseTwilioClientService({
    identity: "ida"
  });

  useEffect(() => {
    if (twilioClient) {
      initChannelList();
    }

    return () => {
      twilioClient && twilioClient.removeAllListeners();
    };
  }, [twilioClient]);

  const initChannelList = async() => {
    const subscribeChannels = await twilioClient.getSubscribedChannels();

    if (subscribeChannels?.items ?? [].length > 0) {
      setChannelList(subscribeChannels.items)
    }
  };

  return (
    <div>
      Your channels are:
      {channelList ?channelList.map((channel, index) => {
        return <div key={index}>{channel.friendlyName}</div>;
      }): <div>Loading...</div>}
    </div>
  );
};

Index.propTypes = {};

export default Index;
