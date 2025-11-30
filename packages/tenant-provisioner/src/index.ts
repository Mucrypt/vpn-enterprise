import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Pool } from 'pg';
import Redis from 'ioredis';
import Bull from 'bull';
import winston from 'winston';
import Docker from 'dockerode';
import { TenantProvisioningService } from './services/tenant-provisioning-service';
import { ResourceLimitService } from './services/resource-limit-service';
import { TenantSecurityService } from './services/tenant-security-service';

// ==============================================
// TENANT PROVISIONER SERVICE
// Handles creation, scaling, and management of tenant databases
// ==============================================

class TenantProvisioner {
  private app: express.Application;
  private pgPool!: Pool;
  private redis!: Redis;
  private docker!: Docker;
  private logger!: winston.Logger;
  private provisioningQueue!: Bull.Queue;
  private tenantProvisioningService!: TenantProvisioningService;
  private resourceLimitService!: ResourceLimitService;
  private tenantSecurityService!: TenantSecurityService;

  constructor() {
    this.app = express();
    this.setupLogger();
    this.setupDatabase();
    this.setupRedis();
    this.setupDocker();
    this.setupQueue();
    this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupQueueProcessors();
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
        new winston.transports.File({ filename: '/app/logs/provisioner.log' })
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
      max: 20
    });
  }

  private setupRedis() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  private setupDocker() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock'
    });
  }

  private setupQueue() {
    this.provisioningQueue = new Bull('tenant provisioning', {
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    });
  }

  private setupServices() {
    this.tenantProvisioningService = new TenantProvisioningService(
      this.pgPool, 
      this.docker, 
      this.logger
    );
    this.resourceLimitService = new ResourceLimitService(this.pgPool, this.logger);
    this.tenantSecurityService = new TenantSecurityService(this.pgPool, this.logger);
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
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
          redis: 'connected',
          docker: 'connected'
        }
      });
    });

    // Tenant provisioning
    this.app.post('/tenants', async (req, res) => {
      try {
        const { organizationId, name, plan = 'free', options = {} } = req.body;

        // Validate input
        if (!organizationId || !name) {
          return res.status(400).json({ error: 'Organization ID and name are required' });
        }

        // Add to provisioning queue
        const job = await this.provisioningQueue.add('provision-tenant', {
          organizationId,
          name,
          plan,
          options
        });

        res.json({
          success: true,
          jobId: job.id,
          message: 'Tenant provisioning started'
        });

      } catch (error) {
        this.logger.error('Tenant provisioning request failed:', error);
        res.status(500).json({ error: 'Failed to start tenant provisioning' });
      }
    });

    // Get tenant status
    this.app.get('/tenants/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const tenant = await this.tenantProvisioningService.getTenantStatus(tenantId);
        
        if (!tenant) {
          return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json({ tenant });
      } catch (error) {
        this.logger.error('Failed to get tenant status:', error);
        res.status(500).json({ error: 'Failed to get tenant status' });
      }
    });

    // Scale tenant resources
    this.app.post('/tenants/:tenantId/scale', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { plan, resources } = req.body;

        const job = await this.provisioningQueue.add('scale-tenant', {
          tenantId,
          plan,
          resources
        });

        res.json({
          success: true,
          jobId: job.id,
          message: 'Tenant scaling started'
        });

      } catch (error) {
        this.logger.error('Tenant scaling request failed:', error);
        res.status(500).json({ error: 'Failed to start tenant scaling' });
      }
    });

    // Delete tenant
    this.app.delete('/tenants/:tenantId', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { confirmDestruction } = req.body;

        if (!confirmDestruction) {
          return res.status(400).json({ 
            error: 'Confirmation required', 
            message: 'Set confirmDestruction: true to proceed' 
          });
        }

        const job = await this.provisioningQueue.add('destroy-tenant', {
          tenantId,
          confirmDestruction: true
        });

        res.json({
          success: true,
          jobId: job.id,
          message: 'Tenant destruction started'
        });

      } catch (error) {
        this.logger.error('Tenant destruction request failed:', error);
        res.status(500).json({ error: 'Failed to start tenant destruction' });
      }
    });

    // Resource limits management
    this.app.post('/tenants/:tenantId/limits', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { limits } = req.body;

        await this.resourceLimitService.updateResourceLimits(tenantId, limits);
        
        res.json({
          success: true,
          message: 'Resource limits updated'
        });

      } catch (error) {
        this.logger.error('Failed to update resource limits:', error);
        res.status(500).json({ error: 'Failed to update resource limits' });
      }
    });

    // Security settings
    this.app.post('/tenants/:tenantId/security', async (req, res) => {
      try {
        const { tenantId } = req.params;
        const { securityConfig } = req.body;

        await this.tenantSecurityService.updateSecurityConfig(tenantId, securityConfig);
        
        res.json({
          success: true,
          message: 'Security configuration updated'
        });

      } catch (error) {
        this.logger.error('Failed to update security config:', error);
        res.status(500).json({ error: 'Failed to update security configuration' });
      }
    });

    // Job status
    this.app.get('/jobs/:jobId', async (req, res) => {
      try {
        const { jobId } = req.params;
        const job = await this.provisioningQueue.getJob(jobId);
        
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        res.json({
          id: job.id,
          data: job.data,
          progress: job.progress(),
          state: await job.getState(),
          createdAt: job.timestamp,
          processedAt: job.processedOn,
          finishedAt: job.finishedOn,
          failedReason: job.failedReason
        });

      } catch (error) {
        this.logger.error('Failed to get job status:', error);
        res.status(500).json({ error: 'Failed to get job status' });
      }
    });
  }

  private setupQueueProcessors() {
    // Tenant provisioning processor
    this.provisioningQueue.process('provision-tenant', 5, async (job: Bull.Job) => {
      const { organizationId, name, plan, options } = job.data;
      
      job.progress(10);
      this.logger.info(`Starting tenant provisioning: ${name} for org ${organizationId}`);

      try {
        const tenant = await this.tenantProvisioningService.createTenant(
          organizationId,
          name,
          plan,
          options
        );

        job.progress(50);
        
        // Set up security
        await this.tenantSecurityService.setupTenantSecurity(tenant.id);
        
        job.progress(80);
        
        // Apply resource limits
        await this.resourceLimitService.applyResourceLimits(tenant.id, plan);
        
        job.progress(100);
        
        this.logger.info(`Tenant provisioning completed: ${tenant.id}`);
        return { tenantId: tenant.id, status: 'provisioned' };

      } catch (error) {
        this.logger.error(`Tenant provisioning failed: ${name}`, error);
        throw error;
      }
    });

    // Tenant scaling processor
    this.provisioningQueue.process('scale-tenant', 3, async (job: Bull.Job) => {
      const { tenantId, plan, resources } = job.data;
      
      job.progress(20);
      this.logger.info(`Starting tenant scaling: ${tenantId}`);

      try {
        await this.tenantProvisioningService.scaleTenant(tenantId, plan, resources);
        
        job.progress(60);
        
        // Update resource limits
        await this.resourceLimitService.applyResourceLimits(tenantId, plan);
        
        job.progress(100);
        
        this.logger.info(`Tenant scaling completed: ${tenantId}`);
        return { tenantId, status: 'scaled' };

      } catch (error) {
        this.logger.error(`Tenant scaling failed: ${tenantId}`, error);
        throw error;
      }
    });

    // Tenant destruction processor
    this.provisioningQueue.process('destroy-tenant', 1, async (job: Bull.Job) => {
      const { tenantId, confirmDestruction } = job.data;
      
      if (!confirmDestruction) {
        throw new Error('Destruction not confirmed');
      }

      job.progress(20);
      this.logger.info(`Starting tenant destruction: ${tenantId}`);

      try {
        await this.tenantProvisioningService.destroyTenant(tenantId);
        
        job.progress(100);
        
        this.logger.info(`Tenant destruction completed: ${tenantId}`);
        return { tenantId, status: 'destroyed' };

      } catch (error) {
        this.logger.error(`Tenant destruction failed: ${tenantId}`, error);
        throw error;
      }
    });
  }

  public async start() {
    const port = process.env.PORT || 3003;
    
    this.app.listen(port, () => {
      this.logger.info(`Tenant Provisioner Service started on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Tenant Provisioner Service...');
      await this.provisioningQueue.close();
      await this.pgPool.end();
      await this.redis.quit();
      process.exit(0);
    });
  }
}

// Start the service
const provisioner = new TenantProvisioner();
provisioner.start().catch(error => {
  console.error('Failed to start Tenant Provisioner Service:', error);
  process.exit(1);
});