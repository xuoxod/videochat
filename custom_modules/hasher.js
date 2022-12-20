import crypto from "crypto";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ?%$^&*~`!@#];",
  27
);

export const createHash = (arg1, cb) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(arg1, salt, (err, hash) => {
      if (err) {
        return cb({ status: false, error: err.message });
      } else {
        return cb({
          status: true,
          original: arg1,
          payload: hash,
        });
      }
    });
  });
};

export const generateToken = (cb, arg = null) => {
  const argument = arg || nanoid();
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(argument, salt, (err, hash) => {
      if (err) {
        return cb({ status: false, error: err.message });
      } else {
        return cb({
          status: true,
          original: argument,
          hash: hash,
        });
      }
    });
  });
};

export const generateTokenString = (size = 32) => {
  const generatedToken = crypto.randomBytes(size);
  return generatedToken.toString("hex");
};

export const generateExpireToken = (expiration = 18000) =>
  Date.now() + expiration;

export const generateResetTokens = () => {
  return {
    resetToken: generateTokenString(),
    expireToken: generateExpireToken(),
  };
};
