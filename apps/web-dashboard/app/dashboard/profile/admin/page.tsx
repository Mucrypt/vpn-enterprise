'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Key,
  FileText,
  Activity,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Database,
  Code,
  Terminal,
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key_preview: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

interface AuditLog {
  id: string;
  event_type: string;
  event_description: string;
  ip_address: string;
  severity: string;
  created_at: string;
}

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', scopes: [] as string[] });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/dashboard/profile';
      return;
    }
    loadAdminData();
  }, [isAdmin]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [keysData, logsData, statsData] = await Promise.all([
        api.getAPIKeys().catch(() => ({ keys: [] })),
        api.getAuditLogs({ limit: 10 }).catch(() => ({ logs: [] })),
        api.getUserStats().catch(() => null),
      ]);

      setAPIKeys(keysData?.keys || keysData || []);
      setAuditLogs(logsData?.logs || logsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async () => {
    try {
      const result = await api.createAPIKey(newKeyData);
      setGeneratedKey(result.key);
      setNewKeyData({ name: '', scopes: [] });
      await loadAdminData();
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    try {
      await api.revokeAPIKey(keyId);
      await loadAdminData();
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const availableScopes = [
    'read:servers',
    'write:servers',
    'read:users',
    'write:users',
    'read:analytics',
    'read:audit',
    'admin:*',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
          <p className="text-gray-600 mt-1">Advanced settings and system management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user?.role === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {user?.role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Admin Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.total_users || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Servers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.active_servers || 0}
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Keys</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{apiKeys.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Key className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {auditLogs.filter(log => log.severity === 'critical').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - API Keys & Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Keys
                  </CardTitle>
                  <CardDescription>Manage API keys for programmatic access</CardDescription>
                </div>
                <Button onClick={() => setShowNewKeyModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No API keys created yet</p>
                  <Button onClick={() => setShowNewKeyModal(true)} variant="outline" size="sm" className="mt-3">
                    Create Your First API Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{key.name}</span>
                        </div>
                        <Button
                          onClick={() => handleRevokeAPIKey(key.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {key.key_preview}...
                        </code>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {key.scopes?.map((scope) => (
                          <span key={scope} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {scope}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Created: {formatDate(key.created_at)}</span>
                          <span>Last used: {formatDate(key.last_used_at)}</span>
                        </div>
                        {key.expires_at && (
                          <span className="text-orange-600">Expires: {formatDate(key.expires_at)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Permissions
              </CardTitle>
              <CardDescription>Your administrative capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Manage Users', enabled: true },
                  { label: 'Manage Servers', enabled: true },
                  { label: 'View Analytics', enabled: true },
                  { label: 'Access Audit Logs', enabled: true },
                  { label: 'Billing Management', enabled: user?.role === 'super_admin' },
                  { label: 'System Settings', enabled: user?.role === 'super_admin' },
                  { label: 'Create Admins', enabled: user?.role === 'super_admin' },
                  { label: 'Database Access', enabled: user?.role === 'super_admin' },
                ].map((permission) => (
                  <div key={permission.label} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">{permission.label}</span>
                    {permission.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Audit Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Audit Logs
                  </CardTitle>
                  <CardDescription>Your recent administrative actions</CardDescription>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No audit logs found</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-200 pl-4 py-2">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{log.event_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{log.event_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </span>
                        <span>{log.ip_address}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & System Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View System Health
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Audit Logs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Database Backup
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Security Scan
              </Button>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Version</span>
                <span className="font-medium">v2.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database Status</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  Healthy
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Status</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  Operational
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Backup</span>
                <span className="font-medium">2 hours ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL Certificate</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rate Limiting</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CORS Protection</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Encryption</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
            
            {generatedKey ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 mb-2 font-medium">
                    ⚠️ Save this key now! You won't be able to see it again.
                  </p>
                  <code className="block bg-white p-3 rounded border border-emerald-300 text-sm font-mono break-all">
                    {generatedKey}
                  </code>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      alert('Copied to clipboard!');
                    }}
                    className="w-full mt-3"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setGeneratedKey(null);
                    setShowNewKeyModal(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyData.name}
                    onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    placeholder="e.g., Production API"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {availableScopes.map((scope) => (
                      <label key={scope} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyData.scopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyData({ ...newKeyData, scopes: [...newKeyData.scopes, scope] });
                            } else {
                              setNewKeyData({
                                ...newKeyData,
                                scopes: newKeyData.scopes.filter((s) => s !== scope),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreateAPIKey} className="flex-1" disabled={!newKeyData.name}>
                    Create Key
                  </Button>
                  <Button onClick={() => setShowNewKeyModal(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
