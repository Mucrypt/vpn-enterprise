import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger, transports, format } from 'winston';

const execAsync = promisify(exec);

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

export class VPNServerManager {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/vpn-server.log' }),
        new transports.Console()
      ]
    });
  }

  async createClient(clientName: string, serverId?: string): Promise<VPNClient> {
    try {
      this.logger.info(`Creating VPN client: ${clientName}`);

      // Generate client keys
      const { stdout: privateKey } = await execAsync('wg genkey');
      const { stdout: publicKey } = await execAsync(`echo "${privateKey.trim()}" | wg pubkey`);

      // Get next available IP
      const ipAddress = await this.getNextClientIP();

      // Create client configuration
      const serverPublicKey = await this.getServerPublicKey();
      const clientConfig = this.generateClientConfig(
        privateKey.trim(),
        ipAddress,
        serverPublicKey
      );

      // Save client configuration
      await this.saveClientConfig(clientName, clientConfig);

      // Add client to WireGuard
      await this.addClientToServer(publicKey.trim(), ipAddress);

      const client: VPNClient = {
        id: this.generateId(),
        name: clientName,
        publicKey: publicKey.trim(),
        ipAddress,
        createdAt: new Date(),
        isActive: true,
        dataUsage: 0
      };

      this.logger.info(`VPN client created successfully: ${clientName}`);
      return client;

    } catch (error) {
      this.logger.error(`Failed to create VPN client: ${error}`);
      throw error;
    }
  }

  async getServerStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync('sudo wg show');
      const { stdout: publicKey } = await execAsync('sudo cat /etc/wireguard/public.key');
      
      return {
        status: 'running',
        serverPublicKey: publicKey.trim(),
        connections: stdout,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get server status: ${error}`);
      throw error;
    }
  }

  async listClients(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('sudo ls /etc/wireguard/clients/ || echo ""');
      return stdout.split('\n')
        .filter(file => file.endsWith('.conf'))
        .map(file => file.replace('.conf', ''));
    } catch (error) {
      this.logger.error(`Failed to list clients: ${error}`);
      return [];
    }
  }

  async removeClient(clientName: string): Promise<void> {
    try {
      this.logger.info(`Removing VPN client: ${clientName}`);

      // Get client public key from config
      const configPath = `/etc/wireguard/clients/${clientName}.conf`;
      const { stdout: config } = await execAsync(`sudo cat ${configPath}`);
      const privateKeyMatch = config.match(/PrivateKey\s*=\s*([^\s]+)/);
      
      if (!privateKeyMatch) {
        throw new Error('Could not find private key in client config');
      }

      const privateKey = privateKeyMatch[1];
      const { stdout: publicKey } = await execAsync(`echo "${privateKey}" | wg pubkey`);

      // Remove client from WireGuard
      await execAsync(`sudo wg set wg0 peer ${publicKey.trim()} remove`);

      // Remove config file
      await execAsync(`sudo rm ${configPath}`);

      // Save configuration
      await execAsync('sudo wg-quick save wg0');

      this.logger.info(`VPN client removed successfully: ${clientName}`);

    } catch (error) {
      this.logger.error(`Failed to remove VPN client: ${error}`);
      throw error;
    }
  }

  private async getNextClientIP(): Promise<string> {
    const clients = await this.listClients();
    return `10.0.0.${clients.length + 2}`;
  }

  private async getServerPublicKey(): Promise<string> {
    const { stdout } = await execAsync('sudo cat /etc/wireguard/public.key');
    return stdout.trim();
  }

  private generateClientConfig(privateKey: string, ipAddress: string, serverPublicKey: string): string {
    const publicIP = 'YOUR_SERVER_PUBLIC_IP'; // Will be set from environment
    return `[Interface]
PrivateKey = ${privateKey}
Address = ${ipAddress}/32
DNS = 8.8.8.8, 1.1.1.1

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${publicIP}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
  }

  private async saveClientConfig(clientName: string, config: string): Promise<void> {
    const configPath = `/etc/wireguard/clients/${clientName}.conf`;
    await execAsync(`echo "${config}" | sudo tee ${configPath}`);
    await execAsync(`sudo chmod 600 ${configPath}`);
  }

  private async addClientToServer(publicKey: string, ipAddress: string): Promise<void> {
    await execAsync(`sudo wg set wg0 peer ${publicKey} allowed-ips ${ipAddress}/32`);
    await execAsync('sudo wg-quick save wg0');
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}