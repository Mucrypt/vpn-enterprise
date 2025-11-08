import { ConnectionRepository, DeviceRepository } from '@vpn-enterprise/database';
import { createLogger, transports, format } from 'winston';
import { ConnectionInfo } from './types';

export class ConnectionTracker {
  private logger;
  private activeConnections: Map<string, string> = new Map(); // userId -> connectionId

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({ filename: 'logs/connections.log' }),
        new transports.Console(),
      ],
    });
  }

  /**
   * Start tracking a new connection
   */
  async startConnection(connectionInfo: ConnectionInfo): Promise<string> {
    try {
      const connection = await ConnectionRepository.create({
        user_id: connectionInfo.userId,
        server_id: connectionInfo.serverId,
        device_id: connectionInfo.deviceId,
        status: 'connected',
        connected_at: new Date().toISOString(),
        ip_address: connectionInfo.ipAddress,
        data_uploaded_mb: 0,
        data_downloaded_mb: 0,
      });

      this.activeConnections.set(connectionInfo.userId, connection.id);

      // Update device last connected
      if (connectionInfo.deviceId) {
        await DeviceRepository.updateLastConnected(connectionInfo.deviceId);
      }

      this.logger.info('Connection started', {
        connectionId: connection.id,
        userId: connectionInfo.userId,
        serverId: connectionInfo.serverId,
      });

      return connection.id;
    } catch (error) {
      this.logger.error('Failed to start connection', { error, connectionInfo });
      throw error;
    }
  }

  /**
   * End a connection
   */
  async endConnection(userId: string, reason?: string): Promise<void> {
    try {
      const connectionId = this.activeConnections.get(userId);

      if (!connectionId) {
        this.logger.warn('No active connection found for user', { userId });
        return;
      }

      await ConnectionRepository.endConnection(connectionId, reason);
      this.activeConnections.delete(userId);

      this.logger.info('Connection ended', {
        connectionId,
        userId,
        reason,
      });
    } catch (error) {
      this.logger.error('Failed to end connection', { error, userId });
      throw error;
    }
  }

  /**
   * Update connection data usage
   */
  async updateDataUsage(
    userId: string,
    uploadedMb: number,
    downloadedMb: number
  ): Promise<void> {
    try {
      const connectionId = this.activeConnections.get(userId);

      if (!connectionId) {
        this.logger.warn('No active connection found for data update', { userId });
        return;
      }

      await ConnectionRepository.updateDataUsage(connectionId, uploadedMb, downloadedMb);

      this.logger.debug('Data usage updated', {
        connectionId,
        userId,
        uploadedMb,
        downloadedMb,
      });
    } catch (error) {
      this.logger.error('Failed to update data usage', { error, userId });
      throw error;
    }
  }

  /**
   * Get user's connection history
   */
  async getConnectionHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await ConnectionRepository.getUserHistory(userId, limit);
    } catch (error) {
      this.logger.error('Failed to get connection history', { error, userId });
      throw error;
    }
  }

  /**
   * Get user's active connections
   */
  async getActiveConnections(userId: string): Promise<any[]> {
    try {
      return await ConnectionRepository.getActiveConnections(userId);
    } catch (error) {
      this.logger.error('Failed to get active connections', { error, userId });
      throw error;
    }
  }

  /**
   * Get total data usage for user
   */
  async getUserDataUsage(userId: string): Promise<any> {
    try {
      return await ConnectionRepository.getUserDataUsage(userId);
    } catch (error) {
      this.logger.error('Failed to get user data usage', { error, userId });
      throw error;
    }
  }
}
