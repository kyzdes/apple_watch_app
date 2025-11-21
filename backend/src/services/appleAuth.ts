import appleSignin from 'apple-signin-auth';
import logger from '../utils/logger';

export interface AppleAuthResponse {
  email: string;
  sub: string; // Apple user ID
  email_verified?: boolean;
}

export const verifyAppleToken = async (identityToken: string): Promise<AppleAuthResponse> => {
  try {
    const appleIdTokenClaims = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID || 'com.hapticfriends.app',
      ignoreExpiration: false,
    });

    return {
      email: appleIdTokenClaims.email || '',
      sub: appleIdTokenClaims.sub,
      email_verified: appleIdTokenClaims.email_verified === 'true',
    };
  } catch (error) {
    logger.error('Apple token verification failed:', error);
    throw new Error('Invalid Apple Sign In token');
  }
};

export const getApplePublicKey = async () => {
  try {
    const keys = await appleSignin.getAuthorizationUrl({
      clientID: process.env.APPLE_CLIENT_ID || 'com.hapticfriends.app',
      redirectUri: 'https://hapticfriends.app/auth/apple/callback',
      state: 'state',
    });
    return keys;
  } catch (error) {
    logger.error('Failed to get Apple public key:', error);
    throw error;
  }
};
