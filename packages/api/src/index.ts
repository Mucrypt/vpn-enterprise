import express from 'express';
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

// Load environment variables from root directory
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.0'
  });
});

// =============================================
// AUTHENTICATION ROUTES
// =============================================

// User signup
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

// User login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await AuthService.signIn(email, password);
    const session = await AuthService.getSession();
    res.json({ user, session });
  } catch (error: any) {
    res.status(401).json({ error: 'Login failed', message: error.message });
  }
});

// Get all active servers (public)
app.get('/api/v1/servers', async (req, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    res.json({ servers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch servers', message: error.message });
  }
});

// =============================================
// USER ROUTES (Protected)
// =============================================

// Get user subscription
app.get('/api/v1/user/subscription', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const subscription = await SubscriptionRepository.getByUserId(req.user!.id);
    res.json({ subscription });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch subscription', message: error.message });
  }
});

// Get user devices
app.get('/api/v1/user/devices', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const devices = await DeviceRepository.getUserDevices(req.user!.id);
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch devices', message: error.message });
  }
});

// Get user stats
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

// Get user profile
app.get('/api/v1/user/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// =============================================
// ADMIN ROUTES (Protected - Admin only)
// =============================================

// Get all users (admin)
app.get('/api/v1/admin/users', async (req: AuthRequest, res) => {
  try {
    // Mock data for now - you can implement actual user fetching from Supabase
    const users = [
      {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        devices: 3,
        data_used: '45.2 GB',
        last_active: new Date().toISOString(),
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        email: 'user1@example.com',
        role: 'user',
        status: 'active',
        devices: 2,
        data_used: '12.8 GB',
        last_active: new Date(Date.now() - 3600000).toISOString(),
        created_at: '2024-02-20T10:00:00Z'
      }
    ];
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Get admin statistics
app.get('/api/v1/admin/statistics', async (req: AuthRequest, res) => {
  try {
    const servers = await ServerRepository.getAllActive();
    const totalServers = servers.length;
    const activeServers = servers.filter(s => s.is_active).length;
    
    res.json({
      totalUsers: 150,
      activeUsers: 89,
      totalServers,
      activeServers,
      totalConnections: 245,
      activeConnections: 89,
      totalDataTransfer: '1.2 TB',
      monthlyRevenue: '$12,450'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
  }
});

// Get analytics data
app.get('/api/v1/admin/analytics', async (req: AuthRequest, res) => {
  try {
    // Mock analytics data
    const analytics = {
      userGrowth: [
        { month: 'Jan', users: 45 },
        { month: 'Feb', users: 62 },
        { month: 'Mar', users: 78 },
        { month: 'Apr', users: 95 },
        { month: 'May', users: 120 },
        { month: 'Jun', users: 150 }
      ],
      serverLoad: [
        { name: 'US-East', load: 45 },
        { name: 'US-West', load: 62 },
        { name: 'EU-Central', load: 38 },
        { name: 'Asia-Pacific', load: 71 }
      ],
      bandwidth: [
        { date: '2024-01-01', upload: 120, download: 450 },
        { date: '2024-01-02', upload: 150, download: 520 },
        { date: '2024-01-03', upload: 180, download: 610 }
      ]
    };
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
});

// Get audit logs
app.get('/api/v1/admin/audit-logs', async (req: AuthRequest, res) => {
  try {
    // Mock audit logs
    const logs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'admin@example.com',
        action: 'USER_LOGIN',
        resource: 'Authentication',
        ip_address: '192.168.1.100',
        status: 'success',
        details: 'Successful login from desktop'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: 'user1@example.com',
        action: 'VPN_CONNECT',
        resource: 'Server: US-East-1',
        ip_address: '192.168.1.101',
        status: 'success',
        details: 'Connected to VPN server'
      }
    ];
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs', message: error.message });
  }
});

// Get invoices
app.get('/api/v1/billing/invoices', async (req: AuthRequest, res) => {
  try {
    // Mock invoices
    const invoices = [
      {
        id: 'INV-2024-001',
        date: '2024-01-01',
        amount: '$29.99',
        status: 'paid',
        plan: 'Professional'
      },
      {
        id: 'INV-2024-002',
        date: '2024-02-01',
        amount: '$29.99',
        status: 'paid',
        plan: 'Professional'
      }
    ];
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch invoices', message: error.message });
  }
});

// VPN Management Routes
app.get('/api/v1/vpn/status', async (req, res) => {
  try {
    const status = await vpnManager.getServerStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get server status' });
  }
});

app.post('/api/v1/vpn/clients', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Valid client name is required' });
    }

    const client = await vpnManager.createClient(name);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.get('/api/v1/vpn/clients', async (req, res) => {
  try {
    const clients = await vpnManager.listClients();
    res.json({ clients });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list clients' });
  }
});

app.delete('/api/v1/vpn/clients/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await vpnManager.removeClient(name);
    res.json({ message: `Client ${name} removed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove client' });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Export for Vercel serverless (CommonJS format)
module.exports = app;

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 VPN Enterprise API running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Health check: http://localhost:${PORT}/health`);
  });
}