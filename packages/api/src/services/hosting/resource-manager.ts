// packages/api/src/services/hosting/resource-manager.ts
import type { HostedService } from '@vpn-enterprise/database';
import { HostingPlanRepository } from '@vpn-enterprise/database';

export class ResourceManager {
  private allocatedResources = new Map<string, ResourceAllocation>();

  async allocateResources(service: HostedService): Promise<ResourceAllocation> {
    const plan = await this.getPlan(service.plan_id);
    
    const allocation: ResourceAllocation = {
      serviceId: service.id,
      cpu: plan.resources.cpu,
      memory: this.parseMemory(plan.resources.memory),
      storage: plan.storage_gb * 1024 * 1024 * 1024, // Convert to bytes
      bandwidth: plan.bandwidth_gb ? plan.bandwidth_gb * 1024 * 1024 * 1024 : null,
    };

    this.allocatedResources.set(service.id, allocation);
    
    // Create DNS records if domain is provided
    if (service.domain) {
      await this.createDnsRecords(service);
    }

    return allocation;
  }

  private async getPlan(planId: string): Promise<any> {
    const plans = await HostingPlanRepository.list();
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error(`Hosting plan not found: ${planId}`);
    return plan;
  }

  async enforceLimits(): Promise<void> {
    for (const [serviceId, allocation] of this.allocatedResources) {
      const usage = await this.getResourceUsage(serviceId);
      
      if (usage.cpu > allocation.cpu * 1.1) {
        await this.throttleService(serviceId, 'cpu');
      }
      
      if (usage.memory > allocation.memory * 1.1) {
        await this.restartService(serviceId);
      }
      
      if (allocation.bandwidth && usage.bandwidth > allocation.bandwidth) {
        await this.suspendService(serviceId);
      }
    }
  }

  private async getResourceUsage(serviceId: string): Promise<ResourceUsage> {
    // Implement resource usage monitoring
    // This would integrate with your monitoring system
    return {
      cpu: 0,
      memory: 0,
      storage: 0,
      bandwidth: 0,
    };
  }

  private parseMemory(memoryString: string): number {
    const units: Record<'KB'|'MB'|'GB', number> = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = memoryString.match(/^(\d+)(KB|MB|GB)$/);
    if (!match) throw new Error(`Invalid memory format: ${memoryString}`);
    
    const [, value, unit] = match as unknown as [string, string, 'KB'|'MB'|'GB'];
    return parseInt(value) * units[unit];
  }

  private async createDnsRecords(service: HostedService): Promise<void> {
    // Integrate with DNS provider (Cloudflare, AWS Route53, etc.)
    console.log(`Creating DNS records for ${service.domain}`);
  }

  private async throttleService(serviceId: string, resource: string): Promise<void> {
    console.log(`Throttling ${resource} usage for service ${serviceId}`);
  }

  private async restartService(serviceId: string): Promise<void> {
    console.log(`Restarting service ${serviceId} due to memory overuse`);
  }

  private async suspendService(serviceId: string): Promise<void> {
    console.log(`Suspending service ${serviceId} due to bandwidth overuse`);
  }
}

interface ResourceAllocation {
  serviceId: string;
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number | null;
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
}