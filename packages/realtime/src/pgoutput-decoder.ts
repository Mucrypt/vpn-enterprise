// Minimal stub decoder to unblock build/install.
// In production, replace with a real pgoutput parser.
export type PgoutputEvent = {
  schema: string;
  table: string;
  op: 'INSERT' | 'UPDATE' | 'DELETE';
  row: Record<string, any>;
};

export class PgoutputDecoder {
  decode(_buf: Buffer): PgoutputEvent[] {
    // Return empty set; upstream WAL stream wiring not yet implemented.
    return [];
  }
}
