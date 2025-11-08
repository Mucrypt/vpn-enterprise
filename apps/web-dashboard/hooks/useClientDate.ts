import { useState, useEffect } from 'react';

/**
 * Hook to safely render dates on client-side to avoid hydration errors
 * Returns null on server, actual date on client after mounting
 */
export function useClientDate() {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
  }, []);

  return date;
}
