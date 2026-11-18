import { useCallback, useEffect, useRef, useState } from 'react';
import { showToast } from '@devvit/web/client';
import type { GameState } from '../../shared/game';
import { readError, requestHint, requestInit, requestPlace, requestReset } from '../api';

export type Screen = 'prompt' | 'play' | 'reveal' | 'result';

function screenFor(state: GameState, revealOnComplete: boolean): Screen {
  if (state.phase === 'complete') return revealOnComplete ? 'reveal' : 'result';
  if (state.phase === 'playing') return 'play';
  return 'prompt';
}

export function useGame(topicId = 'mix') {
  const [session, setSession] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>('prompt');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const pendingRef = useRef(false);

  const apply = useCallback((state: GameState, revealOnComplete: boolean) => {
    setSession(state);
    setScreen(screenFor(state, revealOnComplete));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    setSession(null);
    setScreen('prompt');
    try {
      const init = await requestInit(topicId).catch(async (err) => {
        const msg: string = err instanceof Error ? err.message : '';
        if (msg.includes('does not match') || msg.includes('could not be read')) {
          await requestReset(topicId);
          return requestInit(topicId);
        }
        throw err;
      });
      setStreak(init.streak);
      apply(init, false);
    } catch (loadError) {
      setSession(null);
      setError(readError(loadError, "Could not load today's round."));
    } finally {
      setLoading(false);
    }
  }, [apply, topicId]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = useCallback(() => {
    if (session?.phase === 'ready' && session.currentItem) setScreen('play');
  }, [session]);

  const showResult = useCallback(() => setScreen('result'), []);

  const lock = useCallback(
    async (slot: number) => {
      if (!session?.currentItem || session.phase === 'complete' || pendingRef.current) return;
      const item = session.currentItem;
      pendingRef.current = true;
      setPending(true);
      setError(null);
      try {
        const placed = await requestPlace(item.id, slot, topicId);
        apply(placed, placed.phase === 'complete');
      } catch (lockError) {
        const message = readError(lockError, 'Could not lock that slot.');
        try {
          const fresh = await requestInit(topicId);
          apply(fresh, false);
          const landed = fresh.placements.some(
            (p) => p.itemId === item.id && p.slot === slot
          );
          if (!landed && fresh.phase !== 'complete') {
            setError(message);
            showToast(message);
          }
        } catch {
          setError(message);
          showToast(message);
        }
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    },
    [apply, session, topicId]
  );

  const hint = useCallback(async () => {
    if (!session?.hintAvailable || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await requestHint(topicId);
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, hintState: result.hintState, hintAvailable: false };
      });
    } catch (hintError) {
      const message = readError(hintError, 'Could not use hint.');
      setError(message);
      showToast(message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [session, topicId]);

  return { session, screen, loading, pending, error, streak, load, start, showResult, lock, hint };
}
