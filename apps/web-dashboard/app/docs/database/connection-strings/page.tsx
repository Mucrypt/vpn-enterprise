"use client";

import { useState } from 'react';
import { 
  Link as LinkIcon, Database, Code, Settings, Copy, Check, 
  Eye, EyeOff, Key, Globe, Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function ConnectionStringsPage() {
  const [copied, setCopied] = useState<string>('');
  const [showPassword, setShowPassword] = useState<string>('');
  type DatabaseKey = keyof typeof connectionFormats;
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseKey>('postgresql');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => prev === id ? '' : id);
  };

  const connectionFormats = {
    postgresql: {
      name: "PostgreSQL",
      port: 5432,
      examples: {
        standard: "postgresql://username:password@host:5432/database",
        ssl: "postgresql://username:password@host:5432/database?sslmode=require",
        pool: "postgresql://username:password@host:5432/database?sslmode=require&max_conns=20"
      },
      drivers: [
        { language: "Node.js", package: "pg", version: "^8.11.3" },
        { language: "Python", package: "psycopg2", version: "^2.9.7" },
        { language: "Java", package: "postgresql", version: "42.6.0" },
        { language: "C#", package: "Npgsql", version: "7.0.6" },
        { language: "Go", package: "pq", version: "^1.10.9" },
        { language: "Ruby", package: "pg", version: "^1.5.4" }
      ]
    },
    mysql: {
      name: "MySQL",
      port: 3306,
      examples: {
        standard: "mysql://username:password@host:3306/database",
        ssl: "mysql://username:password@host:3306/database?ssl-mode=REQUIRED",
        charset: "mysql://username:password@host:3306/database?charset=utf8mb4"
      },
      drivers: [
        { language: "Node.js", package: "mysql2", version: "^3.6.3" },
        { language: "Python", package: "PyMySQL", version: "^1.1.0" },
        { language: "Java", package: "mysql-connector-java", version: "8.1.0" },
        { language: "C#", package: "MySql.Data", version: "8.1.0" },
        { language: "Go", package: "go-sql-driver/mysql", version: "^1.7.1" },
        { language: "PHP", package: "mysqli", version: "built-in" }
      ]
    },
    mongodb: {
      name: "MongoDB",
      port: 27017,
      examples: {
        standard: "mongodb://username:password@host:27017/database",
        replica: "mongodb://username:password@host1:27017,host2:27017/database?replicaSet=rs0",
        srv: "mongodb+srv://username:password@cluster.host.com/database"
      },
      drivers: [
        { language: "Node.js", package: "mongodb", version: "^6.2.0" },
        { language: "Python", package: "pymongo", version: "^4.6.0" },
        { language: "Java", package: "mongodb-driver-sync", version: "4.11.1" },
        { language: "C#", package: "MongoDB.Driver", version: "2.22.0" },
        { language: "Go", package: "go.mongodb.org/mongo-driver", version: "^1.12.1" },
        { language: "PHP", package: "mongodb/mongodb", version: "^1.17.0" }
      ]
    },
    redis: {
      name: "Redis",
      port: 6379,
      examples: {
        standard: "redis://username:password@host:6379/0",
        ssl: "rediss://username:password@host:6380/0",
        sentinel: "redis-sentinel://host1:26379,host2:26379/mymaster/0"
      },
      drivers: [
        { language: "Node.js", package: "redis", version: "^4.6.10" },
        { language: "Python", package: "redis", version: "^5.0.1" },
        { language: "Java", package: "jedis", version: "5.1.0" },
        { language: "C#", package: "StackExchange.Redis", version: "2.7.4" },
        { language: "Go", package: "go-redis/redis", version: "^9.3.0" },
        { language: "Ruby", package: "redis", version: "^5.0.8" }
      ]
    }
  };

  const environmentExamples = {
    nodejs: {
      name: "Node.js",
      config: `// .env file
DATABASE_URL=postgresql://username:password@host:5432/database

// app.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;`,
      usage: `const pool = require('./db');

async function getUsers() {
  try {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}`
    },
    python: {
      name: "Python",
      config: `# .env file
DATABASE_URL=postgresql://username:password@host:5432/database

# db.py
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

connection_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,
    dsn=os.getenv('DATABASE_URL')
)`,
      usage: `import psycopg2
from db import connection_pool

def get_users():
    connection = connection_pool.getconn()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users")
            return cursor.fetchall()
    finally:
        connection_pool.putconn(connection)`
    },
    java: {
      name: "Java",
      config: `# application.properties
spring.datasource.url=jdbc:postgresql://host:5432/database
spring.datasource.username=username
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# Or application.yml
spring:
  datasource:
    url: jdbc:postgresql://host:5432/database
    username: username
    password: password
    driver-class-name: org.postgresql.Driver`,
      usage: `@Repository
public class UserRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public List<User> getAllUsers() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }
}`
    },
    csharp: {
      name: "C#",
      config: `// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=host;Port=5432;Database=database;Username=username;Password=password;SSL Mode=Require;"
  }
}

// Startup.cs or Program.cs
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));`,
      usage: `public class UserService
{
    private readonly ApplicationDbContext _context;
    
    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<User>> GetUsersAsync()
    {
        return await _context.Users.ToListAsync();
    }
}`
    }
  };

  const securityFeatures = [
    {
      feature: "SSL/TLS Encryption",
      description: "All connections encrypted in transit with TLS 1.3",
      icon: Shield,
      implementation: "Automatic SSL certificate management and renewal"
    },
    {
      feature: "Connection Pooling",
      description: "Efficient connection reuse and automatic scaling",
      icon: Zap,
      implementation: "Built-in pgBouncer for PostgreSQL, ProxySQL for MySQL"
    },
    {
      feature: "IP Whitelisting",
      description: "Restrict database access to specific IP addresses",
      icon: Globe,
      implementation: "Configure allowed IPs in database security settings"
    },
    {
      feature: "Authentication",
      description: "Strong password policies and optional 2FA",
      icon: Key,
      implementation: "SCRAM-SHA-256 for PostgreSQL, caching_sha2_password for MySQL"
    }
  ];

  const bestPractices = [
    {
      title: "Use Environment Variables",
      description: "Never hardcode connection strings in your source code",
      example: "Use .env files and process.env for Node.js applications"
    },
    {
      title: "Enable SSL/TLS",
      description: "Always use encrypted connections in production",
      example: "Add ?sslmode=require to PostgreSQL connection strings"
    },
    {
      title: "Connection Pooling",
      description: "Reuse database connections for better performance",
      example: "Configure pool size based on your application's concurrency needs"
    },
    {
      title: "Error Handling",
      description: "Implement proper error handling and retry logic",
      example: "Use try-catch blocks and exponential backoff for retries"
    },
    {
      title: "Monitoring",
      description: "Monitor connection usage and query performance",
      example: "Set up alerts for connection pool exhaustion and slow queries"
    }
  ];

  const currentDb = connectionFormats[selectedDatabase];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/database/overview" className="hover:text-gray-900">Database Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Connection Strings</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <LinkIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Connection Strings</h1>
              <p className="text-lg text-gray-600 mt-2">
                Learn how to connect your applications to VPN Enterprise databases
              </p>
            </div>
          </div>
        </div>

        {/* Getting Connection String */}
        <div className="mb-12">
          <Card className="bg-purple-50/50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-5 w-5 text-purple-600" />
                Get Your Connection String
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Retrieve your database connection string using the CLI tool or web dashboard.
              </p>
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`# Get connection string for your database
db-cli connection-string my-database

# Get connection string with specific format
db-cli connection-string my-database --format jdbc

# Export to environment file
db-cli connection-string my-database --format env > .env.database`, 'get-connection')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  {copied === 'get-connection' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`# Get connection string for your database
db-cli connection-string my-database

# Get connection string with specific format
db-cli connection-string my-database --format jdbc

# Export to environment file
db-cli connection-string my-database --format env > .env.database`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connection String Formats</h2>
          
          <div className="flex gap-2 mb-6">
            {Object.entries(connectionFormats).map(([key, db]) => (
              <Button
                key={key}
                variant={selectedDatabase === key ? "default" : "outline"}
                onClick={() => setSelectedDatabase(key as DatabaseKey)}
                className={selectedDatabase === key ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {db.name}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{currentDb.name} Connection Formats</CardTitle>
              <CardDescription>
                Different connection string formats for {currentDb.name} databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(currentDb.examples).map(([type, example]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {type} Connection
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(type)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showPassword === type ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(example, `format-${type}`)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {copied === `format-${type}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        value={showPassword === type ? example : example.replace(/:[^:@]*@/, ':***@')}
                        readOnly
                        className="font-mono text-sm bg-gray-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Drivers</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Drivers for {currentDb.name}</CardTitle>
              <CardDescription>
                Official and community-supported database drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {currentDb.drivers.map((driver: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{driver.language}</h4>
                      <Badge variant="outline" className="font-mono text-xs">
                        {driver.version}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{driver.package}</p>
                    <div className="mt-2">
                      <Button
                        onClick={() => copyToClipboard(
                          driver.language === 'Node.js' ? `npm install ${driver.package}` :
                          driver.language === 'Python' ? `pip install ${driver.package}` :
                          driver.language === 'Java' ? `implementation '${driver.package}:${driver.version}'` :
                          driver.language === 'C#' ? `dotnet add package ${driver.package}` :
                          driver.language === 'Go' ? `go get ${driver.package}` :
                          `Install ${driver.package}`,
                          `driver-${index}`
                        )}
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        {copied === `driver-${index}` ? 
                          <Check className="h-3 w-3 mr-1" /> : 
                          <Copy className="h-3 w-3 mr-1" />
                        }
                        Install
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Examples</h2>
          
          <Tabs defaultValue="nodejs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nodejs">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
              <TabsTrigger value="csharp">C#</TabsTrigger>
            </TabsList>
            
            {Object.entries(environmentExamples).map(([key, lang]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{lang.name} Configuration</CardTitle>
                      <CardDescription>
                        Database configuration setup for {lang.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(lang.config, `config-${key}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `config-${key}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{lang.config}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{lang.name} Usage Example</CardTitle>
                      <CardDescription>
                        Example of using the database connection in {lang.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(lang.usage, `usage-${key}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `usage-${key}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{lang.usage}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.feature}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{feature.description}</p>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600">{feature.implementation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connection Best Practices</h2>
          
          <div className="space-y-4">
            {bestPractices.map((practice, index) => (
              <Card key={index} className="bg-green-50/50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">{practice.title}</h4>
                      <p className="text-green-700 text-sm mb-2">{practice.description}</p>
                      <p className="text-green-600 text-sm font-medium">{practice.example}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testing Connection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Testing Your Connection</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Connection Verification</CardTitle>
              <CardDescription>
                Verify your database connection is working properly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Using CLI Tool</h4>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Test database connection
db-cli test-connection my-database

# Test with verbose output
db-cli test-connection my-database --verbose

# Test connection and run sample query
db-cli test-connection my-database --query "SELECT 1"`, 'test-cli')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'test-cli' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Test database connection
db-cli test-connection my-database

# Test with verbose output
db-cli test-connection my-database --verbose

# Test connection and run sample query
db-cli test-connection my-database --query "SELECT 1"`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Connection Health Check</h4>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Check database health
db-cli health my-database

# Monitor connection metrics
db-cli metrics my-database --connections

# View connection pool status
db-cli pool-status my-database`, 'test-health')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'test-health' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Check database health
db-cli health my-database

# Monitor connection metrics
db-cli metrics my-database --connections

# View connection pool status
db-cli pool-status my-database`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With your database connected, learn about backup strategies, performance optimization, and scaling your infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/backup-recovery">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Backup & Recovery
              </Button>
            </Link>
            <Link href="/docs/database/performance">
              <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                Performance Tuning
              </Button>
            </Link>
            <Link href="/docs/database/scaling">
              <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                Scaling Guide
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}