/**
 * VPN Enterprise Mobile - Core Type Definitions
 * Revolutionary mobile VPN types beyond NordVPN
 */

export interface Server {
  id: string;
  name: string;
  location: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  load: number;
  maxClients: number;
  currentClients: number;
  endpoint: string;
  publicKey: string;
  status: 'online' | 'offline' | 'maintenance';
  ping: number | null;
  bandwidth: number;
  features: ServerFeature[];
  performanceScore: number; // AI-calculated performance score
  recommendationScore: number; // AI recommendation based on user habits
}

export type ServerFeature = 
  | 'streaming' 
  | 'p2p' 
  | 'double-vpn' 
  | 'tor-over-vpn' 
  | 'dedicated-ip' 
  | 'obfuscated';

export interface VPNConnection {
  id: string;
  serverId: string;
  status: ConnectionStatus;
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  bytesReceived: number;
  bytesSent: number;
  duration: number; // seconds
  protocol: 'wireguard' | 'openvpn';
  ipAddress: string | null;
  dnsServers: string[];
  killSwitchActive: boolean;
}

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnecting' 
  | 'error';

export interface ConnectionMetrics {
  downloadSpeed: number; // bytes per second
  uploadSpeed: number;
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  timestamp: Date;
}

export interface UserDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  publicKey: string;
  privateKey: string;
  ipAddress: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface SecuritySettings {
  killSwitchEnabled: boolean;
  autoConnectEnabled: boolean;
  biometricLockEnabled: boolean;
  dnsLeakProtectionEnabled: boolean;
  ipv6LeakProtectionEnabled: boolean;
  splitTunnelingEnabled: boolean;
  threatProtectionEnabled: boolean;
  cybersecEnabled: boolean;
}

export interface SplitTunnelRule {
  id: string;
  type: 'app' | 'domain' | 'ip';
  value: string;
  action: 'bypass' | 'tunnel';
  enabled: boolean;
}

export interface ThreatEvent {
  id: string;
  type: 'malware' | 'tracker' | 'phishing' | 'ads';
  domain: string;
  blockedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserStats {
  totalDataSaved: number; // bytes
  totalDataUsed: number; // bytes
  dataUploaded: number; // bytes
  dataDownloaded: number; // bytes
  threatsBlocked: number;
  countriesVisited: string[];
  totalConnections: number;
  totalConnectionTime: number; // seconds
  averageSessionDuration: number; // seconds
  averageSpeed: number; // Mbps
  peakSpeed: number; // Mbps
  averageLatency: number; // ms
  dataSaved: number; // bytes from compression
  securityScore: number; // 0-100
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date | null;
  progress: number; // Current progress
  maxProgress: number; // Target to unlock
}

export interface UserPreferences {
  autoConnect: boolean;
  autoSelectServer: boolean;
  preferredProtocol: 'wireguard' | 'openvpn';
  preferredCountries: string[];
  notificationsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  darkModeEnabled: boolean;
  dataUsageWarnings: boolean;
}

export interface AIRecommendation {
  serverId: string;
  score: number; // 0-100
  reason: 'low-latency' | 'high-bandwidth' | 'location' | 'habit' | 'streaming' | 'security';
  confidence: number; // 0-100
}
