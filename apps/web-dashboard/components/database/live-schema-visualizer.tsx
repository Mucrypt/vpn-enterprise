'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GitBranch, Plus, Download, Maximize2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveSchemaVisualizerProps {
  activeTenant: string
  tables: Array<{
    name: string
    schema: string
    fullName: string
  }>
}

interface TableNode {
  id: string
  name: string
  schema: string
  x: number
  y: number
  columns?: Array<{
    name: string
    type: string
    isPrimary?: boolean
    isForeign?: boolean
  }>
}

export function LiveSchemaVisualizer({
  activeTenant,
  tables,
}: LiveSchemaVisualizerProps) {
  const [nodes, setNodes] = useState<TableNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Initialize nodes from tables
  useEffect(() => {
    if (tables.length > 0) {
      const newNodes: TableNode[] = tables.map((table, index) => ({
        id: `${table.schema}.${table.name}`,
        name: table.name,
        schema: table.schema,
        x: 100 + (index % 3) * 250,
        y: 100 + Math.floor(index / 3) * 200,
        columns: [
          { name: 'id', type: 'UUID', isPrimary: true },
          { name: 'created_at', type: 'TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP' },
        ],
      }))
      setNodes(newNodes)
    }
  }, [tables])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const exportDiagram = () => {
    // TODO: Implement export as PNG/PDF
    alert('Export feature coming soon!')
  }

  if (!activeTenant) {
    return (
      <div className='h-full flex items-center justify-center bg-[#1e1e1e] p-6'>
        <div className='text-center text-gray-400'>
          <GitBranch className='h-12 w-12 mx-auto mb-3 opacity-50' />
          <p className='text-sm'>Select a database to visualize schema</p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col bg-[#1e1e1e]'>
      {/* Toolbar */}
      <div className='flex items-center justify-between p-4 border-b border-[#2d2d30]'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center'>
            <GitBranch className='h-4 w-4 text-white' />
          </div>
          <div>
            <h2 className='font-semibold text-white text-sm'>
              Schema Visualizer
            </h2>
            <p className='text-xs text-gray-400'>{tables.length} tables</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleZoomOut}
            className='h-8 border-gray-700 text-gray-300 hover:bg-gray-800'
          >
            −
          </Button>
          <span className='text-xs text-gray-400 w-12 text-center'>
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={handleZoomIn}
            className='h-8 border-gray-700 text-gray-300 hover:bg-gray-800'
          >
            +
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={handleReset}
            className='h-8 border-gray-700 text-gray-300 hover:bg-gray-800'
          >
            <Maximize2 className='h-3 w-3' />
          </Button>
          <Button
            size='sm'
            onClick={exportDiagram}
            className='h-8 bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            <Download className='h-3 w-3 mr-1' />
            Export
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className='flex-1 overflow-hidden relative bg-[#0a0a0a]'
        style={{
          backgroundImage:
            'radial-gradient(circle, #2d2d30 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left',
            transition: 'transform 0.1s',
          }}
          className='relative w-full h-full'
        >
          {/* Table Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
              }}
              className={cn(
                'w-64 bg-[#2d2d30] border rounded-lg overflow-hidden cursor-move transition-all',
                selectedNode === node.id
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'border-[#3e3e42] hover:border-gray-600',
              )}
              onClick={() => setSelectedNode(node.id)}
            >
              {/* Table Header */}
              <div className='bg-linear-to-r from-emerald-600 to-cyan-600 p-3'>
                <div className='text-white font-semibold text-sm'>
                  {node.name}
                </div>
                <div className='text-emerald-100 text-xs'>{node.schema}</div>
              </div>

              {/* Columns */}
              <div className='p-3 space-y-1.5'>
                {node.columns?.map((column, idx) => (
                  <div key={idx} className='flex items-center gap-2 text-xs'>
                    {column.isPrimary && (
                      <div
                        className='w-2 h-2 bg-yellow-500 rounded-full'
                        title='Primary Key'
                      />
                    )}
                    {column.isForeign && (
                      <div
                        className='w-2 h-2 bg-blue-500 rounded-full'
                        title='Foreign Key'
                      />
                    )}
                    {!column.isPrimary && !column.isForeign && (
                      <div className='w-2 h-2 bg-gray-600 rounded-full' />
                    )}
                    <span className='text-gray-300 font-mono'>
                      {column.name}
                    </span>
                    <span className='text-gray-500 ml-auto'>{column.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Connection Lines (Future Feature) */}
          {/* Add SVG lines to show foreign key relationships */}
        </div>

        {/* Mini Map (Bottom Right) */}
        <div className='absolute bottom-4 right-4 w-48 h-32 bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-2'>
          <div className='relative w-full h-full bg-[#1e1e1e] rounded overflow-hidden'>
            {nodes.map((node) => (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${(node.x / 1000) * 100}%`,
                  top: `${(node.y / 600) * 100}%`,
                  width: '8px',
                  height: '8px',
                }}
                className={cn(
                  'rounded-sm',
                  selectedNode === node.id ? 'bg-emerald-500' : 'bg-gray-600',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className='p-3 border-t border-[#2d2d30] bg-[#181818]'>
        <div className='flex items-center gap-6 text-xs text-gray-400'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-yellow-500 rounded-full' />
            <span>Primary Key</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-500 rounded-full' />
            <span>Foreign Key</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-gray-600 rounded-full' />
            <span>Column</span>
          </div>
          <div className='ml-auto text-gray-500'>
            Drag to move • Click to select • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  )
}
