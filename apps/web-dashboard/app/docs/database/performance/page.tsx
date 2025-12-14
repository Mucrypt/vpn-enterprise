"use client";

import { useState } from 'react';
import { 
  Gauge, Zap, Search, BarChart3, Target, Settings,
  Copy, Check, TrendingUp, Clock, Database, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function PerformancePage() {
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const performanceMetrics = [
    { metric: "Avg Query Time", value: "12.5ms", target: "< 50ms", status: "excellent", trend: "down" },
    { metric: "Throughput", value: "2,847 QPS", target: "> 1,000 QPS", status: "good", trend: "up" },
    { metric: "Cache Hit Rate", value: "94.2%", target: "> 85%", status: "excellent", trend: "stable" },
    { metric: "Connection Pool", value: "68%", target: "< 80%", status: "good", trend: "stable" }
  ];

  const optimizationCategories = [
    {
      category: "Query Optimization",
      description: "Optimize SQL queries for better performance and resource usage",
      icon: Search,
      techniques: [
        "Use EXPLAIN ANALYZE to identify bottlenecks",
        "Create appropriate indexes for frequent queries",
        "Avoid SELECT * and fetch only needed columns",
        "Use query result caching for repeated operations",
        "Optimize JOIN operations and subqueries"
      ],
      color: "blue"
    },
    {
      category: "Index Management",
      description: "Strategic indexing for optimal query performance",
      icon: Target,
      techniques: [
        "Create composite indexes for multi-column queries",
        "Use partial indexes for filtered queries",
        "Monitor index usage and remove unused indexes",
        "Consider covering indexes for read-heavy workloads",
        "Analyze index fragmentation and maintenance"
      ],
      color: "green"
    },
    {
      category: "Connection Optimization",
      description: "Optimize database connections and pooling",
      icon: Zap,
      techniques: [
        "Implement connection pooling with optimal pool size",
        "Use prepared statements for repeated queries",
        "Configure connection timeouts appropriately",
        "Monitor connection pool utilization",
        "Implement connection retry logic with backoff"
      ],
      color: "purple"
    },
    {
      category: "Resource Tuning",
      description: "Fine-tune database configuration for optimal performance",
      icon: Settings,
      techniques: [
        "Optimize memory allocation for buffers and cache",
        "Configure checkpoint and WAL settings",
        "Tune autovacuum and maintenance operations",
        "Adjust work_mem and shared_buffers",
        "Configure parallel query execution"
      ],
      color: "orange"
    }
  ];

  const queryOptimizationTips = [
    {
      title: "Inefficient Query",
      problem: "SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01'",
      solution: "SELECT u.id, u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.created_at > '2024-01-01'",
      improvement: "85% faster execution, reduced memory usage"
    },
    {
      title: "Missing Index",
      problem: "Frequent queries on email column without index",
      solution: "CREATE INDEX idx_users_email ON users(email);",
      improvement: "Query time reduced from 2.3s to 15ms"
    },
    {
      title: "N+1 Query Problem",
      problem: "Loading related data in application loop",
      solution: "Use JOIN or IN clause to fetch related data in single query",
      improvement: "Reduced from 100+ queries to 1 query"
    },
    {
      title: "Unbounded Result Set",
      problem: "SELECT * FROM logs WHERE level = 'ERROR'",
      solution: "SELECT * FROM logs WHERE level = 'ERROR' ORDER BY timestamp DESC LIMIT 100",
      improvement: "Prevents memory overflow, faster response"
    }
  ];

  const indexingStrategies = [
    {
      strategy: "B-tree Index",
      useCase: "Standard index for equality and range queries",
      example: "CREATE INDEX idx_users_email ON users(email);",
      performance: "Excellent for exact matches and sorting"
    },
    {
      strategy: "Partial Index",
      useCase: "Index subset of rows based on condition",
      example: "CREATE INDEX idx_active_users ON users(email) WHERE active = true;",
      performance: "Smaller index size, faster for filtered queries"
    },
    {
      strategy: "Composite Index",
      useCase: "Multi-column queries and sorting",
      example: "CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);",
      performance: "Optimizes complex WHERE and ORDER BY clauses"
    },
    {
      strategy: "Covering Index",
      useCase: "Include all columns needed for query",
      example: "CREATE INDEX idx_users_covering ON users(email) INCLUDE (name, status);",
      performance: "Eliminates table lookups, fastest for read queries"
    },
    {
      strategy: "GIN Index",
      useCase: "Full-text search and array operations",
      example: "CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('english', content));",
      performance: "Excellent for text search and array contains operations"
    },
    {
      strategy: "Expression Index",
      useCase: "Index on computed values or functions",
      example: "CREATE INDEX idx_users_lower_email ON users(lower(email));",
      performance: "Optimizes queries with functions in WHERE clause"
    }
  ];

  const cachingStrategies = [
    {
      strategy: "Query Result Caching",
      description: "Cache results of expensive or frequent queries",
      implementation: "Redis with automatic TTL and invalidation",
      benefits: "Reduces database load, improves response times"
    },
    {
      strategy: "Connection Pooling",
      description: "Reuse database connections across requests",
      implementation: "PgBouncer for PostgreSQL, ProxySQL for MySQL",
      benefits: "Reduces connection overhead, better resource utilization"
    },
    {
      strategy: "Buffer Pool Optimization",
      description: "Maximize database buffer cache hit ratio",
      implementation: "Tune shared_buffers and effective_cache_size",
      benefits: "Reduces disk I/O, faster data access"
    },
    {
      strategy: "Application-Level Caching",
      description: "Cache frequently accessed data in application layer",
      implementation: "Redis or Memcached with cache-aside pattern",
      benefits: "Reduces database queries, scalable caching"
    }
  ];

  const monitoringMetrics = [
    {
      metric: "Query Performance",
      indicators: ["Average execution time", "Slow query count", "Query throughput", "Lock wait time"],
      tools: ["pg_stat_statements", "Performance Insights", "Query performance monitoring"],
      alerts: "Alert when avg query time > 100ms or slow queries > 10/min"
    },
    {
      metric: "Resource Utilization",
      indicators: ["CPU usage", "Memory consumption", "I/O wait time", "Disk space"],
      tools: ["System metrics", "Database performance counters", "Resource monitoring"],
      alerts: "Alert when CPU > 80% or memory > 90% for 5+ minutes"
    },
    {
      metric: "Connection Health",
      indicators: ["Active connections", "Connection pool usage", "Connection errors", "Wait events"],
      tools: ["Connection pool monitoring", "Database activity monitoring", "Error logs"],
      alerts: "Alert when connection pool > 80% or connection errors spike"
    },
    {
      metric: "Throughput & Latency",
      indicators: ["Transactions per second", "Response time percentiles", "Queue depth", "Replication lag"],
      tools: ["Performance dashboards", "APM tools", "Database metrics"],
      alerts: "Alert when p95 response time > 200ms or TPS drops 50%"
    }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/database/overview" className="hover:text-gray-900">Database Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Performance</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Gauge className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Performance Optimization</h1>
              <p className="text-lg text-gray-600 mt-2">
                Optimize database performance with advanced tuning, indexing, and monitoring
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-lg font-bold ${
                      metric.status === 'excellent' ? 'text-green-600' :
                      metric.status === 'good' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {metric.value}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      metric.trend === 'up' ? 'bg-green-100 text-green-800' :
                      metric.trend === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{metric.metric}</div>
                  <div className="text-xs text-gray-500">Target: {metric.target}</div>
                  <div className="mt-2">
                    <Badge className={
                      metric.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      metric.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="mb-12">
          <Card className="bg-orange-50/50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Performance Optimization Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise provides comprehensive performance optimization tools including query analysis, 
                automatic indexing recommendations, connection pooling, and real-time performance monitoring 
                to ensure your database operates at peak efficiency.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Query Analysis</h4>
                  <span className="text-sm text-gray-600">EXPLAIN plans and optimization</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Smart Indexing</h4>
                  <span className="text-sm text-gray-600">Automatic index recommendations</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Connection Pooling</h4>
                  <span className="text-sm text-gray-600">Optimized connection management</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Real-time Monitoring</h4>
                  <span className="text-sm text-gray-600">Performance metrics and alerts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Optimization Categories</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {optimizationCategories.map((category, index) => (
              <Card 
                key={index}
                className={`${
                  category.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  category.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  category.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' :
                  'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      category.color === 'blue' ? 'bg-blue-100' :
                      category.color === 'green' ? 'bg-green-100' :
                      category.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <category.icon className={`h-6 w-6 ${
                        category.color === 'blue' ? 'text-blue-600' :
                        category.color === 'green' ? 'text-green-600' :
                        category.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {category.techniques.map((technique, techniqueIndex) => (
                      <div key={techniqueIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{technique}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Query Optimization Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Query Optimization Examples</h2>
          
          <div className="space-y-6">
            {queryOptimizationTips.map((tip, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {tip.title}
                    <Badge className="bg-green-100 text-green-800">{tip.improvement}</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">❌ Before (Inefficient)</h4>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(tip.problem, `problem-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `problem-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm overflow-x-auto">
                          <code className="text-red-900">{tip.problem}</code>
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">✅ After (Optimized)</h4>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(tip.solution, `solution-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `solution-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm overflow-x-auto">
                          <code className="text-green-900">{tip.solution}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Indexing Strategies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Indexing Strategies</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {indexingStrategies.map((strategy, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{strategy.strategy}</CardTitle>
                  <CardDescription>{strategy.useCase}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Example</h5>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(strategy.example, `index-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `index-${index}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                          <code>{strategy.example}</code>
                        </pre>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-1">Performance Impact</h5>
                      <p className="text-sm text-blue-800">{strategy.performance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Analysis Tools</h2>
          
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Query Analysis</TabsTrigger>
              <TabsTrigger value="indexing">Index Management</TabsTrigger>
              <TabsTrigger value="caching">Caching</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Query Performance Analysis</CardTitle>
                  <CardDescription>
                    Analyze and optimize query performance with detailed execution plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Analyze query performance
db-cli query analyze \\
  --database my-database \\
  --query "SELECT * FROM users WHERE email = 'user@example.com'"

# Get slow query report
db-cli query slow-queries my-database \\
  --threshold 100ms \\
  --period 24h \\
  --limit 10

# Explain query execution plan
db-cli query explain my-database \\
  --query "SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.name"

# Generate query optimization recommendations
db-cli query optimize my-database \\
  --auto-recommend \\
  --apply-safe-changes false

# Monitor query performance over time
db-cli query performance my-database \\
  --metric "execution_time,cpu_time,io_time" \\
  --period 7d`, 'query-analysis')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'query-analysis' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Analyze query performance
db-cli query analyze \\
  --database my-database \\
  --query "SELECT * FROM users WHERE email = 'user@example.com'"

# Get slow query report
db-cli query slow-queries my-database \\
  --threshold 100ms \\
  --period 24h \\
  --limit 10

# Explain query execution plan
db-cli query explain my-database \\
  --query "SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.name"

# Generate query optimization recommendations
db-cli query optimize my-database \\
  --auto-recommend \\
  --apply-safe-changes false

# Monitor query performance over time
db-cli query performance my-database \\
  --metric "execution_time,cpu_time,io_time" \\
  --period 7d`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="indexing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Index Management & Optimization</CardTitle>
                  <CardDescription>
                    Manage indexes for optimal query performance and storage efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Analyze index usage
db-cli index analyze my-database \\
  --show-unused \\
  --show-duplicate \\
  --size-threshold 100mb

# Get index recommendations
db-cli index recommend my-database \\
  --based-on-queries \\
  --period 7d \\
  --min-impact 20

# Create recommended indexes
db-cli index create my-database \\
  --table users \\
  --columns "email,status" \\
  --type btree \\
  --concurrent

# Monitor index performance
db-cli index performance my-database \\
  --metric "usage_count,scan_ratio,maintenance_cost" \\
  --format table

# Rebuild fragmented indexes
db-cli index maintenance my-database \\
  --reindex-fragmented \\
  --fragmentation-threshold 30

# Drop unused indexes
db-cli index cleanup my-database \\
  --unused-days 30 \\
  --dry-run false`, 'index-management')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'index-management' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Analyze index usage
db-cli index analyze my-database \\
  --show-unused \\
  --show-duplicate \\
  --size-threshold 100mb

# Get index recommendations
db-cli index recommend my-database \\
  --based-on-queries \\
  --period 7d \\
  --min-impact 20

# Create recommended indexes
db-cli index create my-database \\
  --table users \\
  --columns "email,status" \\
  --type btree \\
  --concurrent

# Monitor index performance
db-cli index performance my-database \\
  --metric "usage_count,scan_ratio,maintenance_cost" \\
  --format table

# Rebuild fragmented indexes
db-cli index maintenance my-database \\
  --reindex-fragmented \\
  --fragmentation-threshold 30

# Drop unused indexes
db-cli index cleanup my-database \\
  --unused-days 30 \\
  --dry-run false`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="caching" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Caching & Connection Optimization</CardTitle>
                  <CardDescription>
                    Implement caching strategies and optimize connection pooling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Configure connection pooling
db-cli pool configure my-database \\
  --max-connections 200 \\
  --min-connections 20 \\
  --pool-mode transaction \\
  --max-client-connections 1000

# Set up query result caching
db-cli cache enable my-database \\
  --type redis \\
  --ttl 3600 \\
  --cache-size 4gb \\
  --eviction-policy lru

# Configure buffer cache
db-cli tune my-database \\
  --shared-buffers 4gb \\
  --effective-cache-size 12gb \\
  --work-mem 64mb \\
  --maintenance-work-mem 512mb

# Monitor cache performance
db-cli cache stats my-database \\
  --metric "hit_ratio,miss_ratio,evictions" \\
  --period 1h

# Optimize vacuum and autovacuum
db-cli vacuum configure my-database \\
  --autovacuum-naptime 30s \\
  --autovacuum-vacuum-threshold 1000 \\
  --autovacuum-max-workers 4

# Analyze buffer cache usage
db-cli buffer-cache analyze my-database \\
  --show-top-tables 10 \\
  --show-hit-ratio`, 'caching-optimization')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'caching-optimization' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Configure connection pooling
db-cli pool configure my-database \\
  --max-connections 200 \\
  --min-connections 20 \\
  --pool-mode transaction \\
  --max-client-connections 1000

# Set up query result caching
db-cli cache enable my-database \\
  --type redis \\
  --ttl 3600 \\
  --cache-size 4gb \\
  --eviction-policy lru

# Configure buffer cache
db-cli tune my-database \\
  --shared-buffers 4gb \\
  --effective-cache-size 12gb \\
  --work-mem 64mb \\
  --maintenance-work-mem 512mb

# Monitor cache performance
db-cli cache stats my-database \\
  --metric "hit_ratio,miss_ratio,evictions" \\
  --period 1h

# Optimize vacuum and autovacuum
db-cli vacuum configure my-database \\
  --autovacuum-naptime 30s \\
  --autovacuum-vacuum-threshold 1000 \\
  --autovacuum-max-workers 4

# Analyze buffer cache usage
db-cli buffer-cache analyze my-database \\
  --show-top-tables 10 \\
  --show-hit-ratio`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitoring" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Monitoring & Alerts</CardTitle>
                  <CardDescription>
                    Monitor database performance metrics and set up proactive alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Set up performance monitoring
db-cli monitor enable my-database \\
  --metrics "cpu,memory,connections,query_time,throughput" \\
  --interval 30s \\
  --retention 30d

# Configure performance alerts
db-cli alerts create \\
  --database my-database \\
  --name "high-cpu-usage" \\
  --metric cpu \\
  --threshold 80 \\
  --duration 5m \\
  --action "email:admin@company.com,slack:alerts"

# Generate performance report
db-cli report performance my-database \\
  --period 7d \\
  --include-recommendations \\
  --format pdf \\
  --email admin@company.com

# Monitor slow queries in real-time
db-cli monitor slow-queries my-database \\
  --threshold 500ms \\
  --follow \\
  --show-explain-plan

# Track resource usage trends
db-cli metrics trend my-database \\
  --metric "cpu,memory,connections" \\
  --period 30d \\
  --interval 1h \\
  --format chart

# Set up custom performance dashboard
db-cli dashboard create my-database \\
  --name "production-performance" \\
  --widgets "query_time,throughput,connections,cache_hit_rate" \\
  --refresh-interval 30s`, 'performance-monitoring')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'performance-monitoring' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Set up performance monitoring
db-cli monitor enable my-database \\
  --metrics "cpu,memory,connections,query_time,throughput" \\
  --interval 30s \\
  --retention 30d

# Configure performance alerts
db-cli alerts create \\
  --database my-database \\
  --name "high-cpu-usage" \\
  --metric cpu \\
  --threshold 80 \\
  --duration 5m \\
  --action "email:admin@company.com,slack:alerts"

# Generate performance report
db-cli report performance my-database \\
  --period 7d \\
  --include-recommendations \\
  --format pdf \\
  --email admin@company.com

# Monitor slow queries in real-time
db-cli monitor slow-queries my-database \\
  --threshold 500ms \\
  --follow \\
  --show-explain-plan

# Track resource usage trends
db-cli metrics trend my-database \\
  --metric "cpu,memory,connections" \\
  --period 30d \\
  --interval 1h \\
  --format chart

# Set up custom performance dashboard
db-cli dashboard create my-database \\
  --name "production-performance" \\
  --widgets "query_time,throughput,connections,cache_hit_rate" \\
  --refresh-interval 30s`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Caching Strategies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Caching & Connection Strategies</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {cachingStrategies.map((strategy, index) => (
              <Card key={index} className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg">{strategy.strategy}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Implementation</h5>
                      <p className="text-sm text-gray-700">{strategy.implementation}</p>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-1">Benefits</h5>
                      <p className="text-sm text-gray-600">{strategy.benefits}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Monitoring Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Performance Indicators</h2>
          
          <div className="space-y-6">
            {monitoringMetrics.map((metric, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{metric.metric}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Key Indicators</h5>
                      <div className="space-y-1">
                        {metric.indicators.map((indicator, indicatorIndex) => (
                          <div key={indicatorIndex} className="text-sm text-gray-700">
                            • {indicator}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Monitoring Tools</h5>
                      <div className="space-y-1">
                        {metric.tools.map((tool, toolIndex) => (
                          <div key={toolIndex} className="text-sm text-gray-700">
                            • {tool}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Alert Configuration</h5>
                      <p className="text-sm text-gray-700">{metric.alerts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With performance optimized, explore scaling strategies, backup solutions, and advanced database management features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/scaling">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Database Scaling
              </Button>
            </Link>
            <Link href="/docs/database/backup-recovery">
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                Backup & Recovery
              </Button>
            </Link>
            <Link href="/docs/database/overview">
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                Back to Overview
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}