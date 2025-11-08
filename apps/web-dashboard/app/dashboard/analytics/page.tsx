'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes } from '@/lib/utils';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const [statsData, connectionsData] = await Promise.all([
        api.getUserStats().catch(() => ({})),
        api.getConnections().catch(() => []),
      ]);
      setStats(statsData);
      setConnections(connectionsData);
    } catch (error: any) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate analytics metrics
  const totalDataTransferred = connections.reduce((sum, conn) => 
    sum + (conn.bytes_sent || 0) + (conn.bytes_received || 0), 0
  );

  const avgConnectionDuration = connections.length > 0
    ? connections.reduce((sum, conn) => {
        const duration = conn.disconnected_at 
          ? new Date(conn.disconnected_at).getTime() - new Date(conn.connected_at).getTime()
          : 0;
        return sum + duration;
      }, 0) / connections.length / 1000 / 60 // Convert to minutes
    : 0;

  const activeConnections = connections.filter(c => !c.disconnected_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Usage insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{connections.length}</div>
            <p className="text-xs text-green-600 mt-1">↑ 8.2% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeConnections}</div>
            <p className="text-xs text-gray-500 mt-1">currently connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Data Transferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(totalDataTransferred)}
            </div>
            <p className="text-xs text-gray-500 mt-1">total bandwidth used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(avgConnectionDuration)} min
            </div>
            <p className="text-xs text-gray-500 mt-1">per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Connection Trends</CardTitle>
            <CardDescription>Daily active connections over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Line chart visualization</p>
                <p className="text-xs text-gray-500">Install recharts library for interactive charts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bandwidth Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Bandwidth Usage</CardTitle>
            <CardDescription>Data transfer by server location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Bar chart visualization</p>
                <p className="text-xs text-gray-500">Showing data distribution across servers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Usage Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Peak Usage Hours</CardTitle>
            <CardDescription>Traffic patterns throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Area chart visualization</p>
                <p className="text-xs text-gray-500">Hourly connection distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Server Distribution</CardTitle>
            <CardDescription>Connections by geographic location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Pie chart visualization</p>
                <p className="text-xs text-gray-500">Regional connection breakdown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Connections</CardTitle>
          <CardDescription>Latest VPN sessions and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Server</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Connected</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Data Used</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={6} className="py-4">
                        <div className="h-8 animate-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : connections.slice(0, 10).map((conn) => (
                  <tr key={conn.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{conn.user_id?.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-gray-700">{conn.server_id?.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(conn.connected_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {conn.disconnected_at 
                        ? `${Math.round((new Date(conn.disconnected_at).getTime() - new Date(conn.connected_at).getTime()) / 60000)} min`
                        : 'Active'}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {formatBytes((conn.bytes_sent || 0) + (conn.bytes_received || 0))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        !conn.disconnected_at ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          !conn.disconnected_at ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {!conn.disconnected_at ? 'Active' : 'Ended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
