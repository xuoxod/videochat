import { customAlphabet } from "nanoid";
import { log, dlog, cls, stringify, parse } from "./index.js";
import User from "../models/UserModel.js";
import Chat from "../models/ChatProfile.js";
import UM from "./usermanager.js";

const userManager = new UM();
const connectedUsers = [];

export default (io) => {
  io.on("connection", (socket) => {
    log(`New client connection detected - ID: ${socket.id}`);

    socket.on("registerme", async (data) => {
      const { uid } = data;

      if (uid) {
        const user = userManager.getUser(uid);
        addCUser(uid);

        if (!user) {
          const doc = await Chat.findOne({ user: `${uid}` }).populate("user");

          let addedUser;

          if (doc) {
            const _id = doc.user._id;
            const blockedUsers = doc.blockedUsers;

            if (userManager.usersCount > 0) {
              for (const ou in userManager.getUsers()) {
                const onlineUser = ou;
                const userIsBlocked =
                  blockedUsers.find((x) => x == onlineUser._id) || null;

                if (null == userIsBlocked) {
                  onlineUser.blockedBy = onlineUser.blockedBy.filter(
                    (x) => x != _id
                  );
                }
              }
            }

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
        } 
      }
    });

    socket.on("updateuser", (data) => {
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

    socket.on("userclicked", (data) => {
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
            `ioserver: line 265`
          );

          if (addedBlocker && addedBlockee) {
            io.emit("updateonlineuserlist", stringify(userManager.getUsers()));
          }
        }
      }
    });

    socket.on("iunblockedauser", (data) => {
      const { blocker, blockee } = data;
      const userBlocker = userManager.getUser(blocker);
      const userBlockee = userManager.getUser(blockee);

      if (userBlocker && userBlockee) {
        dlog(`${userBlocker.fname} has unblocked ${userBlockee.fname}`);

        userBlocker.blockedUsers = userBlocker.blockedUsers.filter(
          (x) => x != blockee
        );

        userBlockee.blockedBy = userBlockee.blockedBy.filter(
          (x) => x != blocker
        );

        io.emit("updateonlineuserlist", {
          users: stringify(userManager.getUsers()),
        });
      }
    });

    socket.on("makemeinvisible", async (data) => {
      const { uid, doc } = data;
      const user = userManager.getUser(uid);

      if (user) {
        dlog(`${user.fname} is invisible`, `ioserver: line 307`);

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
      const { uid, doc } = data;
      const user = userManager.getUser(uid);

      if (user) {
        dlog(`${user.fname} is visible`, `ioserver: line 348`);

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
