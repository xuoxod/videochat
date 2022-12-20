import { registerSocketEvents } from "./wss.js";

// init socket connection
const socket = io("/");

registerSocketEvents(socket);
