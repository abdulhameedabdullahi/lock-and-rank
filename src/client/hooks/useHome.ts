import { useCallback, useEffect, useState } from 'react';
import type { HomeResponse } from '../../shared/game';
import { readError, requestHome } from '../api';

export function useHome() {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHome(await requestHome());
    } catch (err) {
      setError(readError(err, 'Could not load.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { home, loading, error, reload: load };
}
