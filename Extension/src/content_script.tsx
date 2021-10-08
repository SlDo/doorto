import { Actions, VideoActions } from './types/actions.enum';

let video: HTMLVideoElement | null;
const listeners = new Map();

let isAdmin = false;

chrome.storage.sync.get('session', (value) => {
  if (value != null) {
    const { session } = value || {};
    const { isAdmin: isAdminFromStorage } = session;

    isAdmin = session;
  }
});

const createHandlers = (roomID: string) => {
  let status = VideoActions.PAUSE;
  video = document.querySelector('video');

  const onPlay = (room: string) => (e: any) => {
    status = VideoActions.PLAY;
    chrome.runtime.sendMessage({ type: VideoActions.PLAY, payload: { room } });
  };

  const onPause = (room: string) => (e: any) => {
    status = VideoActions.PAUSE;
    chrome.runtime.sendMessage({ type: VideoActions.PAUSE, payload: { room } });
  };

  if (video != null) {
    if (!listeners.get(video)) {
      video.addEventListener('play', onPlay(roomID));
      video.addEventListener('pause', onPause(roomID));
      if (!video.paused) video.pause();
    }

    listeners.set(video, true);

    setInterval(() => {
      if (status !== VideoActions.PAUSE) {
        chrome.runtime.sendMessage({
          type: VideoActions.PROGRESS,
          payload: {
            time: video?.currentTime,
            room: roomID,
          },
        });
      }
    }, 1000);
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === Actions.DETECT) {
    chrome.storage.sync.get('session', (value) => {
      if (value != null) {
        const { session } = value || {};
        const { url } = session;

        // eslint-disable-next-line no-restricted-globals
        if (url === location.href) {
          if (document.readyState !== 'complete') {
            const handler = () => createHandlers(msg.payload.room);
            window.addEventListener('load', handler);
          } else {
            createHandlers(msg.payload.room);
          }
        }
      }
    });
  }

  if (msg.type === VideoActions.PLAY) video?.play();
  if (msg.type === VideoActions.PAUSE) video?.pause();
  if (msg.type === VideoActions.PROGRESS) {
    if (video?.currentTime != null && Math.abs(video?.currentTime - msg.time) > 2 && !isAdmin) {
      video.currentTime = msg.time;
    }
  }
});
