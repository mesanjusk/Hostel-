import { io, type Socket } from "socket.io-client";

import { getAuthToken } from "@/lib/api";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

/** Lazily creates (or reuses) a single authenticated Socket.IO connection for the whole app —
 * every chat window/community screen shares it rather than opening its own connection. */
export function getSocket(): Socket | null {
  const token = getAuthToken();
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
