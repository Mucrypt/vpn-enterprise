import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import { Pool } from 'pg';
import Redis from 'ioredis';
import winston from 'winston';
import { BackupService } from './services/backup-service';
import { MetricsCollector } from './services/metrics-collector';
import { ResourceMonitor } from './services/resource-monitor';
import { CleanupService } from './services/cleanup-service';

// ==============================================
// DATABASE MANAGER SERVICE
// Core service for managing database platform operations
// ==============================================

class DatabaseManager {
  private app: express.Application;
  private pgPool!: Pool;
  private redis!: Redis;
  private logger!: winston.Logger;
  private backupService!: BackupService;
  private metricsCollector!: MetricsCollector;
  private resourceMonitor!: ResourceMonitor;
  private cleanupService!: CleanupService;

  constructor() {
    this.app = express();
    this.setupLogger();
    this.setupDatabase();
    this.setupRedis();
    this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCronJobs();
  }

  private setupLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: '/app/logs/db-manager.log' })
      ]
    });
  }

  private setupDatabase() {
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgres-primary',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  private setupRedis() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  private setupServices() {
    this.backupService = new BackupService(this.pgPool, this.logger);
    this.metricsCollector = new MetricsCollector(this.pgPool, this.redis, this.logger);
    this.resourceMonitor = new ResourceMonitor(this.pgPool, this.redis, this.logger);
    this.cleanupService = new CleanupService(this.pgPool, this.logger);
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected'
        }
      });
    });

    // Backup management
    this.app.post('/backups/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { type = 'full' } = req.body;

        const backupId = await this.backupService.createBackup(tenantId, type);
        
        res.json({
          success: true,
          backupId,
          message: 'Backup started successfully'
        });
      } catch (error) {
        this.logger.error('Backup creation failed:', error);
        res.status(500).json({ error: 'Backup creation failed' });
      }
    });

    this.app.get('/backups/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const backups = await this.backupService.getBackupHistory(tenantId);
        res.json({ backups });
      } catch (error) {
        this.logger.error('Failed to fetch backups:', error);
        res.status(500).json({ error: 'Failed to fetch backups' });
      }
    });

    this.app.post('/backups/:tenantId/restore/:backupId', async (req, res) => {
      try {
        const { tenantId, backupId } = req.params;
        await this.backupService.restoreBackup(tenantId, backupId);
        res.json({ success: true, message: 'Restore completed successfully' });
      } catch (error) {
        this.logger.error('Restore failed:', error);
        res.status(500).json({ error: 'Restore failed' });
      }
    });

    // Metrics and monitoring
    this.app.get('/metrics/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { period = '24h' } = req.query;
        
        const metrics = await this.metricsCollector.getTenantMetrics(tenantId, period as string);
        res.json({ metrics });
      } catch (error) {
        this.logger.error('Failed to fetch metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });

    this.app.get('/resources/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const resources = await this.resourceMonitor.getTenantResources(tenantId);
        res.json({ resources });
      } catch (error) {
        this.logger.error('Failed to fetch resources:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
      }
    });

    // System operations
    this.app.post('/cleanup', async (req, res) => {
      try {
        const result = await this.cleanupService.performCleanup();
        res.json({ success: true, result });
      } catch (error) {
        this.logger.error('Cleanup failed:', error);
        res.status(500).json({ error: 'Cleanup failed' });
      }
    });
  }

  private setupCronJobs() {
    // Daily backups at 2 AM
    cron.schedule('0 2 * * *', async () => {
      this.logger.info('Starting daily backup job');
      try {
        await this.backupService.performDailyBackups();
        this.logger.info('Daily backup job completed');
      } catch (error) {
        this.logger.error('Daily backup job failed:', error);
      }
    });

    // Hourly metrics collection
    cron.schedule('0 * * * *', async () => {
      try {
        await this.metricsCollector.collectAllMetrics();
        this.logger.info('Metrics collection completed');
      } catch (error) {
        this.logger.error('Metrics collection failed:', error);
      }
    });

    // Resource monitoring every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.resourceMonitor.checkAllResources();
      } catch (error) {
        this.logger.error('Resource monitoring failed:', error);
      }
    });

    // Weekly cleanup on Sundays at 4 AM
    cron.schedule('0 4 * * 0', async () => {
      this.logger.info('Starting weekly cleanup job');
      try {
        await this.cleanupService.performCleanup();
        this.logger.info('Weekly cleanup job completed');
      } catch (error) {
        this.logger.error('Weekly cleanup job failed:', error);
      }
    });
  }

  public async start() {
    const port = process.env.PORT || 3002;
    
    this.app.listen(port, () => {
      this.logger.info(`Database Manager Service started on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Database Manager Service...');
      await this.pgPool.end();
      await this.redis.quit();
      process.exit(0);
    });
  }
}

// Start the service
const dbManager = new DatabaseManager();
dbManager.start().catch(error => {
  console.error('Failed to start Database Manager Service:', error);
  process.exit(1);
});