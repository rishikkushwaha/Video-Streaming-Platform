import { useMemo } from 'react';
import { Plyr } from "plyr-react";
import "plyr-react/plyr.css";

const VideoPlayer = ({ src, poster }) => {
  const videoSource = useMemo(() => ({
    type: 'video',
    sources: [
      {
        src: src,
        type: 'video/mp4',
      },
    ],
    poster: poster,
  }), [src, poster]);

  const plyrOptions = {
    autoplay: false,
    muted: false,
    volume: 1,
    controls: [
      'play-large', 'play', 'progress', 'current-time',
      'mute', 'volume', 'captions', 'settings', 'pip', 'fullscreen'
    ],
    settings: ['captions', 'quality', 'speed'],
    storage: { enabled: false }
  };

  if (!src) return null;

  return (
    <div className="video-player-wrapper">
      <Plyr 
        source={videoSource} 
        options={plyrOptions} 
      />
    </div>
  );
};

export default VideoPlayer;
