// packages/api/src/unified-data-api.ts
import type { Express, Request, Response } from 'express';

export class UnifiedDataAPI {
  constructor(private app: Express) {}

  initialize() {
    this.setupRESTEndpoints();
    // TODO: setup GraphQL + subscriptions
  }

  setupRESTEndpoints() {
    this.app.get('/api/v1/:tenantId/data/:table', this.handleRESTGet.bind(this));
    this.app.post('/api/v1/:tenantId/data/:table', this.handleRESTPost.bind(this));
    this.app.put('/api/v1/:tenantId/data/:table/:id', this.handleRESTPut.bind(this));
    this.app.delete('/api/v1/:tenantId/data/:table/:id', this.handleRESTDelete.bind(this));
    this.app.post('/api/v1/:tenantId/query', this.handleQuery.bind(this));
  }

  async handleRESTGet(req: Request, res: Response) {
    const { tenantId, table } = req.params as any;
    // TODO: route to appropriate manager based on table mapping
    res.json({ ok: true, tenantId, table });
  }
  async handleRESTPost(req: Request, res: Response) {
    res.json({ ok: true, route: 'POST', body: req.body });
  }
  async handleRESTPut(req: Request, res: Response) {
    res.json({ ok: true, route: 'PUT', params: req.params, body: req.body });
  }
  async handleRESTDelete(req: Request, res: Response) {
    res.json({ ok: true, route: 'DELETE', params: req.params });
  }
  async handleQuery(req: Request, res: Response) {
    const { tenantId } = req.params as any;
    const { sql, params } = req.body || {};
    res.json({ ok: true, tenantId, sql, params });
  }
}
