import asyncHandler from "express-async-handler";
import bunyan from "bunyan";
import { dlog, log, stringify } from "../../custom_modules/index.js";
const logger = bunyan.createLogger({ name: "Landing Controller" });

// const clients = [];

// @desc        Home page
// @route       GET /
// @access      Public
export const landingPage = asyncHandler(async (req, res) => {
  logger.info(`GET /`);

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

export const landing = asyncHandler(async (req, res) => {
  logger.info(`SUBSCRIBE /landing`);
  log(`Clients: ${clients.length}`);

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

  const client = {};

  if (clients.length > 0) {
    const clientIndex = clients.findIndex((x) => x.address === host);

    if (clientIndex == -1) {
      client.address = host;
      client.platform = platform;
      client.stamp = new Date().toLocaleString();
      clients.push(client);
    }
  } else {
    client.address = host;
    client.platform = platform;
    client.stamp = new Date().toLocaleString();
    clients.push(client);
  }

  /* res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  }); */
  res.write("event:connected");
  res.write(`data:${JSON.stringify(clients)}`);
  req.on("close", () => res.end("See Ya!"));
});
