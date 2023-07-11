import express from "express";
// import spdy from "spdy";
import { Server } from "socket.io";
import https from "https";
import path from "path";
import dotenv from "dotenv";
import bodyParser from "body-parser";
// import cookieSession from "cookie-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import mongoose from "mongoose";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import Handlebars from "handlebars";
import expressHandlebars from "express-handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import { customAlphabet } from "nanoid";
import csurf from "csurf-expire";
import flash from "connect-flash";
import { fs } from "mz";
import twilio from "twilio";
import connectDB from "./config/db.js";
import passportConfig from "./config/passport.js";
import bunyan from "bunyan";
const logger = bunyan.createLogger({ name: "User Controller" });
import {
  log,
  dlog,
  cls,
  successMessage,
  infoMessage,
  stringify,
  keys,
  dbMessage,
} from "./custom_modules/index.js";
import landing from "./routes/landing/index.js";
import auth from "./routes/auth/index.js";
import user from "./routes/user/index.js";
import chat from "./routes/chat/index.js";
import ioserverhandler from "./custom_modules/ioserverhandler.js";

dotenv.config();
mongoose.Promise = global.Promise;

connectDB(mongoose);

const mongoStore = MongoDBStore(session);
const store = new mongoStore({
  uri: process.env.DB_URI,
  databaseName: process.env.DB_NAME,
  collection: process.env.DB_TABLE,
});

store.on("error", (err) => {
  log(err);
});

store.on("connected", () => {
  cls();
  const msg = dbMessage("\t\tStore connected to DB");
  dlog(
    successMessage(
      `\n\t\tServer listening on *:${PORT}\n\t\tServer Address: ${server._connectionKey}`
    )
  );
  log(msg);
});

// constants
const csrfProtection = csurf({ cookie: { maxAge: 60 * 60 * 8 } });
const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
const sessionMiddleware = session({
  name: `dEepphake`,
  secret: process.env.SECRET,
  key: process.env.SESSION_NAME,
  resave: true,
  saveUninitialized: true,
  store: store,
  expires: expiryDate,
  cookie: { secure: true },
});
const nanoid = customAlphabet("02468ouqtyminv", 13);
const __dirname = path.resolve(".");
const PORT = process.env.SPORT || 443;
const ADDRESS = process.env.ADDRESS || "0.0.0.0";
const domain = process.env.DOMAIN || null;
const options = letsencryptOptions(domain);

// Express app
const app = express();

// Authentication middleware
passportConfig(passport);

app.set("views", path.join(__dirname, "views"));

// View engine setup
app.engine(
  ".hbs",
  expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: "layout",
    partials: "partials",
    extname: ".hbs",
  })
);

app.set("view engine", ".hbs");

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache,no-store,max-age=0,must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "-1");
  res.setHeader("X-XSS-Protection", "1;mode=block");
  // res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("keep-alive", "-1");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Content-Security-Policy", "script-src 'self'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("x-powered-by", "Deez Nuts");
  res.setHeader("ETag", `${nanoid()}`);
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With, *"
  );
  next();
});

// Connect flash
app.use(flash());

// Global flash variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.warning_msg = req.flash("warning_msg");
  res.locals.info_msg = req.flash("info_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Static assets
app.use(express.static("node_modules/twilio-video/dist/"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/get-turn-credentials", (req, res) => {
  // create the twilioClient
  try {
    const client = twilio(process.env.APP_SID, process.env.APP_SECRET, {
      accountSid: process.env.ACCT_SID,
    });

    client.tokens
      .create()
      .then((token) => {
        res.send(token);
      })
      .catch((err) => {
        log("\n\t" + err);
        res.send({ status: false, message: "failed to get token" });
      });
  } catch (err) {
    console.log(err);
    res.send({ status: false });
  }
});

app.get(["/*"], csrfProtection, (req, res, next) => {
  next();
});

let clients = [];
app.get(["/landing"], (req, res, next) => {
  logger.info(`SUBSCRIBE /landing`);

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

  if (clients.length > 0) {
    const clientIndex = clients.findIndex((x) => x.id === host);

    if (clientIndex == -1) {
      const client = {};
      const user = {};
      client.address = host;
      client.platform = platform.replace('"', "").replace('"', "");
      client.stamp = new Date().toLocaleString();
      user.id = host;
      user.details = client;
      clients.push(user);
    }
  } else {
    const client = {};
    const user = {};
    client.address = host;
    client.platform = platform.replace('"', "").replace('"', "");
    client.stamp = new Date().toLocaleString();
    user.id = host;
    user.details = client;
    clients.push(user);
  }

  console.log(`\n\tUsers:\n\t${JSON.stringify(clients)}\n\n`);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("retry: 10000\n");
  res.write(`event:message\n`);
  res.write(`data:${JSON.stringify(clients)}\n`);
  res.write(`id:${host}\n\n`);
  res.flushHeaders();

  req.on("close", () => {
    clients = clients.filter((client) => client.id != host);
    console.log(`\n\tUsers:\n\t${JSON.stringify(clients)}\n\n`);
    res.end("See Ya!");
  });

  log(`Clients: ${clients.length}`);

  setInterval(() => {
    res.write(`event:message\n`);
    res.write(`data:${JSON.stringify(clients)}\n`);
    res.write(`id:${host}\n\n`);
    res.flushHeaders();
  }, [300]);
});

// Routes
app.use("/", landing);
app.use("/auth", auth);
app.use("/user", user);
app.use("/chat", chat);

const server = https.createServer(options, app);
// const server = spdy.createServer(options, app);
const io = new Server(server);
ioserverhandler(io);

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    cls();
    dlog(
      successMessage(
        `\n\t\tServer listening on *:${PORT}\n\t\tServer Address: ${server._connectionKey}\n\n`
      )
    );
  },
  (err) => {
    if (err) {
      console.log(err.message);
    }
  }
);

function letsencryptOptions(domain = null) {
  let certPath;
  if (null != domain) {
    certPath = "/etc/letsencrypt/live/";
    return {
      key: fs.readFileSync(certPath + domain + "/privkey.pem"),
      cert: fs.readFileSync(certPath + domain + "/cert.pem"),
      ca: fs.readFileSync(certPath + domain + "/chain.pem"),
    };
  } else {
    certPath = path.join(__dirname, "../certi/");
    return {
      key: fs.readFileSync(certPath + "server.key"),
      cert: fs.readFileSync(certPath + "server.cert"),
    };
  }
}
