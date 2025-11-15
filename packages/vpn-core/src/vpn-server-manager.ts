import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger, transports, format } from 'winston';
import fs from 'fs';
import path from 'path';

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
  private testMode: boolean;
  private wgDir: string;
  private publicIP: string;
  private interfaceName: string;
  private port: number;

  constructor(options: { testMode?: boolean; wgDir?: string; publicIP?: string; interfaceName?: string; port?: number } = {}) {
    const logDir = process.env.LOG_DIR || (process.env.VERCEL === '1' ? '/tmp/logs' : 'logs');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: path.join(logDir, 'vpn-server.log') }),
        new transports.Console()
      ]
    });
    this.testMode = !!options.testMode;
    this.wgDir = options.wgDir || process.env.WIREGUARD_DIR || '/etc/wireguard';
    this.publicIP = options.publicIP || process.env.WIREGUARD_PUBLIC_IP || 'YOUR_SERVER_PUBLIC_IP';
    this.interfaceName = options.interfaceName || process.env.WIREGUARD_INTERFACE || 'wg0';
    this.port = options.port || Number(process.env.WIREGUARD_PORT) || 51820;
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
  const configPath = `${this.wgDir}/clients/${clientName}.conf`;
  const { stdout: config } = await (this.testMode ? execAsync(`cat ${configPath} || echo ""`) : execAsync(`sudo cat ${configPath}`));
      const privateKeyMatch = config.match(/PrivateKey\s*=\s*([^\s]+)/);
      
      if (!privateKeyMatch) {
        throw new Error('Could not find private key in client config');
      }

      const privateKey = privateKeyMatch[1];
      const { stdout: publicKey } = await execAsync(`echo "${privateKey}" | wg pubkey`);

      // Remove client from WireGuard
      if (this.testMode) {
        this.logger.info(`(testMode) Would remove peer ${publicKey.trim()} from ${this.interfaceName}`);
        await execAsync(`rm -f ${configPath} || true`);
      } else {
        await execAsync(`sudo wg set ${this.interfaceName} peer ${publicKey.trim()} remove`);
        // Remove config file
        await execAsync(`sudo rm ${configPath}`);
        // Save configuration
        await execAsync('sudo wg-quick save ' + this.interfaceName);
      }

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

    public async getServerPublicKey(): Promise<string> {
    const keyPath = `${this.wgDir}/public.key`;
    const { stdout } = await (this.testMode ? execAsync(`cat ${keyPath} || echo ""`) : execAsync(`sudo cat ${keyPath}`));
    return stdout.trim();
  }

  private generateClientConfig(privateKey: string, ipAddress: string, serverPublicKey: string): string {
    const publicIP = this.publicIP; // configured on manager or via env
    return `[Interface]
PrivateKey = ${privateKey}
Address = ${ipAddress}/32
DNS = 8.8.8.8, 1.1.1.1

[Peer]
PublicKey = ${serverPublicKey}
Endpoint = ${publicIP}:${this.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
  }

  private async saveClientConfig(clientName: string, config: string): Promise<void> {
    const configPath = `${this.wgDir}/clients/${clientName}.conf`;
    if (this.testMode) {
      // ensure dir
      await execAsync(`mkdir -p ${this.wgDir}/clients`);
      await execAsync(`echo "${config}" > ${configPath}`);
      await execAsync(`chmod 600 ${configPath}`);
      this.logger.info(`(testMode) Saved client config to ${configPath}`);
    } else {
      await execAsync(`echo "${config}" | sudo tee ${configPath}`);
      await execAsync(`sudo chmod 600 ${configPath}`);
    }
  }

  private async addClientToServer(publicKey: string, ipAddress: string): Promise<void> {
    if (this.testMode) {
      this.logger.info(`(testMode) Would add peer ${publicKey} allowed-ips ${ipAddress}/32 to ${this.interfaceName}`);
    } else {
      await execAsync(`sudo wg set ${this.interfaceName} peer ${publicKey} allowed-ips ${ipAddress}/32`);
      await execAsync('sudo wg-quick save ' + this.interfaceName);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}