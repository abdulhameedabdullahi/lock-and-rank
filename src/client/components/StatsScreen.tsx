import { useEffect, useState } from 'react';
import type { PlayerStats } from '../../shared/game';
import { readError, requestStats } from '../api';
import { Surface } from './primitives';

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
    <section className="flex h-full flex-col overflow-hidden bg-bg px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header className="shrink-0">
        <button
          type="button"
          className="press mb-3 text-sm font-bold text-signal"
          onClick={onBack}
          aria-label="Back to game"
        >
          ← Back
        </button>
        <h1 className="text-3xl leading-none font-black text-tile font-display">Your stats</h1>
      </header>

      {loading ? (
        <p className="mt-6 font-medium text-soft">Loading…</p>
      ) : error ? (
        <p className="mt-6 font-bold text-miss">{error}</p>
      ) : stats ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <StatCell label="Games played" value={String(stats.gamesPlayed)} />
            <StatCell label="Current streak" value={`${stats.streak}`} suffix={stats.streak > 0 ? ' 🔥' : ''} />
            <StatCell label="Best streak" value={String(stats.longestStreak)} />
            <StatCell label="Best score" value={`${stats.bestScore}`} suffix="/100" />
            <StatCell label="Average score" value={`${stats.averageScore}`} suffix="/100" wide />
          </dl>
          <Surface className="mt-3 p-3 text-center">
            <p className="text-sm font-black text-tile">Streak freeze</p>
            <p className="mt-0.5 text-xs font-medium text-soft leading-snug">
              {stats.freezeAvailable
                ? 'Counts as one played day if you miss — resets Monday'
                : 'Used this week — resets Monday'}
            </p>
          </Surface>
        </>
      ) : null}
    </section>
  );
};

type StatCellProps = { label: string; value: string; suffix?: string; wide?: boolean };

const StatCell = ({ label, value, suffix, wide }: StatCellProps) => (
  <Surface className={`flex flex-col items-center justify-center gap-1 p-3 text-center${wide ? ' col-span-2' : ''}`}>
    <dt className="text-xs font-bold text-soft">{label}</dt>
    <dd className="font-display font-black tabular-nums text-tile" style={{ fontSize: '1.75rem', lineHeight: 1 }}>
      {value}
      {suffix ? <span className="text-sm font-bold text-soft">{suffix}</span> : null}
    </dd>
  </Surface>
);
