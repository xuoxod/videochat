import { isArray, isObject, isNull, size, stringify } from "./utils.js";
import { dlog, tlog } from "./printer.js";

class UM {
  constructor() {
    this.users = {};
  }

  addUser = (newUser) => {
    dlog(`Adding user ${stringify(newUser.fname)}`, `usermanager: addUser`);
    if (!(newUser._id in this.users)) {
      console.log(`Added user ${newUser.fname} to the user list`);
      this.users[`${newUser._id}`] = newUser;
      return newUser._id in this.users;
    }
    return false;
  };

  removeUser = (uid) => {
    dlog(`Removing user ${stringify(uid)}`, `usermanager: removeUser`);
    if (uid in this.users) {
      console.log(`Removing by uid`);
      delete this.users[uid];
      return this.getUser(uid) == false;
    }
    return false;
  };

  getUsers = () => this.users;

  getUser = (uid) => this.users[uid] || false;

  updateUser = (uid, property) => {
    dlog(`Update user ${stringify(uid)}`, `usermanager: updateUser`);
    const user = this.getUser(uid) || null;

    if (null != user) {
      if (isNull(property)) {
        return false;
      } else if (isObject(property)) {
        if (size(property) > 0) {
          for (const p in property) {
            user[p] = property[p];
          }
        }
      }
    }
  };

  usersCount = () => Object.keys(this.users).length;

  userCount = () => this.usersCount();
}

export default UM;
