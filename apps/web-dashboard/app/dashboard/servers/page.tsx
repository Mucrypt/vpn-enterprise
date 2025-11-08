'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Server, Activity, Users, HardDrive, Cpu, Plus, RefreshCw } from 'lucide-react';
import { getServerLoadColor, getServerLoadBgColor, formatBytes } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  async function loadServers() {
    try {
      setLoading(true);
      const data = await api.getServers();
      setServers(data.servers || []);
    } catch (error: any) {
      toast.error('Failed to load servers');
      console.error(error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Server Management</h1>
          <p className="text-gray-600 mt-1">Manage VPN servers and monitor performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadServers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Server Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-48 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))
        ) : (
          servers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-gray-900">{server.name}</CardTitle>
                  </div>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      server.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <CardDescription>{server.country} • {server.endpoint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Server Load */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 flex items-center gap-1">
                      <Cpu className="h-4 w-4" />
                      Server Load
                    </span>
                    <span className={getServerLoadColor(server.load)}>
                      {server.load}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${getServerLoadBgColor(server.load)}`}
                      style={{ width: `${server.load}%` }}
                    />
                  </div>
                </div>

                {/* Connected Clients */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Clients
                  </span>
                  <span className="font-semibold text-gray-900">
                    {server.current_clients} / {server.max_clients}
                  </span>
                </div>

                {/* Storage */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 flex items-center gap-1">
                    <HardDrive className="h-4 w-4" />
                    Storage
                  </span>
                  <span className="text-gray-900">
                    {formatBytes(Math.random() * 1000000000000)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Configure
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Monitor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Server Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{servers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {servers.filter(s => s.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {servers.reduce((sum, s) => sum + (s.current_clients || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              across all servers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Avg Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {servers.length > 0
                ? Math.round(servers.reduce((sum, s) => sum + s.load, 0) / servers.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              cluster average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {servers.reduce((sum, s) => sum + (s.max_clients || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              max connections
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
