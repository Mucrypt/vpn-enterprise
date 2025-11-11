'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Settings as SettingsIcon,
  Filter,
  CheckCheck,
  Clock,
  Zap,
  CreditCard,
  Server,
  Smartphone
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'high' | 'critical';
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    security_alerts: true,
    connection_events: true,
    threat_alerts: true,
    subscription_updates: true,
    marketing_emails: false
  });

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Only pass allowed properties to getNotifications
      const data = await api.getNotifications(
        filter === 'unread' ? { limit: 50 } : {}
      );
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getNotificationSettings();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updateSettings = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await api.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security_alert': return <Shield className="h-5 w-5 text-red-600" />;
      case 'threat_blocked': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'connection': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'subscription': return <CreditCard className="h-5 w-5 text-green-600" />;
      case 'system': return <Server className="h-5 w-5 text-purple-600" />;
      case 'device': return <Smartphone className="h-5 w-5 text-indigo-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-900">
              <SettingsIcon className="h-5 w-5 mr-2" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {key === 'email_notifications' && 'Receive notifications via email'}
                    {key === 'push_notifications' && 'Browser push notifications'}
                    {key === 'security_alerts' && 'Important security events'}
                    {key === 'connection_events' && 'VPN connection status'}
                    {key === 'threat_alerts' && 'Threat detection alerts'}
                    {key === 'subscription_updates' && 'Billing and subscription updates'}
                    {key === 'marketing_emails' && 'Product updates and promotions'}
                  </p>
                </div>
                <button
                  onClick={() => updateSettings(key, !value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'unread'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    !notification.read ? 'bg-white' : 'bg-gray-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                          )}
                          <Badge className={getSeverityColor(notification.severity)}>
                            {notification.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
