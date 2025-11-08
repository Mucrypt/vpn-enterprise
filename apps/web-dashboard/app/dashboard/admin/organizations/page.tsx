'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Plus, 
  Settings, 
  Shield, 
  Server,
  Crown,
  Mail,
  Trash2,
  Edit,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  billing_tier: string;
  max_users: number;
  max_devices_per_user: number;
  max_servers: number;
  created_at: string;
  features: any;
  _count?: {
    users: number;
    servers: number;
  };
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    billing_tier: 'enterprise',
    max_users: 100,
    max_devices_per_user: 10,
    max_servers: 50,
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user',
    full_name: '',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadTeamMembers(selectedOrg.id);
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await api.getOrganizations();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (orgId: string) => {
    try {
      const data = await api.getOrganizationMembers(orgId);
      setTeamMembers(data.members || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrganization(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        billing_tier: 'enterprise',
        max_users: 100,
        max_devices_per_user: 10,
        max_servers: 50,
      });
      loadOrganizations();
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    
    try {
      await api.inviteOrganizationMember(selectedOrg.id, inviteData);
      setShowInviteForm(false);
      setInviteData({ email: '', role: 'user', full_name: '' });
      loadTeamMembers(selectedOrg.id);
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrg || !confirm('Remove this member from the organization?')) return;
    
    try {
      await api.removeOrganizationMember(selectedOrg.id, memberId);
      loadTeamMembers(selectedOrg.id);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!selectedOrg) return;
    
    try {
      await api.updateOrganizationMember(selectedOrg.id, memberId, { role: newRole });
      loadTeamMembers(selectedOrg.id);
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'business': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'professional': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'text-red-700 bg-red-100 border-red-200';
      case 'admin': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'user': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'viewer': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations & Teams</h1>
          <p className="text-gray-600 mt-1">Manage enterprise organizations and team members</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + (org._count?.users || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Servers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, org) => sum + (org._count?.servers || 0), 0)}
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enterprise Tier</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.billing_tier === 'enterprise').length}
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Organization Form */}
      {showCreateForm && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Create New Organization</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </CardTitle>
            <CardDescription>Set up a new enterprise organization</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_tier">Billing Tier *</Label>
                  <select
                    id="billing_tier"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={formData.billing_tier}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, billing_tier: e.target.value })}
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_devices">Max Devices/User</Label>
                  <Input
                    id="max_devices"
                    type="number"
                    value={formData.max_devices_per_user}
                    onChange={(e) => setFormData({ ...formData, max_devices_per_user: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_servers">Max Servers</Label>
                  <Input
                    id="max_servers"
                    type="number"
                    value={formData.max_servers}
                    onChange={(e) => setFormData({ ...formData, max_servers: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            onClick={() => setSelectedOrg(org)}
            className="cursor-pointer"
          >
            <Card 
              className={`transition-all hover:shadow-lg ${
                selectedOrg?.id === org.id ? 'ring-2 ring-emerald-600' : ''
              }`}
            >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge className={`mt-1 ${getTierColor(org.billing_tier)}`}>
                      {org.billing_tier}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Users
                  </span>
                  <span className="font-semibold">
                    {org._count?.users || 0} / {org.max_users}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Server className="h-4 w-4 mr-1" />
                    Servers
                  </span>
                  <span className="font-semibold">
                    {org._count?.servers || 0} / {org.max_servers}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Devices/User
                  </span>
                  <span className="font-semibold">{org.max_devices_per_user}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Created: {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      {/* Team Members Section */}
      {selectedOrg && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members - {selectedOrg.name}</CardTitle>
                <CardDescription>Manage users and their roles within this organization</CardDescription>
              </div>
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Invite Form */}
            {showInviteForm && (
              <div className="mb-6 p-4 border-2 border-dashed border-emerald-300 rounded-lg bg-emerald-50">
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite_email">Email Address *</Label>
                      <Input
                        id="invite_email"
                        type="email"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite_name">Full Name</Label>
                      <Input
                        id="invite_name"
                        value={inviteData.full_name}
                        onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite_role">Role *</Label>
                      <select
                        id="invite_role"
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        value={inviteData.role}
                        onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Members Table */}
            <div className="space-y-2">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No team members yet. Invite users to get started.</p>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        className={`rounded-md border px-3 py-1 text-sm font-medium ${getRoleColor(member.role)}`}
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
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
      )}
    </div>
  );
}
