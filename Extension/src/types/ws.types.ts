import { Socket } from 'socket.io-client';

export interface WSHandlers {
    onOpen?: (ws: Socket) => void
    onMessage?: (ws: Socket, message: MessageEvent) => void
    onClose?: (websocket: Socket, reason: Socket.DisconnectReason) => void
    onError?: (ws: Socket) => void
}
