// Optimized SQL utility functions - extracted from component to prevent re-renders

export function formatSqlForDisplay(sql: string): string {
  return sql.trim();
}

export function extractTableNameFromSQL(sql: string): string | null {
  const sqlLower = sql.toLowerCase().trim();
  const createTableMatch = sqlLower.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?([^"\s.]+)"?\.)?"?([^"\s(]+)"?/);
  if (createTableMatch) {
    return createTableMatch[2];
  }
  return null;
}

export function extractSchemaNameFromSQL(sql: string): string | null {
  const sqlLower = sql.toLowerCase().trim();
  const createTableMatch = sqlLower.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?([^"\s.]+)"?\.)?"?([^"\s(]+)"?/);
  if (createTableMatch) {
    return createTableMatch[1] || null;
  }
  return null;
}

export function isCreateStatement(sql: string): boolean {
  const sqlLower = sql.toLowerCase().trim();
  return sqlLower.startsWith('create table') || 
         sqlLower.startsWith('create schema') || 
         sqlLower.includes('create table');
}

export function getSuggestionForError(error: string): string | null {
  if (error.includes('already exists')) {
    const match = error.match(/relation "([^"]+)" already exists/);
    const tableName = match ? match[1] : 'table';
    return `💡 Tip: Add "IF NOT EXISTS" to your CREATE TABLE statement:\nCREATE TABLE IF NOT EXISTS ${tableName} (...)`;
  }
  
  if (error.includes('syntax error')) {
    return '💡 Tip: Check for missing semicolons, typos in keywords, or incorrect SQL syntax.';
  }
  
  if (error.includes('does not exist')) {
    const match = error.match(/relation "([^"]+)" does not exist/);
    const tableName = match ? match[1] : 'table';
    return `💡 Tip: Table "${tableName}" does not exist. Create it first or check the spelling.`;
  }
  
  return null;
}

// Simple SQL keyword check (no regex, much faster)
export function containsSQLKeywords(text: string): boolean {
  const upper = text.toUpperCase();
  return upper.includes('SELECT') || 
         upper.includes('INSERT') || 
         upper.includes('UPDATE') || 
         upper.includes('DELETE') || 
         upper.includes('CREATE');
}
