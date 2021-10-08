import { Socket } from 'socket.io-client';
import { Actions, VideoActions } from './types/actions.enum';

import { AuthEnum } from './types/auth.enum';
import { connect } from './utils/createWS';
import { ServerWSResponse } from './types/serverTypes.type';

let isAdmin = false;
let sessionURL: undefined | string;
let sessionID: undefined | string;

const sendMessageToContent = (msg: any | null) => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) chrome.tabs.sendMessage(tab.id, msg);
    });
  });
};

const messageToPopUp = (msg: any) => {
  chrome.runtime.sendMessage(msg);
};

const clearStorage = () => chrome.storage.sync.clear();

const onOpen = (ws: Socket) => {
  console.info('Подключено');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { payload } = message;

    switch (message.type) {
      case AuthEnum.GET_TOKEN:
        sendResponse(null);
        break;
      case Actions.JOIN:
        ws.emit('join', { room: payload.room }, null, ({ payload: returnedPayload }: { payload: any}) => {
          messageToPopUp({ type: ServerWSResponse.JOINED_ROOM, payload: returnedPayload });

          const { room, url, isAdmin: returnedIsAdmin } = returnedPayload;

          sessionURL = url;
          isAdmin = returnedIsAdmin;
          sessionID = room;

          const value = { id: room, url, isAdmin: returnedIsAdmin };

          chrome.storage.sync.set({ session: value });
        });
        sendResponse(payload.room);
        break;
      case Actions.LEAVE:
        ws.emit('leave', { room: payload.room }, null, () => {
          messageToPopUp({ type: ServerWSResponse.LEFT_ROOM });

          sessionURL = undefined;
          sessionID = undefined;
          isAdmin = false;
        });
        break;
      case VideoActions.PROGRESS:
        if (isAdmin) {
          ws.emit(message.type, payload);
        }

        break;
      default:
        ws.emit(message.type, payload);
        break;
    }
  });
};

const onClose = (ws: Socket, reason: any) => {
  if (reason === 'io server disconnect') {
    clearStorage();
    ws.close();
  }
};

const tokens = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsZm9yZXN0eEBnbWFpbC5jb20iLCJpYXQiOjE2MzM3MzE2NjYsImV4cCI6MTYzMzczNDA2Nn0.AaDLsMrx4I80YNZPIe7xY7DVlbQxk7i1lpByjk3qrhY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsZm9yZXN0eEBnbWFpbC5jb20iLCJpYXQiOjE2MzM3MjU5ODksImV4cCI6MTYzMzcyODM4OX0.m9wXlytQdRex-WFp2aDqWD-P-x17EuZvRe4O6Fr213213'];
const token = tokens[Math.floor(Math.random() * tokens.length)];
console.log(token);

const socket = connect('http://localhost:3000', {
  query: { token },
  connectTimeout: 5000,
}, {
  onOpen,
  onClose,
});

socket.on('pause', () => {
  sendMessageToContent({ type: VideoActions.PAUSE });
});

socket.on('play', () => {
  sendMessageToContent({ type: VideoActions.PLAY });
});

socket.on('progress', ({ time }) => {
  sendMessageToContent({ type: VideoActions.PROGRESS, time });
});

chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (tab.url === sessionURL) {
      chrome.tabs.sendMessage(tabId, {
        type: Actions.DETECT,
        payload: {
          room: sessionID,
        },
      });
    }
  },
);

// Clear all sessions on starting
chrome.runtime.onStartup.addListener(() => clearStorage());
chrome.runtime.onInstalled.addListener(() => clearStorage());
