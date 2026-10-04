import React from 'react';
import RateDoerScreen from './rate-doer';

export default function RateRequesterScreen(props) {
  return <RateDoerScreen forcedTarget="requester" {...props} />;
}
