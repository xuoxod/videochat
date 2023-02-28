import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import { body, check, validationResult } from "express-validator";
import twilio from "twilio";
import { customAlphabet } from "nanoid";
import Chat from "../../models/ChatProfile.js";
import {
  cap,
  stringify,
  dlog,
  tlog,
  log,
  size,
} from "../../custom_modules/index.js";

const logger = bunyan.createLogger({ name: "Chat Controller" });
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 13);
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const findOrCreateRoom = async (roomName) => {
  let twilioClient;

  try {
    twilioClient = twilio(process.env.API_KEY, process.env.APP_SECRET, {
      accountSid: process.env.ACCT_SID,
    });
    // see if the room exists already. If it doesn't, this will throw
    // error 20404.
    await twilioClient.video.rooms(roomName).fetch();
  } catch (error) {
    // the room was not found, so create it
    if (error.code == 20404) {
      await twilioClient.video.rooms.create({
        uniqueName: roomName,
        type: "go",
      });
    } else {
      // let other errors bubble up
      throw error;
    }
  }
};

const getAccessToken = (roomName) => {
  // create an access token
  const token = new AccessToken(
    process.env.ACCT_SID,
    process.env.API_KEY,
    process.env.APP_SECRET,
    // generate a random unique identity for this participant
    { identity: nanoid() }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};

//  @desc           Create room
//  @route          POST /chat/room/create
//  @access         Private
export const createRoom = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/room/create`);
  const user = req.user.withoutPassword();

  const { roomName } = req.body;

  try {
    // find or create a room with the given roomName
    findOrCreateRoom(roomName);

    dlog(`Room ${roomName} created\n\n`);

    return res.json({
      status: true,
    });
  } catch (err) {
    dlog(`Error creating room ${roomName}\n\tError:\t${stringify(err)}`);
    return res.json({
      status: false,
      cause: `Server-side Error`,
      detail: `user controller.createRoom method.`,
      err,
    });
  }
});

//  @desc           Video Chat
//  @route          POST /chat/room/gettoken
//  @access         Private
export const getRoomToken = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/room/gettoken`);
  const user = req.user.withoutPassword();

  const { roomName, connectionType, senderId, receiverId } = req.body;

  dlog(`made it to getRoomToken\t${roomName}`);

  dlog(`User ${user.fname} is entering chat room ${roomName}`);

  try {
    const token = getAccessToken(roomName);

    if (token) {
      dlog(`Received access token\nReferrer:\t ${req.get("referrer")}`);

      return res.json({
        status: true,
        roomName,
        connectionType,
        senderId,
        receiverId,
        token,
        referrer: req.get("referrer") || false,
      });
    }
  } catch (err) {
    return res.json({
      status: false,
      cause: `server-side: getRoomToken method`,
      error: err,
    });
  }
});

//  @desc           Chat Room
//  @route          GET /chat/room/enter
//  @access         Private
export const enterRoom = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/room/enter`);
  const user = req.user.withoutPassword();
  user.fname = cap(user.fname);
  user.lname = cap(user.lname);

  try {
    dlog(`${req.user.fname} entered chat room`);

    res.render("chat/room", {
      title: "Room Dammit",
      uid: user._id,
      user,
      enteredroom: true,
      signedin: true,
    });
  } catch (err) {
    tlog(err);
    res.status(200).json({ status: JSON.stringify(err) });
  }
});

//  @desc           Chat Room Connect
//  @route          GET /chat/room/connect
//  @access         Private
export const connectRoom = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/room/connect`);

  // Get query params
  const { roomName, connectionType, senderId, receiverId, token } = req.query;

  res.render("chat/peers", {
    title: `${roomName}`,
    signedin: true,
    enteredroom: true,
    peers: true,
    roomName,
    connectionType,
    senderId,
    receiverId,
    token,
  });
});

//  @desc           Blocked Users
//  @route          POST /user/get/blockedlist
//  @access         Private
export const getBlockedList = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/get/blockedlist/<parameter>`);

  const { blocker } = req.params;
  const { blockee } = req.body;

  dlog(`Blocker ${blocker}\nBockee ${blockee}`);

  // res.json({ status: true, blocker });

  User.findById(blocker, (err, doc) => {
    if (err) {
      return res.json({ status: false, cause: err });
    }
    return res.json({
      status: true,
      blockedUsers: doc.blockedUsers,
      blocker,
      blockee,
    });
  });
});

//  @desc           Add user ID to blocked list
//  @route          POST /chat/block/
//  @access         Private
export const blockUser = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/block`);

  const { blocker, blockee } = req.body;

  dlog(`${blocker} adding ${blockee} to blocked list`);

  try {
    const chatUser = await Chat.updateOne(
      { user: `${blocker}` },
      { $push: { blockedUsers: `${blockee}` } }
    );
    dlog(chatUser);
    dlog(`---------------------------------------\n\n`);
    return res.json({ status: true });
  } catch (err) {
    dlog(`Server side error blocking user`);
    dlog(err);
    return res.json({ status: false, cause: err });
  }
});

//  @desc           Remove user ID from blocked list
//  @route          POST /chat/unblock/
//  @access         Private
export const unblockUser = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/unblock`);

  const { blocker, blockee } = req.body;

  dlog(`${blocker} removing ${blockee} from the blocked list`);

  try {
    const chatUser = await Chat.updateOne(
      { user: `${blocker}` },
      { $pull: { blockedUsers: `${blockee}` } }
    );
    dlog(chatUser);
    dlog(`---------------------------------------\n\n`);
    return res.json({ status: true });
  } catch (err) {
    dlog(`Server side error blocking user`);
    dlog(err);
    return res.json({ status: false, cause: err });
  }
});

//  @desc           Create user chat profile
//  @route          GET /chat/profile/create
//  @access         Private
export const createProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/profle/create`);

  const { uid } = req.params;

  dlog(`Route Parameter: ${uid}\n`);

  Chat.findOne({ user: `${uid}` }, (err, doc) => {
    if (err) {
      console.log(`------------------------------------`);
      console.log(err);
      console.log(`------------------------------------\n`);
      res.json({ status: false });
    }

    if (!doc) {
      Chat.create({
        user: `${uid}`,
        uname: `uname-${uid}`,
        displayName: { fname: true, uname: false },
        photoUrl: "",
        description: "",
        isVisible: true,
        public: false,
        blockedUsers: [],
        friends: [],
      });
      res.json({ status: true, hasDoc: false, doc: stringify(doc) });
    } else {
      res.json({ status: true, hasDoc: true, doc: stringify(doc) });
    }
  }).populate("user");
});

//  @desc           View user chat profile
//  @route          GET /chat/profile/view/uid
//  @access         Private
export const viewProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/profle/view/uid`);

  const { uid } = req.params;

  dlog(`Route Parameter: ${uid}\n`);

  Chat.findOne({ user: `${uid}` }, (err, doc) => {
    if (err) {
      console.log(`------------------------------------`);
      console.log(err);
      console.log(`------------------------------------\n`);
      res.json({ status: false });
    }

    if (!doc) {
      res.render({
        title: `Profile`,
        hasDoc: false,
        chatprofile: true,
        signedin: true,
      });
    } else {
      Chat.find((err, docs) => {
        log(`${doc.user.fname}'s profile:\t${stringify(doc)}`);
        res.render("chat/viewprofile", {
          title: `${doc.user.fname}`,
          hasDoc: true,
          profile: doc,
          uid,
          chatprofile: true,
          signedin: true,
          unames: docs,
        });
      }).select("uname");
    }
  }).populate("user");
});

//  @desc           Update user chat profile
//  @route          POST /chat/profile/update
//  @access         Private
export const updateProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/profle/update`);
  const user = req.user.withoutPassword();
  const rmtid = user._id;
  const data = req.body;

  delete data.rmtid;

  if (data.displayName == "uname") {
    log(`display name: uname`);
    data.displayName = { fname: false, uname: true };
  } else {
    log(`display name: fname`);
    data.displayName = { fname: true, uname: false };
  }

  if ("isVisible" in data) {
    log(`is visible`);
    data.isVisible = true;
  } else {
    data.isVisible = false;
  }

  if ("public" in data) {
    log(`is public`);
    data.public = true;
  } else {
    data.public = false;
  }

  log(`\nChat Profile Form Data:\n\t${stringify(data)}\n`);

  try {
    let doc = await Chat.findOneAndUpdate({ user: `${rmtid}` }, data);
    res.redirect(`/chat/profile/view/${rmtid}`);
  } catch (err) {
    log(`\n--------------------------------------------------`);
    log(err);
    log(`--------------------------------------------------\n`);
    res.redirect(`/chat/profile/view/${rmtid}`);
  }
});

//  @desc           Update user chat profile photo
//  @route          POST /chat/profile/update/photo
//  @access         Private
export const updateProfilePhoto = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/profle/update/photo`);

  const { photoPath } = req.body;

  console.log(`Photo ${photoPath} uploaded to server\n`);

  return res.status(200).json({ status: true });
});

//  @desc           Connection request
//  @route          GET /chat/connect/request
//  @access         Private
export const requestConn = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/connect/request`);

  res.render("chat/caller", {
    title: "connection request",
    uid: req.user._id,
    user: req.user,
    enteredroom: true,
    signedin: true,
  });
});
