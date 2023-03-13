import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uname: {
      type: String,
      default: "",
      unique: true,
    },
    displayName: {
      type: Object,
      default: {
        fname: true,
        uname: false,
      },
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    online: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    public: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    friends: [
      {
        type: String,
      },
    ],
    blockedUsers: [
      {
        type: String,
      },
    ],
    blockedBy: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

chatSchema.methods.userIsBlocked = async function (uid) {
  console.log(`blockUser method fired: ${JSON.stringify(this.blockedUsers)}`);
  this.blockedUsers.forEach((id) => {
    if (id == uid) {
      return true;
    }
  });
};

chatSchema.methods.userIsFriend = async function (uid) {
  this.friends.forEach((id) => {
    if (id == uid) {
      return true;
    }
  });
};

chatSchema.methods.blockUser = function (uid) {
  const userIndex = this.blockedUsers.findIndex((x) => x == uid);

  if (userIndex == -1) {
    this.blockedUsers.push(uid);
  }
};

chatSchema.methods.addFriend = function (uid) {
  const userIndex = this.friends.findIndex((x) => x == uid);

  if (userIndex == -1) {
    this.friends.push(uid);
  }
};

chatSchema.methods.unBlockUser = function (uid) {
  const userIndex = this.blockedUsers.findIndex((x) => x == uid);

  if (userIndex != -1) {
    this.blockedUsers = this.blockedUsers.filter((x) => x != uid);
  }
};

chatSchema.methods.removeFriend = function (uid) {
  const userIndex = this.friends.findIndex((x) => x == uid);

  if (userIndex != -1) {
    this.friends = this.friends.filter((x) => x != uid);
  }
};

chatSchema.methods.createUsername = function (username) {
  try {
    this.uname = username;
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
