import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Helper functions for common operations
export const setWithExpiry = async (key: string, value: string, expirySeconds: number) => {
  await redisClient.setEx(key, expirySeconds, value);
};

export const get = async (key: string): Promise<string | null> => {
  return await redisClient.get(key);
};

export const del = async (key: string): Promise<number> => {
  return await redisClient.del(key);
};

export const exists = async (key: string): Promise<number> => {
  return await redisClient.exists(key);
};

export const setAdd = async (key: string, ...members: string[]): Promise<number> => {
  return await redisClient.sAdd(key, members);
};

export const setRemove = async (key: string, ...members: string[]): Promise<number> => {
  return await redisClient.sRem(key, members);
};

export const setMembers = async (key: string): Promise<string[]> => {
  return await redisClient.sMembers(key);
};

export const hashSet = async (key: string, field: string, value: string): Promise<number> => {
  return await redisClient.hSet(key, field, value);
};

export const hashGet = async (key: string, field: string): Promise<string | undefined> => {
  return await redisClient.hGet(key, field);
};

export const hashGetAll = async (key: string): Promise<Record<string, string>> => {
  return await redisClient.hGetAll(key);
};

export default redisClient;
