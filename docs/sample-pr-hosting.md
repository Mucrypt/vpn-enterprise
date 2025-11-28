# Sample PR — Hosting Feature Slice

A minimal, repeatable pattern for adding a small hosting capability end-to-end (API + Web UI), suitable for pull requests.

## Goals
- Add a tiny API route under `packages/api` (TypeScript, Express)
- Cover with a minimal test or manual verification step
- Wire a small UI action in `apps/web-dashboard`

## Scope
- Feature: “Pause service” (no-op/stubbed) to demonstrate flow
- Endpoint: `POST /api/v1/hosting/services/:id/pause`
- UI: Button on service detail page

---

## 1) API — Route and Service Stub

File: `packages/api/src/routes/hosting.ts`

```ts
// Add near other control routes
router.post('/services/:id/pause', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const service = await HostedServiceRepository.getById(req.params.id);
    if (!service || service.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const orchestrator = new DeploymentOrchestrator();
    // Implement real pause later; stub for now
    await orchestrator.stop(service);
    res.json({ message: 'Service pause initiated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

Service methods are already available in `packages/api/src/services/hosting/deployment-orchestrator.ts` (e.g., `stop`).

---

## 2) API — Quick Verification

Run locally:
```bash
cd packages/api
npm run dev
```

Manual smoke test:
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/hosting/services/<serviceId>/pause
```
Expected: `{"message":"Service pause initiated"}`

For automated tests, add a minimal supertest case (optional):

File: `packages/api/test/hosting.pause.spec.ts`
```ts
import request from 'supertest';
import app from '../src/app';

// This example assumes a test harness that injects auth and repositories.
// If not available, keep manual smoke testing.

describe('Hosting pause route', () => {
  it('returns 404 for non-existent service', async () => {
    const res = await request(app)
      .post('/api/v1/hosting/services/does-not-exist/pause')
      .set('Authorization', 'Bearer test-token');
    expect([401, 404]).toContain(res.status);
  });
});
```

---

## 3) Web Client — Add Method

File: `apps/web-dashboard/lib/api.ts`
```ts
pauseHostingService(id: string) {
  return this.fetchAPI(`/hosting/services/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
  });
}
```

---

## 4) UI — Wire Button on Service Detail

File: `apps/web-dashboard/app/dashboard/hosting/services/[id]/page.tsx`
```tsx
<Button
  variant="outline"
  onClick={() => handleServiceAction('pause')}
  disabled={actionLoading !== null}
>
  Pause
</Button>
```

Extend the action handler:
```ts
case 'pause':
  await api.pauseHostingService(serviceId);
  toast.success('Service pause initiated');
  break;
```

---

## 5) PR Checklist
- API route added, compiles (`npm run dev` in `packages/api`)
- Manual curl or UI click returns 2xx and toast feedback
- Web client method present in `lib/api.ts`
- UI action visible and disabled when busy
- No secrets committed; envs documented if needed

---

## 6) Follow-ups (Optional)
- Replace stub with real pause/resume lifecycle in orchestrator
- Add role/permission checks beyond ownership if required
- E2E test: navigate dashboard → service → click Pause → assert response

This template keeps changes small, testable, and aligned with the repo structure. Copy it for the next feature slice (e.g., resume, scale, logs export).