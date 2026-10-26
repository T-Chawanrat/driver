import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      autoConnect: false,
      auth: (callback) => callback({ token: localStorage.getItem("driver_token") }),
    });
  }
  return socket;
};

export const connectSocket = () => {
  const instance = getSocket();
  if (!instance.connected) instance.connect();
  return instance;
};
