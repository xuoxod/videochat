import { customAlphabet } from "nanoid";
import { log, dlog, cls, stringify, parse } from "./index.js";
import User from "../models/UserModel.js";
import Chat from "../models/ChatProfile.js";
import UM from "./usermanager.js";

const userManager = new UM();
const connectedUsers = [];

export default ( io ) => {
  io.on( "connection", ( socket ) => {
    dlog( `connection event fired`, `ioserverhandler` );

    socket.on( "registerme", async ( data ) => {
      dlog( `registerme event fired`, `ioserverhandler` );
      const { uid, doc, unblockedUser, hasDoc } = data;
      const userId = uid || doc._id;

      if ( unblockedUser ) {
        const { unblockeduserid } = data;
        const unblockedUser = userManager.getUser( unblockeduserid );

        dlog( `Unblocking user ${ unblockedUser.fname }` );
        io.to( unblockedUser.sid ).emit( "updateyourself", {
          unblockedBy: `${ uid }`,
        } );
      }

      const user = userManager.getUser( userId );

      if ( !user ) {
        dlog( `User does not exist\n` );
        let addedUser;

        if ( hasDoc ) {
          const regUser = Object.assign( {
            ...{
              fname: doc.user.fname,
              lname: doc.user.lname,
              email: doc.user.email,
              _id: doc.user._id,
              uid: doc.user._id,
              uname: doc.uname,
              displayName: doc.displayName,
              isVisible: doc.isVisible,
              friendsOnly: doc.friendsOnly,
              photoUrl: doc.photoUrl,
              public: doc.public,
              description: doc.description,
              friends: doc.friends,
              befriendedBy: doc.befriendedBy,
              blockedUsers: doc.blockedUsers,
              blockedBy: doc.blockedBy,
              online: doc.online,
            },
            ...{ sid: socket.id },
          } );

          addedUser = userManager.addUser( regUser );

          if ( addedUser ) {
            log( `User ${ regUser.fname } successfully registered\n\n` );
            io.to( socket.id ).emit( "registered", { doc: stringify( doc ) } );
            io.emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      } else {
        log( `User ${ user.fname } is already registered\n\n` );
        user.sid = socket.id;
        io.to( user.sid ).emit( "registered", {
          doc: userManager.getUser( user._id ),
        } );
      }
    } );

    socket.on( "updateuser", async ( data ) => {
      dlog( `updateuser event fired`, `ioserverhandler` );
      const { uid, doc, hasDoc } = data;

      let user = userManager.getUser( uid );

      if ( user ) {
        if ( hasDoc ) {
          dlog( `${ user.fname }'s updated doc\t\t${ stringify( doc ) }` );

          const regUser = Object.assign( {
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
          } );

          const removedUser = userManager.removeUser( uid );

          if ( removedUser ) {
            user = null;
            const addedUser = userManager.addUser( regUser );

            if ( addedUser ) {
              io.emit( "updateonlineuserlist", {
                users: stringify( userManager.getUsers() ),
              } );

              io.to( regUser.sid ).emit( "onlinestatus", {
                onlineStatus: regUser.online,
              } );
            }
          }
        }
      }
    } );

    socket.on( "updateme", ( data ) => {
      dlog( `updateme event fired`, `ioserverhandler` );
      const { doc, unblockedBy } = data;

      const user = userManager.getUser( doc.user._id );

      if ( user ) {
        dlog( `${ user.fname } had been updated`, `ioserverhandler` );

        const regUser = Object.assign( {
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
        } );

        const removedUser = userManager.removeUser( user.uid );

        if ( removedUser ) {
          const addedUser = userManager.addUser( regUser );

          if ( addedUser ) {
            log( `User ${ regUser.fname } successfully updated\n\n` );
            const unblockedByUser = userManager.getUser( unblockedBy );

            io.emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );

            if ( unblockedByUser ) {
              io.to( unblockedByUser.sid ).emit( "clearunblocked" );
            }
          }
        }
      }
    } );

    socket.on( "userclicked", ( data ) => {
      dlog( `userclicked event fired`, `ioserverhandler` );
      const { sender, receiver, conntype } = data;
      log( `${ sender } requesting a ${ conntype } connection with ${ receiver }` );
      const userSender = userManager.getUser( sender );
      const userReceiver = userManager.getUser( receiver );

      if ( userSender && userReceiver ) {
        log(
          `${ userSender.fname } is requesting a ${ conntype } connection with ${ userReceiver.fname }\n\n`
        );

        io.to( userSender.sid ).emit( "clickeduser", {
          strUser: stringify( userReceiver ),
        } );

        const strUserDetails = stringify( { user: userSender, conntype } );

        io.to( userReceiver.sid ).emit( "connectionrequested", {
          strUserDetails,
        } );
      }
    } );

    socket.on( "connectionrequest", ( data ) => {
      dlog( `connectionrequest event fired`, `ioserverhandler` );
      const { sender, receiver } = data;

      const userSender = userManager.getUser( sender );
      const userReceiver = userManager.getUser( receiver );
      const strUserSender = stringify( {
        fname: userSender.fname,
        sid: userSender.sid,
      } );

      if ( userSender && userReceiver ) {
        log(
          `${ userSender.fname } is requesting a connection with ${ userReceiver.fname }\n\n`
        );

        // log(
        //   `Sender's SID: ${userSender.sid}\tReceiver's SID: ${userReceiver.sid}`
        // );

        io.to( userReceiver.sid ).emit( "connectionrequested", {
          strSender: strUserSender,
        } );
      }
    } );

    socket.on( "callaccepted", ( data ) => {
      dlog( `callaccepted event fired`, `ioserverhandler` );
      const { sender, receiver, connType } = data;
      const userSender = userManager.getUser( sender );
      const userReceiver = userManager.getUser( receiver );
      const roomName = randomNameGenerator();

      if ( userSender && userReceiver ) {
        log(
          `${ userReceiver.fname } accepted ${ userSender.fname }'s ${ connType } connection request\n\n`
        );

        const response = "accepted";
        const strSenderResponseData = stringify( {
          receiver: userReceiver,
          response,
          roomName,
          connType,
          sender: userSender._id,
        } );

        io.to( userSender.sid ).emit( "connectionrequestresponse", {
          responseData: strSenderResponseData,
        } );
      }
    } );

    socket.on( "callrejected", ( data ) => {
      dlog( `callrejected event fired`, `ioserverhandler` );
      const { sender, receiver } = data;
      const userSender = userManager.getUser( sender );
      const userReceiver = userManager.getUser( receiver );

      if ( userSender && userReceiver ) {
        log(
          `${ userReceiver.fname } rejected ${ userSender.fname }'s connection request`
        );

        const response = "rejected";
        const strResponseData = stringify( {
          receiver: userReceiver,
          sender: userSender,
          response,
        } );

        io.to( userSender.sid ).emit( "connectionrequestresponse", {
          responseData: strResponseData,
        } );
      }
    } );

    socket.on( "noresponsetocall", ( data ) => {
      dlog( `noresponsetocall event fired`, `ioserverhandler` );
      const { sender, receiver } = data;
      const userSender = userManager.getUser( sender );
      const userReceiver = userManager.getUser( receiver );

      if ( userSender && userReceiver ) {
        dlog(
          `${ userReceiver.fname } did not reposnd to ${ userSender.fname }'s connection request`
        );
      }
    } );

    socket.on( "enterroom", ( data ) => {
      dlog( `enterroom event fired`, `ioserverhandler` );
      const { sender, receiver, roomName, connectionType, from } = data;
      const userSender = userManager.getUser( sender );

      // log(`made it to enterroom socket event`);

      log(
        `${ receiver.fname } is joining room ${ roomName } as a ${ connectionType } connection\n\n`
      );

      const strUserDetails = stringify( {
        sender,
        receiver,
        roomName,
        connectionType,
      } );

      if ( from == "sender" ) {
        io.to( receiver.sid ).emit( "enterroom", strUserDetails );
      }
    } );

    socket.on( "disconnectme", async ( data ) => {
      dlog( `disconnectme event fired`, `ioserverhandler` );
      const { uid } = data;
      const user = userManager.getUser( uid );
      const fname = user.fname;

      log( `${ fname } disconnected\n${ stringify( user ) }` );

      const removedUser = userManager.removeUser( uid );
      if ( removedUser ) {
        log( `User ${ fname } removed successfully` );
        io.emit( "updateonlineuserlist", {
          users: stringify( userManager.getUsers() ),
        } );
      }
    } );

    socket.on( "iblockedauser", ( data ) => {
      dlog( `iblockedauser event fired`, `ioserverhandler` );
      const { blocker, blockee } = data;
      const { blockerUid, blockerDoc } = blocker;
      const { blockeeUid, blockeeDoc } = blockee;

      const userBlocker = userManager.getUser( blockerUid );
      const userBlockee = userManager.getUser( blockeeUid );

      if ( userBlocker && userBlockee ) {
        const addBlockerDoc = Object.assign( {
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
        } );

        const addBlockeeDoc = Object.assign( {
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
        } );

        dlog( `\n\tAdd Blocker Doc\n\t${ stringify( addBlockerDoc ) }\n` );
        dlog( `\n\tAdd Blockee Doc\n\t${ stringify( addBlockeeDoc ) }\n` );

        const removedBlockerDoc = userManager.removeUser( blockerUid );
        const removedBlockeeDoc = userManager.removeUser( blockeeUid );

        if ( removedBlockerDoc && removedBlockeeDoc ) {
          const addedBlocker = userManager.addUser( addBlockerDoc );
          const addedBlockee = userManager.addUser( addBlockeeDoc );

          dlog(
            `${ userBlocker.fname } blocked ${ userBlockee.fname }`,
            `ioserver event: iblockedauser`
          );

          if ( addedBlocker && addedBlockee ) {
            io.to( addBlockeeDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );

            io.to( addBlockerDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      }
    } );

    socket.on( "iunblockedauser", async ( data ) => {
      dlog( `iunblockedauser event fired`, `ioserverhandler` );
      const { blocker, blockee } = data;

      const blockerDoc = await Chat.findOneAndUpdate(
        { user: `${ blocker }` },
        { $pop: { blockedUsers: `${ blockee }` } },
        { new: true }
      ).populate( "user" );

      const blockeeDoc = await Chat.findOneAndUpdate(
        { user: `${ blockee }` },
        { $pop: { blockedBy: `${ blocker }` } },
        { new: true }
      ).populate( "user" );

      const userBlocker = userManager.getUser( blocker );
      const userBlockee = userManager.getUser( blockee );

      if ( userBlocker && userBlockee ) {
        dlog( `\n\tBlocker Doc\n\t${ stringify( blockerDoc ) }\n` );
        dlog( `\n\tBlockee Doc\n\t${ stringify( blockeeDoc ) }\n` );

        const addedBlockerDoc = Object.assign( {
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
        } );

        const addedBlockeeDoc = Object.assign( {
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
        } );

        const removedBlockerDoc = userManager.removeUser( blocker );
        const removedBlockeeDoc = userManager.removeUser( blockee );

        if ( removedBlockerDoc && removedBlockeeDoc ) {
          const addedBlocker = userManager.addUser( addedBlockerDoc );
          const addedBlockee = userManager.addUser( addedBlockeeDoc );

          dlog(
            `${ userBlocker.fname } unblocked ${ userBlockee.fname }`,
            `ioserver event: iunblockedauser`
          );

          if ( addedBlocker && addedBlockee ) {
            io.emit( "updateonlineuserlist", stringify( userManager.getUsers() ) );
          }
        }
      }
    } );

    socket.on( "ibefriendedauser", ( data ) => {
      dlog( `ibefriendedauser event fired`, `ioserverhandler` );
      const { befriender, befriendee } = data;
      const { befrienderUid, befrienderDoc } = befriender;
      const { befriendeeUid, befriendeeDoc } = befriendee;

      const userBefriender = userManager.getUser( befrienderUid );
      const userBefriendee = userManager.getUser( befriendeeUid );

      if ( userBefriender && userBefriendee ) {
        const addBefrienderDoc = Object.assign( {
          ...{
            fname: befrienderDoc.user.fname,
            lname: befrienderDoc.user.lname,
            email: befrienderDoc.email,
            _id: befrienderDoc.user._id,
            uid: befrienderDoc.user._id,
            uname: befrienderDoc.uname,
            displayName: befrienderDoc.displayName,
            isVisible: befrienderDoc.isVisible,
            photoUrl: befrienderDoc.photoUrl,
            public: befrienderDoc.public,
            description: befrienderDoc.description,
            friends: befrienderDoc.friends,
            friendsOnly: befrienderDoc.friendsOnly,
            befriendedBy: befrienderDoc.befriendedBy,
            blockedUsers: befrienderDoc.blockedUsers,
            blockedBy: befrienderDoc.blockedBy,
            online: befrienderDoc.online,
          },
          ...{ sid: userBefriender.sid },
        } );

        const addBefriendeeDoc = Object.assign( {
          ...{
            fname: befriendeeDoc.user.fname,
            lname: befriendeeDoc.user.lname,
            email: befriendeeDoc.email,
            _id: befriendeeDoc.user._id,
            uid: befriendeeDoc.user._id,
            uname: befriendeeDoc.uname,
            displayName: befriendeeDoc.displayName,
            isVisible: befriendeeDoc.isVisible,
            photoUrl: befriendeeDoc.photoUrl,
            public: befriendeeDoc.public,
            description: befriendeeDoc.description,
            friends: befriendeeDoc.friends,
            friendsOnly: befriendeeDoc.friendsOnly,
            befriendedBy: befriendeeDoc.befriendedBy,
            blockedUsers: befriendeeDoc.blockedUsers,
            blockedBy: befriendeeDoc.blockedBy,
            online: befriendeeDoc.online,
          },
          ...{ sid: userBefriendee.sid },
        } );

        dlog( `\n\tAdd Befriender Doc\n\t${ stringify( addBefrienderDoc ) }\n` );
        dlog( `\n\tAdd Befriendee Doc\n\t${ stringify( addBefriendeeDoc ) }\n` );

        const removedBefrienderDoc = userManager.removeUser( befrienderUid );
        const removedBefriendeeDoc = userManager.removeUser( befriendeeUid );

        if ( removedBefrienderDoc && removedBefriendeeDoc ) {
          const addedBefriender = userManager.addUser( addBefrienderDoc );
          const addedBefriendee = userManager.addUser( addBefriendeeDoc );

          dlog(
            `${ userBefriender.fname } befriended ${ userBefriendee.fname }`,
            `ioserver event: ibefriendedauser`
          );

          if ( addedBefriender && addedBefriendee ) {
            io.to( addBefrienderDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );

            io.to( addBefriendeeDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      }
    } );

    socket.on( "iunbefriendedauser", async ( data ) => {
      dlog( `iunbefriendedauser event fired`, `ioserverhandler` );
      const { unbefriender, unbefriendee } = data;
      const { unbefrienderUid, unbefrienderDoc } = unbefriender;
      const { unbefriendeeUid, unbefriendeeDoc } = unbefriendee;

      const userUnbefriender = userManager.getUser( unbefrienderUid );
      const userUnbefriendee = userManager.getUser( unbefriendeeUid );

      if ( userUnbefriender && userUnbefriendee ) {
        const addUnBefrienderDoc = Object.assign( {
          ...{
            fname: unbefrienderDoc.user.fname,
            lname: unbefrienderDoc.user.lname,
            email: unbefrienderDoc.email,
            _id: unbefrienderDoc.user._id,
            uid: unbefrienderDoc.user._id,
            uname: unbefrienderDoc.uname,
            displayName: unbefrienderDoc.displayName,
            isVisible: unbefrienderDoc.isVisible,
            photoUrl: unbefrienderDoc.photoUrl,
            public: unbefrienderDoc.public,
            description: unbefrienderDoc.description,
            friends: unbefrienderDoc.friends,
            friendsOnly: unbefrienderDoc.friendsOnly,
            befriendedBy: unbefrienderDoc.befriendedBy,
            blockedUsers: unbefrienderDoc.blockedUsers,
            blockedBy: unbefrienderDoc.blockedBy,
            online: unbefrienderDoc.online,
          },
          ...{ sid: userUnbefriender.sid },
        } );

        const addUnbefriendeeDoc = Object.assign( {
          ...{
            fname: unbefriendeeDoc.user.fname,
            lname: unbefriendeeDoc.user.lname,
            email: unbefriendeeDoc.email,
            _id: unbefriendeeDoc.user._id,
            uid: unbefriendeeDoc.user._id,
            uname: unbefriendeeDoc.uname,
            displayName: unbefriendeeDoc.displayName,
            isVisible: unbefriendeeDoc.isVisible,
            photoUrl: unbefriendeeDoc.photoUrl,
            public: unbefriendeeDoc.public,
            description: unbefriendeeDoc.description,
            friends: unbefriendeeDoc.friends,
            friendsOnly: unbefriendeeDoc.friendsOnly,
            befriendedBy: unbefriendeeDoc.befriendedBy,
            blockedUsers: unbefriendeeDoc.blockedUsers,
            blockedBy: unbefriendeeDoc.blockedBy,
            online: unbefriendeeDoc.online,
          },
          ...{ sid: userUnbefriendee.sid },
        } );

        dlog( `\n\tAdd Unbefriender Doc\n\t${ stringify( addUnBefrienderDoc ) }\n` );
        dlog( `\n\tAdd Unbefriendee Doc\n\t${ stringify( addUnbefriendeeDoc ) }\n` );

        const removedUnbefrienderDoc = userManager.removeUser( unbefrienderUid );
        const removedUnbefriendeeDoc = userManager.removeUser( unbefriendeeUid );

        if ( removedUnbefrienderDoc && removedUnbefriendeeDoc ) {
          const addedUnbefriender = userManager.addUser( addUnBefrienderDoc );
          const addedUnbefriendee = userManager.addUser( addUnbefriendeeDoc );

          dlog(
            `${ userUnbefriender.fname } unbefriended ${ userUnbefriendee.fname }`,
            `ioserver event: iunbefriendedauser`
          );

          if ( addedUnbefriender && addedUnbefriendee ) {
            io.to( addUnBefrienderDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );

            io.to( addUnbefriendeeDoc.sid ).emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      }
    } );

    socket.on( "makemeinvisible", async ( data ) => {
      dlog( `makemeinvisible event fired`, `ioserverhandler` );
      const { uid, doc } = data;
      const user = userManager.getUser( uid );

      if ( user ) {
        dlog(
          `${ user.fname } is invisible`,
          `ioserverhandler: makemeinvisible emitter`
        );

        const regUser = Object.assign( {
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
        } );

        const removedUser = userManager.removeUser( uid );

        if ( removedUser ) {
          const addedUser = userManager.addUser( regUser );

          if ( addedUser ) {
            io.emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      }
    } );

    socket.on( "makemevisible", async ( data ) => {
      dlog( `makemevisible event fired`, `ioserverhandler` );
      const { uid, doc } = data;
      const user = userManager.getUser( uid );

      if ( user ) {
        dlog(
          `${ user.fname } is visible`,
          `ioserverhandler: makemevisible emitter`
        );

        const regUser = Object.assign( {
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
        } );

        const removedUser = userManager.removeUser( uid );

        if ( removedUser ) {
          const addedUser = userManager.addUser( regUser );

          if ( addedUser ) {
            io.emit( "updateonlineuserlist", {
              users: stringify( userManager.getUsers() ),
            } );
          }
        }
      }
    } );

    socket.on( "sendprivatemessage", ( data ) => {
      dlog( `sendprivatemessage event fired`, `ioserverhandler` );
      const { from, to, message } = data;

      const messageSender = userManager.getUser( from );
      const messageReceiver = userManager.getUser( to );

      if ( messageSender && messageReceiver ) {
        log(
          `${ messageSender.fname } sent ${ message } to ${ messageReceiver.fname }\n`
        );

        io.to( messageReceiver.sid ).emit( "privatemessage", {
          messageDetails: stringify( { from: messageSender, text: message } ),
        } );
      }
    } );

    socket.on( "privatemessageresponse", ( data ) => {
      dlog( `privatemessageresponse event fired`, `ioserverhandler` );
      const { replyFrom, replyTo, replyMessage } = data;

      const replySender = userManager.getUser( replyFrom );
      const replyReceiver = userManager.getUser( replyTo );

      if ( replySender && replyReceiver ) {
        log(
          `${ replySender.fname } sent response ${ replyMessage } to ${ replyReceiver.fname }\n`
        );

        io.to( replyReceiver.sid ).emit( "privatemessage", {
          messageDetails: stringify( { from: replySender, text: replyMessage } ),
        } );
      }
    } );
  } );
};

function addCUser ( uid ) {
  const index = connectedUsers.findIndex( ( x ) => ( x = uid ) );

  if ( index == -1 ) {
    connectedUsers.push( uid );
  }
}

function randomNameGenerator () {
  const randomGenerator = customAlphabet( "abcdefghijklmnopqrstuvwxyz", 13 );
  return randomGenerator();
}
