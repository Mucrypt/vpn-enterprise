'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Users, UserPlus, Download, Upload, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes, formatDuration } from '@/lib/utils';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setClients(data);
    } catch (error: any) {
      toast.error('Failed to load clients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(client =>
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage VPN users and their devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">online users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Premium Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {clients.filter(c => c.subscription_tier === 'premium').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {clients.length > 0 
                ? Math.round((clients.filter(c => c.subscription_tier === 'premium').length / clients.length) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {clients.reduce((sum, c) => sum + (c.max_devices || 0), 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Devices</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Active</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={7} className="py-4">
                        <div className="h-8 animate-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {client.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-gray-900">{client.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{client.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          client.subscription_tier === 'premium' 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {client.subscription_tier || 'free'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          client.is_active ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${
                            client.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          {client.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {client.max_devices || 0}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {client.updated_at 
                          ? new Date(client.updated_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
