const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const app = express();

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
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Prevent DDoS and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', limiter);
app.use('/auth/', authLimiter);

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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vpn-enterprise-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    security: {
      helmet: 'enabled',
      cors: 'enabled',
      rateLimit: 'enabled',
      sanitization: 'enabled'
    }
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

    // For now, return success (integrate with Supabase later)
    // In production, this would create user in Supabase
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        email,
        id: 'temp-' + Date.now(),
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

    // For demo purposes, accept any valid credentials
    // In production, this would validate against Supabase
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'user-' + Date.now(),
        email,
        role: email.includes('admin') ? 'admin' : 'user'
      },
      session: {
        access_token: 'demo-token-' + Buffer.from(email).toString('base64'),
        refresh_token: 'demo-refresh-' + Date.now(),
        expires_in: 3600
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
app.get('/admin/statistics', async (req, res) => {
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
