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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'user'
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
        city: 'New York',
        ip_address: '192.0.2.1',
        load: 45,
        status: 'online',
        latency: 12,
        capacity: 1000,
        current_connections: 450
      },
      {
        id: 'server-2',
        name: 'US West - Los Angeles',
        country: 'United States',
        city: 'Los Angeles',
        ip_address: '192.0.2.2',
        load: 62,
        status: 'online',
        latency: 8,
        capacity: 1000,
        current_connections: 620
      },
      {
        id: 'server-3',
        name: 'EU - London',
        country: 'United Kingdom',
        city: 'London',
        ip_address: '192.0.2.3',
        load: 38,
        status: 'online',
        latency: 25,
        capacity: 1000,
        current_connections: 380
      },
      {
        id: 'server-4',
        name: 'Asia - Tokyo',
        country: 'Japan',
        city: 'Tokyo',
        ip_address: '192.0.2.4',
        load: 71,
        status: 'online',
        latency: 120,
        capacity: 1000,
        current_connections: 710
      }
    ];

    res.status(200).json(servers);
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
