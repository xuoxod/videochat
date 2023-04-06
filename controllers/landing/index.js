import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import { dlog, log, stringify } from "../../custom_modules/index.js";
const logger = bunyan.createLogger({ name: "Landing Controller" });

// @desc        Home page
// @route       GET /
// @access      Public
export const landingPage = asyncHandler(async (req, res) => {
  logger.info(`GET /`);
  const method = req.method;
  const url = req.url;
  const host = req.headers["host"];
  const dnt = req.headers["dnt"];
  const accept = req.headers["accept"];
  const agent = req.headers["user-agent"];
  const secSite = req.headers["sec-fetch-site"];
  const secMobile = req.headers["sec-ch-ua-mobile"] == "?1" ? true : false;
  const platform = req.headers["sec-ch-ua-platform"];
  const referer = req.headers["referer"] || "none";
  const acceptedEnc = req.headers["accept-encoding"];
  const cookie = req.headers["cookie"];
  const ua = req.headers["sec-ch-ua"];

  log(`\nHost:\t${host}`);
  log(`User Agent:\t${ua}`);
  log(`Referer:\t${referer}`);
  log(`Cookie:\t${cookie}`);
  log(`Platform:\t${platform}`);
  log(`Mobile:\t${secMobile}`);
  log(`Encoding:\t${acceptedEnc}`);
  log(`Fetch Site:\t${secSite}\n`);

  try {
    req.flash("success_msg", "Hey there");
    res.render("home/home", {
      title: process.env.SITE_NAME || "RMT",
      signedin: false,
      landing: true,
      csrfToken: req.csrfToken,
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

// @desc        Forgot password
// @route       GET /forgotpassword
// @access      Public
export const forgotPassword = asyncHandler(async (req, res) => {
  logger.info(`GET: /forgotpassword`);

  res.render("home/forgotpassword", {
    title: "Authenticate",
    signedin: false,
    forgotpassword: true,
  });
});

// @desc        Reset password
// @route       GET /resettpassword
// @access      Public
export const resetPassword = asyncHandler(async (req, res) => {
  logger.info(`GET: /forgotpassword`);

  const { email } = req.params;

  res.render("home/resetpassword", {
    title: "Reset Password",
    email,
    signedin: false,
    resetpassword: true,
  });
});
