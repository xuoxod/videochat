import { stringify, parse } from "./utils.js";

import { log, dlog, cap, cls, tlog } from "./clientutils.js";

import {
  getElement,
  newElement,
  removeChildren,
  appendChild,
  addClickHandler,
  addHandler,
  addAttribute,
  countChildren,
  removeChild,
} from "./computils.js";

import {
  localParticipantHandler,
  remoteParticipantHandler,
  handleDisconnection,
  logConnectedParticipants,
} from "./participantmanager.js";

const rmtId = getElement("rmtid-input").value;
const roomName = getElement("roomname-input").value;
const connType = getElement("connectiontype-input").value;
const senderId = getElement("senderid-input").value;
const brand = getElement("navbar-brand");
const exitLink = getElement("exit-link");
const token = getElement("token-input").value;

const initRoom = async () => {
  brand.innerHTML = `Room ID: ${roomName}`;
  let room = null;

  if (Twilio) {
    try {
      if (connType.trim().toLowerCase() === "video") {
        room = await Twilio.Video.connect(token, {
          room: roomName,
          audio: true,
          video: { width: 640, height: 480 },
          networkQuality: {
            local: 3, // LocalParticipant's Network Quality verbosity [1 - 3]
            remote: 3, // RemoteParticipants' Network Quality verbosity [0 - 3]
          },
        });
      } else {
        room = await Twilio.Video.connect(token, {
          room: roomName,
          audio: true,
          video: false,
          networkQuality: {
            local: 3, // LocalParticipant's Network Quality verbosity [1 - 3]
            remote: 3, // RemoteParticipants' Network Quality verbosity [0 - 3]
          },
        });
      }
      return room;
    } catch (err) {
      dlog(err);
      return null;
    }
  } else {
    dlog(`No Twilio`);
    return null;
  }

  return room;
  // }
};

const connectedPeers = initRoom();

if (null != connectedPeers) {
  connectedPeers
    .then((room) => {
      log(room);

      // Handle local participant
      localParticipantHandler(room);

      // Handle remote participant connect event
      room.participants.forEach(logConnectedParticipants);

      // Handle participants connected event
      room.on("participantConnected", remoteParticipantHandler);

      // Handle participant diconnecte event
      room.on("participantDisconnected", handleDisconnection);

      // Disconnect room on page events
      window.addEventListener("pagehide", () => room.disconnect());
      window.addEventListener("beforeunload", () => room.disconnect());

      addClickHandler(exitLink, (e) => {
        room.disconnect();
      });
    })
    .catch((err) => {
      displayRoomError(err);
    });
} else {
  log(`connected peers is null`);
}

function displayRoomError(err) {
  log(`\n\ninitRoom method caused an error`);
  tlog(err);
  log(`\n\n`);
  return;
}
