// Types for NexusAI Database Integration

export interface DatabaseInfo {
  tenantId: string
  database: string
  host: string
  port: number
  username: string
  password?: string
  connectionString: string
  status: 'provisioned' | 'exists'
}

export interface ProvisionDatabaseRequest {
  initialize_schema?: boolean
}

export interface ProvisionDatabaseResponse {
  database: DatabaseInfo
  connection_string: string
  schemas?: string[]
  message: string
  already_exists?: boolean
}

export interface GetDatabaseResponse {
  has_database: boolean
  database?: Partial<DatabaseInfo>
  connection_string?: string
  message?: string
}
