'use client';

import { useEffect, useState } from 'react';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ServerStatusGrid } from '@/components/dashboard/server-status-grid';
import { ConnectionMap } from '@/components/dashboard/connection-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Activity, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const [servers, setServers] = useState([]);
  const [stats, setStats] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [serversData, statsData] = await Promise.all([
        api.getServers(),
        api.getUserStats().catch(() => undefined),
      ]);
      
      setServers(serversData.servers || []);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }

  // User Dashboard View
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1">Manage your VPN connection and settings</p>
        </div>

        {/* Quick Actions for Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                VPN Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">Disconnected</div>
              <Link href="/dashboard/connect">
                <Button className="w-full mt-3 bg-green-600 hover:bg-green-700">
                  Connect Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{servers.length}</div>
              <p className="text-xs text-gray-500 mt-1">Available worldwide</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Data Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0 GB</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Connection Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">0h</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <ConnectionMap />
        
        <ServerStatusGrid servers={servers} loading={loading} />
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome to VPN Enterprise Control Panel</p>
      </div>

      <StatsOverview data={stats} loading={loading} />
      
      <ConnectionMap />
      
      <ServerStatusGrid servers={servers} loading={loading} />
    </div>
  );
}
