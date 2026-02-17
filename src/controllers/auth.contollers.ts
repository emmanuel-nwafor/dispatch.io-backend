import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.service.js';
import { User, type IUser } from '../models/Users.js';
import { sendOtpEmail } from '../services/email.service.js';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user && user.isVerified && user.passwordHash) {
      res.status(400).json({ success: false, message: 'User already registered. Please login.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findOneAndUpdate(
      { email },
      { otpHash, otpExpires, isVerified: false },
      { upsert: true, new: true }
    );

    try {
      await sendOtpEmail(email, otp);
      console.log(`[SUCCESS] OTP sent to ${email}`);
    } catch (emailError) {
      console.error("[EMAIL ERROR]:", emailError);
      res.status(500).json({ success: false, message: 'Failed to send verification email.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Valid for 10 minutes.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify Otp
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otpHash || !user.otpExpires) {
      res.status(404).json({ success: false, message: 'User not found or OTP not requested' });
      return;
    }

    if (new Date() > user.otpExpires) {
      res.status(400).json({ success: false, message: 'OTP has expired' });
      return;
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
      return;
    }

    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified. You can now complete your registration.'
    });
  } catch (error) {
    next(error);
  }
};

// Register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role, fullName, companyName, companyWebsite } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ success: false, message: 'Please request an OTP first' });
      return;
    }

    if (!user.isVerified) {
      res.status(400).json({ success: false, message: 'Email not verified. Please verify OTP first' });
      return;
    }

    if (user.passwordHash) {
      res.status(400).json({ success: false, message: 'User already fully registered' });
      return;
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.role = role;
    user.isProfileCompleted = false;

    // 3. Build appropriate profile
    if (role === 'seeker') {
      user.profile = {
        fullName: fullName || '',
        resumeUrl: '',
        skills: [],
        experienceYear: 0
      };
    } else if (role === 'recruiter') {
      user.recruiterProfile = {
        companyName: companyName || '',
        companyWebsite: companyWebsite || '',
        accountabilityScore: 100
      };
    }

    await user.save();

    const token = AuthService.generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: AuthService.formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * LOGIN: Traditional email/password entry
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Use a single generic message for security
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ success: false, message: 'Please verify your email first' });
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