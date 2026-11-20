import { useEffect, useRef, useState } from 'react';
import { formatValue, MARK_SYMBOL, type ItemResult, type RoundSummary } from '../../shared/game';
import { useReducedMotion } from '../hooks/useReducedMotion';

type RowPhase = 'before' | 'flipping-out' | 'flipping-in' | 'after';

const markRowClass: Record<string, string> = {
  check:    'bg-signal text-bg',
  diamond:  'bg-tile text-bg',
  triangle: 'bg-board text-tile',
  cross:    'bg-miss text-tile',
};

type RevealScreenProps = {
  summary: RoundSummary;
  results: ItemResult[];
  onDone: () => void;
};

export const RevealScreen = ({ summary, results, onDone }: RevealScreenProps) => {
  const reducedMotion = useReducedMotion();
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  const ordered = [...results].sort((a, b) => a.trueRank - b.trueRank);

  /* What the player placed at each rank slot (before-state content). */
  const byChosenSlot = new Map(results.map((r) => [r.chosenSlot, r]));

  const [phases, setPhases] = useState<RowPhase[]>(() =>
    reducedMotion ? ordered.map(() => 'after' as RowPhase) : ordered.map(() => 'before' as RowPhase)
  );

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDoneRef.current();
  };

  const skip = () => {
    setPhases(ordered.map(() => 'after' as RowPhase));
    finish();
  };

  /* Start staggered flip sequence (state already initialized to 'after' when reducedMotion) */
  useEffect(() => {
    if (reducedMotion) return;

    const timers: ReturnType<typeof window.setTimeout>[] = [];

    ordered.forEach((_, i) => {
      const delay = i * 400;
      timers.push(window.setTimeout(() => {
        setPhases((prev) => prev.map((p, j) => (j === i ? 'flipping-out' : p)));
      }, delay));
      timers.push(window.setTimeout(() => {
        setPhases((prev) => prev.map((p, j) => (j === i ? 'flipping-in' : p)));
      }, delay + 180));
      timers.push(window.setTimeout(() => {
        setPhases((prev) => prev.map((p, j) => (j === i ? 'after' : p)));
      }, delay + 360));
    });

    return () => timers.forEach((t) => window.clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  /* Auto-advance 300ms after last row lands */
  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      onDoneRef.current();
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <section
      className="flex h-full flex-col gap-3 overflow-hidden bg-bg px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <header className="shrink-0">
        <p className="text-sm font-medium text-soft">True order</p>
        <h1 className="text-xl leading-tight font-black text-tile">{summary.rule}</h1>
      </header>

      <ol className="board flex-1 min-h-0">
        {ordered.map((result, i) => {
          const phase = phases[i] ?? 'before';
          const isAfter = phase === 'flipping-in' || phase === 'after';

          /* Content to display */
          const beforeItem = byChosenSlot.get(result.trueRank);
          const displayResult = isAfter ? result : (beforeItem ?? result);
          const rowVariant = isAfter ? (markRowClass[result.mark] ?? 'bg-board text-tile') : 'bg-board text-tile';

          const animClass =
            phase === 'flipping-out'
              ? 'animate-[flap-flip-out_180ms_ease-in_forwards]'
              : phase === 'flipping-in'
              ? 'animate-[flap-flip-in_180ms_ease-out_forwards]'
              : '';

          return (
            <li
              key={result.itemId}
              className={`flex h-12 items-center gap-2 rounded-[10px] overflow-hidden ${rowVariant}${animClass ? ` ${animClass}` : ''}`}
              aria-label={`Rank ${result.trueRank}: ${result.name}${isAfter ? `, ${result.mark === 'check' ? 'exact' : result.mark}` : ''}`}
            >
              {/* Rank numeral tile */}
              <div
                className={`flap-tile h-full w-12 shrink-0 text-lg font-black ${isAfter && result.mark === 'check' ? 'bg-signal text-bg' : 'bg-board text-soft'}`}
                style={{ borderRadius: 10, minHeight: 0, backgroundImage: 'none' }}
                aria-hidden="true"
              >
                {result.trueRank}
              </div>

              {/* Item content */}
              <div className="flex flex-1 items-center gap-2 px-2 min-w-0 h-full">
                <span className="text-xl leading-none shrink-0" aria-hidden="true">{displayResult.emoji}</span>
                <span className="font-black text-sm truncate flex-1">{displayResult.name}</span>
                {isAfter ? (
                  <>
                    <span className="shrink-0 text-xs font-medium opacity-70">{formatValue(result.value, result.unit)}</span>
                    <span
                      className="shrink-0 text-lg font-black leading-none w-6 text-right"
                      aria-label={result.mark}
                    >
                      {MARK_SYMBOL[result.mark]}
                    </span>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Progress line */}
      {!reducedMotion ? (
        <div className="h-0.5 w-full shrink-0 overflow-hidden rounded-full bg-groove">
          <div className="h-full bg-signal" style={{ animation: 'progressBar 2.3s linear forwards' }} />
        </div>
      ) : null}

      <button type="button" className="press btn-primary shrink-0 font-bold" onClick={skip}>
        {reducedMotion ? 'See your score' : 'Tap to skip'}
      </button>
    </section>
  );
};
