import { useEffect, useState } from 'react';
import type { PlayerStats } from '../../shared/game';
import { readError, requestStats } from '../api';

type StatsScreenProps = {
  onBack: () => void;
};

export const StatsScreen = ({ onBack }: StatsScreenProps) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await requestStats());
      } catch (err) {
        setError(readError(err, 'Could not load stats.'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <section className="flex h-full flex-col overflow-hidden px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header className="shrink-0">
        <button
          type="button"
          className="mb-3 text-sm font-black text-tangerine"
          onClick={onBack}
          aria-label="Back to game"
        >
          ← Back
        </button>
        <h1 className="text-3xl leading-none font-black">Your Stats</h1>
      </header>

      {loading ? (
        <p className="mt-6 font-semibold text-ink-soft">Loading…</p>
      ) : error ? (
        <p className="mt-6 font-bold">{error}</p>
      ) : stats ? (
        <dl className="mt-6 grid grid-cols-2 gap-3">
          <StatCell label="Games played" value={String(stats.gamesPlayed)} />
          <StatCell label="Current streak" value={`${stats.streak} 🔥`} />
          <StatCell label="Best streak" value={String(stats.longestStreak)} />
          <StatCell label="Best score" value={`${stats.bestScore}/100`} />
          <StatCell label="Avg score" value={`${stats.averageScore}/100`} />
        </dl>
      ) : null}
    </section>
  );
};

const StatCell = ({ label, value }: { label: string; value: string }) => (
  <div className="chunk flex flex-col items-center justify-center gap-1 p-3 text-center">
    <dt className="text-xs font-black tracking-[0.14em] text-ink-soft uppercase">{label}</dt>
    <dd className="text-3xl leading-none font-black tabular-nums">{value}</dd>
  </div>
);
