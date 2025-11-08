import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSecurityStore } from '@/src/store';
import type { SecurityDashboard } from '@/src/types/security';

export default function SecurityScreen() {
  const { dashboard, updateDashboard } = useSecurityStore();
  const [splitTunnelApp, setSplitTunnelApp] = useState('');
  const [customDNS, setCustomDNS] = useState('1.1.1.1');

  // Mock security score calculation
  const calculateSecurityScore = (): number => {
    let score = 100;
    if (!dashboard.killSwitch) score -= 20;
    if (!dashboard.dnsLeakProtection) score -= 15;
    if (!dashboard.ipv6Protection) score -= 10;
    if (dashboard.threatsBlocked < 10) score -= 5;
    return Math.max(0, score);
  };

  const securityScore = calculateSecurityScore();

  const handleKillSwitchToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDashboard({ killSwitch: value });
  };

  const handleDNSLeakToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDashboard({ dnsLeakProtection: value });
  };

  const handleIPv6Toggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDashboard({ ipv6Protection: value });
  };

  const handleAutoConnectToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDashboard({ autoConnect: value });
  };

  const handleAddSplitTunnelApp = () => {
    if (splitTunnelApp.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newApps = [...(dashboard.splitTunnelApps || []), splitTunnelApp.trim()];
      updateDashboard({ splitTunnelApps: newApps });
      setSplitTunnelApp('');
    }
  };

  const handleRemoveSplitTunnelApp = (app: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newApps = dashboard.splitTunnelApps?.filter(a => a !== app) || [];
    updateDashboard({ splitTunnelApps: newApps });
  };

  const getScoreColor = (score: number): [string, string] => {
    if (score >= 90) return ['#10B981', '#059669']; // Green
    if (score >= 70) return ['#F59E0B', '#D97706']; // Yellow
    return ['#EF4444', '#DC2626']; // Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Security Score Card */}
      <LinearGradient
        colors={getScoreColor(securityScore)}
        style={styles.scoreCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.scoreTitle}>Security Score</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{securityScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <Text style={styles.scoreLabel}>{getScoreLabel(securityScore)}</Text>
      </LinearGradient>

      {/* Threat Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Threat Protection</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{dashboard.threatsBlocked}</Text>
            <Text style={styles.statLabel}>Threats Blocked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{dashboard.maliciousSitesBlocked}</Text>
            <Text style={styles.statLabel}>Sites Blocked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{dashboard.trackersBlocked}</Text>
            <Text style={styles.statLabel}>Trackers Blocked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{dashboard.adsBlocked}</Text>
            <Text style={styles.statLabel}>Ads Blocked</Text>
          </View>
        </View>
      </View>

      {/* Essential Security Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Essential Protection</Text>

        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.featureName}>Kill Switch</Text>
              <Text style={styles.featureDescription}>
                Block internet if VPN disconnects
              </Text>
            </View>
            <Switch
              value={dashboard.killSwitch}
              onValueChange={handleKillSwitchToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={dashboard.killSwitch ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.featureName}>DNS Leak Protection</Text>
              <Text style={styles.featureDescription}>
                Prevent DNS queries from leaking
              </Text>
            </View>
            <Switch
              value={dashboard.dnsLeakProtection}
              onValueChange={handleDNSLeakToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={dashboard.dnsLeakProtection ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.featureName}>IPv6 Protection</Text>
              <Text style={styles.featureDescription}>
                Disable IPv6 to prevent leaks
              </Text>
            </View>
            <Switch
              value={dashboard.ipv6Protection}
              onValueChange={handleIPv6Toggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={dashboard.ipv6Protection ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.featureName}>Auto-Connect</Text>
              <Text style={styles.featureDescription}>
                Connect automatically on untrusted networks
              </Text>
            </View>
            <Switch
              value={dashboard.autoConnect}
              onValueChange={handleAutoConnectToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={dashboard.autoConnect ? '#fff' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* Split Tunneling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔀 Split Tunneling</Text>
        <Text style={styles.sectionDescription}>
          Exclude apps from VPN tunnel for local network access
        </Text>

        <View style={styles.splitTunnelInput}>
          <TextInput
            style={styles.input}
            placeholder="Enter app name (e.g., Chrome, Netflix)"
            placeholderTextColor="#6B7280"
            value={splitTunnelApp}
            onChangeText={setSplitTunnelApp}
            onSubmitEditing={handleAddSplitTunnelApp}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSplitTunnelApp}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {dashboard.splitTunnelApps && dashboard.splitTunnelApps.length > 0 ? (
          <View style={styles.appsList}>
            {dashboard.splitTunnelApps.map((app, index) => (
              <View key={index} style={styles.appChip}>
                <Text style={styles.appChipText}>{app}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSplitTunnelApp(app)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No apps excluded from VPN tunnel
            </Text>
          </View>
        )}
      </View>

      {/* Custom DNS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Custom DNS</Text>
        <Text style={styles.sectionDescription}>
          Use custom DNS servers for enhanced privacy
        </Text>

        <View style={styles.dnsCard}>
          <Text style={styles.dnsLabel}>Primary DNS Server</Text>
          <TextInput
            style={styles.dnsInput}
            value={customDNS}
            onChangeText={setCustomDNS}
            placeholder="1.1.1.1"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
          />
          <View style={styles.dnsPresets}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomDNS('1.1.1.1');
              }}
            >
              <Text style={styles.presetButtonText}>Cloudflare</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomDNS('8.8.8.8');
              }}
            >
              <Text style={styles.presetButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomDNS('9.9.9.9');
              }}
            >
              <Text style={styles.presetButtonText}>Quad9</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Last Scan Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Security Status</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Security Scan</Text>
            <Text style={styles.infoValue}>
              {dashboard.lastSecurityScan
                ? new Date(dashboard.lastSecurityScan).toLocaleString()
                : 'Never'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>VPN Protocol</Text>
            <Text style={styles.infoValue}>WireGuard</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Encryption</Text>
            <Text style={styles.infoValue}>AES-256-GCM</Text>
          </View>
        </View>
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
  scoreCard: {
    margin: 16,
    marginTop: 60,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreMax: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  featureCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    maxWidth: '80%',
  },
  splitTunnelInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#fff',
  },
  addButton: {
    width: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  appsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  appChipText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
  },
  dnsCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dnsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  dnsInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  dnsPresets: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 32,
  },
});
