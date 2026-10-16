import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import * as authService from '../services/authService';
import * as oauthService from '../services/oauthService';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  ok(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  ok(res, result);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWT: logout is a client-side token discard. Documented in API.md.
  ok(res, { message: 'Logged out. Discard tokens client-side.' });
});

// --- OAuth: Google ---------------------------------------------------

export const googleStart = asyncHandler(async (req: Request, res: Response) => {
  // `state` is a lightweight anti-CSRF nonce, echoed back by Google and not
  // otherwise validated in this academic build — a production system would
  // store it in a short-lived signed cookie and verify it on callback.
  const state = Math.random().toString(36).slice(2);
  const url = oauthService.buildGoogleAuthUrl(state);
  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) throw new ApiError(400, 'OAUTH_MISSING_CODE', 'Google did not return an authorization code.');
  const user = await oauthService.handleGoogleCallback(code);
  const { accessToken } = authService.issueTokens(user);
  res.redirect(`${env.clientOrigin}/oauth-callback?token=${encodeURIComponent(accessToken)}`);
});

// --- OAuth: GitHub -----------------------------------------------------

export const githubStart = asyncHandler(async (req: Request, res: Response) => {
  const state = Math.random().toString(36).slice(2);
  const url = oauthService.buildGithubAuthUrl(state);
  res.redirect(url);
});

export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) throw new ApiError(400, 'OAUTH_MISSING_CODE', 'GitHub did not return an authorization code.');
  const user = await oauthService.handleGithubCallback(code);
  const { accessToken } = authService.issueTokens(user);
  res.redirect(`${env.clientOrigin}/oauth-callback?token=${encodeURIComponent(accessToken)}`);
});
