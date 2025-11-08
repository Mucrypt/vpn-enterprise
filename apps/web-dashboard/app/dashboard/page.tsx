'use client';

import { useEffect, useState } from 'react';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ServerStatusGrid } from '@/components/dashboard/server-status-grid';
import { ConnectionMap } from '@/components/dashboard/connection-map';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [servers, setServers] = useState([]);
  const [stats, setStats] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

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
