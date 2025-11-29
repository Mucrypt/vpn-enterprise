// apps/web-dashboard/app/dashboard/hosting/services/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Extend Window type for __DECENTRAL_HOSTING_ENABLED__
declare global {
  interface Window {
    __DECENTRAL_HOSTING_ENABLED__?: boolean;
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Settings,
  RefreshCw,
  Trash2,
  Play,
  StopCircle,
  Download,
  Upload,
  Globe,
  Cpu,
  HardDrive,
  Network,
  Database,
  Shield
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface HostedService {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;
  status: 'creating' | 'active' | 'suspended' | 'error' | 'deleting';
  type: string;
  plan_name: string;
  config: any;
  resource_usage: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
  created_at: string;
  last_backup?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<HostedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [attestations, setAttestations] = useState<Array<{ id: string; type: string; hash: string; created_at?: string; signer?: string }>>([]);
  const decentralEnabled = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_DECENTRAL_HOSTING_ENABLED === 'true' ||
       window?.__DECENTRAL_HOSTING_ENABLED__ === true)
    : (process.env.NEXT_PUBLIC_DECENTRAL_HOSTING_ENABLED === 'true');

  useEffect(() => {
    loadService();
    loadAttestations();
  }, [serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      const serviceData = await api.getHostedService(serviceId);
      setService(serviceData.service);
    } catch (error: any) {
      console.error('Failed to load service:', error);
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (action: string) => {
    try {
      setActionLoading(action);
      
      switch (action) {
        case 'restart':
          await api.restartHostingService(serviceId);
          toast.success('Service restart initiated');
          break;
        case 'stop':
          await api.stopHostingService(serviceId);
          toast.success('Service stopped');
          break;
        case 'start':
          await api.startHostingService(serviceId);
          toast.success('Service started');
          break;
        case 'backup':
          await api.createBackup(serviceId);
          toast.success('Backup created successfully');
          break;
        case 'attest':
          {
            const res = await api.attestService(serviceId);
            toast.success(`Attested: ${res.attestationId || 'ok'}`);
            // Refresh attestations shortly after
            setTimeout(loadAttestations, 1000);
          }
          break;
        case 'distribute':
          {
            const res = await api.distributeServiceEdge(serviceId);
            toast.success(`Distribution queued: ${res.distributionId || 'ok'}`);
          }
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            await api.deleteHostedService(serviceId);
            toast.success('Service deleted successfully');
            router.push('/dashboard/hosting');
          }
          break;
      }
      
      // Reload service data after action
      setTimeout(loadService, 2000);
    } catch (error: any) {
      toast.error(`Failed to ${action} service: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const loadAttestations = async () => {
    try {
      const list = await api.getServiceAttestations(serviceId);
      setAttestations(Array.isArray(list) ? list : []);
    } catch (e) {
      setAttestations([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100 border-green-200';
      case 'creating': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'error': return 'text-red-700 bg-red-100 border-red-200';
      case 'suspended': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'deleting': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
        <p className="text-gray-600 mb-6">The service you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/dashboard/hosting')}>
          Back to Hosting
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/hosting')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
              <Badge className={getStatusColor(service.status)}>
                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              {service.domain || service.subdomain || 'No domain configured'} • {service.plan_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleServiceAction('restart')}
            disabled={actionLoading !== null || service.status !== 'active'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
            Restart
          </Button>
          <Button
            variant="outline"
            onClick={() => handleServiceAction('stop')}
            disabled={actionLoading !== null}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Stop
          </Button>
          <Button
            variant="outline"
            onClick={() => handleServiceAction('start')}
            disabled={actionLoading !== null}
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={() => handleServiceAction('backup')}
            disabled={actionLoading !== null}
          >
            <Download className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleServiceAction('delete')}
            disabled={actionLoading !== null}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          {decentralEnabled && <TabsTrigger value="attestations">Attestations</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(service.resource_usage.cpu * 100)}%
                    </p>
                  </div>
                  <Cpu className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(service.resource_usage.memory * 100)}%
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(service.resource_usage.storage / 1024 * 100) / 100} GB
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
                      {Math.round(service.resource_usage.bandwidth / 1024 * 100) / 100} GB
                    </p>
                  </div>
                  <Network className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
                <CardDescription>Basic details about your service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium capitalize">{service.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{service.plan_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Domain</span>
                  <span className="font-medium">
                    {service.domain || service.subdomain || 'Not configured'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(service.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Last Backup</span>
                  <span className="font-medium">
                    {service.last_backup 
                      ? new Date(service.last_backup).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.domain && (
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <a href={`https://${service.domain}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleServiceAction('restart')}
                  disabled={actionLoading !== null || service.status !== 'active'}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                  Restart Service
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleServiceAction('backup')}
                  disabled={actionLoading !== null}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/hosting/services/${serviceId}/settings`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Service Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Monitor your service resource consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* CPU Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-gray-600">{Math.round(service.resource_usage.cpu * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.round(service.resource_usage.cpu * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Memory Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-gray-600">{Math.round(service.resource_usage.memory * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.round(service.resource_usage.memory * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Storage Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Storage Usage</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(service.resource_usage.storage / 1024 * 100) / 100} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(Math.round(service.resource_usage.storage / 1024), 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Bandwidth Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Bandwidth Usage</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(service.resource_usage.bandwidth / 1024 * 100) / 100} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(Math.round(service.resource_usage.bandwidth / 1024), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
              <CardDescription>Configure your service parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-gray-600">Service settings configuration will be implemented here.</p>
                {decentralEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleServiceAction('attest')} 
                      disabled={actionLoading !== null}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Attest Service
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleServiceAction('distribute')} 
                      disabled={actionLoading !== null}
                    >
                      <Network className="h-4 w-4 mr-2" />
                      Distribute to Edge
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Backups</CardTitle>
              <CardDescription>Manage your service backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No backups yet</h3>
                <p className="text-gray-600 mb-4">Create your first backup to protect your service data.</p>
                <Button onClick={() => handleServiceAction('backup')}>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {decentralEnabled && (
          <TabsContent value="attestations">
            <Card>
              <CardHeader>
                <CardTitle>Attestations</CardTitle>
                <CardDescription>Signed proofs and distribution records</CardDescription>
              </CardHeader>
              <CardContent>
                {attestations.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    No attestations yet. Use "Attest Service" under Settings.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attestations.map((a) => (
                      <div key={a.id} className="border rounded-md p-3 flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="text-sm text-gray-500">{a.type}</div>
                          <div className="font-mono text-sm break-all">{a.hash}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                            {a.signer ? ` • signer: ${a.signer}` : ''}
                          </div>
                        </div>
                        <Badge variant="secondary">{a.id}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}