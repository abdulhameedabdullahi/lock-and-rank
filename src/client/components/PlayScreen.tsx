import { useState } from 'react';
import { SLOT_COUNT, type PublicItem, type PublicPlacement, type RoundSummary } from '../../shared/game';

type PlayScreenProps = {
  summary: RoundSummary;
  placements: PublicPlacement[];
  currentItem: PublicItem;
  pending: boolean;
  error: string | null;
  onLock: (slot: number) => void;
};

export const PlayScreen = ({
  summary,
  placements,
  currentItem,
  pending,
  error,
  onLock,
}: PlayScreenProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const used = new Map(placements.map((placement) => [placement.slot, placement]));
  const step = placements.length + 1;
  const slots = [1, 2, 3, 4, 5];

  return (
    <section className="flex h-full flex-col gap-2 overflow-hidden px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <header className="shrink-0">
        <p className="truncate text-xs font-black tracking-[0.16em] text-tangerine uppercase">
          {summary.category}
        </p>
        <h1 className="truncate text-lg leading-tight font-black">{summary.rule}</h1>
        <p className="text-sm font-semibold text-ink-soft">
          Item {step} of {SLOT_COUNT} · 1 is first
        </p>
      </header>
      <p className="sr-only" aria-live="polite">
        Item {step} of {SLOT_COUNT}. {currentItem.name}. Choose a rank, then lock it in.
      </p>
      <div className="grid shrink-0 grid-cols-5 gap-1.5" role="group" aria-label="Rank slots">
        {slots.map((slot) => {
          const filled = used.get(slot);
          const isSelected = selected === slot;
          if (filled) {
            return (
              <div
                key={slot}
                className="flex h-16 flex-col items-center justify-center border-2 border-ink bg-ink text-paper"
                aria-label={`Rank ${slot}, ${filled.name}, locked`}
              >
                <span className="text-[10px] font-black tracking-wide">#{slot}</span>
                <span className="text-xl leading-none" aria-hidden="true">
                  {filled.emoji}
                </span>
              </div>
            );
          }
          return (
            <button
              key={slot}
              type="button"
              disabled={pending}
              aria-pressed={isSelected}
              aria-label={`Rank ${slot}${isSelected ? ', selected' : ''}`}
              className={`press flex h-16 flex-col items-center justify-center border-2 border-ink ${
                isSelected ? 'bg-tangerine text-ink' : 'bg-card text-ink'
              }`}
              onClick={() => setSelected(slot)}
            >
              <span className="text-[10px] font-black tracking-wide">#{slot}</span>
              <span className="text-lg leading-none font-black">{slot}</span>
            </button>
          );
        })}
      </div>
      <article className="chunk flex min-h-0 flex-1 flex-col items-center justify-center px-3 text-center">
        <p className="text-xs font-black tracking-[0.18em] text-ink-soft uppercase">Lock this</p>
        <p className="mt-1 text-5xl leading-none" aria-hidden="true">
          {currentItem.emoji}
        </p>
        <h2 className="mt-2 text-2xl leading-tight font-black">{currentItem.name}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Tap a slot, then lock it in.</p>
      </article>
      {error ? (
        <p role="alert" className="shrink-0 text-sm font-bold text-ink">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="press chunk shrink-0 bg-tangerine text-base font-black text-ink disabled:bg-line disabled:shadow-none"
        disabled={selected === null || pending}
        onClick={() => {
          if (selected === null) return;
          onLock(selected);
        }}
      >
        {pending ? 'Locking…' : selected === null ? 'Choose a slot' : `Lock into #${selected}`}
      </button>
    </section>
  );
};
