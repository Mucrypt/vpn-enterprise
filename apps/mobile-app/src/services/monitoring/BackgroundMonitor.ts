/**
 * Background Connection Monitor
 * Monitors VPN connection health, handles auto-reconnect, and network changes
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import vpnConnectionService from '@/src/services/vpn/VPNConnectionService';
import notificationService from '@/src/services/notifications/NotificationService';
import { useVPNStore, usePreferencesStore } from '@/src/store';

const BACKGROUND_FETCH_TASK = 'vpn-connection-monitor';
const CHECK_INTERVAL = 15 * 60; // 15 minutes

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const now = Date.now();
    
    // Check VPN connection status
    const status = useVPNStore.getState().status;
    
    if (status === 'connected') {
      // Perform health check
      const isHealthy = await vpnConnectionService.checkConnectionHealth();
      
      if (!isHealthy) {
        // Attempt auto-reconnect if enabled
        const preferences = usePreferencesStore.getState().preferences;
        if (preferences.autoConnect) {
          await vpnConnectionService.reconnect();
          await notificationService.notifyConnectionQuality('unstable');
        }
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundMonitor {
  private static instance: BackgroundMonitor;
  private networkUnsubscribe: (() => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  private constructor() {}

  static getInstance(): BackgroundMonitor {
    if (!BackgroundMonitor.instance) {
      BackgroundMonitor.instance = new BackgroundMonitor();
    }
    return BackgroundMonitor.instance;
  }

  /**
   * Initialize background monitoring
   */
  async initialize() {
    await this.registerBackgroundFetch();
    this.startNetworkMonitoring();
  }

  /**
   * Register background fetch task
   */
  private async registerBackgroundFetch() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: CHECK_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background fetch registered successfully');
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  /**
   * Unregister background fetch task
   */
  async unregisterBackgroundFetch() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('Background fetch unregistered');
    } catch (error) {
      console.error('Failed to unregister background fetch:', error);
    }
  }

  /**
   * Start monitoring network changes
   */
  private startNetworkMonitoring() {
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetworkChange(state);
    });
  }

  /**
   * Stop monitoring network changes
   */
  stopNetworkMonitoring() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
  }

  /**
   * Handle network state changes
   */
  private async handleNetworkChange(state: any) {
    const { status, currentServer } = useVPNStore.getState();
    const { preferences } = usePreferencesStore.getState();

    // Network became available
    if (state.isConnected && status === 'disconnected' && preferences.autoConnect) {
      // Check if we should auto-connect on untrusted networks
      if (!state.details?.isConnectionExpensive) {
        console.log('Network available, auto-connecting...');
        
        if (currentServer) {
          try {
            await vpnConnectionService.connect(currentServer);
            await notificationService.notifyConnectionStatus(true, currentServer.name);
          } catch (error) {
            console.error('Auto-connect failed:', error);
          }
        }
      }
    }

    // Network lost while connected
    if (!state.isConnected && status === 'connected') {
      console.log('Network lost, connection dropped');
      await notificationService.notifyConnectionQuality('unstable');
    }

    // Network type changed (WiFi to Cellular or vice versa)
    if (state.isConnected && status === 'connected') {
      const networkType = state.type;
      console.log(`Network changed to ${networkType}`);
      
      // Attempt reconnect to maintain VPN connection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        await this.attemptReconnect();
      }
    }

    // Reset reconnect attempts on stable connection
    if (state.isConnected && status === 'connected') {
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Attempt to reconnect VPN
   */
  private async attemptReconnect() {
    try {
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      const { currentServer } = useVPNStore.getState();
      if (currentServer) {
        await vpnConnectionService.reconnect();
        console.log('Reconnect successful');
        this.reconnectAttempts = 0;
      }
    } catch (error) {
      console.error('Reconnect failed:', error);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        await notificationService.notifyConnectionQuality('poor');
      }
    }
  }

  /**
   * Check if background fetch is available
   */
  async isBackgroundFetchAvailable(): Promise<boolean> {
    const status = await BackgroundFetch.getStatusAsync();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
  }

  /**
   * Manually trigger connection health check
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      const { status } = useVPNStore.getState();
      
      if (status !== 'connected') {
        return false;
      }

      return await vpnConnectionService.checkConnectionHealth();
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get current network information
   */
  async getNetworkInfo() {
    return await NetInfo.fetch();
  }
}

// Export singleton instance
export default BackgroundMonitor.getInstance();
