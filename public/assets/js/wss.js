import { parse, stringify } from "./utils.js";
import { log, dlog, tlog } from "./clientutils.js";
import {
  updateUsersList,
  showMessage,
  showCallAlert,
  showCallResponse,
} from "./ui.js";

let socketIO = null,
  userDetails = {};

export const registerSocketEvents = (socket) => {
  socketIO = socket;

  socket.on("connect", () => {
    dlog(`\n\tSuccessfully connected to socket.io server\n`);
    userDetails = {};
    userDetails.uid = document.querySelector("#rmtid-input").value;
    socket.emit("registerme", userDetails);
  });

  socket.on("updateonlineuserlist", (data) => {
    const { users } = data;
    const pUsers = parse(users);
    const currentUser = document.querySelector("#rmtid-input").value;
    const currentUserBlockedList = pUsers[currentUser].blockedUsers;

    log(`Current user blocked list: ${stringify(currentUserBlockedList)}`);

    const arrUsers = [];

    for (const u in pUsers) {
      const user = pUsers[u];

      if (user._id != currentUser) {
        arrUsers.push({ ...user });
      }
    }

    const listItemClickHandler = (e) => {
      dlog(`${e.target.id} was clicked`);
      userDetails = {};
      userDetails.receiver = e.target.id.trim().split("-")[1];
      userDetails.sender = document.querySelector("#rmtid-input").value;
      userDetails.conntype = e.target.dataset.connectiontype;

      dlog(
        `Sending ${userDetails.conntype} connection request\t Sender: ${userDetails.sender} Receiver: ${userDetails.receiver}`
      );
      socket.emit("userclicked", userDetails);
    };

    updateUsersList(
      arrUsers,
      listItemClickHandler,
      detectWebcam,
      acceptCall,
      rejectCall,
      blockUser,
      userBlocked,
      currentUserBlockedList,
      unblockUser
    );
  });

  socket.on("registered", (data) => {
    const { uid } = data;
    dlog(`I am registered`);

    try {
      const xmlHttp = new XMLHttpRequest();

      xmlHttp.onload = () => {
        // location.href = `/chat/profile/create/${uid}`;

        const { status, doc, hasDoc } = parse(xmlHttp.responseText);

        if (status) {
          dlog(`chat profile created`);
          userDetails = {};
          userDetails.uid = document.querySelector("#rmtid-input").value;
          userDetails.doc = doc;
          userDetails.hasDoc = hasDoc;
          socket.emit("updateuser", userDetails);
        }
      };

      xmlHttp.open("GET", `/chat/profile/create/${uid}`);

      xmlHttp.send(true);
    } catch (err) {
      dlog(err);
      return;
    }
  });

  socket.on("clickeduser", (data) => {
    const { strUser } = data;
    const user = parse(strUser);
    userDetails = {};
    userDetails.userInfo = user;
    userDetails.alertType = `alert-info`;

    showCallAlert(userDetails);
  });

  socket.on("connectionrequested", (data) => {
    const { strUserDetails } = data;
    userDetails = parse(strUserDetails);

    const callDialog = document.querySelector(
      `#callrequest-${userDetails.user._id}`
    );
    const callRequestTitle = document.querySelector(
      `#callrequesttitle-${userDetails.user._id}`
    );

    dlog(
      `${userDetails.user.fname} is requesting a ${userDetails.conntype} connection with you`
    );

    if (callDialog) {
      callDialog.classList.add("hide");
      callRequestTitle.innerHTML = `${userDetails.user.fname} wants to connect`;
    } else {
      dlog(`No such element`);
      dlog(`#callrequest-${userDetails._id}`);
    }
  });

  socket.on("connectionrequestresponse", (data) => {
    const { responseData } = data;
    const userReponseData = parse(responseData);
    const { receiver, response, roomName, connType, sender } = userReponseData;

    // dlog(`Made it to connectionrequestresponse`);

    if (response == "accepted") {
      dlog(`User ${receiver.fname} ${response} your request`);

      userReponseData.alertType = "alert-success";
      showCallResponse(userReponseData);
      createRoom(roomName);
      userDetails = {};
      userDetails.sender = sender;
      userDetails.receiver = receiver;
      userDetails.roomName = roomName;
      userDetails.connectionType = connType;
      userDetails.from = `sender`;
      socket.emit("enterroom", userDetails);
      getRoomTokenAndEnterRoom(roomName, connType, sender, receiver._id);
    } else if (response == "rejected") {
      userReponseData.alertType = "alert-warning";
      showCallResponse(userReponseData);
    } else {
      dlog(`No response`);
    }
  });

  socket.on("enterroom", (data) => {
    userDetails = parse(data);
    const { roomName, connectionType, sender, receiver } = userDetails;
    getRoomTokenAndEnterRoom(roomName, connectionType, sender, receiver._id);
  });
};

addEventListener("beforeunload", (event) => {
  dlog(`\n\tBefore unload\n`);
  userDetails = {};
  userDetails.uid = document.querySelector("#rmtid-input").value;
  socketIO.emit("disconnectme", userDetails);
  return;
});

function detectWebcam(callback) {
  let md = navigator.mediaDevices;
  if (!md || !md.enumerateDevices) return callback(false);
  md.enumerateDevices().then((devices) => {
    callback(devices.some((device) => "videoinput" === device.kind));
  });
}

function acceptCall(senderUid, receiverUid, connType) {
  dlog(`You accepted ${senderUid}'s connection request`);
  userDetails = {};
  userDetails.sender = senderUid;
  userDetails.receiver = receiverUid;
  userDetails.connType = connType;
  socketIO.emit("callaccepted", userDetails);
}

function rejectCall(senderUid, receiverUid) {
  dlog(`You rejected ${senderUid}'s connection request`);
  userDetails = {};
  userDetails.sender = senderUid;
  userDetails.receiver = receiverUid;
  socketIO.emit("callrejected", userDetails);
}

function noResponseToCall(senderUid, receiverUid) {}

function blockUser(blockerUid, blockeeUid) {
  let xmlHttp;

  try {
    xmlHttp = new XMLHttpRequest();

    xmlHttp.open("POST", "/chat/block", true);

    xmlHttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );

    xmlHttp.onload = () => {
      const responseText = xmlHttp.responseText;

      if (responseText) {
        // log(`\n\tResponse Text: ${stringify(responseText)}\n`);
        const responseJson = parse(responseText);
        const status = responseJson.status;

        if (status) {
          dlog(`${blockerUid} blocked ${blockeeUid}`);
          userDetails = {};
          userDetails.blocker = blockerUid;
          userDetails.blockee = blockeeUid;
          socketIO.emit("iblockedauser", userDetails);
        } else {
          dlog(`Something went wrong blocking user`);
        }
        return;
      }
    };

    xmlHttp.send(`blocker=${blockerUid}&blockee=${blockeeUid}`, true);
  } catch (err) {
    tlog(err);
    return;
  }
}

function createRoom(roomName) {
  let xmlHttp;

  try {
    xmlHttp = new XMLHttpRequest();

    xmlHttp.open("POST", "/chat/room/create", true);

    xmlHttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );

    xmlHttp.onload = () => {
      const responseText = xmlHttp.responseText;

      if (responseText) {
        // log(`\n\tResponse Text: ${stringify(responseText)}\n`);
        const responseJson = parse(responseText);
        const status = responseJson.status;

        if (status) {
          dlog(
            `room:\t${roomName} successfully created.`,
            "createRoom xhr post"
          );
        } else {
          const cause = responseJson.cause;
          const detail = responseJson.detail;
          const err = responseJson.err;

          dlog(
            `Cause:\t${cause}\nDetails:\t${detail}\nError:\n\t${err}\n\n`,
            `createRoom xhr post`
          );
        }
        return;
      }
    };

    xmlHttp.send(`roomName=${roomName}`, true);
  } catch (err) {
    tlog(err);
    return;
  }
}

function getRoomTokenAndEnterRoom(
  roomName,
  connectionType,
  senderId,
  receiverId
) {
  let xmlHttp;

  try {
    xmlHttp = new XMLHttpRequest();

    xmlHttp.open("POST", `/chat/room/gettoken`);

    xmlHttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );

    xmlHttp.onload = () => {
      const responseText = xmlHttp.responseText;

      if (responseText) {
        // log(`\n\tResponse Text: ${stringify(responseText)}\n`);
        const responseJson = parse(responseText);
        const status = responseJson.status;
        const _roomName = responseJson.roomName;
        const _connectionType = responseJson.connectionType;
        const _senderId = responseJson.senderId;
        const _receiverId = responseJson.receiverId;
        const _token = responseJson.token;

        if (status) {
          dlog(
            `roomName:\t${_roomName}\nConn Type:\t${_connectionType}\nSender:\t${_senderId}\nReceiver:\t${_receiverId}\nToken:\t${_token}\n`,
            "sender xhr request"
          );

          location.href = `/chat/room/connect?roomName=${roomName}&connectionType=${connectionType}&senderId=${senderId}&receiverId=${receiverId}&token=${_token}`;
        }
      }
    };

    xmlHttp.send(
      `roomName=${roomName}&connectionType=${connectionType}&senderId=${senderId}&receiverId=${receiverId}`,
      true
    );
  } catch (err) {
    tlog(err);
    return;
  }
}

function cloakMe() {
  dlog(`Going invisible`);
}

function userBlocked(arrList, uid) {
  const index = arrList.findIndex((x) => x == uid);
  return index != -1;
}

function unblockUser(blockerUid, blockeeUid) {
  let xmlHttp;

  try {
    xmlHttp = new XMLHttpRequest();

    xmlHttp.open("POST", "/chat/unblock", true);

    xmlHttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );

    xmlHttp.onload = () => {
      const responseText = xmlHttp.responseText;

      if (responseText) {
        // log(`\n\tResponse Text: ${stringify(responseText)}\n`);
        const responseJson = parse(responseText);
        const status = responseJson.status;

        if (status) {
          dlog(`${blockerUid} unblocked ${blockeeUid}`);
          userDetails = {};
          userDetails.blocker = blockerUid;
          userDetails.blockee = blockeeUid;
          socketIO.emit("iunblockedauser", userDetails);
        } else {
          dlog(`Something went wrong blocking user`);
        }
        return;
      }
    };

    xmlHttp.send(`blocker=${blockerUid}&blockee=${blockeeUid}`, true);
  } catch (err) {
    tlog(err);
    return;
  }
}
