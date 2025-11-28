// packages/api/src/services/hosting/template-manager.ts
import type { HostedService, ServiceDeployment } from '@vpn-enterprise/database';

export type ResourceRequirements = {
  cpu: number;
  memory: string; // e.g., '512MB'
  storage: string; // e.g., '10GB'
  databases?: number;
};

export class TemplateManager {
  private templates = new Map<string, ServiceTemplate>();

  registerTemplate(type: string, template: ServiceTemplate) {
    this.templates.set(type, template);
  }

  async createService(service: HostedService): Promise<ServiceDeployment> {
    const template = this.templates.get(service.config.type);
    if (!template) {
      throw new Error(`Unsupported service type: ${service.config.type}`);
    }

    return await template.setup(service);
  }

  async deleteService(serviceId: string): Promise<void> {
    // Implementation for service deletion
  }

  async backupService(serviceId: string): Promise<string> {
    // Implementation for backups
    return `backup_${serviceId}_${Date.now()}`;
  }
}

export interface ServiceTemplate {
  setup(service: HostedService): Promise<ServiceDeployment>;
  validateConfig(config: any): boolean;
  getResourceRequirements(): ResourceRequirements;
}