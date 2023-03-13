import { isArray, isObject, isNull, size, stringify } from "./utils.js";

class UM {
  constructor() {
    this.users = {};
  }

  addUser = (newUser) => {
    console.log(`Adding user ${stringify(newUser)}`);
    if (!(newUser._id in this.users)) {
      console.log(`Added user ${newUser.fname} to the user list`);
      this.users[`${newUser._id}`] = newUser;
      return newUser._id in this.users;
    }
    return false;
  };

  removeUser = (uid) => {
    if (uid in this.users) {
      console.log(`Removing by uid`);
      delete this.users[uid];
      return this.getUser(uid) == false;
    }
    return true;
  };

  getUsers = () => this.users;

  getUser = (uid) => this.users[uid] || false;

  updateUser = (uid, property) => {
    const user = this.getUser(uid) || null;

    if (null != user) {
      if (isNull(property)) {
        return false;
      } else if (isObject(property)) {
        if (size(property) > 1) {
          for (const p in property) {
            user[p] = property[p];
          }
        }
      }
    }
  };
}

export default UM;
