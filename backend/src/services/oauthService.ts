import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import User, { IUser } from '../models/User';

/**
 * Manual OAuth2 "Authorization Code" flow for Google and GitHub — written
 * out explicitly (no passport.js) so the flow is easy to follow and explain
 * in an academic viva: build an authorize URL → user consents on the
 * provider's site → provider redirects back with a `code` → we exchange
 * that code server-side for an access token → we fetch the user's profile
 * → we find-or-create a local User → we issue our own JWT, same as a
 * normal login.
 *
 * Requires GOOGLE_CLIENT_ID/SECRET and/or GITHUB_CLIENT_ID/SECRET to be set
 * (see .env.example + docs/SETUP.md). Without them, the start endpoints
 * return a clear 501 rather than a confusing redirect failure.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

function googleRedirectUri(): string {
  return `${env.apiBaseUrl}/api/auth/google/callback`;
}
function githubRedirectUri(): string {
  return `${env.apiBaseUrl}/api/auth/github/callback`;
}

export function isGoogleConfigured(): boolean {
  return !!(env.google.clientId && env.google.clientSecret);
}
export function isGithubConfigured(): boolean {
  return !!(env.github.clientId && env.github.clientSecret);
}

export function buildGoogleAuthUrl(state: string): string {
  if (!isGoogleConfigured()) {
    throw new ApiError(501, 'OAUTH_NOT_CONFIGURED', 'Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID/SECRET).');
  }
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function buildGithubAuthUrl(state: string): string {
  if (!isGithubConfigured()) {
    throw new ApiError(501, 'OAUTH_NOT_CONFIGURED', 'GitHub sign-in is not configured on this server (missing GITHUB_CLIENT_ID/SECRET).');
  }
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: githubRedirectUri(),
    scope: 'read:user user:email',
    state,
  });
  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function handleGoogleCallback(code: string): Promise<IUser> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    const tokenError = (await tokenRes.json().catch(() => ({}))) as {
      error?: string;
      error_description?: string;
    };
    const providerMessage = tokenError.error_description || tokenError.error;
    throw new ApiError(
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      providerMessage
        ? `Google rejected the authorization code: ${providerMessage}`
        : 'Failed to exchange Google authorization code.'
    );
  }
  const tokenData = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) {
    throw new ApiError(502, 'OAUTH_PROFILE_FETCH_FAILED', 'Failed to fetch Google profile.');
  }
  const profile = (await profileRes.json()) as { sub: string; email: string; name?: string; picture?: string };

  return findOrCreateOAuthUser({
    provider: 'google',
    providerId: profile.sub,
    email: profile.email,
    name: profile.name || profile.email.split('@')[0],
    avatar: profile.picture,
  });
}

export async function handleGithubCallback(code: string): Promise<IUser> {
  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
      redirect_uri: githubRedirectUri(),
    }),
  });
  if (!tokenRes.ok) {
    throw new ApiError(502, 'OAUTH_TOKEN_EXCHANGE_FAILED', 'Failed to exchange GitHub authorization code.');
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    throw new ApiError(502, 'OAUTH_TOKEN_EXCHANGE_FAILED', tokenData.error || 'GitHub did not return an access token.');
  }

  const headers = { Authorization: `token ${tokenData.access_token}`, 'User-Agent': 'Smart-Electronic-Vehicle-Charging-Management-System-App' };
  const profileRes = await fetch(GITHUB_USER_URL, { headers });
  if (!profileRes.ok) {
    throw new ApiError(502, 'OAUTH_PROFILE_FETCH_FAILED', 'Failed to fetch GitHub profile.');
  }
  const profile = (await profileRes.json()) as { id: number; login: string; name?: string; avatar_url?: string; email?: string };

  // GitHub only returns `email` on the profile if the user made it public;
  // otherwise we fetch their verified emails separately (requires the
  // `user:email` scope, requested above).
  let email = profile.email;
  if (!email) {
    const emailsRes = await fetch(GITHUB_EMAILS_URL, { headers });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
      email = primary?.email;
    }
  }
  if (!email) {
    throw new ApiError(
      400,
      'OAUTH_NO_EMAIL',
      'Your GitHub account has no accessible email address. Make an email public or verified on GitHub and try again.'
    );
  }

  return findOrCreateOAuthUser({
    provider: 'github',
    providerId: String(profile.id),
    email,
    name: profile.name || profile.login,
    avatar: profile.avatar_url,
  });
}

async function findOrCreateOAuthUser(input: {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<IUser> {
  const idField = input.provider === 'google' ? 'googleId' : 'githubId';

  // 1) Already linked by provider id.
  let user = await User.findOne({ [idField]: input.providerId });
  if (user) return user;

  // 2) An existing local/other-provider account with the same email — link
  // this provider to it rather than creating a duplicate account.
  user = await User.findOne({ email: input.email.toLowerCase() });
  if (user) {
    (user as any)[idField] = input.providerId;
    if (!user.avatar && input.avatar) user.avatar = input.avatar;
    await user.save();
    return user;
  }

  // 3) Brand new user.
  user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    authProvider: input.provider,
    [idField]: input.providerId,
    avatar: input.avatar,
    role: 'USER',
    verified: true, // the provider already verified this email
  });
  return user;
}
