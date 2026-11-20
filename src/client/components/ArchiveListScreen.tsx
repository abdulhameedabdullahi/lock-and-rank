import { useEffect, useState } from 'react';
import { difficultyLabel, type ArchiveListItem } from '../../shared/game';
import { readError, requestArchiveList } from '../api';

type ArchiveListScreenProps = {
  onSelect: (index: number) => void;
  onBack: () => void;
};

export const ArchiveListScreen = ({ onSelect, onBack }: ArchiveListScreenProps) => {
  const [rounds, setRounds] = useState<ArchiveListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setRounds(await requestArchiveList());
      } catch (err) {
        setError(readError(err, 'Could not load archive.'));
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
        <h1 className="text-2xl leading-none font-black text-tile font-display">Past rounds</h1>
        <p className="mt-1 text-sm font-medium text-soft">Replay any past round — no score saved</p>
      </header>

      {loading ? (
        <p className="mt-6 font-medium text-soft">Loading…</p>
      ) : error ? (
        <p className="mt-6 font-bold text-miss">{error}</p>
      ) : (
        <ul className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {rounds.map((round) => (
            <li key={round.index}>
              <button
                type="button"
                className="press w-full border-b border-groove py-3 text-left"
                onClick={() => onSelect(round.index)}
              >
                <p className="text-xs font-bold text-soft">
                  Round {round.roundNumber} · {difficultyLabel(round.difficulty)}
                </p>
                <p className="font-black text-tile">{round.category}</p>
                <p className="text-sm font-medium text-soft">{round.rule}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
