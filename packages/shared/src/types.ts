// Common types used across all services

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  TENANT_ADMIN = 'tenant_admin',
  DEVELOPER = 'developer',
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface ServiceConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  port: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseInstance {
  id: string;
  tenantId: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'creating' | 'active' | 'maintenance' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStatus {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
