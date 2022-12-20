import { Router } from "express";
import { signedOut } from "../../middleware/AuthMiddleware.js";
import { body, check, validationResult } from "express-validator";
import {
  registerUser,
  signinUser,
  userRegister,
  userSignin,
  userSignout,
  validateUser,
  resetPassword,
  // generatePasswordResetToken,
} from "../../controllers/auth/index.js";

const auth = Router();

auth.route("/signin").get(userSignin).post(signinUser);

auth
  .route("/register")
  .get(userRegister)
  .post(
    [
      body("email").isEmail().withMessage("Must provide a valid email"),
      body("pwd").notEmpty().withMessage("Must create a password"),
      body("pwd2")
        .notEmpty()
        .custom((value, { req }) => {
          if (value !== req.body.pwd) {
            throw new Error("Password confirmation does not match password");
          }
          return true;
        }),
      body("fname").notEmpty().withMessage("Must provide a first name"),
      body("lname").notEmpty().withMessage("Must provide a last name"),
    ],
    registerUser
  );

// auth.route("/password/reset/generatetoken").get(generatePasswordResetToken);

auth.route("/validateuser").post(signedOut, validateUser);

auth.route("/resetpassword").post(signedOut, resetPassword);

auth.route("/signout").get(userSignout);

export default auth;
