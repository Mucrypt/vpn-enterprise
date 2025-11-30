'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Crown, 
  Zap, 
  Shield, 
  Database,
  Users,
  HardDrive,
  Globe,
  Activity,
  Calendar,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  BarChart3,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantResourceMonitor } from './tenant-resource-monitor';

interface TenantDetailsModalProps {
  tenant: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantUpdated: (tenant: any) => void;
  onTenantDeleted: (tenantId: string) => void;
}

const getPlanIcon = (plan: string) => {
  switch (plan) {
    case 'enterprise': return <Crown className="h-4 w-4 text-purple-600" />;
    case 'pro': return <Zap className="h-4 w-4 text-blue-600" />;
    default: return <Shield className="h-4 w-4 text-gray-600" />;
  }
};

export function TenantDetailsModal({ 
  tenant, 
  open, 
  onOpenChange, 
  onTenantUpdated,
  onTenantDeleted 
}: TenantDetailsModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    plan_type: 'free',
    max_users: 5,
    max_storage_gb: 1,
    enable_realtime: false,
    enable_analytics: true,
    custom_domain: ''
  });

  // Reset form when tenant changes
  useEffect(() => {
    if (tenant && open) {
      setFormData({
        name: tenant.name || '',
        description: tenant.description || '',
        status: tenant.status || 'active',
        plan_type: tenant.plan_type || 'free',
        max_users: tenant.max_users || 5,
        max_storage_gb: tenant.max_storage_gb || 1,
        enable_realtime: tenant.enable_realtime || false,
        enable_analytics: tenant.enable_analytics !== false,
        custom_domain: tenant.custom_domain || ''
      });
      setMode('view');
      setError(null);
    }
  }, [tenant, open]);

  const handleSave = async () => {
    if (!tenant) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update tenant: ${response.status}`);
      }

      const { tenant: updatedTenant } = await response.json();
      onTenantUpdated(updatedTenant);
      setMode('view');
      
    } catch (e: any) {
      setError(e?.message || 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant || !confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/tenants/${tenant.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete tenant: ${response.status}`);
      }

      onTenantDeleted(tenant.id);
      onOpenChange(false);
      
    } catch (e: any) {
      setError(e?.message || 'Failed to delete tenant');
    } finally {
      setDeleting(false);
    }
  };

  if (!tenant) return null;

  // Calculate usage percentages
  const userUsagePercent = tenant.max_users ? (tenant.current_users / tenant.max_users) * 100 : 0;
  const storageUsagePercent = tenant.max_storage_gb ? (tenant.storage_used_gb / tenant.max_storage_gb) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1600px] max-h-[95vh] overflow-y-auto bg-[#1e1e1e] border-gray-700 p-0">
        <DialogHeader className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">{tenant.name}</DialogTitle>
                <DialogDescription className="text-gray-300 text-base mt-1">
                  {tenant.subdomain}.vpn-enterprise.com • {tenant.plan_type} plan
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={
                tenant.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-600/30 px-3 py-1' :
                tenant.status === 'suspended' ? 'bg-red-600/20 text-red-400 border-red-600/30 px-3 py-1' :
                'bg-yellow-600/20 text-yellow-400 border-yellow-600/30 px-3 py-1'
              }>
                {tenant.status.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-gray-300">
                {getPlanIcon(tenant.plan_type)}
                <span className="capitalize font-medium">{tenant.plan_type}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <div className="px-6 pt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-[#252525] border border-gray-700 h-12 rounded-lg shadow-sm mb-4">
              <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 font-medium">Overview</TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 font-medium">Usage & Metrics</TabsTrigger>
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 font-medium">Monitoring</TabsTrigger>
              <TabsTrigger value="databases" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 font-medium">Databases</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300 font-medium">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card className="bg-[#252525] border-gray-700 lg:col-span-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Info className="h-4 w-4 text-blue-400" />
                    </div>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {mode === 'edit' ? (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-300">Name</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-[#1e1e1e] border-gray-600 text-white h-11"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-300">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="bg-[#1e1e1e] border-gray-600 text-white resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Name</Label>
                        <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg px-4 py-3">
                          <span className="text-white font-medium">{tenant.name}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Subdomain</Label>
                        <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg px-4 py-3">
                          <span className="text-white font-medium">{tenant.subdomain}</span>
                          <span className="text-gray-400">.vpn-enterprise.com</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Description</Label>
                        <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg px-4 py-3">
                          <span className="text-gray-300">{tenant.description || 'No description provided'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Created</Label>
                        <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg px-4 py-3">
                          <span className="text-white font-medium">
                            {new Date(tenant.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status & Limits */}
              <Card className="bg-[#252525] border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-600/20 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-sky-400" />
                    </div>
                    Status & Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Plan</div>
                      <div className="flex items-center gap-2 text-white font-medium">
                        {getPlanIcon(tenant.plan_type)}
                        <span className="capitalize">{tenant.plan_type}</span>
                      </div>
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Status</div>
                      <Badge className={
                        tenant.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                        tenant.status === 'suspended' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                        'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                      }>
                        {tenant.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Max Users</div>
                      <div className="text-white font-bold text-xl">{tenant.max_users || 0}</div>
                    </div>
                    <div className="bg-[#1e1e1e] border border-gray-600 rounded-lg p-4">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Max Storage</div>
                      <div className="text-white font-bold text-xl">{tenant.max_storage_gb || 0} GB</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#252525] border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-bold text-white truncate">{tenant.current_users || 0}</div>
                        <div className="text-sm text-gray-400">Active Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#252525] border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
                        <Database className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-bold text-white truncate">{tenant.database_count || 0}</div>
                        <div className="text-sm text-gray-400">Databases</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#252525] border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                        <HardDrive className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-bold text-white truncate">
                          {tenant.storage_used_gb?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-400">GB Used</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#252525] border-gray-700">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xl font-bold text-white truncate">{tenant.status === 'active' ? 'Active' : 'Inactive'}</div>
                        <div className="text-sm text-gray-400">Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-8 mt-6 px-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Usage */}
              <Card className="bg-[#252525] border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-400" />
                    </div>
                    User Usage
                  </CardTitle>
                  <CardDescription className="text-gray-400">Current user allocation and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Active Users</span>
                      <span className="text-white font-bold text-lg">{tenant.current_users || 0} / {tenant.max_users || 0}</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={userUsagePercent} className="h-3 bg-gray-700" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{userUsagePercent.toFixed(1)}% used</span>
                        <span className="text-gray-400">{tenant.max_users - (tenant.current_users || 0)} remaining</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card className="bg-[#252525] border-gray-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <HardDrive className="h-4 w-4 text-purple-400" />
                    </div>
                    Storage Usage
                  </CardTitle>
                  <CardDescription className="text-gray-400">Current storage allocation and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Storage Used</span>
                      <span className="text-white font-bold text-lg">{tenant.storage_used_gb?.toFixed(1) || '0.0'} / {tenant.max_storage_gb || 0} GB</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={storageUsagePercent} className="h-3 bg-gray-700" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{storageUsagePercent.toFixed(1)}% used</span>
                        <span className="text-gray-400">{((tenant.max_storage_gb || 0) - (tenant.storage_used_gb || 0)).toFixed(1)} GB free</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="bg-[#252525] border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-400" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-[#1e1e1e] border border-gray-600 rounded-lg">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-white font-medium">Last Active</div>
                      <div className="text-gray-300 text-sm">{new Date(tenant.last_activity || tenant.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#1e1e1e] border border-gray-600 rounded-lg">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <div>
                      <div className="text-white font-medium">Tenant Created</div>
                      <div className="text-gray-300 text-sm">{new Date(tenant.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-8 mt-6 px-1">
            <TenantResourceMonitor tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="databases" className="space-y-8 mt-6 px-1">
            <Card className="bg-[#252525] border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-green-400" />
                  </div>
                  Database Management
                </CardTitle>
                <CardDescription className="text-gray-400">Manage databases and access controls for this tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">Database Access</div>
                      <div className="text-gray-300">Open the database management interface for this tenant</div>
                    </div>
                  </div>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3">
                    <a href={`/dashboard/databases?tenantId=${tenant.id}`} target="_blank" rel="noopener noreferrer">
                      <Database className="h-4 w-4 mr-2" />
                      Open Databases
                    </a>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  This tenant has access to {tenant.database_count || 0} database{tenant.database_count !== 1 ? 's' : ''}. 
                  Use the database management interface to create, edit, and manage database schemas and data.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8 mt-6 px-1">
            <Card className="bg-[#252525] border-gray-700">
              <CardHeader className="pb-6">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-4 w-4 text-orange-400" />
                  </div>
                  Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">Manage tenant settings, features, and advanced options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {mode === 'edit' ? (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">Real-time Features</Label>
                            <div className="text-sm text-gray-300">Enable live data synchronization and updates</div>
                          </div>
                        </div>
                        <Switch
                          checked={formData.enable_realtime}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_realtime: checked }))}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <Label className="text-white font-semibold">Analytics</Label>
                            <div className="text-sm text-gray-300">Track usage patterns and performance metrics</div>
                          </div>
                        </div>
                        <Switch
                          checked={formData.enable_analytics}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_analytics: checked }))}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center">
                            <Database className="h-3 w-3 text-green-400" />
                          </div>
                          <Label className="text-white font-semibold">Custom Domain</Label>
                        </div>
                        <Input
                          value={formData.custom_domain}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                          placeholder="app.yourcompany.com"
                          className="bg-[#1e1e1e] border-gray-600 text-white h-11"
                        />
                        <p className="text-sm text-gray-400">Configure a custom domain for this tenant's services</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-600" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-red-400">Danger Zone</h4>
                      </div>
                      <div className="border border-red-600/30 bg-red-600/5 rounded-xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                            <Trash2 className="h-6 w-6 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-lg">Delete Tenant</div>
                            <div className="text-red-200 mt-1">Permanently delete this tenant and all associated data. This action cannot be undone.</div>
                            <Button 
                              variant="destructive" 
                              onClick={handleDelete}
                              disabled={deleting}
                              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                            >
                              {deleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Tenant
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-blue-400" />
                        <span className="text-white font-medium">Real-time Features</span>
                      </div>
                      <Badge className={
                        tenant.enable_realtime ? 
                        'bg-green-600/20 text-green-400 border-green-600/30' : 
                        'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }>
                        {tenant.enable_realtime ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-purple-400" />
                        <span className="text-white font-medium">Analytics</span>
                      </div>
                      <Badge className={
                        tenant.enable_analytics !== false ? 
                        'bg-green-600/20 text-green-400 border-green-600/30' : 
                        'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }>
                        {tenant.enable_analytics !== false ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] border border-gray-600 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-green-400" />
                        <span className="text-white font-medium">Custom Domain</span>
                      </div>
                      <span className="text-gray-300 font-mono">
                        {tenant.custom_domain || 'Not configured'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-700 bg-[#1e1e1e]/50">
          <div className="flex justify-between w-full items-center">
            <div className="flex gap-3">
              {mode === 'view' ? (
                <Button 
                  variant="outline" 
                  onClick={() => setMode('edit')}
                  className="bg-[#252525] border-gray-600 text-white hover:bg-gray-700 px-6"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Edit Tenant
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setMode('view')}
                    className="bg-[#252525] border-gray-600 text-white hover:bg-gray-700 px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-[#252525] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white px-6"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}