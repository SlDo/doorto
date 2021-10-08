import { Socket, io } from 'socket.io-client';
import { WSHandlers } from '../types/ws.types';

export const connect = (host: string, options: any, {
  onClose, onError, onMessage, onOpen,
}: WSHandlers): Socket => {
  const websocket: Socket | undefined = io(host, options);

  websocket.on('connect', () => onOpen?.(websocket!));
  websocket.on('message', (message) => onMessage?.(websocket!, message));
  websocket.on('disconnect', (reason) => onClose?.(websocket, reason));
  websocket.on('error', () => onError?.(websocket!));

  return websocket;
};
