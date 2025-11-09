import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { VPNServerManager, ServerLoadBalancer, ConnectionTracker } from '@vpn-enterprise/vpn-core';
import { AuthService, authMiddleware, adminMiddleware, AuthRequest } from '@vpn-enterprise/auth';
import {
  ServerRepository,
  SubscriptionRepository,
  DeviceRepository,
  ConnectionRepository
} from '@vpn-enterprise/database';

// Load environment variables from repo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const vpnManager = new VPNServerManager();
const loadBalancer = new ServerLoadBalancer();
const connectionTracker = new ConnectionTracker();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
// Cookies (used for refresh token cookie)
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.0'
  });
});

// ==========================
// ROUTES (kept identical to previous implementation)
// ==========================

// AUTH
app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await AuthService.signUp(email, password);
    res.status(201).json({ user, message: 'User created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: 'Signup failed', message: error.message });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  // AuthService may have differing type shapes depending on package builds; cast to any to remain flexible
  const signInResult: any = await (AuthService as any).signIn(email, password);
  const user = signInResult?.user || signInResult;
  const session = signInResult?.session || (await (AuthService as any).getSession());

    // If a refresh token is present in the session, set it as a httpOnly cookie
    try {
      if (session && session.refresh_token) {
        const cookieOptions: any = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        };

        // If expires_in is provided use it to set maxAge (ms)
        if (session.expires_in) cookieOptions.maxAge = Number(session.expires_in) * 1000;

        res.cookie('refresh_token', session.refresh_token, cookieOptions);
      }
    } catch (cookieErr) {
      console.warn('Failed to set refresh token cookie:', cookieErr);
    }

    res.json({ user, session });
  } catch (error: any) {
    res.status(401).json({ error: 'Login failed', message: error.message });
  }
});

// Refresh session using refresh token stored in httpOnly cookie (or body)
app.post('/api/v1/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

  const session = await (AuthService as any).refreshSession(refreshToken);

    // Rotate refresh token cookie if provided
    try {
      if (session && session.refresh_token) {
        const cookieOptions: any = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        };
        if (session.expires_in) cookieOptions.maxAge = Number(session.expires_in) * 1000;
        res.cookie('refresh_token', session.refresh_token, cookieOptions);
      }
    } catch (cookieErr) {
      console.warn('Failed to set refresh token cookie during refresh:', cookieErr);
    }

    res.json({ session });
  } catch (error: any) {
    res.status(401).json({ error: 'Refresh failed', message: error.message });
  }
});

// Logout - revoke session on Supabase and clear refresh cookie
app.post('/api/v1/auth/logout', async (req, res) => {
  try {
    await AuthService.signOut();
    // Clear cookie
    res.clearCookie('refresh_token', { path: '/' });
    // Optionally clear access token cookie as well if used
    res.clearCookie('access_token', { path: '/' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed', message: error.message });
  }
});

// Public servers
app.get('/api/v1/servers', async (req, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    res.json({ servers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch servers', message: error.message });
  }
});

// User (protected) routes
app.get('/api/v1/user/subscription', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const subscription = await SubscriptionRepository.getByUserId(req.user!.id);
    res.json({ subscription });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch subscription', message: error.message });
  }
});

app.get('/api/v1/user/devices', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const devices = await DeviceRepository.getUserDevices(req.user!.id);
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch devices', message: error.message });
  }
});

app.get('/api/v1/user/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    res.json({
      totalServers: servers.length,
      activeConnections: 0,
      totalUsers: 1,
      dataTransferred: '0 GB'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
  }
});

app.get('/api/v1/user/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// Notifications (user)
app.get('/api/v1/user/notifications', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const notifications = [] as any[];
    const unread_count = 0;
    res.json({ notifications, unread_count });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

app.put('/api/v1/user/notifications/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification read', message: error.message });
  }
});

app.put('/api/v1/user/notifications/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notifications read', message: error.message });
  }
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export default app;
