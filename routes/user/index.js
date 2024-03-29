import { Router } from "express";
import { body, check, validationResult } from "express-validator";
import {
  userDashboard,
  readUserProfile,
  editUserProfile,
  updateUserProfile,
  createUserProfile,
  deleteUserProfile,
  userReauth,
} from "../../controllers/user/index.js";
import { signedIn, reauthenticate } from "../../middleware/AuthMiddleware.js";
import { lettersOnly } from "../../custom_modules/index.js";

const user = Router();

user.route("/").get(signedIn, userDashboard);

user.route("/reauthenticate").post(signedIn, reauthenticate, userReauth);

user
  .route("/profile/edit/reauthenticate")
  .get(signedIn, reauthenticate, userReauth);

user.route("/profile/edit/authenticated").post(signedIn, userReauth);

user.route("/profile").get(signedIn, readUserProfile);

user.route("/profile/edit").get(signedIn, editUserProfile);

user.route("/profile/delete/").get(signedIn, deleteUserProfile);

user.route("/profile/create").post(signedIn, createUserProfile);

user.route("/profile/update").post(signedIn, updateUserProfile);

export default user;
