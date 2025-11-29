import React from 'react';

export class VisualQueryBuilder extends React.Component<any, any> {
  state = {
    tables: [],
    relationships: [],
    currentQuery: { conditions: [], sql: '' },
    results: [],
    queryHistory: [] as any[]
  };

  async componentDidMount() {
    // TODO: load schema via UnifiedDataAPI
  }

  render() {
    return (
      <div className="visual-query-builder p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Visual Query Builder (Alpha)</h2>
        <p className="text-sm text-gray-600 mb-4">Schema + canvas coming soon.</p>
      </div>
    );
  }
}
