import { customAlphabet } from "nanoid";
import { log, dlog, cls, stringify, parse } from "./index.js";
import User from "../models/UserModel.js";
import Chat from "../models/ChatProfile.js";
import UM from "./usermanager.js";

const userManager = new UM();
const connectedUsers = [];

export default (io) => {
  io.on("connection", (socket) => {
    dlog(`connection event fired`, `ioserverhandler`);

    socket.on("registerme", async (data) => {
      dlog(`registerme event fired`, `ioserverhandler`);
      const { uid, doc, unblockedUser } = data;

      if (unblockedUser) {
        const { unblockeduserid } = data;

        if (unblockeduserid) {
          const unblockedUser = userManager.getUser(unblockeduserid);

          if (unblockedUser) {
            dlog(`Unblocking user ${unblockedUser.fname}`);
            io.to(unblockedUser.sid).emit("updateyourself");
          }
        }
      }

      if (uid) {
        const user = userManager.getUser(uid);
        addCUser(uid);

        if (!user) {
          let addedUser;

          if (doc) {
            const regUser = Object.assign({
              ...{
                fname: doc.user.fname,
                lname: doc.user.lname,
                email: doc.user.email,
                _id: doc.user._id,
                uid: doc.user._id,
                uname: doc.uname,
                displayName: doc.displayName,
                isVisible: doc.isVisible,
                photoUrl: doc.photoUrl,
                public: doc.public,
                description: doc.description,
                friends: doc.friends,
                blockedUsers: doc.blockedUsers,
                blockedBy: doc.blockedBy,
                online: doc.online,
              },
              ...{ sid: socket.id },
            });

            addedUser = userManager.addUser(regUser);

            if (addedUser) {
              log(`User ${regUser.fname} successfully registered\n\n`);
              io.to(socket.id).emit("registered", { uid: uid });
              io.emit("updateonlineuserlist", {
                users: stringify(userManager.getUsers()),
              });
            }
          }
        } else {
          log(`User ${user.fname} is already registered\n\n`);
          user.sid = socket.id;
          io.to(user.sid).emit("registered");
        }
      }
    });

    socket.on("updateuser", (data) => {
      dlog(`updateuser event fired`, `ioserverhandler`);
      const { uid, doc, hasDoc } = data;

      const user = userManager.getUser(uid);

      if (user) {
        // log(`Updating user ${user.fname}\n\n`);
        if (hasDoc) {
          const userDoc = parse(doc);

          user.uname = userDoc.uname;
          user.isVisible = userDoc.isVisible;
          user.public = userDoc.public;
          user.blockedUsers = userDoc.blockedUsers;
          user.blockedBy = userDoc.blockedBy;
          user.friends = userDoc.friends;
          user.displayName = userDoc.displayName;
          user.photoUrl = userDoc.photoUrl;
          user.description = userDoc.description;

          io.emit("updateonlineuserlist", {
            users: stringify(userManager.getUsers()),
          });
        } else {
          Chat.findOne({ user: uid }, (err, chat) => {
            if (err) {
              log(`--------------------------------------`);
              log(err);
              log(`---------------------------------------\n`);
              return;
            } else {
              if (chat) {
                user.uname = chat.uname;
                user.isVisible = chat.isVisible;
                user.public = chat.public;
                user.blockedUsers = chat.blockedUsers;
                user.blockedBy = userDoc.blockedBy;
                user.friends = chat.friends;
                user.displayName = chat.displayName;

                io.emit("updateonlineuserlist", {
                  users: stringify(userManager.getUsers()),
                });
              }
            }
          }).populate("user");
        }
      }
    });

    socket.on("updateme", (data) => {
      dlog(`updateme event fired`, `ioserverhandler`);
      const { doc } = data;

      const user = userManager.getUser(doc.user._id);

      if (user) {
        dlog(`${user.fname} had been updated`, `ioserverhandler`);

        const regUser = Object.assign({
          ...{
            fname: doc.user.fname,
            lname: doc.user.lname,
            email: doc.user.email,
            _id: doc.user._id,
            uid: doc.user._id,
            uname: doc.uname,
            displayName: doc.displayName,
            isVisible: doc.isVisible,
            photoUrl: doc.photoUrl,
            public: doc.public,
            description: doc.description,
            friends: doc.friends,
            blockedUsers: doc.blockedUsers,
            blockedBy: doc.blockedBy,
            online: doc.online,
          },
          ...{ sid: user.sid },
        });

        const removedUser = userManager.removeUser(user.uid);

        if (removedUser) {
          const addedUser = userManager.addUser(regUser);

          if (addedUser) {
            log(`User ${regUser.fname} successfully updated\n\n`);
            io.emit("updateonlineuserlist", {
              users: stringify(userManager.getUsers()),
            });
          }
        }
      }
    });

    socket.on("userclicked", (data) => {
      dlog(`userclicked event fired`, `ioserverhandler`);
      const { sender, receiver, conntype } = data;
      log(`${sender} requesting a ${conntype} connection with ${receiver}`);
      const userSender = userManager.getUser(sender);
      const userReceiver = userManager.getUser(receiver);

      if (userSender && userReceiver) {
        log(
          `${userSender.fname} is requesting a ${conntype} connection with ${userReceiver.fname}\n\n`
        );

        io.to(userSender.sid).emit("clickeduser", {
          strUser: stringify(userReceiver),
        });

        const strUserDetails = stringify({ user: userSender, conntype });

        io.to(userReceiver.sid).emit("connectionrequested", {
          strUserDetails,
        });
      }
    });

    socket.on("connectionrequest", (data) => {
      dlog(`connectionrequest event fired`, `ioserverhandler`);
      const { sender, receiver } = data;

      const userSender = userManager.getUser(sender);
      const userReceiver = userManager.getUser(receiver);
      const strUserSender = stringify({
        fname: userSender.fname,
        sid: userSender.sid,
      });

      if (userSender && userReceiver) {
        log(
          `${userSender.fname} is requesting a connection with ${userReceiver.fname}\n\n`
        );

        // log(
        //   `Sender's SID: ${userSender.sid}\tReceiver's SID: ${userReceiver.sid}`
        // );

        io.to(userReceiver.sid).emit("connectionrequested", {
          strSender: strUserSender,
        });
      }
    });

    socket.on("callaccepted", (data) => {
      dlog(`callaccepted event fired`, `ioserverhandler`);
      const { sender, receiver, connType } = data;
      const userSender = userManager.getUser(sender);
      const userReceiver = userManager.getUser(receiver);
      const roomName = randomNameGenerator();

      if (userSender && userReceiver) {
        log(
          `${userReceiver.fname} accepted ${userSender.fname}'s ${connType} connection request\n\n`
        );

        const response = "accepted";
        const strSenderResponseData = stringify({
          receiver: userReceiver,
          response,
          roomName,
          connType,
          sender: userSender._id,
        });

        io.to(userSender.sid).emit("connectionrequestresponse", {
          responseData: strSenderResponseData,
        });
      }
    });

    socket.on("callrejected", (data) => {
      dlog(`callrejected event fired`, `ioserverhandler`);
      const { sender, receiver } = data;
      const userSender = userManager.getUser(sender);
      const userReceiver = userManager.getUser(receiver);

      if (userSender && userReceiver) {
        log(
          `${userReceiver.fname} rejected ${userSender.fname}'s connection request`
        );

        const response = "rejected";
        const strResponseData = stringify({
          receiver: userReceiver,
          sender: userSender,
          response,
        });

        io.to(userSender.sid).emit("connectionrequestresponse", {
          responseData: strResponseData,
        });
      }
    });

    socket.on("noresponsetocall", (data) => {
      dlog(`noresponsetocall event fired`, `ioserverhandler`);
      const { sender, receiver } = data;
      const userSender = userManager.getUser(sender);
      const userReceiver = userManager.getUser(receiver);

      if (userSender && userReceiver) {
        dlog(
          `${userReceiver.fname} did not reposnd to ${userSender.fname}'s connection request`
        );
      }
    });

    socket.on("enterroom", (data) => {
      dlog(`enterroom event fired`, `ioserverhandler`);
      const { sender, receiver, roomName, connectionType, from } = data;
      const userSender = userManager.getUser(sender);

      // log(`made it to enterroom socket event`);

      log(
        `${receiver.fname} is joining room ${roomName} as a ${connectionType} connection\n\n`
      );

      const strUserDetails = stringify({
        sender,
        receiver,
        roomName,
        connectionType,
      });

      if (from == "sender") {
        io.to(receiver.sid).emit("enterroom", strUserDetails);
      }
    });

    socket.on("disconnectme", async (data) => {
      dlog(`disconnectme event fired`, `ioserverhandler`);
      const { uid } = data;
      const doc = await Chat.findOneAndUpdate(
        { user: `${uid}` },
        { online: false },
        { new: true }
      );

      const user = userManager.getUser(uid);
      const fname = user.fname;

      log(`${fname} disconnected\n${stringify(doc)}`);

      const removedUser = userManager.removeUser(uid);
      if (removedUser) {
        log(`User ${fname} removed successfully`);
        io.emit("updateonlineuserlist", {
          users: stringify(userManager.getUsers()),
        });
      }
    });

    socket.on("iblockedauser", (data) => {
      dlog(`iblockedauser event fired`, `ioserverhandler`);
      const { blocker, blockee } = data;
      const { blockerUid, blockerDoc } = blocker;
      const { blockeeUid, blockeeDoc } = blockee;

      const userBlocker = userManager.getUser(blockerUid);
      const userBlockee = userManager.getUser(blockeeUid);

      if (userBlocker && userBlockee) {
        const addBlockerDoc = Object.assign({
          ...{
            fname: blockerDoc.user.fname,
            lname: blockerDoc.user.lname,
            email: blockerDoc.email,
            _id: blockerDoc.user._id,
            uid: blockerDoc.user._id,
            uname: blockerDoc.uname,
            displayName: blockerDoc.displayName,
            isVisible: blockerDoc.isVisible,
            photoUrl: blockerDoc.photoUrl,
            public: blockerDoc.public,
            description: blockerDoc.description,
            friends: blockerDoc.friends,
            blockedUsers: blockerDoc.blockedUsers,
            blockedBy: blockerDoc.blockedBy,
            online: blockerDoc.online,
          },
          ...{ sid: userBlocker.sid },
        });

        const addBlockeeDoc = Object.assign({
          ...{
            fname: blockeeDoc.user.fname,
            lname: blockeeDoc.user.lname,
            email: blockeeDoc.email,
            _id: blockeeDoc.user._id,
            uid: blockeeDoc.user._id,
            uname: blockeeDoc.uname,
            displayName: blockeeDoc.displayName,
            isVisible: blockeeDoc.isVisible,
            photoUrl: blockeeDoc.photoUrl,
            public: blockeeDoc.public,
            description: blockeeDoc.description,
            friends: blockeeDoc.friends,
            blockedUsers: blockeeDoc.blockedUsers,
            blockedBy: blockeeDoc.blockedBy,
            online: blockeeDoc.online,
          },
          ...{ sid: userBlockee.sid },
        });

        dlog(`\n\tAdd Blocker Doc\n\t${stringify(addBlockerDoc)}\n`);
        dlog(`\n\tAdd Blockee Doc\n\t${stringify(addBlockeeDoc)}\n`);

        const removedBlockerDoc = userManager.removeUser(blockerUid);
        const removedBlockeeDoc = userManager.removeUser(blockeeUid);

        if (removedBlockerDoc && removedBlockeeDoc) {
          const addedBlocker = userManager.addUser(addBlockerDoc);
          const addedBlockee = userManager.addUser(addBlockeeDoc);

          dlog(
            `${userBlocker.fname} blocked ${userBlockee.fname}`,
            `ioserver: line 246`
          );

          if (addedBlocker && addedBlockee) {
            io.to(addBlockeeDoc.sid).emit("updateonlineuserlist", {
              users: stringify(userManager.getUsers()),
            });

            io.to(addBlockerDoc.sid).emit("updateonlineuserlist", {
              users: stringify(userManager.getUsers()),
            });
          }
        }
      }
    });

    socket.on("_iblockedauser", (data) => {
      const { blocker, blockee } = data;
      const { blockerUid, blockerDoc } = blocker;
      const { blockeeUid, blockeeDoc } = blockee;
      const userBlocker = userManager.getUser(blockerUid);
      const userBlockee = userManager.getUser(blockeeUid);

      if (userBlocker && userBlockee) {
        dlog(`\n\tBlocker Doc\n\t${stringify(blockerDoc)}\n`);
        dlog(`\n\tBlockee Doc\n\t${stringify(blockeeDoc)}\n`);

        const addedBlockerDoc = Object.assign({
          ...{
            fname: blockerDoc.user.fname,
            lname: blockerDoc.user.lname,
            email: blockerDoc.email,
            _id: blockerDoc.user._id,
            uid: blockerDoc.user._id,
            uname: blockerDoc.uname,
            displayName: blockerDoc.displayName,
            isVisible: blockerDoc.isVisible,
            photoUrl: blockerDoc.photoUrl,
            public: blockerDoc.public,
            description: blockerDoc.description,
            friends: blockerDoc.friends,
            blockedUsers: blockerDoc.blockedUsers,
            blockedBy: blockerDoc.blockedBy,
            online: blockerDoc.online,
          },
          ...{ sid: userBlocker.sid },
        });

        const addedBlockeeDoc = Object.assign({
          ...{
            fname: blockeeDoc.user.fname,
            lname: blockeeDoc.user.lname,
            email: blockeeDoc.email,
            _id: blockeeDoc.user._id,
            uid: blockeeDoc.user._id,
            uname: blockeeDoc.uname,
            displayName: blockeeDoc.displayName,
            isVisible: blockeeDoc.isVisible,
            photoUrl: blockeeDoc.photoUrl,
            public: blockeeDoc.public,
            description: blockeeDoc.description,
            friends: blockeeDoc.friends,
            blockedUsers: blockeeDoc.blockedUsers,
            blockedBy: blockeeDoc.blockedBy,
            online: blockeeDoc.online,
          },
          ...{ sid: userBlockee.sid },
        });

        const removedBlockerDoc = userManager.removeUser(blockerUid);
        const removedBlockeeDoc = userManager.removeUser(blockeeUid);

        if (removedBlockerDoc && removedBlockeeDoc) {
          const addedBlocker = userManager.addUser(addedBlockerDoc);
          const addedBlockee = userManager.addUser(addedBlockeeDoc);

          dlog(
            `${userBlocker.fname} blocked ${userBlockee.fname}`,
            `ioserver: line 246`
          );

          if (addedBlocker && addedBlockee) {
            io.emit("updateonlineuserlist", stringify(userManager.getUsers()));
          }
        }
      }
    });

    socket.on("iunblockedauser", async (data) => {
      dlog(`iunblockedauser event fired`, `ioserverhandler`);
      const { blocker, blockee } = data;

      const blockerDoc = await Chat.findOneAndUpdate(
        { user: `${blocker}` },
        { $pop: { blockedUsers: `${blockee}` } },
        { new: true }
      ).populate("user");

      const blockeeDoc = await Chat.findOneAndUpdate(
        { user: `${blockee}` },
        { $pop: { blockedBy: `${blocker}` } },
        { new: true }
      ).populate("user");

      const userBlocker = userManager.getUser(blocker);
      const userBlockee = userManager.getUser(blockee);

      if (userBlocker && userBlockee) {
        dlog(`\n\tBlocker Doc\n\t${stringify(blockerDoc)}\n`);
        dlog(`\n\tBlockee Doc\n\t${stringify(blockeeDoc)}\n`);

        const addedBlockerDoc = Object.assign({
          ...{
            fname: blockerDoc.user.fname,
            lname: blockerDoc.user.lname,
            email: blockerDoc.email,
            _id: blockerDoc.user._id,
            uid: blockerDoc.user._id,
            uname: blockerDoc.uname,
            displayName: blockerDoc.displayName,
            isVisible: blockerDoc.isVisible,
            photoUrl: blockerDoc.photoUrl,
            public: blockerDoc.public,
            description: blockerDoc.description,
            friends: blockerDoc.friends,
            blockedUsers: blockerDoc.blockedUsers,
            blockedBy: blockerDoc.blockedBy,
            online: blockerDoc.online,
          },
          ...{ sid: userBlocker.sid },
        });

        const addedBlockeeDoc = Object.assign({
          ...{
            fname: blockeeDoc.user.fname,
            lname: blockeeDoc.user.lname,
            email: blockeeDoc.email,
            _id: blockeeDoc.user._id,
            uid: blockeeDoc.user._id,
            uname: blockeeDoc.uname,
            displayName: blockeeDoc.displayName,
            isVisible: blockeeDoc.isVisible,
            photoUrl: blockeeDoc.photoUrl,
            public: blockeeDoc.public,
            description: blockeeDoc.description,
            friends: blockeeDoc.friends,
            blockedUsers: blockeeDoc.blockedUsers,
            blockedBy: blockeeDoc.blockedBy,
            online: blockeeDoc.online,
          },
          ...{ sid: userBlockee.sid },
        });

        const removedBlockerDoc = userManager.removeUser(blocker);
        const removedBlockeeDoc = userManager.removeUser(blockee);

        if (removedBlockerDoc && removedBlockeeDoc) {
          const addedBlocker = userManager.addUser(addedBlockerDoc);
          const addedBlockee = userManager.addUser(addedBlockeeDoc);

          dlog(
            `${userBlocker.fname} unblocked ${userBlockee.fname}`,
            `ioserver: line 246`
          );

          if (addedBlocker && addedBlockee) {
            io.emit("updateonlineuserlist", stringify(userManager.getUsers()));
          }
        }
      }
    });

    socket.on("makemeinvisible", async (data) => {
      dlog(`makemeinvisible event fired`, `ioserverhandler`);
      const { uid, doc } = data;
      const user = userManager.getUser(uid);

      if (user) {
        dlog(
          `${user.fname} is invisible`,
          `ioserverhandler: makemeinvisible emitter`
        );

        const regUser = Object.assign({
          ...{
            fname: doc.user.fname,
            lname: doc.user.lname,
            email: doc.email,
            _id: doc.user._id,
            uid: doc.user._id,
            uname: doc.uname,
            displayName: doc.displayName,
            isVisible: doc.isVisible,
            photoUrl: doc.photoUrl,
            public: doc.public,
            description: doc.description,
            friends: doc.friends,
            blockedUsers: doc.blockedUsers,
            blockedBy: doc.blockedBy,
            online: doc.online,
          },
          ...{ sid: user.sid },
        });

        const removedUser = userManager.removeUser(uid);

        if (removedUser) {
          const addedUser = userManager.addUser(regUser);

          if (addedUser) {
            io.emit("updateonlineuserlist", {
              users: stringify(userManager.getUsers()),
            });
          }
        }
      }
    });

    socket.on("makemevisible", async (data) => {
      dlog(`makemevisible event fired`, `ioserverhandler`);
      const { uid, doc } = data;
      const user = userManager.getUser(uid);

      if (user) {
        dlog(
          `${user.fname} is visible`,
          `ioserverhandler: makemevisible emitter`
        );

        const regUser = Object.assign({
          ...{
            fname: doc.user.fname,
            lname: doc.user.lname,
            email: doc.email,
            _id: doc.user._id,
            uid: doc.user._id,
            uname: doc.uname,
            displayName: doc.displayName,
            isVisible: doc.isVisible,
            photoUrl: doc.photoUrl,
            public: doc.public,
            description: doc.description,
            friends: doc.friends,
            blockedUsers: doc.blockedUsers,
            blockedBy: doc.blockedBy,
            online: doc.online,
          },
          ...{ sid: user.sid },
        });

        const removedUser = userManager.removeUser(uid);

        if (removedUser) {
          const addedUser = userManager.addUser(regUser);

          if (addedUser) {
            io.emit("updateonlineuserlist", {
              users: stringify(userManager.getUsers()),
            });
          }
        }
      }
    });
  });
};

function addCUser(uid) {
  const index = connectedUsers.findIndex((x) => (x = uid));

  if (index == -1) {
    connectedUsers.push(uid);
  }
}

function randomNameGenerator() {
  const randomGenerator = customAlphabet("abcdefghijklmnopqrstuvwxyz", 13);
  return randomGenerator();
}
