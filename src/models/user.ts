import mongoose, { Model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
export interface IUser {
  firstName: string;
  lastName: string;
  avatar?: string;
  email: string;
  password?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  verified: boolean;
  otp?: string;
  otp_expiry_time?: Date;
}
interface IUserMethods {
  isCorrectPassword: (userPwd: string, hashPwd: string) => Promise<boolean>;
  isCorrectOTP: (userOTP: string, hashOTP: string) => Promise<boolean>;
  createPasswordResetToken: () => string;
}
type UserModel = Model<IUser, {}, IUserMethods>;
const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required."],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required."],
    },
    avatar: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      validate: {
        validator: function (email: string) {
          return String(email)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        },
        message: (props) => `Email ${props.value} is invalid.`,
      },
    },
    password: {
      type: String,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otp_expiry_time: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
// when-ever we update/create the userSchema { if => otp is also updated/created } then this function will execute and update the otp hashed.
userSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();
  this.otp = await bcrypt.hash(this.otp, 12);
  return next();
});
userSchema.methods.isCorrectPassword = async function (userPwd, hashPwd) {
  return userPwd === hashPwd;
};

userSchema.methods.isCorrectOTP = async function (userOTP, hashOTP) {
  console.log({ userOTP, hashOTP });
  return userOTP === hashOTP;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;
