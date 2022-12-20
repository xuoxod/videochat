import passport from "passport";
import LocalStrategy from "passport-local";
import { log } from "../custom_modules/printer.js";

const localStrategy = (User) => {
  return new LocalStrategy((email, password, done) => {
    log(`\n\tMade it to Passport Local Login\n`);

    // Match the user
    User.findOne({
      $or: [{ email: email }, { uname: email }],
    })
      .then((user) => {
        if (!user) {
          log(`\n\tDid not find user: ${email}\n`);

          return done(null, false, {
            message: "User does not exists",
          });
        }

        log(`\n\tFound User: ${user.email} ... checking password\n`);

        if (!user.matchPassword(password)) {
          log(`\nPassword failed`);
          return done(null, false, { message: "Authentication Failed" });
        } else {
          return done(null, user.withoutPassword());
        }
      })
      .catch((err) => {
        done(null, false, { message: "Authentication Failed" });
      });
  });
};

export default localStrategy;
