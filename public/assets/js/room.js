import { registerSocketEvents } from "./wss.js";

// init socket connection
const socket = io("/");

// register socket events
registerSocketEvents(socket);
