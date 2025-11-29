"use client";
import React from 'react';
import { VisualQueryBuilder } from '@vpn-enterprise/editor/src/visual-query-builder';
import { AdvancedSQLEditor } from '@vpn-enterprise/editor/src/sql-editor';

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