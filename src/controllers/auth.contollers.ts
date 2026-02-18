import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.service.js';
import { User } from '../models/Users.js';
import { Otp } from '../models/Otp.js';
import { sendOtpEmail } from '../services/email.service.js';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    await Otp.findOneAndUpdate(
      { email },
      { otpHash, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email.',
      otp: otp
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'No OTP request found for this email.' });
      return;
    }

    if (otpRecord.count >= 4) {
      res.status(429).json({
        success: false,
        message: 'Too many attempts. Please wait an hour before trying again.'
      });
      return;
    }

    const { otp, otpHash } = await generateOtpData(email);

    otpRecord.otpHash = otpHash;
    otpRecord.count += 1;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: `OTP resent. Attempt ${otpRecord.count} of 3.`,
      otp: otp
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
      return;
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
      return;
    }

    res.status(200).json({ success: true, message: 'OTP verified. Proceed to registration.' });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Verification session expired.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email: otpRecord.email,
      passwordHash,
      isVerified: true
    });

    await Otp.deleteOne({ email: otpRecord.email });

    const token = AuthService.generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: AuthService.formatUserResponse(newUser)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = AuthService.generateToken(user);
    res.status(200).json({
      success: true,
      token,
      user: AuthService.formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

function generateOtpData(email: any): { otp: any; otpHash: any; } | PromiseLike<{ otp: any; otpHash: any; }> {
  throw new Error('Function not implemented.');
}
