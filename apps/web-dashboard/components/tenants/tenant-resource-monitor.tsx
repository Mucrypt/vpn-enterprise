'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface ResourceMetrics {
  cpu: number;
  memory: number;
  storage: number;
  connections: number;
  responseTime: number;
  uptime: number;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
  trends: {
    cpu: 'up' | 'down' | 'stable';
    memory: 'up' | 'down' | 'stable';
    storage: 'up' | 'down' | 'stable';
  };
}

interface TenantResourcesProps {
  tenantId: string;
  className?: string;
}

export function TenantResourceMonitor({ tenantId, className }: TenantResourcesProps) {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data generation for demo purposes
  const generateMockMetrics = (): ResourceMetrics => ({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    storage: 20 + Math.random() * 60, // Storage usually grows over time
    connections: Math.floor(Math.random() * 50),
    responseTime: 50 + Math.random() * 200,
    uptime: 99.5 + Math.random() * 0.5,
    alerts: [
      ...(Math.random() > 0.7 ? [{
        id: '1',
        type: 'warning' as const,
        message: 'Storage usage is approaching 80% capacity',
        timestamp: new Date().toISOString()
      }] : []),
      ...(Math.random() > 0.8 ? [{
        id: '2',
        type: 'info' as const,
        message: 'Database backup completed successfully',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }] : []),
      ...(Math.random() > 0.9 ? [{
        id: '3',
        type: 'error' as const,
        message: 'Connection pool exhausted, consider upgrading plan',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }] : [])
    ],
    trends: {
      cpu: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      memory: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      storage: Math.random() > 0.7 ? 'up' : 'stable' // Storage rarely goes down
    }
  });

  useEffect(() => {
    const loadMetrics = () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setMetrics(generateMockMetrics());
        setLastUpdated(new Date());
        setLoading(false);
      }, 1000);
    };

    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [tenantId]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'error' ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={className}>
      {/* Resource Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-blue-600" />
              {getTrendIcon(metrics.trends.cpu)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.cpu.toFixed(1)}%</div>
            <Progress value={metrics.cpu} className="mb-2" />
            <p className="text-xs text-gray-600">
              {metrics.cpu > 80 ? 'High usage' : metrics.cpu > 50 ? 'Moderate usage' : 'Low usage'}
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-green-600" />
              {getTrendIcon(metrics.trends.memory)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.memory.toFixed(1)}%</div>
            <Progress value={metrics.memory} className="mb-2" />
            <p className="text-xs text-gray-600">
              {metrics.memory > 80 ? 'High usage' : metrics.memory > 50 ? 'Moderate usage' : 'Low usage'}
            </p>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <div className="flex items-center gap-1">
              <HardDrive className="h-4 w-4 text-purple-600" />
              {getTrendIcon(metrics.trends.storage)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.storage.toFixed(1)}%</div>
            <Progress value={metrics.storage} className="mb-2" />
            <p className="text-xs text-gray-600">
              {metrics.storage > 80 ? 'Nearly full' : metrics.storage > 50 ? 'Half full' : 'Plenty of space'}
            </p>
          </CardContent>
        </Card>

        {/* Active Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.connections}</div>
            <div className="text-xs text-gray-600 mb-2">Active database connections</div>
            <p className="text-xs text-gray-600">
              Response time: {metrics.responseTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {metrics.uptime.toFixed(2)}%
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Backup</span>
                <span className="text-sm text-gray-600">2 hours ago</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Secure
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {lastUpdated.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Auto-refreshes every 30 seconds
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertDescription className="mb-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}