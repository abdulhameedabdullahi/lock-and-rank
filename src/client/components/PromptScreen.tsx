import { difficultyLabel, type RoundSummary } from '../../shared/game';
import { Btn, Surface } from './primitives';

type PromptScreenProps = {
  summary: RoundSummary;
  onStart: () => void;
  onBack?: (() => void) | undefined;
};

export const PromptScreen = ({ summary, onStart, onBack }: PromptScreenProps) => {
  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden bg-bg px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      {onBack ? (
        <button type="button" className="press self-start text-sm font-bold text-signal" onClick={onBack}>
          ← Home
        </button>
      ) : null}
      <header>
        <p className="text-sm font-medium text-soft">{summary.category}</p>
        <h1 className="mt-1 text-3xl leading-none font-black text-tile font-display">{summary.category}</h1>
        <p className="mt-2 text-lg font-bold text-tile">{summary.rule}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-soft">
          <span className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3].map((n) => {
              const filled = summary.difficulty === 'hard' || (summary.difficulty === 'medium' && n <= 2) || n === 1;
              return (
                <span
                  key={n}
                  className={`text-sm leading-none ${filled ? 'text-signal' : 'text-groove'}`}
                >
                  ●
                </span>
              );
            })}
          </span>
          {difficultyLabel(summary.difficulty)} · Round {summary.roundNumber}
        </p>
      </header>
      <Surface className="p-4">
        <p className="font-black text-tile">How to play</p>
        <p className="mt-1 text-sm leading-snug font-medium text-soft">
          Five items appear one at a time. Lock each into a rank from 1 to 5 —
          used slots stay locked. No undo. Use the hint on the first two items
          to rule out two wrong slots (costs 5 pts).
        </p>
      </Surface>
      <Btn variant="primary" className="mt-auto" onClick={onStart}>
        Start ranking
      </Btn>
    </section>
  );
};
