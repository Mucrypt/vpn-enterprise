/**
 * VPN Enterprise API Client
 * Connects to the backend API for all VPN operations
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Server, VPNConnection, UserDevice, UserStats } from '@/src/types/vpn';
import { SecurityDashboard, ThreatAnalytics } from '@/src/types/security';

// Use your computer's local IP for development (find with `ifconfig` or `ipconfig`)
// For production, this should be your actual API endpoint
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api/v1' // Android emulator
  : 'https://api.vpnenterprise.com/api/v1';

class VPNEnterpriseAPI {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear auth
          this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAuth() {
    this.accessToken = null;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    this.setAccessToken(data.access_token);
    return data;
  }

  async signup(email: string, password: string, fullName: string) {
    const { data } = await this.client.post('/auth/signup', { 
      email, 
      password, 
      full_name: fullName 
    });
    return data;
  }

  async logout() {
    this.clearAuth();
  }

  // ============================================
  // SERVERS
  // ============================================

  async getServers(): Promise<Server[]> {
    const { data } = await this.client.get('/servers');
    return data.servers || data;
  }

  async getServerById(id: string): Promise<Server> {
    const { data } = await this.client.get(`/servers/${id}`);
    return data;
  }

  async pingServer(serverId: string): Promise<number> {
    const start = Date.now();
    await this.client.get(`/servers/${serverId}/ping`);
    return Date.now() - start;
  }

  // ============================================
  // VPN CONNECTION
  // ============================================

  async connect(serverId: string): Promise<VPNConnection> {
    const { data } = await this.client.post('/vpn/connect', { 
      server_id: serverId 
    });
    return data;
  }

  async disconnect(connectionId: string): Promise<void> {
    await this.client.post('/vpn/disconnect', { 
      connection_id: connectionId 
    });
  }

  async getConnectionStatus(): Promise<VPNConnection | null> {
    const { data } = await this.client.get('/vpn/status');
    return data.connection || null;
  }

  async getConnectionHistory(limit: number = 50): Promise<VPNConnection[]> {
    const { data } = await this.client.get('/vpn/history', {
      params: { limit },
    });
    return data.connections || [];
  }

  // ============================================
  // USER & DEVICES
  // ============================================

  async getProfile() {
    const { data } = await this.client.get('/user/profile');
    return data;
  }

  async getDevices(): Promise<UserDevice[]> {
    const { data } = await this.client.get('/user/devices');
    return data.devices || [];
  }

  async registerDevice(deviceName: string, publicKey: string): Promise<UserDevice> {
    const { data } = await this.client.post('/user/devices', {
      name: deviceName,
      public_key: publicKey,
      platform: 'mobile',
    });
    return data;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.client.delete(`/user/devices/${deviceId}`);
  }

  // ============================================
  // ANALYTICS & STATS
  // ============================================

  async getUserStats(): Promise<UserStats> {
    const { data } = await this.client.get('/user/stats');
    return data;
  }

  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const { data } = await this.client.get('/security/dashboard');
    return data;
  }

  async getThreatAnalytics(days: number = 30): Promise<ThreatAnalytics> {
    const { data } = await this.client.get('/security/threats', {
      params: { days },
    });
    return data;
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  async getSubscription() {
    const { data } = await this.client.get('/user/subscription');
    return data;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const api = new VPNEnterpriseAPI();
export default api;
