/**
 * Security & Threat Detection Types
 */

export interface SecurityDashboard {
  securityScore: number; // 0-100
  activeThreats: number;
  blockedToday: number;
  protectedData: number; // bytes
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  lastScan: Date;
  recommendations: SecurityRecommendation[];
  
  // Protection features
  killSwitch: boolean;
  dnsLeakProtection: boolean;
  ipv6Protection: boolean;
  autoConnect: boolean;
  
  // Threat stats
  threatsBlocked: number;
  maliciousSitesBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  
  // Split tunneling
  splitTunnelApps: string[];
  
  // Last scan
  lastSecurityScan: Date | null;
}

export interface SecurityRecommendation {
  id: string;
  type: 'killswitch' | 'dns' | 'protocol' | 'auto-connect' | 'biometric';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: () => void;
}

export interface ThreatAnalytics {
  totalBlocked: number;
  byType: {
    malware: number;
    tracker: number;
    phishing: number;
    ads: number;
  };
  topThreats: Array<{
    domain: string;
    count: number;
    lastSeen: Date;
  }>;
  timeline: Array<{
    date: Date;
    count: number;
  }>;
}

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  requireOnConnect: boolean;
  requireOnLaunch: boolean;
  lockTimeout: number; // minutes
}
