'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Monitor,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  email_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  last_login: string | null;
  preferences: any;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  kill_switch_enabled: boolean;
  auto_connect: boolean;
  dns_leak_protection: boolean;
  ipv6_leak_protection: boolean;
  preferred_protocol: string;
}

interface Session {
  id: string;
  device_name: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  ip_address: string;
  last_activity: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, secData, sessionsData, devicesData, subData] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getSecuritySettings().catch(() => null),
        api.getSessions().catch(() => []),
        api.getDevices().catch(() => ({ devices: [] })),
        api.getSubscription().catch(() => null),
      ]);

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
        });
      }
      
      setSecuritySettings(secData);
      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions || []);
      setDevices(devicesData?.devices || []);
      setSubscription(subData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.updateProfile(formData);
      await loadProfileData();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityToggle = async (setting: string, value: boolean) => {
    try {
      await api.updateSecuritySettings({
        ...securitySettings,
        [setting]: value,
      });
      await loadProfileData();
    } catch (error) {
      console.error('Error updating security settings:', error);
      alert('Failed to update security settings');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      await api.revokeSession(sessionId);
      await loadProfileData();
    } catch (error) {
      console.error('Error revoking session:', error);
      alert('Failed to revoke session');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-emerald-100 text-emerald-800',
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            profile?.role === 'super_admin' ? 'bg-red-100 text-red-800' :
            profile?.role === 'admin' ? 'bg-orange-100 text-orange-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {profile?.role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg border-2 border-emerald-500 hover:bg-emerald-50">
                    <Camera className="h-4 w-4 text-emerald-600" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Photo</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{profile?.email}</p>
                    {profile?.email_verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+1 (555) 000-0000"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Created
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{formatDate(profile?.created_at || null)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Key className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings?.two_factor_enabled || false}
                    onChange={(e) => handleSecurityToggle('two_factor_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Lock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kill Switch</p>
                    <p className="text-sm text-gray-600">Block internet if VPN disconnects</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings?.kill_switch_enabled || false}
                    onChange={(e) => handleSecurityToggle('kill_switch_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Auto-Connect</p>
                    <p className="text-sm text-gray-600">Connect automatically on startup</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings?.auto_connect || false}
                    onChange={(e) => handleSecurityToggle('auto_connect', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">DNS Leak Protection</p>
                    <p className="text-sm text-gray-600">Prevent DNS leaks</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings?.dns_leak_protection || false}
                    onChange={(e) => handleSecurityToggle('dns_leak_protection', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage your active sessions across devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No active sessions</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{session.device_name || 'Unknown Device'}</p>
                          <p className="text-sm text-gray-600">
                            {session.os} • {session.browser} • {session.ip_address}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            Last active: {formatDate(session.last_activity)}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRevokeSession(session.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats & Subscription */}
        <div className="space-y-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Status</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Email Verified</span>
                {profile?.email_verified ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">2FA Enabled</span>
                {securitySettings?.two_factor_enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium">{formatDate(profile?.last_login || null)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className={`inline-block px-4 py-2 rounded-full font-semibold text-lg mb-2 ${
                  getPlanBadgeColor(subscription?.plan_type || 'free')
                }`}>
                  {(subscription?.plan_type || 'free').toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {subscription?.status || 'Active'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Devices</span>
                  <span className="font-medium">{subscription?.max_devices || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data Limit</span>
                  <span className="font-medium">
                    {subscription?.data_limit_gb ? `${subscription.data_limit_gb} GB` : 'Unlimited'}
                  </span>
                </div>
                {subscription?.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Renews</span>
                    <span className="font-medium">{formatDate(subscription.expires_at)}</span>
                  </div>
                )}
              </div>

              <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          {/* Connected Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>{devices.length} of {subscription?.max_devices || 1} devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {devices.slice(0, 3).map((device) => (
                  <div key={device.id} className="flex items-center gap-2 p-2 border rounded">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{device.device_name}</p>
                      <p className="text-xs text-gray-500">{device.os_type}</p>
                    </div>
                    {device.is_active && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    )}
                  </div>
                ))}
                {devices.length > 3 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    +{devices.length - 3} more devices
                  </p>
                )}
              </div>
              <Button variant="outline" className="w-full mt-3" size="sm">
                Manage Devices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
