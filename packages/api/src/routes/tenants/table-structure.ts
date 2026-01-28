import type { Router } from 'express'
import { requireTenantEditor } from './guards'
import {
  getTableStructure,
  updateTableStructure,
} from '../../controllers/tableStructureController'

export function registerTenantTableStructureRoutes(router: Router) {
  router.get(
    '/:tenantId/tables/:schema.:tableName/structure',
    getTableStructure,
  )
  router.put(
    '/:tenantId/tables/:schema.:tableName/structure',
    ...requireTenantEditor,
    updateTableStructure,
  )
}
