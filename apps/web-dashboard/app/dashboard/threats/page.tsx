'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  AlertTriangle,
  Ban,
  Eye,
  TrendingDown,
  Activity,
  Database,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';
import { useClientDate } from '@/hooks/useClientDate';

interface ThreatStats {
  total_threats_blocked: number;
  blocked_today: number;
  blocked_this_week: number;
  blocked_this_month: number;
  by_type: {
    malware: number;
    phishing: number;
    tracker: number;
    ads: number;
  };
  threat_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

interface ThreatEvent {
  id: string;
  threat_type: string;
  domain: string;
  ip_address: string;
  blocked_at: string;
  severity: string;
  description: string;
  user_id: string;
  device_id?: string;
}

export default function ThreatProtectionPage() {
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string, format?: string) => {
    if (!mounted) return '';
    const date = new Date(dateString);
    if (format === 'HH:mm') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString();
  };

  useEffect(() => {
    loadThreatData();
  }, [timeRange]);

  const loadThreatData = async () => {
    try {
      setLoading(true);
      const [statsData, threatsData] = await Promise.all([
        api.getThreatStats(timeRange),
        api.getRecentThreats({ limit: 50 })
      ]);
      setStats(statsData.stats);
      setRecentThreats(threatsData.threats || []);
    } catch (error) {
      console.error('Failed to load threat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'malware': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'phishing': return <Eye className="h-4 w-4 text-orange-600" />;
      case 'tracker': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'ads': return <Ban className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const exportThreats = () => {
    const csv = [
      ['Timestamp', 'Type', 'Domain', 'IP Address', 'Severity', 'Description'],
      ...recentThreats.map(t => [
        new Date(t.blocked_at).toISOString(),
        t.threat_type,
        t.domain,
        t.ip_address,
        t.severity,
        t.description
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Threat Protection</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze security threats in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="rounded-md border border-gray-300 px-3 py-2"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <Button onClick={exportThreats} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Threat Level Alert */}
      {stats && (
        <Card className={`border-2 ${getThreatLevelColor(stats.threat_level)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                  <Shield className={`h-8 w-8 ${getSeverityColor(stats.threat_level)}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold capitalize">{stats.threat_level} Threat Level</h3>
                  <p className="text-sm mt-1">
                    {stats.blocked_today} threats blocked today • {stats.total_threats_blocked} total blocked
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.blocked_this_week}</p>
                <p className="text-sm">Blocked This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Malware Blocked</p>
                  <p className="text-3xl font-bold text-red-900">{stats.by_type.malware}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <div className="mt-3 flex items-center text-xs text-red-700">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>High severity threats</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Phishing Attempts</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.by_type.phishing}</p>
                </div>
                <Eye className="h-10 w-10 text-orange-600" />
              </div>
              <div className="mt-3 flex items-center text-xs text-orange-700">
                <Ban className="h-3 w-3 mr-1" />
                <span>Identity protection active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Trackers Blocked</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.by_type.tracker}</p>
                </div>
                <Activity className="h-10 w-10 text-yellow-600" />
              </div>
              <div className="mt-3 flex items-center text-xs text-yellow-700">
                <Shield className="h-3 w-3 mr-1" />
                <span>Privacy protected</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Ads Blocked</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.by_type.ads}</p>
                </div>
                <Ban className="h-10 w-10 text-blue-600" />
              </div>
              <div className="mt-3 flex items-center text-xs text-blue-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Clean browsing</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Threats */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Threat Detections</CardTitle>
          <CardDescription>Real-time threat blocking activity across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentThreats.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-lg font-medium text-green-900">No threats detected</p>
                <p className="text-sm text-green-700">Your network is secure</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Domain</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IP Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentThreats.map((threat) => (
                      <tr key={threat.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(threat.blocked_at, 'HH:mm')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getThreatTypeIcon(threat.threat_type)}
                            <span className="text-sm font-medium capitalize">{threat.threat_type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                          {threat.domain}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {threat.ip_address}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getSeverityColor(threat.severity) + ' bg-opacity-10'}>
                            {threat.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {threat.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Protection Settings */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center text-emerald-900">
            <Shield className="h-5 w-5 mr-2" />
            Active Protection Features
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Malware Protection</p>
                <p className="text-xs text-gray-600">Real-time threat detection</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">DNS Filtering</p>
                <p className="text-xs text-gray-600">Block malicious domains</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Tracker Blocking</p>
                <p className="text-xs text-gray-600">Privacy protection</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Ad Blocking</p>
                <p className="text-xs text-gray-600">Enhanced browsing</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
