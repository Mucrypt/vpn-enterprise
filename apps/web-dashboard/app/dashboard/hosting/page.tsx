// apps/web-dashboard/app/dashboard/hosting/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Plus, 
  Settings, 
  Activity, 
  Database, 
  Globe,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function HostingPage() {
  const [services, setServices] = useState<HostedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    totalStorage: 0,
    bandwidthUsed: 0
  });

  const { user } = useAuthStore();

  useEffect(() => {
    loadHostingData();
  }, []);

  const loadHostingData = async () => {
    try {
      setLoading(true);
      const [servicesData, statsData] = await Promise.all([
        api.getHostingServices().catch(() => []),
        api.getHostingStats().catch(() => ({})),
      ]);
      // getHostingServices returns an array, not { services }
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setStats(statsData as any);
    } catch (error: any) {
      console.error('Failed to load hosting data:', error);
      toast.error('Failed to load hosting services');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200';
      case 'creating': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'error': return 'text-red-700 bg-red-100 border-red-200';
      case 'suspended': return 'text-orange-700 bg-orange-100 border-orange-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'wordpress':
      case 'woocommerce':
        return <Globe className="h-5 w-5" />;
      case 'minecraft':
      case 'counter-strike':
        return <Server className="h-5 w-5" />;
      case 'discord-bot':
        return <Activity className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hosting Services</h1>
          <p className="text-gray-600 mt-1">Manage your websites, game servers, and applications</p>
        </div>
        <Link href="/dashboard/hosting/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalServices || services.length}</p>
              </div>
              <Server className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeServices || services.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.totalStorage / 1024 * 100) / 100 || 0} GB
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bandwidth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.bandwidthUsed / 1024 * 100) / 100 || 0} GB
                </p>
              </div>
              <Network className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
          <CardDescription>
            Manage all your hosting services in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first hosting service</p>
              <Link href="/dashboard/hosting/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Service
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {getServiceIcon(service.type)}
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