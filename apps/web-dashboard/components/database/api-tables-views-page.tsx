'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  Check,
  Table,
  Search,
  ChevronRight,
  Database,
  Eye,
  FileCode,
  Play,
} from 'lucide-react'

interface ApiTablesViewsPageProps {
  activeTenant: string
}

interface TableInfo {
  schema: string
  name: string
  type: 'table' | 'view'
  columns: {
    name: string
    type: string
    nullable: boolean
    default: string | null
  }[]
}

export function ApiTablesViewsPage({ activeTenant }: ApiTablesViewsPageProps) {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [filteredTables, setFilteredTables] = useState<TableInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apiUrl = `https://api.vpnenterprise.com/v1/projects/${activeTenant}`
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

  useEffect(() => {
    fetchTables()
  }, [activeTenant])

  useEffect(() => {
    if (searchQuery) {
      setFilteredTables(
        tables.filter(
          (table) =>
            table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            table.schema.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredTables(tables)
    }
  }, [searchQuery, tables])

  const fetchTables = async () => {
    setIsLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockTables: TableInfo[] = [
        {
          schema: 'public',
          name: 'users',
          type: 'table',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              nullable: false,
              default: 'gen_random_uuid()',
            },
            { name: 'email', type: 'text', nullable: false, default: null },
            { name: 'name', type: 'text', nullable: true, default: null },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              default: 'now()',
            },
          ],
        },
        {
          schema: 'public',
          name: 'posts',
          type: 'table',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              nullable: false,
              default: 'nextval()',
            },
            { name: 'title', type: 'text', nullable: false, default: null },
            { name: 'content', type: 'text', nullable: true, default: null },
            { name: 'user_id', type: 'uuid', nullable: false, default: null },
            {
              name: 'published',
              type: 'boolean',
              nullable: false,
              default: 'false',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              default: 'now()',
            },
          ],
        },
        {
          schema: 'public',
          name: 'comments',
          type: 'table',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              nullable: false,
              default: 'nextval()',
            },
            { name: 'post_id', type: 'bigint', nullable: false, default: null },
            { name: 'user_id', type: 'uuid', nullable: false, default: null },
            { name: 'content', type: 'text', nullable: false, default: null },
            {
              name: 'created_at',
              type: 'timestamp',
              nullable: false,
              default: 'now()',
            },
          ],
        },
        {
          schema: 'blog',
          name: 'posts',
          type: 'table',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              nullable: false,
              default: 'gen_random_uuid()',
            },
            { name: 'title', type: 'varchar', nullable: false, default: null },
            { name: 'slug', type: 'varchar', nullable: false, default: null },
            { name: 'content', type: 'text', nullable: true, default: null },
            { name: 'author_id', type: 'uuid', nullable: false, default: null },
          ],
        },
        {
          schema: 'ecommerce',
          name: 'products',
          type: 'table',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              nullable: false,
              default: 'nextval()',
            },
            { name: 'name', type: 'text', nullable: false, default: null },
            { name: 'price', type: 'numeric', nullable: false, default: null },
            { name: 'stock', type: 'integer', nullable: false, default: '0' },
          ],
        },
      ]

      setTables(mockTables)
      setFilteredTables(mockTables)
      if (mockTables.length > 0) {
        setSelectedTable(mockTables[0])
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(type)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const generateSelectExample = (table: TableInfo) => {
    return `// Select all rows
const { data, error } = await supabase
  .from('${table.name}')
  .select('*')

// Select specific columns
const { data, error } = await supabase
  .from('${table.name}')
  .select('${table.columns
    .slice(0, 3)
    .map((c) => c.name)
    .join(', ')}')
  
// With filters
const { data, error } = await supabase
  .from('${table.name}')
  .select('*')
  .eq('${table.columns[0].name}', 'value')
  .limit(10)`
  }

  const generateInsertExample = (table: TableInfo) => {
    const exampleData = table.columns
      .filter((c) => !c.default || c.default === 'null')
      .slice(0, 3)
      .map((c) => {
        if (c.type.includes('int')) return `${c.name}: 123`
        if (c.type.includes('bool')) return `${c.name}: true`
        if (c.type.includes('numeric') || c.type.includes('decimal'))
          return `${c.name}: 99.99`
        return `${c.name}: 'example'`
      })
      .join(',\n    ')

    return `// Insert a single row
const { data, error } = await supabase
  .from('${table.name}')
  .insert({
    ${exampleData}
  })
  .select()

// Insert multiple rows
const { data, error } = await supabase
  .from('${table.name}')
  .insert([
    { ${table.columns[1]?.name}: 'value1' },
    { ${table.columns[1]?.name}: 'value2' }
  ])
  .select()`
  }

  const generateUpdateExample = (table: TableInfo) => {
    const updateField = table.columns.find(
      (c) => c.name !== 'id' && c.name !== 'created_at',
    )

    return `// Update rows
const { data, error } = await supabase
  .from('${table.name}')
  .update({ ${updateField?.name || 'column'}: 'new value' })
  .eq('${table.columns[0].name}', 'value')
  .select()

// Update with conditions
const { data, error } = await supabase
  .from('${table.name}')
  .update({ ${updateField?.name || 'column'}: 'updated' })
  .lt('${table.columns[0].name}', 100)
  .select()`
  }

  const generateDeleteExample = (table: TableInfo) => {
    return `// Delete rows
const { data, error } = await supabase
  .from('${table.name}')
  .delete()
  .eq('${table.columns[0].name}', 'value')

// Delete with conditions
const { data, error } = await supabase
  .from('${table.name}')
  .delete()
  .lt('${table.columns[0].name}', 100)`
  }

  const generateCurlExample = (table: TableInfo) => {
    return `# GET - Select all
curl '${apiUrl}/rest/v1/${table.name}?select=*' \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}"

# POST - Insert
curl -X POST '${apiUrl}/rest/v1/${table.name}' \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"${table.columns[1]?.name}": "value"}'

# PATCH - Update
curl -X PATCH '${apiUrl}/rest/v1/${table.name}?${table.columns[0].name}=eq.value' \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"${table.columns[1]?.name}": "new value"}'

# DELETE - Delete
curl -X DELETE '${apiUrl}/rest/v1/${table.name}?${table.columns[0].name}=eq.value' \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}"`
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <Database className='h-8 w-8 animate-pulse text-emerald-400 mx-auto mb-2' />
          <p className='text-sm text-gray-400'>Loading tables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full'>
      {/* Sidebar - Table List */}
      <div className='w-80 border-r border-gray-800 bg-gray-900 overflow-y-auto'>
        <div className='p-4 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-3'>
            Tables & Views
          </h2>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
            <Input
              placeholder='Search tables...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 bg-gray-950 border-gray-800 text-gray-300'
            />
          </div>
        </div>

        <div className='p-3 space-y-1'>
          {filteredTables.map((table) => (
            <button
              key={`${table.schema}.${table.name}`}
              onClick={() => setSelectedTable(table)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                selectedTable?.name === table.name &&
                selectedTable?.schema === table.schema
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                <Table className='h-4 w-4 shrink-0' />
                <div className='text-left'>
                  <div className='font-medium'>{table.name}</div>
                  <div className='text-xs opacity-70'>{table.schema}</div>
                </div>
              </div>
              <ChevronRight className='h-4 w-4 shrink-0' />
            </button>
          ))}

          {filteredTables.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <Table className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>No tables found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Table Documentation */}
      <div className='flex-1 overflow-y-auto'>
        {selectedTable ? (
          <div className='p-6 max-w-5xl mx-auto space-y-6'>
            {/* Header */}
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Badge variant='outline' className='text-xs'>
                  {selectedTable.schema}
                </Badge>
                <Badge variant='outline' className='text-xs'>
                  {selectedTable.type}
                </Badge>
              </div>
              <h1 className='text-3xl font-bold text-white'>
                {selectedTable.name}
              </h1>
              <p className='text-gray-400 mt-2'>
                Auto-generated API endpoints for the {selectedTable.name}{' '}
                {selectedTable.type}.
              </p>
            </div>

            {/* Endpoint URL */}
            <Card className='bg-gray-900 border-gray-800 p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-xs text-gray-500 mb-1'>Base URL</p>
                  <code className='text-sm text-emerald-400 font-mono'>
                    {apiUrl}/rest/v1/{selectedTable.name}
                  </code>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    copyToClipboard(
                      `${apiUrl}/rest/v1/${selectedTable.name}`,
                      'url',
                    )
                  }
                >
                  {copiedCode === 'url' ? (
                    <Check className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </Card>

            {/* Schema */}
            <div className='space-y-3'>
              <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
                <FileCode className='h-5 w-5 text-emerald-400' />
                Schema
              </h2>
              <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                <table className='w-full'>
                  <thead className='bg-gray-950 border-b border-gray-800'>
                    <tr>
                      <th className='text-left p-3 text-sm font-semibold text-gray-400'>
                        Column
                      </th>
                      <th className='text-left p-3 text-sm font-semibold text-gray-400'>
                        Type
                      </th>
                      <th className='text-left p-3 text-sm font-semibold text-gray-400'>
                        Nullable
                      </th>
                      <th className='text-left p-3 text-sm font-semibold text-gray-400'>
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.columns.map((column, idx) => (
                      <tr
                        key={column.name}
                        className={
                          idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }
                      >
                        <td className='p-3 text-sm text-white font-mono'>
                          {column.name}
                        </td>
                        <td className='p-3 text-sm text-gray-400 font-mono'>
                          {column.type}
                        </td>
                        <td className='p-3 text-sm'>
                          {column.nullable ? (
                            <Badge variant='outline' className='text-xs'>
                              Yes
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='text-xs text-red-400'
                            >
                              No
                            </Badge>
                          )}
                        </td>
                        <td className='p-3 text-sm text-gray-400 font-mono'>
                          {column.default || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* API Examples */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
                <Play className='h-5 w-5 text-emerald-400' />
                API Examples
              </h2>

              <Tabs defaultValue='select' className='w-full'>
                <TabsList className='bg-gray-900 border border-gray-800'>
                  <TabsTrigger value='select'>SELECT</TabsTrigger>
                  <TabsTrigger value='insert'>INSERT</TabsTrigger>
                  <TabsTrigger value='update'>UPDATE</TabsTrigger>
                  <TabsTrigger value='delete'>DELETE</TabsTrigger>
                  <TabsTrigger value='curl'>cURL</TabsTrigger>
                </TabsList>

                <TabsContent value='select' className='mt-4'>
                  <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                    <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                      <Badge variant='outline' className='text-xs'>
                        JavaScript
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(
                            generateSelectExample(selectedTable),
                            'select',
                          )
                        }
                      >
                        {copiedCode === 'select' ? (
                          <Check className='h-4 w-4 text-emerald-400' />
                        ) : (
                          <Copy className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <pre className='p-4 overflow-x-auto'>
                      <code className='text-sm text-gray-300 font-mono'>
                        {generateSelectExample(selectedTable)}
                      </code>
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value='insert' className='mt-4'>
                  <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                    <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                      <Badge variant='outline' className='text-xs'>
                        JavaScript
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(
                            generateInsertExample(selectedTable),
                            'insert',
                          )
                        }
                      >
                        {copiedCode === 'insert' ? (
                          <Check className='h-4 w-4 text-emerald-400' />
                        ) : (
                          <Copy className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <pre className='p-4 overflow-x-auto'>
                      <code className='text-sm text-gray-300 font-mono'>
                        {generateInsertExample(selectedTable)}
                      </code>
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value='update' className='mt-4'>
                  <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                    <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                      <Badge variant='outline' className='text-xs'>
                        JavaScript
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(
                            generateUpdateExample(selectedTable),
                            'update',
                          )
                        }
                      >
                        {copiedCode === 'update' ? (
                          <Check className='h-4 w-4 text-emerald-400' />
                        ) : (
                          <Copy className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <pre className='p-4 overflow-x-auto'>
                      <code className='text-sm text-gray-300 font-mono'>
                        {generateUpdateExample(selectedTable)}
                      </code>
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value='delete' className='mt-4'>
                  <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                    <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                      <Badge variant='outline' className='text-xs'>
                        JavaScript
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(
                            generateDeleteExample(selectedTable),
                            'delete',
                          )
                        }
                      >
                        {copiedCode === 'delete' ? (
                          <Check className='h-4 w-4 text-emerald-400' />
                        ) : (
                          <Copy className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <pre className='p-4 overflow-x-auto'>
                      <code className='text-sm text-gray-300 font-mono'>
                        {generateDeleteExample(selectedTable)}
                      </code>
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value='curl' className='mt-4'>
                  <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
                    <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                      <Badge variant='outline' className='text-xs'>
                        cURL
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          copyToClipboard(
                            generateCurlExample(selectedTable),
                            'curl',
                          )
                        }
                      >
                        {copiedCode === 'curl' ? (
                          <Check className='h-4 w-4 text-emerald-400' />
                        ) : (
                          <Copy className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <pre className='p-4 overflow-x-auto'>
                      <code className='text-sm text-gray-300 font-mono'>
                        {generateCurlExample(selectedTable)}
                      </code>
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center'>
              <Eye className='h-8 w-8 text-gray-600 mx-auto mb-2' />
              <p className='text-sm text-gray-500'>
                Select a table to view API documentation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
