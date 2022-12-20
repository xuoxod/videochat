import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import {
  cap,
  stringify,
  dlog,
  tlog,
  log,
  size,
} from "../../custom_modules/index.js";
import Profile from "../../models/UserProfile.js";
import User from "../../models/UserModel.js";
const logger = bunyan.createLogger({ name: "User Controller" });

//  @desc           User Dashboard
//  @route          GET /user
//  @access         Private
export const userDashboard = asyncHandler(async (req, res) => {
  logger.info(`GET: /user`);

  try {
    const user = req.user.withoutPassword();
    user.fname = cap(user.fname);
    user.lname = cap(user.lname);

    res.render("user/dashboard", {
      title: "Dashboard",
      user,
      signedin: true,
    });
  } catch (err) {
    tlog(err);
    res.status(200).json({ status: JSON.stringify(err) });
  }
});

//  @desc           Read user's profile
//  @route          GET /user/profile
//  @access         Private
export const readUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile`);
  const uid = req.user._id;
  req.user.fname = cap(req.user.fname);
  req.user.lname = cap(req.user.lname);

  Profile.findOne({ user: `${uid}` }, (err, doc) => {
    if (err) {
      log(err);
      return res.redirect("/user");
    }

    // console.log(typeof doc);

    res.render("user/viewprofile", {
      title: `Profile`,
      user: doc,
      doc: req.user,
      hasDoc: size(doc) > 0,
      profile: true,
    });
  }).populate("user");
});

//  @desc           View user's profile
//  @route          GET /user/profile/edit
//  @access         Private
export const editUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile/edit`);
  const uid = req.user._id;

  User.findOne({ _id: `${uid}` })
    .populate("profile")
    .then((user) => {
      console.log("User doc " + user);

      res.render("user/editprofile", {
        title: `Profile`,
        user: [...user],
        profile: true,
        csrfToken: req.csrfToken,
      });
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/user");
    });
});

//  @desc           Update user's profile
//  @route          POST /user/profile/update
//  @access         Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/profile/update`);
  const uid = req.user._id;
  logger.info(`POST: /user/profile/update`);
  const user = req.user.withoutPassword()._id;
  const data = req.body;
  const {
    fname,
    lname,
    email,
    street,
    city,
    zipcode,
    savepwd,
    male,
    female,
    dob,
  } = data;

  let gender;
  const dobSplit = dob.split("-");

  if (male == "on") {
    gender = "male";
  } else if (female == "on") {
    gender = "female";
  }

  const userUpdate = {
    fname,
    lname,
    email,
  };

  const profileUpdate = {
    address: {
      street,
      city,
      zipcode,
    },
    passwordSaved: savepwd == "on" ? true : false,
    gender,
    dob: {
      month: dobSplit[1],
      day: dobSplit[2],
      year: dobSplit[0],
    },
  };

  let doc = await Profile.findOneAndUpdate({ user: `${uid}` }, profileUpdate);

  log(`Updated Profile: ${stringify(doc)}`);

  doc = await User.findOneAndUpdate({ _id: uid }, userUpdate);

  log(`Updated User: ${doc}`);

  res.redirect("/user/profile");
});

//  @desc           Reauthenticate User
//  @route          POST /user/reauth
//  @access         Private
export const userReauth = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/reauth`);

  const oUser = req.user;
  const { email, pwd } = req.body;
  dlog(`\n\tRe-authentication Data\n\t\tEmail: ${email}, Password: ${pwd}\n`);

  const matched = await oUser.matchPassword(pwd);
  if (matched) {
    Profile.findOne({ user: req.user._id })
      .populate("user")
      .then((doc) => {
        // console.log("Doc" + doc);
        let gender;

        if (doc.gender == "male") {
          gender = { male: true };
        } else if (doc.gender == "female") {
          gender = { female: true };
        } else {
          gender = null;
        }

        res.render("user/editprofile", {
          title: `Editing Profile`,
          profile: doc,
          gender,
          csrfToken: req.csrfToken,
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/user");
      });
  } else {
    res.redirect("/user");
  }
});

//  @desc           Create User Profile
//  @route          POST /user/profile/create
//  @access         Private
export const createUserProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/profile/create`);
  const user = req.user.withoutPassword()._id;
  const data = req.body;
  const { street, city, zipcode, savepwd, male, female, dob } = data;

  let gender;
  const dobSplit = dob.split("-");

  if (male == "on") {
    gender = "male";
  } else if (female == "on") {
    gender = "female";
  }

  const profileUpdate = {
    user,
    address: {
      street,
      city,
      zipcode,
    },
    passwordSaved: savepwd == "on" ? true : false,
    gender,
    dob: {
      month: dobSplit[1],
      day: dobSplit[2],
      year: dobSplit[0],
    },
  };

  const doc = await Profile.create(profileUpdate);
  log(`\nProfile Created:\t ${stringify(doc)}`);
  res.redirect("/user/profile");
});

//  @desc           Delete user's profile
//  @route          GET /user/profile/delete
//  @access         Private
export const deleteUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile`);
  const uid = req.user._id;

  Profile.findOneAndDelete({ user: `${uid}` }, (err, doc) => {
    if (err) {
      log(err);
    }

    return res.redirect("/user/profile");
  });
});
