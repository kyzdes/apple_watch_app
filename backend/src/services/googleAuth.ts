import { OAuth2Client } from 'google-auth-library';
import logger from '../utils/logger';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleAuthResponse {
  email: string;
  sub: string; // Google user ID
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleAuthResponse> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    return {
      email: payload.email || '',
      sub: payload.sub,
      email_verified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    logger.error('Google token verification failed:', error);
    throw new Error('Invalid Google Sign In token');
  }
};
