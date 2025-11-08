'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Split, 
  Plus, 
  Trash2, 
  Globe, 
  Shield, 
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { api } from '@/lib/api';

interface SplitTunnelRule {
  id: string;
  user_id: string;
  rule_type: 'app' | 'domain' | 'ip';
  rule_value: string;
  action: 'allow' | 'block' | 'vpn' | 'direct';
  description?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export default function SplitTunnelPage() {
  const [rules, setRules] = useState<SplitTunnelRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    rule_type: 'domain' as 'app' | 'domain' | 'ip',
    rule_value: '',
    action: 'vpn' as 'allow' | 'block' | 'vpn' | 'direct',
    description: '',
    priority: 100,
    is_active: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await api.getSplitTunnelRules();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Failed to load split tunnel rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSplitTunnelRule(formData);
      setShowCreateForm(false);
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<SplitTunnelRule>) => {
    try {
      await api.updateSplitTunnelRule(id, updates);
      setEditingId(null);
      loadRules();
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this split tunnel rule?')) return;
    
    try {
      await api.deleteSplitTunnelRule(id);
      loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await handleUpdateRule(id, { is_active: !currentStatus });
  };

  const resetForm = () => {
    setFormData({
      rule_type: 'domain',
      rule_value: '',
      action: 'vpn',
      description: '',
      priority: 100,
      is_active: true,
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'vpn': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'direct': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'block': return 'bg-red-100 text-red-800 border-red-200';
      case 'allow': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'app': return <Shield className="h-4 w-4" />;
      case 'ip': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const filteredRules = rules
    .filter(rule => filterType === 'all' || rule.rule_type === filterType)
    .filter(rule => 
      searchQuery === '' || 
      rule.rule_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Split Tunneling</h1>
          <p className="text-gray-600 mt-1">Control which traffic goes through the VPN</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
              </div>
              <Split className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rules.filter(r => r.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Domain Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rules.filter(r => r.rule_type === 'domain').length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">App Rules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rules.filter(r => r.rule_type === 'app').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create Split Tunnel Rule</span>
              <Button variant="ghost" size="sm" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                <XCircle className="h-5 w-5" />
              </Button>
            </CardTitle>
            <CardDescription>Define routing rules for specific apps, domains, or IP addresses</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type *</Label>
                  <select
                    id="rule_type"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as any })}
                  >
                    <option value="domain">Domain</option>
                    <option value="app">Application</option>
                    <option value="ip">IP Address</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Action *</Label>
                  <select
                    id="action"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                  >
                    <option value="vpn">Route through VPN</option>
                    <option value="direct">Direct Connection</option>
                    <option value="block">Block Traffic</option>
                    <option value="allow">Always Allow</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule_value">
                  {formData.rule_type === 'domain' ? 'Domain Name' : 
                   formData.rule_type === 'app' ? 'Application Name' : 'IP Address'} *
                </Label>
                <Input
                  id="rule_value"
                  value={formData.rule_value}
                  onChange={(e) => setFormData({ ...formData, rule_value: e.target.value })}
                  placeholder={
                    formData.rule_type === 'domain' ? 'example.com' :
                    formData.rule_type === 'app' ? 'com.example.app' : '192.168.1.0/24'
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Why this rule exists..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (lower = higher priority)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rules by value or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                className="rounded-md border border-gray-300 px-3 py-2"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="domain">Domains</option>
                <option value="app">Applications</option>
                <option value="ip">IP Addresses</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Split Tunnel Rules ({filteredRules.length})</CardTitle>
          <CardDescription>
            Rules are evaluated by priority (lower number = higher priority)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredRules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Split className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No split tunnel rules</p>
                <p className="text-sm">Create rules to control which traffic goes through the VPN</p>
              </div>
            ) : (
              filteredRules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <div 
                    key={rule.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      rule.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
                        {getTypeIcon(rule.rule_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{rule.rule_value}</p>
                          <Badge variant="outline" className="text-xs">
                            {rule.rule_type}
                          </Badge>
                          <Badge className={getActionColor(rule.action)}>
                            {rule.action}
                          </Badge>
                          <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(rule.id, rule.is_active)}
                        className={rule.is_active ? 'text-green-600' : 'text-gray-400'}
                      >
                        {rule.is_active ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Shield className="h-5 w-5 mr-2" />
            How Split Tunneling Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Route through VPN:</strong> Traffic matching this rule will be encrypted and sent through the VPN tunnel.</p>
          <p><strong>Direct Connection:</strong> Traffic bypasses the VPN and connects directly to the internet.</p>
          <p><strong>Block Traffic:</strong> All traffic matching this rule will be blocked completely.</p>
          <p><strong>Always Allow:</strong> Traffic is allowed regardless of other security rules.</p>
          <p className="pt-2 border-t border-blue-200"><strong>Note:</strong> Rules with lower priority numbers are evaluated first. If no rules match, default VPN behavior applies.</p>
        </CardContent>
      </Card>
    </div>
  );
}
