import User from '../models/user.js';
import { Session } from '../models/session.js';

import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { createSession, setSessionCookies } from '../services/auth.js';

import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';

import fs from 'fs/promises';
import handlebars from 'handlebars';
import path from 'path';

export const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw createHttpError(400, 'Email in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ ...req.body, password: hashPassword });

  const session = await createSession(newUser._id);
  setSessionCookies(res, session);

  res.status(201).json(newUser);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw createHttpError(401, 'Invalid credentials');

  const inValidPassword = await bcrypt.compare(password, user.password);
  if (!inValidPassword) throw createHttpError(401, 'Invalid credentials');

  await Session.findOneAndDelete({ userId: user._id });

  const newSession = await createSession(user._id);
  setSessionCookies(res, newSession);

  res.json(user);
};

export const refreshUserSession = async (req, res) => {
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });
  if (!session) throw createHttpError(401, 'Session not found');

  const isRefreshTokenExpired = session.refreshTokenValidUntil < new Date();
  if (isRefreshTokenExpired) {
    await Session.findByIdAndDelete(session._id);
    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    throw createHttpError(401, 'Session token expired');
  }

  await Session.findByIdAndDelete(session._id);

  const newSession = await createSession(session.userId);

  setSessionCookies(res, newSession);

  res.json({ message: 'Session refreshed' });
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await Session.findByIdAndDelete(sessionId);
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');

  res.status(204).end();
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: 'Password reset email sent successfully' });
    }

    const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const resetLink = `${FRONTEND_DOMAIN}/reset-password?token=${token}`;

    const templatePath = path.resolve(
      'src',
      'templates',
      'reset-password-email.html',
    );
    const source = await fs.readFile(templatePath, 'utf8');

    const template = handlebars.compile(source);

    const html = template({
      username: user.username || 'користувач',
      resetLink,
    });

    await sendEmail({
      to: user.email,
      subject: 'Password reset request',
      html,
    });

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({ _id: decoded.sub, email: decoded.email });
    if (!user) throw createHttpError(404, 'User not found');

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
