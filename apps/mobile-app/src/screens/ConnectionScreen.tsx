/**
 * Connection Screen - Revolutionary Neural Interface
 * The heart of the VPN app with AI-powered connections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVPNConnection, useServerOptimization, useFormatSpeed, useFormatDuration } from '@/src/hooks/useVPN';
import { ConnectionButton } from '@/src/components/connection/ConnectionButton';
import { SpeedIndicator } from '@/src/components/connection/SpeedIndicator';
import RealTimeConnectionMap from '@/src/components/connection/RealTimeConnectionMap';

const { width, height } = Dimensions.get('window');

export default function ConnectionScreen() {
  const { 
    status, 
    currentServer, 
    metrics, 
    isConnected, 
    quickConnect, 
    disconnect 
  } = useVPNConnection();
  
  const { recommendedServer, optimizeServerSelection } = useServerOptimization();
  const formatSpeed = useFormatSpeed();
  const formatDuration = useFormatDuration();

  const [connectionDuration, setConnectionDuration] = useState(0);
  const [glowAnimation] = useState(new Animated.Value(0));

  // Auto-optimize server selection on mount
  useEffect(() => {
    optimizeServerSelection();
  }, []);

  // Track connection duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setConnectionDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Glow animation for connected state
  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnimation.setValue(0);
    }
  }, [isConnected]);

  const handleConnectionToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await quickConnect();
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return ['#10B981', '#059669'];
      case 'connecting':
      case 'reconnecting':
        return ['#F59E0B', '#D97706'];
      case 'disconnected':
        return ['#6B7280', '#4B5563'];
      case 'error':
        return ['#EF4444', '#DC2626'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Protected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnecting':
        return 'Disconnecting...';
      case 'disconnected':
        return 'Not Protected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Ready';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={isConnected ? ['#0F172A', '#1E293B', '#334155'] : ['#1F2937', '#111827', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>VPN Enterprise</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor()[0] }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {/* Connection Map */}
        <View style={styles.mapContainer}>
                    <RealTimeConnectionMap />
        </View>

        {/* Main Connection Button */}
        <View style={styles.connectionSection}>
          <ConnectionButton
            isConnected={isConnected}
            status={status}
            onPress={handleConnectionToggle}
            glowAnimation={glowAnimation}
          />

          {/* Server Info */}
          {(currentServer || recommendedServer) && (
            <View style={styles.serverInfo}>
              <Text style={styles.serverLabel}>
                {isConnected ? 'Connected to' : 'Best server available'}
              </Text>
              <Text style={styles.serverName}>
                {currentServer?.name || recommendedServer?.name}
              </Text>
              <Text style={styles.serverLocation}>
                {currentServer?.city || recommendedServer?.city}, {currentServer?.country || recommendedServer?.country}
              </Text>
            </View>
          )}
        </View>

        {/* Metrics Display */}
        {isConnected && metrics && (
          <View style={styles.metricsContainer}>
            <SpeedIndicator
              label="Download"
              speed={formatSpeed(metrics.downloadSpeed)}
              icon="↓"
              color="#10B981"
            />
            <SpeedIndicator
              label="Upload"
              speed={formatSpeed(metrics.uploadSpeed)}
              icon="↑"
              color="#3B82F6"
            />
            <SpeedIndicator
              label="Latency"
              speed={`${Math.round(metrics.latency)}ms`}
              icon="⚡"
              color="#F59E0B"
            />
          </View>
        )}

        {/* Connection Stats */}
        {isConnected && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatDuration(connectionDuration)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>IP Address</Text>
              <Text style={styles.statValue}>{currentServer?.endpoint?.split(':')[0] || 'Hidden'}</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🛡️</Text>
            <Text style={styles.actionText}>Security</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  mapContainer: {
    height: height * 0.25,
    marginBottom: 32,
  },
  connectionSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  serverInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  serverLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  serverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  serverLocation: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
