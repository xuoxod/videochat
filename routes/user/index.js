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
import { signedIn, reauthorize } from "../../middleware/AuthMiddleware.js";
import { lettersOnly } from "../../custom_modules/index.js";

const user = Router();

user.route("/").get(signedIn, userDashboard);

user.route("/reauth").post(signedIn, userReauth);

user.route("/profile").get(signedIn, readUserProfile);

user.route("/profile/edit").get(reauthorize, editUserProfile);

user.route("/profile/delete").get(signedIn, deleteUserProfile);

user.route("/profile/create").post(signedIn, createUserProfile);

user.route("/profile/update").post(signedIn, updateUserProfile);

export default user;
