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
//  @returns        void
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
//  @returns        void
export const readUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile`);
  const uid = req.user._id;
  req.user.fname = cap(req.user.fname);
  req.user.lname = cap(req.user.lname);

  const doc = await Profile.findOne({ user: `${uid}` }).populate("user");

  dlog(`User & Profile\n\t${doc}\n`);

  res.render("user/viewprofile", {
    title: `My Profile Gee`,
    doc: doc,
    user: req.user.withoutPassword(),
    hasDoc: doc != null,
    userprofile: true,
    signedin: true,
  });
});

//  @desc           View user's profile
//  @route          GET /user/profile/edit
//  @access         Private
//  @returns        void
export const editUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile/edit`);
  const uid = req.user._id;

  const doc = await Profile.findOne({ user: `${uid}` }).populate("user");
  const gender = {};

  if (doc.gender) {
    if (doc.gender.trim() == "male") {
      gender.male = true;
      gender.female = false;
    } else {
      gender.male = false;
      gender.female = true;
    }
  }

  res.render("user/editprofile", {
    title: `Profile`,
    doc: doc,
    gender,
    user: req.user.withoutPassword(),
    hasDoc: doc != null,
    userprofile: true,
    csrfToken: req.csrfToken,
  });
});

//  @desc           Update user's profile
//  @route          POST /user/profile/update
//  @access         Private
//  @returns        redirect
export const updateUserProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/profile/update`);
  const uid = req.user._id;

  const data = req.body;

  dlog(`\nprofile update data:\n\t${stringify(data)}\n`);

  const { fname, lname, email, street, city, zipcode, savepwd, gender, dob } =
    data;

  const userUpdate = {};

  if (fname) {
    userUpdate.fname = fname;
  }

  if (lname) {
    userUpdate.lname = lname;
  }

  if (email) {
    userUpdate.email = email;
  }

  const userDoc = await User.findOneAndUpdate({ _id: uid }, userUpdate, {
    new: true,
  });

  // log(`Updated User: ${userDoc}\n`);

  const profileUpdate = {};

  if (street || city || zipcode) {
    profileUpdate.address = {};

    if (street) {
      profileUpdate.address.street = street;
    }

    if (city) {
      profileUpdate.address.city = city;
    }

    if (zipcode) {
      profileUpdate.address.zipcode = zipcode;
    }
  }

  if (savepwd) {
    profileUpdate.passwordSaved = savepwd == "on" ? true : false;
  }

  if (gender == "male") {
    profileUpdate.gender = "male";
  } else if (gender == "female") {
    profileUpdate.gender = "female";
  } else {
    profileUpdate.gender = "other";
  }

  if (dob) {
    const dobSplit = dob.split("-");
    profileUpdate.dob = {};
    profileUpdate.dob.year = dobSplit[0];
    profileUpdate.dob.month = dobSplit[1];
    profileUpdate.dob.day = dobSplit[2];
  }

  const profileDoc = await Profile.findOneAndUpdate(
    { user: `${req.user._id}` },
    profileUpdate,
    {
      new: true,
    }
  ).populate("user");

  if (null == profileDoc) {
    res.redirect("/user/profile/create");
  } else {
    // log(`Updated Profile: ${profileDoc}\n`);

    res.redirect("/user/profile");
  }
});

//  @desc           Reauthenticate User
//  @route          POST /user/reauth
//  @access         Private
//  @returns        void
export const userReauth = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/reauth`);

  const oUser = req.user;
  const { email, pwd } = req.body;

  const matched = await oUser.matchPassword(pwd);
  if (matched) {
    dlog(`\n\tReauthenticated ${email} === ${oUser.email}\n`);
    res.redirect("/user/profile/edit");
  } else {
    res.redirect("/user/profile");
  }
});

//  @desc           Create User Profile
//  @route          POST /user/profile/create
//  @access         Private
//  @returns        redirect
export const createUserProfile = asyncHandler(async (req, res) => {
  logger.info(`POST: /user/profile/create`);
  const user = req.user.withoutPassword()._id;
  const data = req.body;
  const { street, city, zipcode, savepwd, male, female, dob, gender } = data;

  const dobSplit = dob.split("-");

  const profileUpdate = {
    user,
    address: {
      street,
      city,
      zipcode,
    },
    passwordSaved: savepwd == "on" ? true : false,
    gender: gender || "",
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
//  @returns        redirect
export const deleteUserProfile = asyncHandler(async (req, res) => {
  logger.info(`GET: /user/profile/delete`);
  const uid = req.user._id;

  const doc = await Profile.deleteOne({ user: `${uid}` });

  dlog(`Deleted Profile: ${doc}\n`);

  res.redirect("/user/profile");
});
