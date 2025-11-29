'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Settings, Cpu, Database, Search } from 'lucide-react';
import { ServiceTemplatesGrid } from '@/components/hosting/service-templates-grid';

interface HostedService {
  id: string;
  name: string;
  domain?: string;
  status: 'creating' | 'active' | 'suspended' | 'error' | 'deleting';
  type: string;
  plan_name: string;
  resource_usage: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
  created_at: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'text-green-700 bg-green-100 border-green-200';
    case 'creating': return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'error': return 'text-red-700 bg-red-100 border-red-200';
    case 'suspended': return 'text-orange-700 bg-orange-100 border-orange-200';
    default: return 'text-gray-700 bg-gray-100 border-gray-200';
  }
}

export default function MyServicesPage() {
  const [services, setServices] = useState<HostedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'creating'|'suspended'|'error'|'deleting'>('all');
  const [typeFilter, setTypeFilter] = useState<'all'|'wordpress'|'woocommerce'|'minecraft'|'counter-strike'|'discord-bot'|'nodejs'>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const servicesData = await api.getHostingServices().catch(() => []);
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to load your services');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesQuery = query.trim() === ''
        || s.name.toLowerCase().includes(query.toLowerCase())
        || (s.domain || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesType = typeFilter === 'all' || s.type === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [services, query, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
        <p className="text-gray-600 mt-1">Your personal hosting services</p>
      </div>

      {/* Quick Create from Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create</CardTitle>
          <CardDescription>Select a template to start a new service</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceTemplatesGrid />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
          <CardDescription>Manage only your services here</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls: Search + Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  className="w-full border rounded pl-9 pr-3 py-2 bg-white text-gray-900"
                  placeholder="Search by name or domain"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-3 py-2 bg-white text-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="creating">Creating</option>
                <option value="suspended">Suspended</option>
                <option value="error">Error</option>
                <option value="deleting">Deleting</option>
              </select>
              <select
                className="border rounded px-3 py-2 bg-white text-gray-900"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="wordpress">WordPress</option>
                <option value="woocommerce">E-commerce</option>
                <option value="minecraft">Minecraft</option>
                <option value="counter-strike">Counter-Strike</option>
                <option value="discord-bot">Discord Bot</option>
                <option value="nodejs">Node.js</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-6">Try adjusting filters or create a new service</p>
              <Link href="/dashboard/hosting/create">
                <Button>Create Service</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {service.domain || 'No domain configured'} • {service.plan_name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Cpu className="h-3 w-3" />
                          <span>{Math.round(service.resource_usage.cpu * 100)}% CPU</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Database className="h-3 w-3" />
                          <span>{Math.round(service.resource_usage.memory * 100)}% Memory</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/hosting/services/${service.id}`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
