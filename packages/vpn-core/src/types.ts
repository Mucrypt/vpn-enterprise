export interface VPNClient {
  id: string;
  name: string;
  publicKey: string;
  ipAddress: string;
  createdAt: Date;
  isActive: boolean;
  dataUsage: number;
}

export interface VPNServer {
  id: string;
  name: string;
  host: string;
  country: string;
  publicKey: string;
  load: number;
  isActive: boolean;
  clientCount: number;
}

export interface ConnectionInfo {
  userId: string;
  serverId: string;
  deviceId?: string;
  ipAddress?: string;
}
