import { useEffect, useRef } from 'react';
import { formatValue, type ItemResult, type RoundSummary } from '../../shared/game';
import { useReducedMotion } from '../hooks/useReducedMotion';

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

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      onDoneRef.current();
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <section className="flex h-full flex-col gap-3 overflow-hidden px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header>
        <p className="text-xs font-black tracking-[0.22em] text-tangerine uppercase">True order</p>
        <h1 className="text-2xl leading-none font-black">{summary.rule}</h1>
      </header>
      <ol className="flex min-h-0 flex-1 flex-col justify-center gap-2">
        {ordered.map((result, index) => (
          <li
            key={result.itemId}
            className="rise flex items-center gap-2 border-2 border-ink bg-card px-3 py-2"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <span className="w-6 text-lg font-black">{result.trueRank}</span>
            <span className="text-xl leading-none" aria-hidden="true">
              {result.emoji}
            </span>
            <span className="min-w-0 flex-1 truncate font-black">{result.name}</span>
            <span className="shrink-0 text-sm font-bold">{formatValue(result.value, result.unit)}</span>
          </li>
        ))}
      </ol>
      {!reducedMotion ? (
        <div className="h-1 w-full shrink-0 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-tangerine" style={{ animation: 'progressBar 3.2s linear forwards' }} />
        </div>
      ) : null}
      <button type="button" className="press chunk shrink-0 bg-tangerine font-black text-ink" onClick={finish}>
        {reducedMotion ? 'See your score' : 'Skip →'}
      </button>
    </section>
  );
};
