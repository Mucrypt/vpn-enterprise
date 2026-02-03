/**
 * Schema Extractor Service
 * Analyzes AI-generated app code and extracts database schema requirements
 * Converts TypeScript/JavaScript models into SQL CREATE TABLE statements
 */

interface TableColumn {
  name: string
  type: string
  nullable: boolean
  primary?: boolean
  unique?: boolean
  references?: { table: string; column: string }
  defaultValue?: string
}

interface TableSchema {
  name: string
  columns: TableColumn[]
  indexes?: string[]
  timestamps?: boolean
}

export class SchemaExtractor {
  /**
   * Extract database schema from app files
   */
  extractSchema(
    files: Array<{ file_path: string; content: string; language: string }>,
  ): {
    tables: TableSchema[]
    relationships: string[]
  } {
    const tables: TableSchema[] = []
    const relationships: string[] = []

    for (const file of files) {
      // Extract Prisma schema
      if (
        file.file_path.includes('prisma') ||
        file.file_path.includes('.prisma')
      ) {
        const prismaSchema = this.parsePrismaSchema(file.content)
        tables.push(...prismaSchema.tables)
        relationships.push(...prismaSchema.relationships)
      }

      // Extract TypeORM entities
      if (this.isTypeORMEntity(file.content)) {
        const entity = this.parseTypeORMEntity(file.content)
        if (entity) tables.push(entity)
      }

      // Extract Mongoose schemas
      if (this.isMongooseSchema(file.content)) {
        const schema = this.parseMongooseSchema(file.content)
        if (schema) tables.push(schema)
      }
    }

    // If no explicit models found, generate from app type
    if (tables.length === 0) {
      tables.push(...this.generateDefaultTables(files))
    }

    return { tables, relationships }
  }

  /**
   * Convert extracted schema to PostgreSQL SQL
   */
  generateSQL(schema: {
    tables: TableSchema[]
    relationships: string[]
  }): string {
    const sqlStatements: string[] = []

    // Add UUID extension
    sqlStatements.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    sqlStatements.push('')

    // Create tables
    for (const table of schema.tables) {
      const sql = this.generateTableSQL(table)
      sqlStatements.push(sql)
      sqlStatements.push('')
    }

    // Add relationships/foreign keys
    for (const relationship of schema.relationships) {
      sqlStatements.push(relationship)
    }

    return sqlStatements.join('\n')
  }

  /**
   * Generate CREATE TABLE SQL for a table schema
   */
  private generateTableSQL(table: TableSchema): string {
    const lines: string[] = []
    lines.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (`)

    const columnDefs: string[] = []

    // Add ID column if no primary key defined
    const hasPrimary = table.columns.some((col) => col.primary)
    if (!hasPrimary) {
      columnDefs.push('  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()')
    }

    // Add columns
    for (const col of table.columns) {
      const parts: string[] = [`  "${col.name}"`]

      parts.push(this.mapTypeToPostgres(col.type))

      if (col.primary) parts.push('PRIMARY KEY')
      if (!col.nullable) parts.push('NOT NULL')
      if (col.unique) parts.push('UNIQUE')
      if (col.defaultValue) parts.push(`DEFAULT ${col.defaultValue}`)

      columnDefs.push(parts.join(' '))
    }

    // Add timestamps if enabled
    if (table.timestamps) {
      columnDefs.push('  created_at TIMESTAMP DEFAULT NOW()')
      columnDefs.push('  updated_at TIMESTAMP DEFAULT NOW()')
    }

    lines.push(columnDefs.join(',\n'))
    lines.push(');')

    // Add indexes
    if (table.indexes && table.indexes.length > 0) {
      for (const index of table.indexes) {
        lines.push('')
        lines.push(
          `CREATE INDEX IF NOT EXISTS idx_${table.name}_${index} ON "${table.name}"("${index}");`,
        )
      }
    }

    return lines.join('\n')
  }

  /**
   * Map JavaScript/TypeScript types to PostgreSQL types
   */
  private mapTypeToPostgres(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'VARCHAR(255)',
      text: 'TEXT',
      number: 'INTEGER',
      float: 'DECIMAL(10,2)',
      boolean: 'BOOLEAN',
      date: 'TIMESTAMP',
      uuid: 'UUID',
      json: 'JSONB',
      array: 'TEXT[]',
    }

    return typeMap[type.toLowerCase()] || 'TEXT'
  }

  /**
   * Check if file is a model/schema file
   */
  private isModelFile(filePath: string): boolean {
    const modelPatterns = [
      /models?\//i,
      /entities?\//i,
      /schemas?\//i,
      /types?\//i,
    ]
    return modelPatterns.some((pattern) => pattern.test(filePath))
  }

  /**
   * Parse Prisma schema file
   */
  private parsePrismaSchema(content: string): {
    tables: TableSchema[]
    relationships: string[]
  } {
    const tables: TableSchema[] = []
    const relationships: string[] = []

    // Match model definitions
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g
    let match

    while ((match = modelRegex.exec(content)) !== null) {
      const tableName = match[1].toLowerCase()
      const modelBody = match[2]

      const columns: TableColumn[] = []
      const lines = modelBody.split('\n').filter((line) => line.trim())

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('//') || !trimmed.includes(' ')) continue

        // Parse field: name Type @directives
        const fieldMatch = trimmed.match(/(\w+)\s+(\w+)(\??)\s*(@.*)?/)
        if (fieldMatch) {
          const [, name, type, nullable, directives] = fieldMatch

          const column: TableColumn = {
            name: name,
            type: this.mapPrismaTypeToPostgres(type),
            nullable: nullable === '?',
            primary: directives?.includes('@id') || false,
            unique: directives?.includes('@unique') || false,
          }

          columns.push(column)
        }
      }

      tables.push({
        name: tableName,
        columns,
        timestamps:
          modelBody.includes('createdAt') || modelBody.includes('created_at'),
      })
    }

    return { tables, relationships }
  }

  /**
   * Parse TypeORM entity
   */
  private isTypeORMEntity(content: string): boolean {
    return content.includes('@Entity') || content.includes('Entity(')
  }

  private parseTypeORMEntity(content: string): TableSchema | null {
    // Extract entity name
    const entityMatch = content.match(
      /@Entity\(['"]?(\w+)?['"]?\)\s*(?:export\s+)?class\s+(\w+)/,
    )
    if (!entityMatch) return null

    const tableName = (entityMatch[1] || entityMatch[2]).toLowerCase()
    const columns: TableColumn[] = []

    // Match column decorators
    const columnRegex = /@Column\(([^)]*)\)\s+(\w+):\s*(\w+)/g
    let match

    while ((match = columnRegex.exec(content)) !== null) {
      const [, options, name, type] = match

      columns.push({
        name,
        type: this.mapTypeScriptTypeToPostgres(type),
        nullable: options.includes('nullable: true'),
        unique: options.includes('unique: true'),
      })
    }

    return {
      name: tableName,
      columns,
      timestamps:
        content.includes('CreateDateColumn') ||
        content.includes('UpdateDateColumn'),
    }
  }

  /**
   * Parse Mongoose schema
   */
  private isMongooseSchema(content: string): boolean {
    return content.includes('mongoose.Schema') || content.includes('new Schema')
  }

  private parseMongooseSchema(content: string): TableSchema | null {
    // Extract model name
    const modelMatch = content.match(/mongoose\.model\(['"](\w+)['"]/)
    if (!modelMatch) return null

    const tableName = modelMatch[1].toLowerCase()
    const columns: TableColumn[] = []

    // Match schema fields
    const schemaMatch = content.match(/new Schema\(\{([^}]+)\}/)
    if (schemaMatch) {
      const schemaBody = schemaMatch[1]
      const fieldRegex = /(\w+):\s*\{[^}]*type:\s*(\w+)/g
      let match

      while ((match = fieldRegex.exec(schemaBody)) !== null) {
        const [, name, type] = match
        columns.push({
          name,
          type: this.mapMongooseTypeToPostgres(type),
          nullable: true,
        })
      }
    }

    return {
      name: tableName,
      columns,
      timestamps: content.includes('timestamps: true'),
    }
  }

  /**
   * Generate default tables based on common app patterns
   */
  private generateDefaultTables(
    files: Array<{ file_path: string; content: string }>,
  ): TableSchema[] {
    const tables: TableSchema[] = []

    // Analyze files to detect app type
    const hasAuth = files.some(
      (f) =>
        f.content.includes('signup') ||
        f.content.includes('login') ||
        f.content.includes('authentication'),
    )

    const hasBlog = files.some(
      (f) =>
        f.content.includes('post') ||
        f.content.includes('article') ||
        f.content.includes('blog'),
    )

    const hasEcommerce = files.some(
      (f) =>
        f.content.includes('product') ||
        f.content.includes('cart') ||
        f.content.includes('order'),
    )

    // Add users table if auth detected
    if (hasAuth) {
      tables.push({
        name: 'users',
        columns: [
          { name: 'email', type: 'string', nullable: false, unique: true },
          { name: 'password', type: 'string', nullable: false },
          { name: 'name', type: 'string', nullable: true },
        ],
        timestamps: true,
      })
    }

    // Add blog tables
    if (hasBlog) {
      tables.push({
        name: 'posts',
        columns: [
          { name: 'title', type: 'string', nullable: false },
          { name: 'content', type: 'text', nullable: false },
          { name: 'slug', type: 'string', nullable: false, unique: true },
          { name: 'author_id', type: 'uuid', nullable: true },
          {
            name: 'published',
            type: 'boolean',
            nullable: false,
            defaultValue: 'false',
          },
        ],
        timestamps: true,
        indexes: ['slug', 'author_id'],
      })
    }

    // Add e-commerce tables
    if (hasEcommerce) {
      tables.push(
        {
          name: 'products',
          columns: [
            { name: 'name', type: 'string', nullable: false },
            { name: 'description', type: 'text', nullable: true },
            { name: 'price', type: 'float', nullable: false },
            {
              name: 'stock',
              type: 'number',
              nullable: false,
              defaultValue: '0',
            },
            { name: 'image_url', type: 'string', nullable: true },
          ],
          timestamps: true,
        },
        {
          name: 'orders',
          columns: [
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'total', type: 'float', nullable: false },
            {
              name: 'status',
              type: 'string',
              nullable: false,
              defaultValue: "'pending'",
            },
          ],
          timestamps: true,
          indexes: ['user_id', 'status'],
        },
      )
    }

    return tables
  }

  private mapPrismaTypeToPostgres(type: string): string {
    const map: Record<string, string> = {
      String: 'string',
      Int: 'number',
      Float: 'float',
      Boolean: 'boolean',
      DateTime: 'date',
      Json: 'json',
    }
    return map[type] || 'string'
  }

  private mapTypeScriptTypeToPostgres(type: string): string {
    const map: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      Date: 'date',
      any: 'json',
    }
    return map[type] || 'string'
  }

  private mapMongooseTypeToPostgres(type: string): string {
    const map: Record<string, string> = {
      String: 'string',
      Number: 'number',
      Boolean: 'boolean',
      Date: 'date',
      Mixed: 'json',
    }
    return map[type] || 'string'
  }
}

export const schemaExtractor = new SchemaExtractor()
