import { Router } from 'express'
import { tenantUuidGuard } from './tenants/guards'
import { registerTenantsRootRoutes } from './tenants/root'
import { registerTenantAssociationRoutes } from './tenants/associations'
import { registerTenantMemberBootstrapRoutes } from './tenants/members'
import { registerTenantDatabaseRoutes } from './tenants/databases'
import { registerTenantTableDataRoutes } from './tenants/table-data'
import { registerTenantTableStructureRoutes } from './tenants/table-structure'
import { registerTenantColumnsRoutes } from './tenants/columns'
import { registerTenantSchemaRoutes } from './tenants/schemas'
import { registerTenantQueryRoutes } from './tenants/query'

export const tenantsRouter = Router()

registerTenantsRootRoutes(tenantsRouter)
registerTenantAssociationRoutes(tenantsRouter)
registerTenantMemberBootstrapRoutes(tenantsRouter)

// Apply auth + tenant membership checks to any UUID tenant route.
// NOTE: We intentionally avoid regex route params here because the
// router/path-to-regexp version in this repo rejects them.
// Non-UUID tenantId values are ignored by `tenantUuidGuard`.
tenantsRouter.use('/:tenantId', tenantUuidGuard)

registerTenantDatabaseRoutes(tenantsRouter)
registerTenantTableDataRoutes(tenantsRouter)
registerTenantTableStructureRoutes(tenantsRouter)
registerTenantColumnsRoutes(tenantsRouter)
registerTenantSchemaRoutes(tenantsRouter)
registerTenantQueryRoutes(tenantsRouter)
