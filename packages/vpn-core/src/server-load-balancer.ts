import { ServerRepository } from '@vpn-enterprise/database';
import { createLogger, transports, format } from 'winston';
import fs from 'fs';
import path from 'path';

export class ServerLoadBalancer {
  private logger;

  constructor() {
    const logDir = process.env.LOG_DIR || (process.env.VERCEL === '1' ? '/tmp/logs' : 'logs');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({ filename: path.join(logDir, 'load-balancer.log') }),
        new transports.Console(),
      ],
    });
  }

  /**
   * Get the best available server based on load
   */
  async getBestServer(countryCode?: string): Promise<any> {
    try {
      const server = await ServerRepository.getBestAvailable(countryCode);

      if (!server) {
        this.logger.warn('No available servers found', { countryCode });
        throw new Error('No available servers');
      }

      this.logger.info('Selected best server', {
        serverId: server.id,
        serverName: server.name,
        load: server.load,
      });

      return server;
    } catch (error) {
      this.logger.error('Failed to get best server', { error });
      throw error;
    }
  }

  /**
   * Get all servers sorted by load
   */
  async getAllServersByLoad(): Promise<any[]> {
    try {
      const servers = await ServerRepository.getAllActive();
      return servers.sort((a, b) => a.load - b.load);
    } catch (error) {
      this.logger.error('Failed to get servers', { error });
      throw error;
    }
  }

  /**
   * Get servers by country
   */
  async getServersByCountry(countryCode: string): Promise<any[]> {
    try {
      return await ServerRepository.getByCountry(countryCode);
    } catch (error) {
      this.logger.error('Failed to get servers by country', { error, countryCode });
      throw error;
    }
  }

  /**
   * Update server load
   */
  async updateServerLoad(serverId: string, load: number): Promise<void> {
    try {
      await ServerRepository.updateLoad(serverId, load);
      this.logger.info('Updated server load', { serverId, load });
    } catch (error) {
      this.logger.error('Failed to update server load', { error, serverId });
      throw error;
    }
  }
}
