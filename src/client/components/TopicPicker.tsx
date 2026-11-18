import { useState } from 'react';
import type { HomeResponse } from '../../shared/game';
import { readError, requestSetPreferences } from '../api';

type TopicPickerProps = {
  home: HomeResponse;
  initialSelected: string[];
  showHint: boolean;
  onSaved: (categoryIds: string[]) => void;
  onDismiss: () => void;
};

function readHintSeen(): boolean {
  try { return localStorage.getItem('lnr:picker-hint-seen') === '1'; } catch { return false; }
}
function writeHintSeen(): void {
  try { localStorage.setItem('lnr:picker-hint-seen', '1'); } catch { /* ignore */ }
}

export const TopicPicker = ({ home, initialSelected, showHint, onSaved, onDismiss }: TopicPickerProps) => {
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(readHintSeen);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(home.topics.map((t) => t.topicId)));

  const dismissHint = () => {
    setHintDismissed(true);
    writeHintSeen();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const ids = [...selected];
      await requestSetPreferences(ids);
      onSaved(ids);
    } catch (err) {
      setSaveError(readError(err, 'Could not save. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <section className="flex h-full flex-col overflow-hidden px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header className="shrink-0">
        <button type="button" className="mb-3 text-sm font-black text-tangerine" onClick={onDismiss}>
          ← Back
        </button>
        <h1 className="text-3xl leading-none font-black">Your topics</h1>
        <p className="mt-1 text-sm font-semibold text-ink-soft">
          A fresh round for each topic alongside Daily Mix every day.
        </p>
      </header>

      {showHint && !hintDismissed ? (
        <div className="mt-3 shrink-0 chunk p-3">
          <p className="text-sm font-black">Pick what you know</p>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft leading-snug">
            Tap topics to toggle them on or off. You&apos;ll get one extra round per picked topic.
          </p>
          <button type="button" className="mt-2 text-xs font-black text-tangerine" onClick={dismissHint}>
            Got it
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {home.topics.map((topic) => {
            const on = selected.has(topic.topicId);
            return (
              <button
                key={topic.topicId}
                type="button"
                aria-pressed={on}
                className={`press flex items-center gap-2 border-2 border-ink p-3 text-left ${
                  on ? 'bg-ink text-paper' : 'bg-card text-ink'
                }`}
                onClick={() => toggle(topic.topicId)}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {topic.emoji}
                </span>
                <span className="flex-1 text-sm font-black leading-tight">{topic.label}</span>
                {on ? (
                  <span className="text-xs font-black" aria-hidden="true">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 shrink-0 flex flex-col gap-2">
        {saveError ? <p role="alert" className="text-sm font-bold">{saveError}</p> : null}
        <button
          type="button"
          className="press chunk bg-card font-black text-ink"
          onClick={selectAll}
          disabled={saving}
        >
          Surprise me (all topics)
        </button>
        <button
          type="button"
          className="press chunk bg-tangerine font-black text-ink disabled:opacity-50 disabled:shadow-none"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving
            ? 'Saving…'
            : selectedCount === 0
            ? 'Save (Daily Mix only)'
            : `Save ${selectedCount} topic${selectedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </section>
  );
};
