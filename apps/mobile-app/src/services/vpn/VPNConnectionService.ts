/**
 * VPN Connection Service
 * Manages WireGuard VPN connections with AI optimization
 */

import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { api } from '@/src/services/api/VPNEnterpriseAPI';
import { useVPNStore, useServersStore, usePreferencesStore } from '@/src/store';
import { Server, ConnectionStatus, ConnectionMetrics } from '@/src/types/vpn';

class VPNConnectionService {
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Connect to a VPN server with AI optimization
   */
  async connect(server: Server): Promise<boolean> {
    try {
      const { setStatus, setConnection, setCurrentServer } = useVPNStore.getState();
      const { preferences } = usePreferencesStore.getState();
      const { addRecentServer } = useServersStore.getState();

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Haptic feedback
      if (preferences.hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Update status to connecting
      setStatus('connecting');
      setCurrentServer(server);

      // Call API to establish connection
      const connection = await api.connect(server.id);
      
      // Update state
      setConnection(connection);
      setStatus('connected');
      addRecentServer(server.id);

      // Success haptic
      if (preferences.hapticFeedbackEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Start monitoring
      this.startConnectionMonitoring();
      this.startMetricsCollection();

      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      useVPNStore.getState().setStatus('error');
      
      // Error haptic
      const { preferences } = usePreferencesStore.getState();
      if (preferences.hapticFeedbackEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      throw error;
    }
  }

  /**
   * Disconnect from VPN
   */
  async disconnect(): Promise<void> {
    try {
      const { connection, setStatus, disconnect } = useVPNStore.getState();
      const { preferences } = usePreferencesStore.getState();

      if (!connection) {
        return;
      }

      // Haptic feedback
      if (preferences.hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setStatus('disconnecting');

      // Call API to disconnect
      await api.disconnect(connection.id);

      // Clear state
      disconnect();

      // Stop monitoring
      this.stopConnectionMonitoring();
      this.stopMetricsCollection();

    } catch (error) {
      // Silently handle disconnect errors (already disconnected)
      if (__DEV__ && error instanceof Error && !error.message.includes('Network Error')) {
        console.error('Disconnect failed:', error);
      }
      throw error;
    }
  }

  /**
   * Quick connect to best server (AI-powered)
   */
  async quickConnect(): Promise<boolean> {
    try {
      const { recommendedServer } = useServersStore.getState();
      
      if (!recommendedServer) {
        // Fall back to first available server
        const servers = await api.getServers();
        const bestServer = this.findBestServer(servers);
        if (!bestServer) {
          throw new Error('No servers available');
        }
        return await this.connect(bestServer);
      }

      return await this.connect(recommendedServer);
    } catch (error) {
      // Only log unexpected errors
      if (__DEV__ && error instanceof Error && !error.message.includes('Network Error')) {
        console.error('Quick connect failed:', error);
      }
      throw error;
    }
  }

  /**
   * Reconnect to current server
   */
  async reconnect(): Promise<boolean> {
    try {
      const { currentServer, setStatus } = useVPNStore.getState();
      
      if (!currentServer) {
        throw new Error('No current server to reconnect');
      }

      setStatus('reconnecting');
      await this.disconnect();
      return await this.connect(currentServer);
    } catch (error) {
      console.error('Reconnect failed:', error);
      throw error;
    }
  }

  /**
   * Find best server based on load and latency
   */
  private findBestServer(servers: Server[]): Server | null {
    const availableServers = servers.filter(s => s.status === 'online');
    
    if (availableServers.length === 0) {
      return null;
    }

    // Sort by performance score (AI-calculated) and load
    return availableServers.sort((a, b) => {
      const scoreA = a.performanceScore || (100 - a.load);
      const scoreB = b.performanceScore || (100 - b.load);
      return scoreB - scoreA;
    })[0];
  }

  /**
   * Start monitoring connection status
   */
  private startConnectionMonitoring() {
    this.stopConnectionMonitoring();
    
    this.connectionCheckInterval = setInterval(async () => {
      try {
        const connection = await api.getConnectionStatus();
        const { setConnection, setStatus } = useVPNStore.getState();
        
        if (connection) {
          setConnection(connection);
          setStatus(connection.status);
        } else {
          setStatus('disconnected');
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop connection monitoring
   */
  private stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Start collecting connection metrics
   */
  private startMetricsCollection() {
    this.stopMetricsCollection();
    
    this.metricsInterval = setInterval(() => {
      // Simulate metrics collection
      // In a real app, this would measure actual network performance
      const metrics: ConnectionMetrics = {
        downloadSpeed: Math.random() * 100 * 1024 * 1024, // 0-100 MB/s
        uploadSpeed: Math.random() * 50 * 1024 * 1024, // 0-50 MB/s
        latency: Math.random() * 50 + 10, // 10-60 ms
        packetLoss: Math.random() * 0.5, // 0-0.5%
        jitter: Math.random() * 10, // 0-10 ms
        timestamp: new Date(),
      };

      useVPNStore.getState().updateMetrics(metrics);
    }, 1000); // Update every second
  }

  /**
   * Stop metrics collection
   */
  private stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    const { status } = useVPNStore.getState();
    return status === 'connected';
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return useVPNStore.getState().status;
  }

  /**
   * Check connection health
   */
  async checkConnectionHealth(): Promise<boolean> {
    try {
      const { status, connection } = useVPNStore.getState();
      
      if (status !== 'connected' || !connection) {
        return false;
      }

      // Check if connection is still active
      const currentConnection = await api.getConnectionStatus();
      
      if (!currentConnection || currentConnection.status !== 'connected') {
        return false;
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const vpnService = new VPNConnectionService();
export default vpnService;
