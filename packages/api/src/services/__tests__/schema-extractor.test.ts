import { describe, it, expect } from 'vitest'
import { schemaExtractor } from '../schema-extractor'

describe('SchemaExtractor', () => {
  describe('Prisma Schema Parsing', () => {
    it('should extract tables from Prisma schema', () => {
      const files = [
        {
          file_path: 'prisma/schema.prisma',
          content: `
            model User {
              id        String   @id @default(uuid())
              email     String   @unique
              name      String?
              createdAt DateTime @default(now())
            }
            
            model Post {
              id        String   @id @default(uuid())
              title     String
              content   String
              published Boolean  @default(false)
              authorId  String
            }
          `,
          language: 'prisma',
        },
      ]

      const { tables } = schemaExtractor.extractSchema(files)

      expect(tables).toHaveLength(2)
      expect(tables[0].name).toBe('user')
      expect(tables[1].name).toBe('post')
      expect(tables[0].columns).toContainEqual(
        expect.objectContaining({ name: 'email', unique: true }),
      )
    })
  })

  describe('TypeORM Entity Parsing', () => {
    it('should extract tables from TypeORM entities', () => {
      const files = [
        {
          file_path: 'src/entities/User.ts',
          content: `
            import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
            
            @Entity('users')
            export class User {
              @PrimaryGeneratedColumn('uuid')
              id: string
              
              @Column({ unique: true })
              email: string
              
              @Column({ nullable: true })
              name: string
            }
          `,
          language: 'typescript',
        },
      ]

      const { tables } = schemaExtractor.extractSchema(files)

      expect(tables).toHaveLength(1)
      expect(tables[0].name).toBe('users')
      expect(tables[0].columns.find((c) => c.name === 'email')?.unique).toBe(
        true,
      )
    })
  })

  describe('Default Schema Generation', () => {
    it('should generate user table for auth apps', () => {
      const files = [
        {
          file_path: 'src/components/LoginForm.tsx',
          content: `
            function LoginForm() {
              const handleLogin = async (email, password) => {
                // authentication logic
              }
            }
          `,
          language: 'typescript',
        },
      ]

      const { tables } = schemaExtractor.extractSchema(files)

      expect(tables.some((t) => t.name === 'users')).toBe(true)
      const userTable = tables.find((t) => t.name === 'users')
      expect(userTable?.columns).toContainEqual(
        expect.objectContaining({ name: 'email', unique: true }),
      )
    })

    it('should generate blog tables', () => {
      const files = [
        {
          file_path: 'src/pages/Blog.tsx',
          content: `
            function BlogPost({ post }) {
              return <article>{post.title}</article>
            }
          `,
          language: 'typescript',
        },
      ]

      const { tables } = schemaExtractor.extractSchema(files)

      expect(tables.some((t) => t.name === 'posts')).toBe(true)
    })

    it('should generate e-commerce tables', () => {
      const files = [
        {
          file_path: 'src/components/ProductList.tsx',
          content: `
            function ProductList({ products }) {
              return products.map(p => (
                <div key={p.id}>
                  <h3>{p.name}</h3>
                  <p>${'$'}{p.price}</p>
                  <button onClick={() => addToCart(p)}>Add to Cart</button>
                </div>
              ))
            }
          `,
          language: 'typescript',
        },
      ]

      const { tables } = schemaExtractor.extractSchema(files)

      expect(tables.some((t) => t.name === 'products')).toBe(true)
      expect(tables.some((t) => t.name === 'orders')).toBe(true)
    })
  })

  describe('SQL Generation', () => {
    it('should generate valid PostgreSQL SQL', () => {
      const files = [
        {
          file_path: 'src/models/User.ts',
          content: `
            interface User {
              email: string
              name: string
              age: number
              active: boolean
            }
          `,
          language: 'typescript',
        },
      ]

      const schema = schemaExtractor.extractSchema(files)
      const sql = schemaExtractor.generateSQL(schema)

      expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('UUID PRIMARY KEY DEFAULT uuid_generate_v4()')
    })

    it('should include timestamps when enabled', () => {
      const schema = {
        tables: [
          {
            name: 'users',
            columns: [{ name: 'email', type: 'string', nullable: false }],
            timestamps: true,
          },
        ],
        relationships: [],
      }

      const sql = schemaExtractor.generateSQL(schema)

      expect(sql).toContain('created_at')
      expect(sql).toContain('updated_at')
    })

    it('should map TypeScript types to PostgreSQL types', () => {
      const schema = {
        tables: [
          {
            name: 'test',
            columns: [
              { name: 'name', type: 'string', nullable: false },
              { name: 'age', type: 'number', nullable: false },
              { name: 'price', type: 'float', nullable: false },
              { name: 'active', type: 'boolean', nullable: false },
              { name: 'data', type: 'json', nullable: false },
            ],
          },
        ],
        relationships: [],
      }

      const sql = schemaExtractor.generateSQL(schema)

      expect(sql).toContain('VARCHAR(255)')
      expect(sql).toContain('INTEGER')
      expect(sql).toContain('DECIMAL(10,2)')
      expect(sql).toContain('BOOLEAN')
      expect(sql).toContain('JSONB')
    })
  })
})
