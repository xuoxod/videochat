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

  try {
    const doc = await Chat.findOne({ user: req.user._id }).populate("user");

    doc.user.fname = cap(doc.user.fname);
    doc.user.lname = cap(doc.user.lname);

    const { unblockeduserid } = req.query;
    let isUnblockedUser = req.query.unblockeduserid ? true : false;

    dlog(`Online? ${doc.online}`, `chat controller: enterRoom`);

    res.render("chat/room", {
      title: "Room Dammit",
      uid: doc.user._id,
      fname: doc.user.fname,
      enteredroom: true,
      signedin: true,
      online: doc.online,
      unblockedUserId: isUnblockedUser,
      unblockeduserid,
    });
  } catch (err) {
    tlog(err, `chat controller: enterRoom`);
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
  logger.info(`POST: /chat/user/block`);

  const { blocker, blockee } = req.body;

  try {
    // Add blockee to blocker's blockedUsers list
    const blockerBlockedUserList = await Chat.findOneAndUpdate(
      { user: `${blocker}` },
      { $push: { blockedUsers: `${blockee}` } },
      { new: true }
    ).populate("user");

    // dlog(`Blocker List:\t${blockerBlockedUserList} `);

    // Add blocker to blockee's blockedBy list
    const blockeeBlockedByList = await Chat.findOneAndUpdate(
      { user: `${blockee}` },
      { $push: { blockedBy: `${blocker}` } },
      { new: true }
    ).populate("user");

    // dlog(`Blocked By List:\t${blockeeBlockedByList} `);

    return res.json({
      status: true,
      blockerdoc: blockerBlockedUserList,
      blockeedoc: blockeeBlockedByList,
    });
  } catch (err) {
    dlog(`Server side error happened while attempting to block user`);
    dlog(err);
    return res.json({ status: false, cause: err });
  }
});

//  @desc           Check if user is blocked
//  @route          POST /chat/user/isblocked
//  @access         Private
export const isUserBlocked = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/user/isblocked`);

  const { blocker, blockee } = req.body;

  try {
    // Add blockee to blocker's blockedUsers list
    const userBlocker = await Chat.findOne({ user: `${blocker}` });
    const blockedUserIndex = userBlocker.blockedUsers.findIndex(
      (x) => x == blockee
    );
    const userIsBlocked = blockedUserIndex != -1 ? true : false;

    return res.json({ status: true, isBlocked: userIsBlocked });
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

  try {
    // Remove blockee from blockers blockedUsers list
    const blockedrBlockedUserList = await Chat.findOneAndUpdate(
      { user: `${blocker}` },
      { $pull: { blockedUsers: `${blockee}` } },
      { new: true }
    );
    dlog(`${blocker} removed ${blockee} from the blockedUser list`);

    // Remove blocker from blockee's blockedBy list
    const blockeeBlockedByList = await Chat.findOneAndUpdate(
      { user: `${blockee}` },
      { $pull: { blockedBy: `${blocker}` } },
      { new: true }
    );

    dlog(`${blockee} removed ${blocker} from the blockedBy list`);

    return res.json({
      status: true,
      blockerdoc: blockedrBlockedUserList,
      blockeedoc: blockeeBlockedByList,
    });
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
  logger.info(`GET: /chat/profile/create`);

  const { uid } = req.params;

  dlog(`Route Parameter: ${uid}\n`);

  const doc = await await Chat.findOneAndUpdate(
    { user: `${uid}` },
    { online: true },
    { new: true }
  ).populate("user");

  if (doc) {
    res.json({ status: true, hasDoc: true, doc: doc });
  } else {
    const createdDoc = await Chat.create({
      user: `${uid}`,
      uname: `uname-${uid}`,
      displayName: { fname: true, uname: false },
      photoUrl: "",
      description: "",
      isVisible: true,
      public: false,
      online: true,
      blockedUsers: [],
      friends: [],
      blockedBy: [],
    });
    res.json({ status: true, hasDoc: false, doc: doc });
  }
});

//  @desc           View user chat profile
//  @route          GET /chat/profile/view/uid
//  @access         Private
export const viewProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /chat/profle/view/uid`);

  const { uid } = req.params;
  const { unblockeduser } = req.query;

  if (unblockeduser) {
    dlog(
      `Unblocked User ID: ${unblockeduser}\n\n`,
      `chat controller: viewProfile`
    );
  }

  const doc = await Chat.findOne({ user: `${uid}` }).populate("user");

  if (!doc) {
    res.render("chat/viewprofile", {
      title: `Profile`,
      hasDoc: false,
      chatprofile: true,
      signedin: true,
    });
  } else {
    const docs = await Chat.find().select("uname");

    dlog(`Is Visible? ${doc.isVisible}`, `chat controller: viewProfile`);

    res.render("chat/viewprofile", {
      title: `${doc.user.fname}`,
      hasDoc: true,
      profile: doc,
      uid,
      chatprofile: true,
      signedin: true,
      unames: docs,
      unblockedUser: unblockeduser != null,
      unblockeduser,
    });
  }
});

//  @desc           Get user chat profile
//  @route          POST /chat/profile
//  @access         Private
export const getChatUserProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/profile`);

  const { uid } = req.body;
  const doc = await Chat.findOne({ user: `${uid}` }).populate("user");

  if (doc) {
    return res.json({ status: true, doc: doc });
  } else {
    return res.json({ status: false });
  }
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

//  @desc           Hide user
//  @route          POST /chat/user/hide
//  @access         Private
export const hideUser = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/user/hide`);

  const { userId } = req.body;

  try {
    let doc = await Chat.findOneAndUpdate(
      { user: `${userId}` },
      { online: false }
    );

    doc = await Chat.findOne({ user: `${userId}` }).populate("user");

    if (doc) {
      res.json({ status: true, doc });
    } else {
      res.json({ status: false, reason: `Unable to update user ${userId}` });
    }
  } catch (err) {
    log(`\n--------------------------------------------------`);
    log(err);
    log(`--------------------------------------------------\n`);
    res.json({
      status: false,
      reason: `Error occurred while attempting to hide user ${userId}`,
    });
  }
});

//  @desc           Unhide user
//  @route          POST /chat/user/unhide
//  @access         Private
export const unhideUser = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/user/unhide`);

  const { userId } = req.body;

  try {
    let doc = await Chat.findOneAndUpdate(
      { user: `${userId}` },
      { online: true }
    );

    doc = await Chat.findOne({ user: `${userId}` }).populate("user");

    if (doc) {
      res.json({ status: true, doc: doc });
    } else {
      res.json({ status: false, reason: `Unable to update user ${userId}` });
    }
  } catch (err) {
    log(`\n--------------------------------------------------`);
    log(err);
    log(`--------------------------------------------------\n`);
    res.json({
      status: false,
      reason: `Error ocurred while attempting to unhide user ${userId}`,
    });
  }
});

//  @desc           Update user's online status'
//  @route          POST /chat/user/onlinestatus/update
//  @access         Private
export const updateUsersOnlineStatus = asyncHandler(async (req, res) => {
  logger.info(`POST: /chat/user/onlinestatus/update`);

  const { rmtid, onlinestatus } = req.body;

  try {
    let doc = await Chat.findOneAndUpdate(
      { user: `${rmtid}` },
      { online: onlinestatus }
    );

    return res.json({ status: true });
  } catch (err) {
    log(`\n--------------------------------------------------`);
    log(err);
    log(`--------------------------------------------------\n`);
    return res.json({ status: false, err: err });
  }
});
