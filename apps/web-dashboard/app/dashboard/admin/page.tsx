'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Settings, Users, Server, Database, Bell, Lock, Globe, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);
      const statsData = await api.getUserStats().catch(() => ({}));
      setStats(statsData);
    } catch (error: any) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
        <p className="text-gray-600 mt-1">System-wide configuration and management</p>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Total Servers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalServers || 0}</div>
            <p className="text-xs text-green-600 mt-1">↑ 2 added this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</div>
            <p className="text-xs text-green-600 mt-1">↑ 15% growth rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeConnections || 0}</div>
            <p className="text-xs text-gray-500 mt-1">real-time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.dataTransferred || '0 GB'}</div>
            <p className="text-xs text-gray-500 mt-1">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Server className="h-8 w-8" />
              <span>Add Server</span>
            </Button>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Users className="h-8 w-8" />
              <span>Manage Users</span>
            </Button>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Bell className="h-8 w-8" />
              <span>View Alerts</span>
            </Button>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Database className="h-8 w-8" />
              <span>Backup Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Core system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable user access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Auto-scaling</p>
                <p className="text-sm text-gray-500">Automatically provision servers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Send system alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Security and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Require 2FA for Admins</p>
                <p className="text-sm text-gray-500">Enforce two-factor authentication</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">IP Whitelist</p>
                <p className="text-sm text-gray-500">Restrict admin access by IP</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Audit Logging</p>
                <p className="text-sm text-gray-500">Track all admin actions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>API keys and integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Production API Key</p>
              <p className="font-mono text-xs text-gray-600 break-all">
                pk_live_51H...3xK2
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Generate New Key
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              View API Documentation
            </Button>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>Backup and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Last Backup</p>
              <p className="text-xs text-blue-700">
                {new Date().toLocaleString()}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Create Backup Now
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Restore from Backup
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Run Maintenance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">System Health</CardTitle>
          <CardDescription>Infrastructure status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Status</span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <p className="text-2xl font-bold text-green-700">Operational</p>
              <p className="text-xs text-gray-600 mt-1">Response time: 45ms</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Database</span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <p className="text-2xl font-bold text-green-700">Healthy</p>
              <p className="text-xs text-gray-600 mt-1">Connections: 45/100</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">VPN Servers</span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <p className="text-2xl font-bold text-green-700">All Online</p>
              <p className="text-xs text-gray-600 mt-1">Average load: 45%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
