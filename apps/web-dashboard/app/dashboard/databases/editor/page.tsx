"use client";
import React from 'react';

// Simple placeholder components
const VisualQueryBuilder = () => (
  <div className="visual-query-builder p-4 border rounded">
    <h2 className="text-xl font-semibold mb-2">Visual Query Builder (Alpha)</h2>
    <p className="text-sm text-gray-600 mb-4">Schema + canvas coming soon.</p>
  </div>
);

const AdvancedSQLEditor = () => (
  <div className="sql-editor border rounded p-3 space-y-2">
    <textarea 
      defaultValue="SELECT 1;" 
      className="w-full h-40 border rounded p-2 font-mono text-sm" 
    />
    <button className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">
      Run Query
    </button>
  </div>
);

export default function DatabasesEditorPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Database Editor</h1>
        <p className="text-sm text-gray-600">Visual builder and advanced SQL editor side-by-side.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="border rounded p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Visual Query Builder</h2>
          <VisualQueryBuilder />
        </div>
        <div className="border rounded p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-2">SQL Editor</h2>
          <AdvancedSQLEditor />
        </div>
      </div>
    </div>
  );
}