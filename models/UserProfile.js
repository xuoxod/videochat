import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    passwordSaved: {
      type: Boolean,
      default: false,
    },
    address: {
      street: {
        type: String,
      },
      city: { type: String },
      zipcode: { type: String },
    },
    gender: { type: String },
    dob: {
      month: { type: String },
      day: { type: String },
      year: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
