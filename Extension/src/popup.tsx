import React, {
  useEffect, useRef, useState,
} from 'react';
import ReactDOM from 'react-dom';
import './styles/style.css';

import { AuthEnum } from './types/auth.enum';
import { setAuthToken, setBaseURL } from './utils/API/config';
import { createSession } from './utils/API';
import { Actions } from './types/actions.enum';
import { ServerWSResponse } from './types/serverTypes.type';
import { tabRedirect } from './utils/tabRedirect';

setBaseURL('http://localhost:3000');

const Popup = () => {
  const [token, setToken] = useState<string | null>(null);
  const [sessionID, setSessionID] = useState<string>();
  const [sessionURL, setSessionURL] = useState<string>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const sessionRef = useRef<HTMLInputElement>();

  const joinToRoom = (room: string | undefined) => {
    if (room != null) chrome.runtime.sendMessage({ type: Actions.JOIN, payload: { room } });
  };

  const leaveFromRoom = (room: string | undefined) => {
    if (room != null) chrome.runtime.sendMessage({ type: Actions.LEAVE, payload: { room } });
  };

  useEffect(() => {
    chrome.storage.sync.get('session', (value) => {
      if (value != null) {
        const { session } = value || {};
        const { id: roomIDFromStorage, url: urlFromStorage, isAdmin: isAdminFromStorage } = session || {};
        if (roomIDFromStorage != null) setSessionID(roomIDFromStorage);
        if (urlFromStorage != null) setSessionURL(urlFromStorage);
        if (isAdminFromStorage != null) setIsAdmin(isAdminFromStorage);
      }
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === ServerWSResponse.JOINED_ROOM) {
        const { room, url: sessionPayloadURL } = msg.payload;
        setSessionID(room);
        setSessionURL(sessionPayloadURL);

        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const { url } = tabs[0];

          if (url !== msg.payload.url) return tabRedirect(msg.payload.url);

          chrome.tabs.query({ active: true, currentWindow: true }, (chromeTabs) => {
            if (chromeTabs[0]?.id) {
              chrome.tabs.sendMessage(chromeTabs[0].id, { type: Actions.DETECT, payload: { room: msg.payload.room } });
            }
          });

          return true;
        });
      } else if (msg.type === ServerWSResponse.LEFT_ROOM) {
        chrome.storage.sync.remove('session', () => {
          setSessionURL(undefined);
          setSessionID(undefined);
          setIsAdmin(false);
        });
      }
    });

    chrome.runtime.sendMessage({ type: AuthEnum.GET_TOKEN }, (res) => {
      setToken(res);
      setAuthToken(res);

      return true;
    });
  }, []);

  const onCreate = () => {
    if (token) {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const { url } = tabs[0];

        if (url) {
          createSession({ url }).then(({ data: { id } }) => {
            chrome.storage.sync.set({ session: { id, url } }, () => setSessionID(id));
          });
        }
      });
    }
  };

  const onJoin = () => joinToRoom(sessionRef?.current?.value);
  const onLeave = () => leaveFromRoom(sessionID);

  const redirectToSession = () => tabRedirect(sessionURL);

  return (
    <main className="popup">
      { sessionID != null && <div className="sessionID">{sessionID}</div> }
      <div className="sessionForm">
        { token != null && <button className="button field" type="button" onClick={onCreate}>Создать сессию</button> }
        { sessionURL != null && <button onClick={redirectToSession} type="button" className="button field">Перейти к сессии</button> }
        <input className="input field" type="string" placeholder="ID сессии" ref={sessionRef as any} />
        <button className="button field" type="button" onClick={onJoin}>Подключиться</button>
        { sessionID != null && <button onClick={onLeave} className="button buttonSecondary field" type="button">Отключиться</button> }
      </div>
    </main>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById('root'),
);
