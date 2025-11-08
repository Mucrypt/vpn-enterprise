/**
 * Custom React Hooks for VPN Enterprise Mobile
 */

import { useState, useEffect, useCallback } from 'react';
import { useVPNStore, useServersStore } from '@/src/store';
import { vpnService } from '@/src/services/vpn/VPNConnectionService';
import { serverRecommender } from '@/src/services/ai/ServerRecommender';
import { Server, ConnectionStatus } from '@/src/types/vpn';
import { api } from '@/src/services/api/VPNEnterpriseAPI';

/**
 * Hook for managing VPN connection
 */
export function useVPNConnection() {
  const { connection, status, currentServer, metrics } = useVPNStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (server: Server) => {
    try {
      setIsConnecting(true);
      setError(null);
      await vpnService.connect(server);
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await vpnService.disconnect();
    } catch (err: any) {
      setError(err.message || 'Disconnect failed');
      throw err;
    }
  }, []);

  const quickConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await vpnService.quickConnect();
    } catch (err: any) {
      setError(err.message || 'Quick connect failed');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const reconnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await vpnService.reconnect();
    } catch (err: any) {
      setError(err.message || 'Reconnect failed');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    connection,
    status,
    currentServer,
    metrics,
    isConnecting,
    error,
    connect,
    disconnect,
    quickConnect,
    reconnect,
    isConnected: status === 'connected',
  };
}

/**
 * Hook for server optimization and recommendations
 */
export function useServerOptimization() {
  const { servers, recommendedServer } = useServersStore();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const optimizeServerSelection = useCallback(async (purpose?: string) => {
    setIsOptimizing(true);
    try {
      const server = await serverRecommender.getRecommendedServer(purpose);
      return server;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const getTopRecommendations = useCallback(async (count: number = 3) => {
    const recs = await serverRecommender.getTopRecommendations(count);
    setRecommendations(recs);
    return recs;
  }, []);

  return {
    servers,
    recommendedServer,
    recommendations,
    isOptimizing,
    optimizeServerSelection,
    getTopRecommendations,
  };
}

/**
 * Hook for loading servers
 */
export function useServers() {
  const { servers, setServers } = useServersStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getServers();
      setServers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load servers');
    } finally {
      setIsLoading(false);
    }
  }, [setServers]);

  useEffect(() => {
    if (servers.length === 0) {
      loadServers();
    }
  }, []);

  return {
    servers,
    isLoading,
    error,
    reload: loadServers,
  };
}

/**
 * Hook for formatting bytes to human-readable format
 */
export function useFormatBytes() {
  return useCallback((bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }, []);
}

/**
 * Hook for formatting speed (bytes per second)
 */
export function useFormatSpeed() {
  const formatBytes = useFormatBytes();
  
  return useCallback((bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
  }, [formatBytes]);
}

/**
 * Hook for formatting duration
 */
export function useFormatDuration() {
  return useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);
}
