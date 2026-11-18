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
        <h1 className="text-2xl leading-none font-black">Archive</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Replay any past round — no score saved</p>
      </header>

      {loading ? (
        <p className="mt-6 font-semibold text-ink-soft">Loading…</p>
      ) : error ? (
        <p className="mt-6 font-bold">{error}</p>
      ) : (
        <ul className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {rounds.map((round) => (
            <li key={round.index}>
              <button
                type="button"
                className="press w-full border-b border-line py-3 text-left"
                onClick={() => onSelect(round.index)}
              >
                <p className="text-xs font-black tracking-[0.16em] text-tangerine uppercase">
                  Round {round.roundNumber} · {difficultyLabel(round.difficulty)}
                </p>
                <p className="font-black">{round.category}</p>
                <p className="text-sm font-semibold text-ink-soft">{round.rule}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
