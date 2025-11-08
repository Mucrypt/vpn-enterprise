const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://wgmgtxlodyxbhxfpnwwm.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ==============================================
// SECURITY MIDDLEWARE
// ==============================================

// Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS - Allow only specific origins
const allowedOrigins = [
  'https://vpn-enterprise-dashboard.vercel.app',
  'https://vpn-enterprise-dashboard-md8sm8f8b-mukulahs-projects.vercel.app',
  'https://vpn-enterprise-dashboard-73agzzd3z-mukulahs-projects.vercel.app',
  'https://vpn-enterprise-dashboard-5e1ye1790-mukulahs-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow if in whitelist
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow any Vercel preview deployments for vpn-enterprise-dashboard
    if (origin.match(/^https:\/\/vpn-enterprise-dashboard.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Prevent DDoS and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: JSON.stringify({
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Temporarily increased to 100 for testing database trigger
  message: JSON.stringify({
    success: false,
    message: 'Too many login attempts, please try again later.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  }
});

app.use('/api/', limiter);
app.use('/api/v1/auth/', authLimiter); // Fixed: should be /api/v1/auth/ not /auth/

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Request logging for security monitoring
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  next();
});

// ==============================================
// API ENDPOINTS
// ==============================================

// Test endpoint to verify deployment
app.get('/api/v1/test/deployment', (req, res) => {
  res.json({ 
    deployed: true,
    timestamp: new Date().toISOString(),
    version: '904ae5b',
    message: 'Latest deployment with all endpoints'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VPN Enterprise API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth/*',
      vpn: '/vpn/*',
      admin: '/admin/*'
    },
    security: 'Enterprise-grade protection enabled'
  });
});

// ==============================================
// AUTHENTICATION ENDPOINTS
// ==============================================

// Signup endpoint
app.post('/api/v1/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters' 
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'user'
        }
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create account'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create account' 
    });
  }
});

// Login endpoint
app.post('/api/v1/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Fetch user role from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, avatar_url')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role || 'user',
        full_name: userData?.full_name || null,
        avatar_url: userData?.avatar_url || null
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed' 
    });
  }
});

// ==============================================
// VPN SERVER ENDPOINTS
// ==============================================

// Get all VPN servers
app.get('/api/v1/servers', async (req, res) => {
  try {
    // Mock server data
    /**
     * Array of VPN server objects containing server configuration and status information.
     * Each server object includes connection details, performance metrics, and current load status.
     * 
     * @type {Array<Object>}
     * @property {string} id - Unique identifier for the server
     * @property {string} name - Human-readable server name with location
     * @property {string} country - Country where the server is located
     * @property {string} city - City where the server is located
     * @property {string} ip_address - IP address of the server
     * @property {number} load - Current server load percentage (0-100)
     * @property {string} status - Current operational status of the server (e.g., 'online', 'offline')
     * @property {number} latency - Server latency in milliseconds
     * @property {number} capacity - Maximum connection capacity of the server
     * @property {number} current_connections - Number of active connections to the server
     */
    const servers = [
      {
        id: 'server-1',
        name: 'US East - New York',
        country: 'United States',
        country_code: 'US',
        city: 'New York',
        ip_address: '192.0.2.1',
        load: 45,
        status: 'online',
        is_active: true,
        latency: 12,
        capacity: 1000,
        current_connections: 450
      },
      {
        id: 'server-2',
        name: 'US West - Los Angeles',
        country: 'United States',
        country_code: 'US',
        city: 'Los Angeles',
        ip_address: '192.0.2.2',
        load: 62,
        status: 'online',
        is_active: true,
        latency: 8,
        capacity: 1000,
        current_connections: 620
      },
      {
        id: 'server-3',
        name: 'EU - London',
        country: 'United Kingdom',
        country_code: 'UK',
        city: 'London',
        ip_address: '192.0.2.3',
        load: 38,
        status: 'online',
        is_active: true,
        latency: 25,
        capacity: 1000,
        current_connections: 380
      },
      {
        id: 'server-4',
        name: 'Asia - Tokyo',
        country: 'Japan',
        country_code: 'JP',
        city: 'Tokyo',
        ip_address: '192.0.2.4',
        load: 71,
        status: 'online',
        is_active: true,
        latency: 120,
        capacity: 1000,
        current_connections: 710
      },
      {
        id: 'server-5',
        name: 'EU - Frankfurt',
        country: 'Germany',
        country_code: 'DE',
        city: 'Frankfurt',
        ip_address: '192.0.2.5',
        load: 28,
        status: 'online',
        is_active: true,
        latency: 30,
        capacity: 1000,
        current_connections: 280
      }
    ];

    res.status(200).json({ servers });
  } catch (error) {
    console.error('Servers fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch servers' 
    });
  }
});

// ==============================================
// ADMIN ENDPOINTS
// ==============================================

// Get admin statistics
app.get('/api/v1/admin/statistics', async (req, res) => {
  try {
    // Mock statistics data
    const stats = {
      totalUsers: 15847,
      activeConnections: 8923,
      totalServers: 156,
      totalBandwidth: '2.4 TB',
      revenue: {
        today: 12450,
        thisMonth: 387600,
        thisYear: 4251200
      },
      growth: {
        users: 12.5,
        revenue: 18.3,
        bandwidth: 25.7
      },
      recentActivity: [
        {
          id: 1,
          type: 'new_user',
          message: 'New user registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: 2,
          type: 'server_added',
          message: 'Server added: EU - Frankfurt',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 3,
          type: 'high_load',
          message: 'High load detected on US West',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ],
      serverStatus: {
        online: 152,
        offline: 2,
        maintenance: 2
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics' 
    });
  }
});

// ==============================================
// ADMIN ENDPOINTS
// ==============================================

// Get all users (admin)
app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get audit logs (admin)
app.get('/api/v1/admin/audit-logs', async (req, res) => {
  try {
    // Mock audit logs for now
    const logs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'romeomukulah@gmail.com',
        action: 'USER_LOGIN',
        resource: 'Authentication',
        ip_address: req.ip || '127.0.0.1',
        status: 'success',
        details: 'Successful login from dashboard'
      }
    ];
    res.json(logs);
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get security events (admin)
app.get('/api/v1/admin/security/events', async (req, res) => {
  try {
    // Mock security events
    const events = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'login_success',
        severity: 'info',
        user: 'romeomukulah@gmail.com',
        ip: req.ip || '127.0.0.1',
        details: 'User logged in successfully'
      }
    ];
    res.json(events);
  } catch (error) {
    console.error('Security events fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// ==============================================
// BILLING ENDPOINTS
// ==============================================

// Get billing plans
app.get('/api/v1/billing/plans', async (req, res) => {
  try {
    // Mock billing plans data
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['1 Device', '5 GB/month', 'Basic Support', '10 Server Locations'],
        maxDevices: 1,
        dataLimit: 5,
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: ['5 Devices', '100 GB/month', 'Email Support', '50 Server Locations'],
        maxDevices: 5,
        dataLimit: 100,
        popular: false,
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 14.99,
        currency: 'USD',
        interval: 'month',
        features: ['10 Devices', 'Unlimited Data', 'Priority Support', '150+ Server Locations', 'Advanced Security'],
        maxDevices: 10,
        dataLimit: null,
        popular: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 49.99,
        currency: 'USD',
        interval: 'month',
        features: ['Unlimited Devices', 'Unlimited Data', '24/7 Support', 'All Servers', 'Dedicated Servers', 'API Access'],
        maxDevices: null,
        dataLimit: null,
        popular: false,
      },
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching billing plans:', error);
    res.status(500).json({ error: 'Failed to fetch billing plans' });
  }
});

// Get user invoices
app.get('/api/v1/billing/invoices', async (req, res) => {
  try {
    // Mock invoice data
    const invoices = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        amount: 14.99,
        currency: 'USD',
        status: 'paid',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        planName: 'Premium',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        amount: 14.99,
        currency: 'USD',
        status: 'paid',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000).toISOString(),
        planName: 'Premium',
      },
    ];

    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get user subscription
app.get('/api/v1/user/subscription', async (req, res) => {
  try {
    // Mock subscription data
    const subscription = {
      id: '1',
      plan: 'premium',
      status: 'active',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      maxDevices: 10,
      dataLimit: null, // unlimited
    };

    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get admin connections
app.get('/api/v1/admin/connections', async (req, res) => {
  try {
    const { data: connections, error } = await supabase
      .from('connection_logs')
      .select(`
        *,
        users!inner(email, full_name),
        servers!inner(name, country)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    res.json({ connections: connections || [] });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// ==============================================
// ENTERPRISE FEATURES - ORGANIZATIONS
// ==============================================

// Get all organizations
app.get('/api/v1/admin/organizations', async (req, res) => {
  try {
    // Mock organizations data
    const organizations = [
      {
        id: '1',
        name: 'Acme Corporation',
        billing_tier: 'enterprise',
        max_users: 100,
        max_servers: 10,
        max_devices_per_user: 5,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          sso_enabled: true,
          force_2fa: true,
          ip_whitelisting: true
        },
        _count: {
          users: 45,
          servers: 7
        }
      },
      {
        id: '2',
        name: 'Tech Startups Inc',
        billing_tier: 'business',
        max_users: 50,
        max_servers: 5,
        max_devices_per_user: 3,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          sso_enabled: false,
          force_2fa: true,
          ip_whitelisting: false
        },
        _count: {
          users: 28,
          servers: 3
        }
      }
    ];

    res.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Create organization
app.post('/api/v1/admin/organizations', async (req, res) => {
  try {
    const newOrg = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString(),
      _count: { users: 0, servers: 0 }
    };
    res.json({ organization: newOrg });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// ==============================================
// THREAT PROTECTION
// ==============================================

// Get threat statistics
app.get('/api/v1/security/threats/stats', async (req, res) => {
  try {
    const stats = {
      total_threats_blocked: 15847,
      blocked_today: 234,
      blocked_this_week: 1543,
      blocked_this_month: 6789,
      by_type: {
        malware: 3421,
        phishing: 5678,
        tracker: 4329,
        ads: 2419
      },
      threat_level: 'low'
    };
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching threat stats:', error);
    res.status(500).json({ error: 'Failed to fetch threat stats' });
  }
});

// Get recent threats
app.get('/api/v1/security/threats/recent', async (req, res) => {
  try {
    const threats = [
      {
        id: '1',
        threat_type: 'malware',
        domain: 'malicious-site.com',
        ip_address: '192.168.1.100',
        blocked_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        severity: 'high',
        description: 'Trojan detected attempting to download',
        user_id: 'user1'
      },
      {
        id: '2',
        threat_type: 'phishing',
        domain: 'fake-bank-login.net',
        ip_address: '192.168.1.101',
        blocked_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        severity: 'critical',
        description: 'Phishing attempt mimicking banking site',
        user_id: 'user2'
      },
      {
        id: '3',
        threat_type: 'tracker',
        domain: 'analytics-tracker.com',
        ip_address: '192.168.1.102',
        blocked_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        severity: 'medium',
        description: 'Third-party tracking script blocked',
        user_id: 'user1'
      }
    ];
    res.json({ threats });
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({ error: 'Failed to fetch threats' });
  }
});

// ==============================================
// SPLIT TUNNELING
// ==============================================

// Get split tunnel rules
app.get('/api/v1/user/split-tunnel', async (req, res) => {
  try {
    const rules = [
      {
        id: '1',
        type: 'app',
        name: 'Netflix',
        action: 'bypass',
        enabled: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'domain',
        name: 'zoom.us',
        action: 'vpn',
        enabled: true,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    res.json({ rules });
  } catch (error) {
    console.error('Error fetching split tunnel rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Create split tunnel rule
app.post('/api/v1/user/split-tunnel', async (req, res) => {
  try {
    const newRule = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString()
    };
    res.json({ rule: newRule });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Update split tunnel rule
app.patch('/api/v1/user/split-tunnel/:id', async (req, res) => {
  try {
    const updatedRule = {
      id: req.params.id,
      ...req.body
    };
    res.json({ rule: updatedRule });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete split tunnel rule
app.delete('/api/v1/user/split-tunnel/:id', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// ==============================================
// KILL SWITCH MONITORING
// ==============================================

// Get kill switch events
app.get('/api/v1/security/kill-switch/events', async (req, res) => {
  try {
    const events = [
      {
        id: '1',
        event_type: 'vpn_drop',
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        duration: 3600,
        reason: 'VPN connection lost',
        actions_taken: ['Blocked all traffic', 'Reconnecting...'],
        ip_protected: true
      },
      {
        id: '2',
        event_type: 'dns_leak_detected',
        triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5000).toISOString(),
        duration: 5,
        reason: 'DNS leak detected',
        actions_taken: ['Switched DNS servers', 'Reconnected'],
        ip_protected: true
      }
    ];
    res.json({ events });
  } catch (error) {
    console.error('Error fetching kill switch events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ==============================================
// SERVER HEALTH MONITORING
// ==============================================

// Get server health metrics
app.get('/api/v1/admin/servers/health', async (req, res) => {
  try {
    const healthMetrics = [
      {
        server_id: '1',
        server_name: 'US East - New York',
        status: 'healthy',
        cpu_usage: 45,
        memory_usage: 62,
        disk_usage: 38,
        bandwidth_usage: 75,
        active_connections: 234,
        uptime: 99.98,
        last_check: new Date().toISOString()
      },
      {
        server_id: '2',
        server_name: 'EU West - London',
        status: 'healthy',
        cpu_usage: 38,
        memory_usage: 54,
        disk_usage: 42,
        bandwidth_usage: 68,
        active_connections: 189,
        uptime: 99.99,
        last_check: new Date().toISOString()
      }
    ];
    res.json({ servers: healthMetrics });
  } catch (error) {
    console.error('Error fetching server health:', error);
    res.status(500).json({ error: 'Failed to fetch server health' });
  }
});

// ==============================================
// WEBHOOKS
// ==============================================

// Get webhooks
app.get('/api/v1/admin/webhooks', async (req, res) => {
  try {
    const webhooks = [
      {
        id: '1',
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/xxx',
        events: ['user.created', 'connection.failed'],
        enabled: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_triggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];
    res.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Create webhook
app.post('/api/v1/admin/webhooks', async (req, res) => {
  try {
    const newWebhook = {
      id: Date.now().toString(),
      ...req.body,
      created_at: new Date().toISOString()
    };
    res.json({ webhook: newWebhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// ==============================================
// NOTIFICATIONS
// ==============================================

// Get user notifications
app.get('/api/v1/user/notifications', async (req, res) => {
  try {
    const notifications = [
      {
        id: '1',
        type: 'security_alert',
        title: 'Suspicious Login Detected',
        message: 'A login attempt was detected from an unusual location: Tokyo, Japan',
        severity: 'high',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        action_url: '/dashboard/security',
        metadata: { location: 'Tokyo, Japan', ip: '45.67.89.12' }
      },
      {
        id: '2',
        type: 'connection',
        title: 'Connected to Server',
        message: 'Successfully connected to US East - New York',
        severity: 'info',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        action_url: '/dashboard/connect'
      },
      {
        id: '3',
        type: 'threat_blocked',
        title: 'Malware Blocked',
        message: '15 threats were blocked in the last hour',
        severity: 'warning',
        read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        action_url: '/dashboard/threats'
      },
      {
        id: '4',
        type: 'subscription',
        title: 'Subscription Renewed',
        message: 'Your Premium subscription has been renewed for another month',
        severity: 'success',
        read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        action_url: '/dashboard/billing'
      },
      {
        id: '5',
        type: 'system',
        title: 'Server Maintenance Scheduled',
        message: 'EU West servers will undergo maintenance on Nov 10, 2025 at 02:00 UTC',
        severity: 'info',
        read: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        action_url: '/dashboard/servers'
      },
      {
        id: '6',
        type: 'device',
        title: 'New Device Connected',
        message: 'iPhone 15 Pro has been added to your account',
        severity: 'info',
        read: true,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        action_url: '/dashboard/profile'
      }
    ];

    const { unread_only } = req.query;
    const filtered = unread_only === 'true' 
      ? notifications.filter(n => !n.read) 
      : notifications;

    res.json({ 
      notifications: filtered,
      unread_count: notifications.filter(n => !n.read).length 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/v1/user/notifications/:id/read', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/v1/user/notifications/read-all', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
app.delete('/api/v1/user/notifications/:id', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification settings
app.get('/api/v1/user/notifications/settings', async (req, res) => {
  try {
    const settings = {
      email_notifications: true,
      push_notifications: true,
      security_alerts: true,
      connection_events: true,
      threat_alerts: true,
      subscription_updates: true,
      marketing_emails: false
    };
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// Update notification settings
app.put('/api/v1/user/notifications/settings', async (req, res) => {
  try {
    res.json({ settings: req.body });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// ==============================================
// VPN CONNECTION & CONFIGURATION
// ==============================================

// Generate VPN configuration for user
app.post('/api/v1/vpn/generate-config', async (req, res) => {
  try {
    const { userId, deviceName } = req.body;
    
    if (!userId || !deviceName) {
      return res.status(400).json({ error: 'userId and deviceName are required' });
    }

    // Check if user has reached device limit
    const { data: tier } = await supabase
      .from('users')
      .select(`
        subscription_tier:subscription_tiers(max_devices)
      `)
      .eq('id', userId)
      .single();

    const { count: existingDevices } = await supabase
      .from('vpn_configs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tier?.subscription_tier?.max_devices && existingDevices >= tier.subscription_tier.max_devices) {
      return res.status(403).json({ 
        error: 'Device limit reached',
        message: 'Please upgrade your plan to add more devices'
      });
    }

    // Generate WireGuard keys (simulated for now)
    const clientPrivateKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');
    const clientPublicKey = Buffer.from(require('crypto').randomBytes(32)).toString('base64');
    
    // Allocate IP (find next available)
    const { data: existingConfigs } = await supabase
      .from('vpn_configs')
      .select('allocated_ip')
      .order('allocated_ip', { ascending: false })
      .limit(1);

    let nextIP = '10.0.0.2';
    if (existingConfigs && existingConfigs.length > 0) {
      const lastIP = existingConfigs[0].allocated_ip;
      const lastOctet = parseInt(lastIP.split('.')[3]);
      nextIP = `10.0.0.${lastOctet + 1}`;
    }

    // Save to database
    const { data: vpnConfig, error: dbError } = await supabase
      .from('vpn_configs')
      .insert({
        user_id: userId,
        client_public_key: clientPublicKey,
        client_private_key_encrypted: clientPrivateKey, // Should encrypt in production
        allocated_ip: nextIP,
        device_name: deviceName,
        dns_servers: '1.1.1.1, 1.0.0.1',
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      // Log full DB error for diagnostics
      console.error('Database error inserting vpn_config:', dbError);

      // Fallback: return a non-persistent config so clients can continue to test the
      // generate/download flow while we investigate the DB issue. This avoids a 500
      // and preserves UX for immediate testing.
      const fallbackConfigFile = `[Interface]\nPrivateKey = ${clientPrivateKey}\nAddress = ${nextIP}/32\nDNS = 1.1.1.1, 1.0.0.1\n\n[Peer]\nPublicKey = ${serverPublicKey}\nEndpoint = ${serverEndpoint}:51820\nAllowedIPs = 0.0.0.0/0, ::/0\nPersistentKeepalive = 25\n`;

      return res.status(200).json({
        success: true,
        persistent: false,
        message: 'Returned non-persistent config due to database error. Inspect server logs for details.',
        config: {
          user_id: userId,
          device_name: deviceName,
          allocated_ip: nextIP,
          client_public_key: clientPublicKey
        },
        configFile: fallbackConfigFile,
        downloadFilename: `${deviceName.replace(/\s+/g, '-')}-vpn.conf`
      });
    }

    // Generate .conf file content
    const serverPublicKey = process.env.WIREGUARD_SERVER_PUBLIC_KEY || '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=';
    const serverEndpoint = process.env.WIREGUARD_SERVER_ENDPOINT || 'your-server-ip';

    const configFile = `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${nextIP}/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${serverEndpoint}:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;

    res.json({
      success: true,
      config: vpnConfig,
      configFile,
      downloadFilename: `${deviceName.replace(/\s+/g, '-')}-vpn.conf`
    });

  } catch (error) {
    // Log full error for diagnostics
    console.error('Error generating VPN config (falling back to non-persistent):', error && error.stack ? error.stack : error);

    try {
      // Attempt to return a non-persistent config so clients can still use the flow
      const crypto = require('crypto');
      const clientPrivateKey = crypto.randomBytes(32).toString('base64');
      const base = 2 + (Math.floor(Date.now() / 1000) % 250);
      const fallbackIp = `10.0.0.${base}`;
      const serverPublicKey = process.env.WIREGUARD_SERVER_PUBLIC_KEY || '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=';
      const serverEndpoint = process.env.WIREGUARD_SERVER_ENDPOINT || 'your-server-ip';

      const fallbackConfigFile = `[Interface]\nPrivateKey = ${clientPrivateKey}\nAddress = ${fallbackIp}/32\nDNS = 1.1.1.1, 1.0.0.1\n\n[Peer]\nPublicKey = ${serverPublicKey}\nEndpoint = ${serverEndpoint}:51820\nAllowedIPs = 0.0.0.0/0, ::/0\nPersistentKeepalive = 25\n`;

      return res.status(200).json({
        success: true,
        persistent: false,
        message: 'Returned non-persistent config due to internal error. Check server logs for details.',
        configFile: fallbackConfigFile,
        downloadFilename: `vpn-fallback-${Date.now()}.conf`
      });
    } catch (fallbackErr) {
      console.error('Fallback error generating config:', fallbackErr);
      return res.status(500).json({ error: 'Failed to generate VPN configuration' });
    }
  }
});

// Get user's VPN configurations
app.get('/api/v1/vpn/configs', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data: configs, error } = await supabase
      .from('vpn_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch VPN configurations' });
    }

    res.json({ configs: configs || [] });
  } catch (error) {
    console.error('Error fetching VPN configs:', error);
    res.status(500).json({ error: 'Failed to fetch VPN configurations' });
  }
});

// Delete VPN configuration
app.delete('/api/v1/vpn/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('vpn_configs')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete VPN configuration' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting VPN config:', error);
    res.status(500).json({ error: 'Failed to delete VPN configuration' });
  }
});

// Get user's data usage
app.get('/api/v1/vpn/usage', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get current month's usage
    const { data: usage, error } = await supabase
      .from('bandwidth_logs')
      .select('bytes_sent, bytes_received')
      .eq('user_id', userId)
      .gte('measured_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const totalSent = usage?.reduce((sum, log) => sum + (log.bytes_sent || 0), 0) || 0;
    const totalReceived = usage?.reduce((sum, log) => sum + (log.bytes_received || 0), 0) || 0;
    const totalBytes = totalSent + totalReceived;
    const totalMB = (totalBytes / 1048576).toFixed(2);

    // Get user's limit
    const { data: userData } = await supabase
      .from('users')
      .select(`
        subscription_tier:subscription_tiers(data_limit_mb)
      `)
      .eq('id', userId)
      .single();

    const limitMB = userData?.subscription_tier?.data_limit_mb || 500;

    res.json({
      usage: {
        bytes_sent: totalSent,
        bytes_received: totalReceived,
        total_bytes: totalBytes,
        total_mb: parseFloat(totalMB),
        limit_mb: limitMB,
        unlimited: limitMB === null,
        percentage_used: limitMB ? (parseFloat(totalMB) / limitMB * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// -------------------------------
// Lightweight TEST endpoints (non-persistent)
// These are safe endpoints that do not write to the DB and can be used
// to exercise the dashboard generate/download flows in production while
// we debug the real implementation.
// -------------------------------

app.post('/api/v1/vpn/generate-config-test', async (req, res) => {
  try {
    const { userId, deviceName } = req.body || {};
    if (!userId || !deviceName) {
      return res.status(400).json({ error: 'userId and deviceName are required' });
    }

    const crypto = require('crypto');
    const clientPrivateKey = crypto.randomBytes(32).toString('base64');
    const clientPublicKey = crypto.randomBytes(32).toString('base64');
    const base = 2 + (Math.floor(Date.now() / 1000) % 250);
    const allocatedIp = `10.0.0.${base}`;

    const serverPublicKey = process.env.WIREGUARD_SERVER_PUBLIC_KEY || '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=';
    const serverEndpoint = process.env.WIREGUARD_SERVER_ENDPOINT || 'your-server-ip';

    const configFile = `[Interface]\nPrivateKey = ${clientPrivateKey}\nAddress = ${allocatedIp}/32\nDNS = 1.1.1.1, 1.0.0.1\n\n[Peer]\nPublicKey = ${serverPublicKey}\nEndpoint = ${serverEndpoint}:51820\nAllowedIPs = 0.0.0.0/0, ::/0\nPersistentKeepalive = 25\n`;

    res.json({
      success: true,
      configFile,
      downloadFilename: `${deviceName.replace(/\s+/g, '-')}-vpn.conf`,
      config: {
        device_name: deviceName,
        allocated_ip: allocatedIp,
        client_public_key: clientPublicKey
      }
    });
  } catch (err) {
    console.error('Error in generate-config-test:', err);
    res.status(500).json({ error: 'Failed to generate test VPN configuration' });
  }
});

app.get('/api/v1/vpn/configs', async (req, res, next) => {
  // If query contains mock=true, return mock data. Otherwise fall back to existing handler above by calling next().
  try {
    const { mock } = req.query || {};
    if (mock === 'true') {
      return res.json({ configs: [
        {
          id: 'test-1',
          device_name: 'Test Device',
          allocated_ip: '10.0.0.2',
          created_at: new Date().toISOString(),
          is_active: true,
          bytes_sent: 0,
          bytes_received: 0
        }
      ]});
    }
    // Not a mock request - pass through to the real handler above
    return next();
  } catch (err) {
    console.error('Error in test configs handler:', err);
    res.status(500).json({ error: 'Failed to fetch test configs' });
  }
});

app.get('/api/v1/vpn/usage-test', async (req, res) => {
  try {
    const usage = {
      bytes_sent: 0,
      bytes_received: 0,
      total_bytes: 0,
      total_mb: 0,
      limit_mb: 500,
      unlimited: false,
      percentage_used: '0.0'
    };
    res.json({ usage });
  } catch (err) {
    console.error('Error in usage-test:', err);
    res.status(500).json({ error: 'Failed to fetch usage (test)' });
  }
});

// ==============================================
// ERROR HANDLERS
// ==============================================

// Catch all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

module.exports = app;
