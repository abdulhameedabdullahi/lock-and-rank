import { difficultyLabel, type RoundSummary } from '../../shared/game';

type PromptScreenProps = {
  summary: RoundSummary;
  onStart: () => void;
  onBack?: (() => void) | undefined;
};

export const PromptScreen = ({ summary, onStart, onBack }: PromptScreenProps) => {
  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      {onBack ? (
        <button type="button" className="self-start text-sm font-black text-tangerine" onClick={onBack}>
          ← Home
        </button>
      ) : null}
      <header>
        <p className="text-xs font-black tracking-[0.22em] text-tangerine uppercase">Today&apos;s round</p>
        <h1 className="mt-1 text-3xl leading-none font-black">{summary.category}</h1>
        <p className="mt-2 text-lg font-bold">{summary.rule}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <span className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3].map((n) => {
              const filled = summary.difficulty === 'hard' || (summary.difficulty === 'medium' && n <= 2) || n === 1;
              return <span key={n} className={`text-sm leading-none ${filled ? 'text-tangerine' : 'text-line'}`}>●</span>;
            })}
          </span>
          {difficultyLabel(summary.difficulty)} · Round {summary.roundNumber}
        </p>
      </header>
      <div className="chunk p-4">
        <p className="font-black">How to play</p>
        <p className="mt-1 text-sm leading-snug font-semibold">
          Five items appear one at a time. Lock each into a rank from 1 to 5 before the next one shows.
          Used slots stay shut. No undo. Tap 💡 on the first two items to rule out wrong slots (costs 5 pts).
        </p>
      </div>
      <button
        type="button"
        className="press chunk mt-auto bg-tangerine text-base font-black text-ink"
        onClick={onStart}
      >
        Start ranking
      </button>
    </section>
  );
};
