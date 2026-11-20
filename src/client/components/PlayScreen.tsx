import { useEffect, useState } from 'react';
import { SLOT_COUNT, type PublicItem, type PublicPlacement, type RoundSummary } from '../../shared/game';

/* Inline SVG padlock (locked slot) */
const PadlockIcon = () => (
  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
    <rect x="1" y="6" width="10" height="8" rx="2" fill="currentColor" />
    <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

type PlayScreenProps = {
  summary: RoundSummary;
  placements: PublicPlacement[];
  currentItem: PublicItem;
  pending: boolean;
  error: string | null;
  onLock: (slot: number) => void;
  hintAvailable: boolean;
  hintUsed: boolean;
  hintEliminatedSlots: number[];
  onHint: () => void;
};

export const PlayScreen = ({
  summary,
  placements,
  currentItem,
  pending,
  error,
  onLock,
  hintAvailable,
  hintUsed,
  hintEliminatedSlots,
  onHint,
}: PlayScreenProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const used = new Map(placements.map((p) => [p.slot, p]));
  const step = placements.length + 1;
  const slots = [1, 2, 3, 4, 5];

  useEffect(() => {
    const usedSlots = new Set(placements.map((p) => p.slot));
    const handler = (e: KeyboardEvent) => {
      if (pending || confirming) return;
      const num = Number(e.key);
      if (Number.isInteger(num) && num >= 1 && num <= 5 && !usedSlots.has(num) && !hintEliminatedSlots.includes(num)) {
        setSelected(num);
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && selected !== null) {
        e.preventDefault();
        onLock(selected);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pending, confirming, placements, hintEliminatedSlots, selected, onLock]);

  const hintAnnouncement =
    hintEliminatedSlots.length > 0
      ? `Hint used. Rank slots ${hintEliminatedSlots.map((s) => `#${s}`).join(' and ')} ruled out.`
      : '';

  return (
    <section className="flex h-full flex-col gap-2 overflow-hidden bg-bg px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="shrink-0">
        <p className="text-sm font-medium text-soft">{summary.category}</p>
        <h1 className="truncate text-base leading-tight font-black text-tile">{summary.rule}</h1>
        <p className="text-xs font-medium text-soft">
          Item {step} of {SLOT_COUNT} — 1 is first
        </p>
      </header>

      {/* Progress bar */}
      <div className="flex shrink-0 gap-1" aria-hidden="true">
        {slots.map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full ${
              n < step ? 'bg-signal' : n === step ? 'bg-soft' : 'bg-groove'
            }`}
          />
        ))}
      </div>

      {/* SR announcements */}
      <p className="sr-only" aria-live="polite">
        Item {step} of {SLOT_COUNT}. {currentItem.name}. Choose a rank, then lock it in.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {hintAnnouncement}
      </p>

      {/* Current item tag — above the board */}
      <div
        className="shrink-0 flap-tile bg-tile text-bg px-4 h-16 flex items-center gap-3"
        style={{ borderRadius: 16 }}
        aria-label={`Lock this: ${currentItem.name}`}
      >
        <span className="text-4xl leading-none shrink-0" aria-hidden="true">{currentItem.emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-bg opacity-60">Lock this into a rank</p>
          <p className="truncate text-lg leading-tight font-black text-bg">{currentItem.name}</p>
        </div>
      </div>

      {/* The board — 5 stacked rows */}
      <div
        className="board shrink-0"
        role="group"
        aria-label="Rank slots"
      >
        {slots.map((slot) => {
          const filled = used.get(slot);
          const isSelected = selected === slot;
          const isEliminated = hintEliminatedSlots.includes(slot);

          if (filled) {
            return (
              <div
                key={slot}
                className="flex h-12 items-center gap-2 overflow-hidden rounded-[10px]"
                aria-label={`Rank ${slot}, ${filled.name}, locked`}
              >
                {/* Rank numeral tile */}
                <div className="flap-tile bg-signal text-bg h-full w-12 shrink-0 text-lg font-black" style={{ borderRadius: 10, minHeight: 0 }}>
                  {slot}
                </div>
                {/* Item content */}
                <div className="flap-tile bg-tile text-bg flex-1 h-full px-2 justify-start gap-2" style={{ borderRadius: 10, minHeight: 0 }}>
                  <PadlockIcon />
                  <span className="text-lg leading-none" aria-hidden="true">{filled.emoji}</span>
                  <span className="text-sm font-black truncate">{filled.name}</span>
                </div>
              </div>
            );
          }

          if (isEliminated) {
            return (
              <div
                key={slot}
                className="flex h-12 items-center gap-2 overflow-hidden rounded-[10px]"
                aria-label={`Rank ${slot}, ruled out by hint`}
                aria-disabled="true"
              >
                <div className="flap-tile bg-groove text-soft h-full w-12 shrink-0 text-lg font-black opacity-60" style={{ borderRadius: 10, minHeight: 0 }}>
                  {slot}
                </div>
                <div className="flap-tile bg-groove text-soft flex-1 h-full justify-start px-3 gap-2 opacity-60" style={{ borderRadius: 10, minHeight: 0 }}>
                  <span className="text-sm font-black" aria-hidden="true">✕</span>
                  <span className="text-xs font-medium">Ruled out</span>
                </div>
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
              className="press flex h-12 w-full items-center gap-2 overflow-hidden rounded-[10px] text-left"
              onClick={() => setSelected(slot)}
            >
              <div
                className={`flap-tile h-full w-12 shrink-0 text-lg font-black ${isSelected ? 'bg-signal text-bg' : 'bg-board text-tile'}`}
                style={{ borderRadius: 10, minHeight: 0 }}
                aria-hidden="true"
              >
                {slot}
              </div>
              <div
                className={`flap-tile flex-1 h-full ${isSelected ? 'bg-signal text-bg' : 'bg-board text-soft'}`}
                style={{ borderRadius: 10, minHeight: 0 }}
                aria-hidden="true"
              >
                {isSelected ? (
                  <span className="text-xs font-bold">Selected</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {hintAvailable && !confirming ? (
        <button
          type="button"
          className="press btn-secondary shrink-0 w-full text-sm font-bold"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          Hint (−5 pts)
        </button>
      ) : hintAvailable && confirming ? (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="press btn-primary flex-1 text-sm font-bold"
            onClick={() => { setConfirming(false); onHint(); }}
          >
            Use hint
          </button>
          <button
            type="button"
            className="press btn-secondary text-sm font-bold px-4"
            style={{ minHeight: 44, width: 'auto' }}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          className="shrink-0 w-full flex items-center justify-center rounded-[8px] border-2 border-groove text-sm font-medium text-groove opacity-60"
          style={{ minHeight: 44 }}
          aria-disabled="true"
        >
          {hintUsed ? 'Hint used' : 'Hint: items 1–2 only'}
        </div>
      )}

      {/* Error */}
      {error ? (
        <p role="alert" className="shrink-0 text-sm font-bold text-miss">{error}</p>
      ) : null}

      {/* Lock CTA */}
      <button
        type="button"
        className="press btn-primary shrink-0 w-full text-base font-bold disabled:opacity-40"
        disabled={selected === null || pending}
        onClick={() => {
          if (selected === null) return;
          onLock(selected);
        }}
      >
        {pending ? 'Locking…' : selected === null ? 'Pick a rank' : `Lock into rank ${selected}`}
      </button>
    </section>
  );
};
