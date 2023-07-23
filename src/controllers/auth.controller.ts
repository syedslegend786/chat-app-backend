import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import { filterObject } from "../utils/filterObject.js";
import { generateOTP } from "../utils/generateOTP.js";
import crypto from "crypto";
const createSignInToken = (userId: Types.ObjectId | string) => {
  return jwt.sign({ userId }, process.env.JWT_SIGN_IN_SECRET);
};
interface ILoginBody {
  email: string;
  password: string;
}
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as ILoginBody;
    const dbUser = await User.findOne({
      email: email,
    }).select("+password");
    if (
      !dbUser ||
      !(await dbUser.isCorrectPassword(password, dbUser.password))
    ) {
      return res.status(400).json({ msg: "Incorrect credentials." });
    }
    const token = createSignInToken(dbUser._id);
    return res.status(200).json(token);
  } catch (error: any) {}
};
interface IRegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body as IRegisterBody;
    const existing_user = await User.findOne({ email: email });
    const filteredData = filterObject(req.body, [
      "firstName",
      "lastName",
      "password",
      "email",
    ]);
    if (existing_user && existing_user.verified) {
      return res.status(400).json({ msg: "Email has been taken." });
    } else if (existing_user && !existing_user.verified) {
      const update_user = await User.findOneAndUpdate(
        { email: email },
        filteredData,
        {
          new: true,
          validateModifiedOnly: true,
        }
      );
      req.userId = update_user._id;
      next();
    } else {
      const new_user = await User.create(filteredData);
      req.userId = new_user._id;
      next();
    }
  } catch (error: any) {
    return res.status(500).json({ msg: error.message });
  }
};

export const sendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newOTP = generateOTP();
    const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10 minutes
    await User.findByIdAndUpdate(req.userId, {
      otp: newOTP,
      otp_expiry_time: otp_expiry_time,
    });
    // TODO Send email

    return res.status(200).json({ msg: "OTP sent successfully." });
  } catch (error: any) {
    return res.status(500).json({ msg: error.message });
  }
};
interface VerifyOTPBody {
  email: string;
  otp: string;
}
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body as VerifyOTPBody;
    const dbUser = await User.findOne({
      email: email,
      otp_expiry_time: { $gt: Date.now() },
    });
    if (!dbUser) {
      return res.status(400).json({ msg: "Invalid email or OTP expired." });
    }
    const isCorrectOTP = await dbUser.isCorrectOTP(otp, dbUser.otp);
    if (!isCorrectOTP) {
      return res.status(400).json({ msg: "Incorrect OTP" });
    }

    await User.findByIdAndUpdate(dbUser._id, {
      $unset: {
        otp: "",
      },
      verified: true,
    });

    const token = createSignInToken(dbUser._id);
    return res.status(200).json({ token });
  } catch (error: any) {
    return res.status(500).json({ msg: error.message });
  }
};
interface ForgotPasswordBody {
  email: string;
}
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordBody;
  const dbUser = await User.findOne({ email });
  if (!dbUser) {
    return res.status(400).json({ msg: "Incorrect email." });
  }
  try {
    const resetToken = dbUser.createPasswordResetToken();
    console.log("forgotPasswordToken-->", resetToken);
    const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10 minutes
    const resetURL = `http://localhost:3000/auth/reset-password/?code=${resetToken}`;
    // TODO => Send email to user
    await User.findByIdAndUpdate(dbUser._id, {
      passwordResetExpires: otp_expiry_time,
      passwordResetToken: resetToken,
    });
    return res.status(200).json({ msg: "Reset password link has been sent." });
  } catch (error: any) {
    dbUser.passwordResetExpires = undefined;
    dbUser.passwordResetToken = undefined;
    await dbUser.save();
    return res.status(500).json({ msg: error.message });
  }
};

interface ResetPasswordParams {
  token: string;
}
interface ResetPasswordBody {
  password: string;
}
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params as unknown as ResetPasswordParams;
  const { password } = req.body as ResetPasswordBody;
  try {
    // const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const dbUser = await User.findOne({
      passwordResetToken: token,
      // passwordResetExpires: { $gt: Date.now() },
    });

    if (!token || !dbUser) {
      return res.status(400).json({ msg: "Token is invalid or expired." });
    }
    // dbUser.password = password;
    // await dbUser.save();
    await User.findByIdAndUpdate(dbUser._id, {
      $set: {
        password: password,
      },
      $unset: {
        passwordResetExpires: "",
        passwordResetToken: "",
      },
    });
    return res.status(200).json({ msg: "Password changed successfully." });
  } catch (error: any) {
    return res.status(500).json({ msg: error.message });
  }
};
interface ResendOTPBody {
  email: string;
}
export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body as ResendOTPBody;
    const dbUser = await User.findOne({ email: email });
    if (!dbUser) {
      return res.status(400).json({ msg: "No user found." });
    }
    if (dbUser.verified) {
      return res.status(400).json({ msg: "You are already verified." });
    }
    req.userId = dbUser._id;
    next();
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
