import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/auth.service.js';
import { User, type IUser } from '../models/Users.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role, fullName, companyName, companyWebsite } = req.body;

    const userExists = await User.exists({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userData: Partial<IUser> = {
      email,
      passwordHash,
      role,
      isProfileCompleted: false,
    };

    if (role === 'seeker') {
      userData.profile = {
        fullName: fullName || '',
        resumeUrl: '',
        skills: [],
        experienceYear: 0
      };
    } else if (role === 'recruiter') {
      userData.recruiterProfile = {
        companyName: companyName || '',
        companyWebsite: companyWebsite || '',
        accountabilityScore: 100
      };
    }

    const user = await User.create(userData);

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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
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