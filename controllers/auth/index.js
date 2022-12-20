import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import passport from "passport";
import { body, check, validationResult } from "express-validator";
import User from "../../models/UserModel.js";
import { stringify, parse } from "../../custom_modules/index.js";
import { createHash } from "../../custom_modules/index.js";

const logger = bunyan.createLogger({ name: "Auth Controller" });

// @desc        signin user
// @route       POST /auth/signin
// @access      Public
export const signinUser = asyncHandler(async (req, res, next) => {
  logger.info(`Post: /auth/signin`);

  const { email, pwd } = req.body;
  console.log(`\nEmail: ${email}\tPassword: ${pwd}`);

  passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/",
    failureFlash: true,
  })(req, res, next);
  // }
});

// @desc        User Signin
// @route       GET /auth/signin
// @access      Public
export const userSignin = asyncHandler(async (req, res) => {
  logger.info(`GET: /auth/signin`);

  try {
    res.render("auth/signin", {
      title: "Signin",
      csrfToken: req.csrfToken,
      signin: true,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: "failure",
      message: err.message,
      cause: err.stackTrace,
    });
  }
});

// @desc        User Registration
// @route       GET /auth/register
// @access      Public
export const userRegister = asyncHandler(async (req, res) => {
  logger.info(`GET: /auth/register`);

  /* const captchaUrl = "../../captcha.jpg";
  const captchaId = "captcha";
  const captchaFieldName = "captcha";
  const captcha = create({ cookie: captchaId }); */

  try {
    res.render("auth/register", {
      title: "Register",
      csrfToken: req.csrfToken,
      signup: true,
      // imgsrc: captchaUrl,
      // captchaFieldName,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: "failure",
      message: err.message,
      cause: err.stackTrace,
    });
  }
});

// @desc        User Sign Out
// @route       GET /auth/signout
// @access      Private
export const userSignout = asyncHandler(async (req, res) => {
  logger.info(`GET: /auth/signout`);
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    delete req["user"];
    res.redirect("/");
  });
});

// @desc        Register user
// @route       POST /auth/register
// @access      Public
export const registerUser = (req, res, next) => {
  logger.info(`Post: /auth/register`);

  const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    // Build your resulting errors however you want! String, object, whatever - it works!
    return `${location}[${param}]: ${msg}`;
  };

  const result = validationResult(req).formatWith(errorFormatter);
  if (!result.isEmpty()) {
    // logger.error(`Registration Failure: ${JSON.stringify(result.array())}`);

    const err = result.array();
    console.log(err);
    const arrResult = [];

    for (const e in err) {
      const objE = err[e];
      const arrObjE = objE.split(":");
      const head = arrObjE[0];
      const value = arrObjE[1];
      const key = head.replace("body", "").replace("[", "").replace("]", "");
      const newObj = {};
      newObj[`${key}`] = value;
      arrResult.push(newObj);
    }

    console.log(`${stringify(arrResult)}\n`);

    return res.status(200).render("auth/register", {
      title: "Error",
      error: true,
      errors: arrResult,
    });
  } else {
    passport.authenticate("local-register", {
      successRedirect: "/user",
      failureRedirect: "/auth/register",
      failureFlash: true,
    })(req, res, next);
  }
};

// @desc        Forgot password
// @route       POST /auth/validateuser
// @access      Public
export const validateUser = asyncHandler(async (req, res) => {
  logger.info(`POST: /auth/validateuser`);
  const { email } = req.body;

  const client = await User.findOne({ email });

  if (!client) {
    return res
      .status(200)
      .json({ status: false, cause: `User ${email} does not exist` });
  }

  return res.status(200).json({ status: true });
});

// @desc        Reset user's password
// @route       POST /auth/resetpassword
// @access      Public
export const resetPassword = asyncHandler(async (req, res) => {
  logger.info(`POST: /auth/resetpassword`);
  const { email, pwd1, pwd2 } = req.body;

  if (pwd1 !== pwd2) {
    return res
      .status(200)
      .json({ status: false, cause: `Passwords don't match` });
  }

  try {
    const client = await User.findOne({ email });

    createHash(pwd1, (data) => {
      const { status, original, payload } = data;

      if (status) {
        client.password = payload;
        const saved = client.save();
        return res.status(200).json({ status: true });
      } else {
        return res.status(200).json({ status: false });
      }
    });
  } catch (err) {
    return res
      .status(200)
      .json({ status: false, cause: `Passwords don't match` });
  }
});

export const testGenerateToken = asyncHandler(async (req, res) => {
  generateToken("test", (resp) => {
    if (resp.status) {
      const { status, original, hash } = resp;
      res.json({ original, hash });
    } else {
      const { status, error } = resp;
      res.json({ status, error });
    }
  });
});

export const generatePasswordResetToken = asyncHandler(async (req, res) => {
  generateToken((resp) => {
    if (resp.status) {
      const { status, original, hash } = resp;
      res.json({ original, hash });
    } else {
      const { status, error } = resp;
      res.json({ status, error });
    }
  });
});
