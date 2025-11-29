// packages/api/src/routes/hosting.ts
import { Router } from 'express';
import { AuthRequest, authMiddleware, adminMiddleware } from '@vpn-enterprise/auth';
import { HostingPlanRepository, HostedServiceRepository, HostingNodeRepository, ServiceAttestationRepository, EdgeDistributionRepository } from '@vpn-enterprise/database';
import { TemplateManager } from '../services/hosting/template-manager';
import { WordPressHosting } from '../services/hosting/wordpress-setup';
import { GameServerHosting } from '../services/hosting/game-server-setup';
import { DiscordBotHosting } from '../services/hosting/discord-bot-setup';
import { ResourceManager } from '../services/hosting/resource-manager';
import { DeploymentOrchestrator } from '../services/hosting/deployment-orchestrator';
import crypto from 'crypto';

const router = Router();
const templateManager = new TemplateManager();
const resourceManager = new ResourceManager();

// Register templates
templateManager.registerTemplate('wordpress', new WordPressHosting());
templateManager.registerTemplate('woocommerce', new WordPressHosting());
templateManager.registerTemplate('minecraft', new GameServerHosting());
templateManager.registerTemplate('counter-strike', new GameServerHosting());
templateManager.registerTemplate('discord-bot', new DiscordBotHosting());

// Get available hosting plans
router.get('/plans', async (req, res) => {
  try {
    const { type } = req.query;
    const plans = await HostingPlanRepository.list(type as string);
    res.json({ plans });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new hosting service
router.post('/services', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { plan_id, name, domain, config } = req.body;
    const userId = req.user!.id;

    // Create service record
    const service = await HostedServiceRepository.create({
        user_id: userId,
        plan_id,
        name,
        domain,
        config,
        status: 'creating',
        id: '',
        resource_usage: {
            cpu: 0,
            memory: 0,
            storage: 0,
            bandwidth: 0
        },
        created_at: '',
        updated_at: ''
    });

    // Allocate resources
    await resourceManager.allocateResources(service);

    // Deploy service
    const deployment = await templateManager.createService(service);

    res.json({ service, deployment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's hosting services
router.get('/services', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const services = await HostedServiceRepository.listByUser(userId);
    res.json({ services });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get service details
router.get('/services/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete hosting service
router.delete('/services/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await templateManager.deleteService(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hosting stats for current user
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const services = await HostedServiceRepository.listByUser(userId);

    const totalServices = services.length;
    const activeServices = services.filter((s: any) => s.status === 'active').length;
    const totals = services.reduce(
      (acc: any, s: any) => {
        const usage = s.resource_usage || {};
        acc.totalStorage += Number(usage.storage || 0);
        acc.bandwidthUsed += Number(usage.bandwidth || 0);
        return acc;
      },
      { totalStorage: 0, bandwidthUsed: 0 }
    );

    res.json({
      totalServices,
      activeServices,
      totalStorage: totals.totalStorage,
      bandwidthUsed: totals.bandwidthUsed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Control actions: start/stop/restart/backup
router.post('/services/:id/start', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.start(service);
    res.json({ message: 'Service start initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/services/:id/stop', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.stop(service);
    res.json({ message: 'Service stop initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/services/:id/restart', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.restart(service);
    res.json({ message: 'Service restart initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/services/:id/backup', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const orchestrator = new DeploymentOrchestrator();
    const backupId = await orchestrator.backup(service);
    res.json({ message: 'Backup initiated', backupId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Decentralized Hosting (MVP stubs) ====================
// List registered edge nodes (stubbed)
router.get('/network/nodes', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const nodes = await HostingNodeRepository.list();
    res.json({ nodes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: upsert a node
router.post('/network/nodes', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id, name, region, capabilities = [], public_key, status = 'healthy' } = req.body || {};
    if (!id || !name || !region) {
      return res.status(400).json({ error: 'id, name and region are required' });
    }
    await HostingNodeRepository.upsert({ id, name, region, capabilities, public_key, status });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: delete a node
router.delete('/network/nodes/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    await HostingNodeRepository.delete(req.params.id);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a simple service attestation (hash + id)
router.post('/services/:id/attest', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const payload = JSON.stringify({ service_id: service.id, ts: Date.now(), action: 'attest' });
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const attestationId = `attest_${service.id}_${Date.now()}`;

    await ServiceAttestationRepository.create({
      id: attestationId,
      service_id: service.id,
      type: 'attest',
      hash,
      signer: req.user!.id,
    });

    res.json({ attestationId, hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List attestations for a service
router.get('/services/:id/attestations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const attestations = await ServiceAttestationRepository.listByService(service.id);
    res.json({ attestations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record intent to distribute workload to edge nodes
router.post('/services/:id/distribute', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const { regions = ['us-east', 'eu-west'], artifact_hash } = req.body || {};
    const distributionId = `dist_${service.id}_${Date.now()}`;

    await EdgeDistributionRepository.create({
      id: distributionId,
      service_id: service.id,
      target_regions: regions,
      artifact_hash,
    });

    res.json({ distributionId, regions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as hostingRouter };