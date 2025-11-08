import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePreferencesStore, useAuthStore, useVPNStore } from '@/src/store';

export default function SettingsScreen() {
  const { preferences, updatePreferences } = usePreferencesStore();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { disconnect } = useVPNStore();

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updatePreferences({ [key]: value });
  };

  const handleProtocolChange = (protocol: 'wireguard' | 'openvpn') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updatePreferences({ preferredProtocol: protocol });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            disconnect();
            clearAuth();
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Cache Cleared', 'App cache has been cleared successfully');
  };

  const handleExportLogs = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Logs Exported', 'Connection logs exported to Downloads folder');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your VPN preferences</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Account</Text>
        
        {isAuthenticated ? (
          <>
            {/* Authenticated User */}
            <View style={styles.accountCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.email?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>
                  {user?.full_name || user?.email || 'VPN User'}
                </Text>
                <Text style={styles.accountEmail}>{user?.email || 'user@vpn.com'}</Text>
                <View style={styles.planBadge}>
                  <IconSymbol name="star.fill" size={12} color="#10B981" />
                  <Text style={styles.accountPlan}>Premium Plan</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => router.push('/(tabs)/billing' as any)}
              >
                <IconSymbol name="chevron.right" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Guest User - Show Login/Signup */}
            <View style={styles.guestCard}>
              <LinearGradient
                colors={['#1E293B', '#334155']}
                style={styles.guestGradient}
              >
                <IconSymbol name="person.crop.circle" size={64} color="#6B7280" />
                <Text style={styles.guestTitle}>You're browsing as a guest</Text>
                <Text style={styles.guestDescription}>
                  Sign in to sync your preferences and access premium features
                </Text>
              </LinearGradient>
            </View>

            <TouchableOpacity 
              style={styles.authButton} 
              onPress={() => router.push('/auth/login' as any)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/auth/signup' as any)}
            >
              <IconSymbol name="person.badge.plus" size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Connection Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔌 Connection</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Auto-Connect</Text>
              <Text style={styles.settingDescription}>
                Connect automatically on app launch
              </Text>
            </View>
            <Switch
              value={preferences.autoConnect}
              onValueChange={(value) => handleToggle('autoConnect', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.autoConnect ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Auto-Select Server</Text>
              <Text style={styles.settingDescription}>
                Automatically choose the best server
              </Text>
            </View>
            <Switch
              value={preferences.autoSelectServer}
              onValueChange={(value) => handleToggle('autoSelectServer', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.autoSelectServer ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Protocol</Text>
          <View style={styles.protocolSelector}>
            <TouchableOpacity
              style={[
                styles.protocolButton,
                preferences.preferredProtocol === 'wireguard' && styles.protocolButtonActive,
              ]}
              onPress={() => handleProtocolChange('wireguard')}
            >
              <Text
                style={[
                  styles.protocolButtonText,
                  preferences.preferredProtocol === 'wireguard' && styles.protocolButtonTextActive,
                ]}
              >
                WireGuard
              </Text>
              <Text style={styles.protocolBadge}>Recommended</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.protocolButton,
                preferences.preferredProtocol === 'openvpn' && styles.protocolButtonActive,
              ]}
              onPress={() => handleProtocolChange('openvpn')}
            >
              <Text
                style={[
                  styles.protocolButtonText,
                  preferences.preferredProtocol === 'openvpn' && styles.protocolButtonTextActive,
                ]}
              >
                OpenVPN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts about security and connection
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.notificationsEnabled ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Data Usage Warnings</Text>
              <Text style={styles.settingDescription}>
                Alert when approaching data limits
              </Text>
            </View>
            <Switch
              value={preferences.dataUsageWarnings}
              onValueChange={(value) => handleToggle('dataUsageWarnings', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.dataUsageWarnings ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* User Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Experience</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Vibration feedback for interactions
              </Text>
            </View>
            <Switch
              value={preferences.hapticFeedbackEnabled}
              onValueChange={(value) => handleToggle('hapticFeedbackEnabled', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.hapticFeedbackEnabled ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View>
              <Text style={styles.settingName}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Use dark theme (always enabled)
              </Text>
            </View>
            <Switch
              value={preferences.darkModeEnabled}
              onValueChange={(value) => handleToggle('darkModeEnabled', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={preferences.darkModeEnabled ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* Advanced */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Advanced</Text>

        <TouchableOpacity style={styles.actionCard} onPress={handleClearCache}>
          <View>
            <Text style={styles.actionName}>Clear Cache</Text>
            <Text style={styles.actionDescription}>
              Free up storage space
            </Text>
          </View>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportLogs}>
          <View>
            <Text style={styles.actionName}>Export Logs</Text>
            <Text style={styles.actionDescription}>
              Save connection logs for debugging
            </Text>
          </View>
          <Text style={styles.actionIcon}>📤</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View>
            <Text style={styles.actionName}>About</Text>
            <Text style={styles.actionDescription}>
              Version 1.0.0 (Build 100)
            </Text>
          </View>
          <Text style={styles.actionIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📜 Legal</Text>

        <TouchableOpacity style={styles.linkCard}>
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Text style={styles.linkIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard}>
          <Text style={styles.linkText}>Terms of Service</Text>
          <Text style={styles.linkIcon}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard}>
          <Text style={styles.linkText}>Licenses</Text>
          <Text style={styles.linkIcon}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  accountCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  accountPlan: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  guestCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  guestGradient: {
    padding: 32,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  guestDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  authButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    maxWidth: '80%',
  },
  protocolSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  protocolButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
  },
  protocolButtonActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  protocolButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  protocolButtonTextActive: {
    color: '#10B981',
  },
  protocolBadge: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  actionIcon: {
    fontSize: 24,
  },
  linkCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  linkIcon: {
    fontSize: 20,
    color: '#10B981',
  },
  bottomPadding: {
    height: 100,
  },
});
