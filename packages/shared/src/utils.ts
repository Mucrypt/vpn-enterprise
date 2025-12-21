import { ApiResponse } from './types';
import { HTTP_STATUS } from './constants';

// Success response helper
export const successResponse = <T>(data: T, message?: string, meta?: any): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    meta,
  };
};

// Error response helper
export const errorResponse = (error: string, statusCode?: number): ApiResponse => {
  return {
    success: false,
    error,
  };
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry utility
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError!;
};

// Generate random string
export const randomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate database name from tenant
export const generateDatabaseName = (tenantId: string, dbName: string): string => {
  return `tenant_${tenantId.replace(/-/g, '_')}_${dbName}`;
};

// Parse database connection string
export const parseDatabaseUrl = (url: string) => {
  const regex = /^(\w+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid database URL format');
  }

  return {
    type: match[1],
    user: match[2],
    password: match[3],
    host: match[4],
    port: parseInt(match[5], 10),
    database: match[6],
  };
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .toLowerCase();
};

// Format bytes
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Chunk array
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};
