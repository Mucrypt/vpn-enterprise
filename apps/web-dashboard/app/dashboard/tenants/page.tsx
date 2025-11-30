"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Database, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Settings,
  Crown,
  Zap,
  Shield,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTenantModal } from "@/components/tenants/create-tenant-modal";
import { TenantDetailsModal } from "@/components/tenants/tenant-details-modal";

interface Tenant {
  id: string;
  tenant_id: string;
  name: string;
  subdomain: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at?: string;
  max_users?: number;
  max_storage_gb?: number;
  current_users?: number;
  storage_used_gb?: number;
  database_count?: number;
  last_activity?: string;
}

interface TenantsResponse {
  tenants: Tenant[];
}

interface AssocResponse {
  userId: string;
  tenants: Array<{ tenant_id: string; name?: string | null }>;
}

const planColors = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
};

export default function TenantsManagementPage() {
  // Main data state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [associations, setAssociations] = useState<AssocResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'overview' | 'associations'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Computed values
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = searchQuery === "" || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = selectedPlan === "all" || tenant.plan_type === selectedPlan;
    const matchesStatus = selectedStatus === "all" || tenant.status === selectedStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Statistics
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    totalUsers: tenants.reduce((sum, t) => sum + (t.current_users || 0), 0),
    totalStorage: tenants.reduce((sum, t) => sum + (t.storage_used_gb || 0), 0)
  };

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/v1/tenants/', {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load tenants: ${res.status}`);
      }
      
      const data: TenantsResponse = await res.json();
      
      // Transform and enrich tenant data
      const enrichedTenants = (data.tenants || []).map(tenant => ({
        ...tenant,
        id: tenant.id || tenant.tenant_id,
        // Add mock enrichment data for demo
        current_users: Math.floor(Math.random() * (tenant.max_users || 10)),
        storage_used_gb: Math.floor(Math.random() * (tenant.max_storage_gb || 10)),
        database_count: Math.floor(Math.random() * 5) + 1,
        last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setTenants(enrichedTenants);
    } catch (e: any) {
      setError(e?.message || "Failed to load tenants");
    }
  };

  const loadAssociations = async () => {
    try {
      const res = await fetch('/api/v1/tenants/me/associations', {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load associations: ${res.status}`);
      }
      
      const data: AssocResponse = await res.json();
      setAssociations(data);
    } catch (e: any) {
      console.warn("Associations not available:", e?.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    await Promise.all([
      loadTenants(),
      loadAssociations()
    ]);
    
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadTenants(),
        loadAssociations()
      ]);
      
      if (!cancelled) setLoading(false);
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Crown className="h-4 w-4" />;
      case 'pro': return <Zap className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Tenants Management
          </h1>
          <p className="text-gray-300 mt-1">
            Manage your multi-tenant infrastructure and resources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-800 bg-red-900/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#252525] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-400">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#252525] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-400">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#252525] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStorage.toFixed(1)} GB</div>
            <p className="text-xs text-gray-400">
              Total allocation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#252525] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">98.5%</div>
            <p className="text-xs text-gray-400">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-6">
        <TabsList className="bg-[#252525] border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300">Tenants Overview</TabsTrigger>
          <TabsTrigger value="associations" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300">My Associations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card className="bg-[#252525] border-gray-700">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tenants by name or subdomain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1e1e1e] border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500"
                  />
                </div>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-full sm:w-40 bg-[#1e1e1e] border-gray-600 text-white hover:border-gray-500">
                    <SelectValue placeholder="All Plans" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Plans</SelectItem>
                    <SelectItem value="free" className="text-white hover:bg-gray-700 focus:bg-gray-700">Free</SelectItem>
                    <SelectItem value="pro" className="text-white hover:bg-gray-700 focus:bg-gray-700">Pro</SelectItem>
                    <SelectItem value="enterprise" className="text-white hover:bg-gray-700 focus:bg-gray-700">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40 bg-[#1e1e1e] border-gray-600 text-white hover:border-gray-500">
                    <SelectValue placeholder="All Status" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">All Status</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-gray-700 focus:bg-gray-700">Active</SelectItem>
                    <SelectItem value="suspended" className="text-white hover:bg-gray-700 focus:bg-gray-700">Suspended</SelectItem>
                    <SelectItem value="pending" className="text-white hover:bg-gray-700 focus:bg-gray-700">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tenants Grid */}
          {filteredTenants.length === 0 ? (
            <Card className="bg-[#252525] border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {searchQuery || selectedPlan !== 'all' || selectedStatus !== 'all' 
                      ? 'No tenants match your filters' 
                      : 'No tenants found'
                    }
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {searchQuery || selectedPlan !== 'all' || selectedStatus !== 'all'
                      ? 'Try adjusting your search criteria or filters.'
                      : 'Get started by creating your first tenant.'
                    }
                  </p>
                  {!searchQuery && selectedPlan === 'all' && selectedStatus === 'all' && (
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Tenant
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="bg-[#252525] border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2 text-white">
                            {getPlanIcon(tenant.plan_type)}
                            {tenant.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">
                            {tenant.subdomain}.vpn-enterprise.com
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#252525] border-gray-600 shadow-lg">
                          <DropdownMenuLabel className="text-gray-200 font-medium">Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDetailsModal(true);
                            }}
                            className="text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDetailsModal(true);
                            }}
                            className="text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer">
                            <Database className="h-4 w-4 mr-2" />
                            Manage Databases
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-200 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-600" />
                          <DropdownMenuItem className="text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Tenant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status and Plan */}
                    <div className="flex items-center justify-between">
                      <Badge className={statusColors[tenant.status]}>
                        {tenant.status}
                      </Badge>
                      <Badge variant="outline" className={planColors[tenant.plan_type]}>
                        {tenant.plan_type}
                      </Badge>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Users</div>
                        <div className="font-semibold text-white">
                          {tenant.current_users}/{tenant.max_users}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Storage</div>
                        <div className="font-semibold text-white">
                          {tenant.storage_used_gb?.toFixed(1)}/{tenant.max_storage_gb} GB
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Databases</div>
                        <div className="font-semibold text-white">{tenant.database_count}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Last Active</div>
                        <div className="font-semibold text-xs text-white">
                          {new Date(tenant.last_activity!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/dashboard/databases?tenantId=${tenant.id}`}>
                          <Database className="h-4 w-4 mr-1" />
                          Databases
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Activity className="h-4 w-4 mr-1" />
                        Monitor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="associations" className="space-y-6">
          <Card className="bg-[#252525] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                My Tenant Associations
              </CardTitle>
              <p className="text-sm text-gray-300">
                Tenants you have access to as a member or administrator
              </p>
            </CardHeader>
            <CardContent>
              {!associations ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading associations...</div>
                </div>
              ) : associations.tenants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No tenant associations found
                  </h3>
                  <p className="text-gray-300">
                    You don't have access to any tenants yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {associations.tenants.map((t) => {
                    const name = t.name || t.tenant_id;
                    const href = `/dashboard/databases?tenantId=${encodeURIComponent(t.tenant_id)}`;
                    
                    return (
                      <div 
                        key={t.tenant_id} 
                        className="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{name}</div>
                            <div className="text-sm text-gray-400">ID: {t.tenant_id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700 text-gray-300" asChild>
                            <Link href={href}>
                              <Database className="h-4 w-4 mr-1" />
                              SQL Editor
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-700 text-gray-400">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Tenant Modal */}
      <CreateTenantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTenantCreated={(newTenant) => {
          // Add the new tenant to the list
          setTenants(prev => [newTenant, ...prev]);
          // Refresh data to get latest state
          handleRefresh();
        }}
      />

      {/* Tenant Details Modal */}
      <TenantDetailsModal
        tenant={selectedTenant}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onTenantUpdated={(updatedTenant) => {
          setTenants(prev => prev.map(t => 
            t.id === updatedTenant.id ? { ...t, ...updatedTenant } : t
          ));
          setSelectedTenant(updatedTenant);
        }}
        onTenantDeleted={(tenantId) => {
          setTenants(prev => prev.filter(t => t.id !== tenantId));
          setSelectedTenant(null);
        }}
      />
    </div>
  );
}
