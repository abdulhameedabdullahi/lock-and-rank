import { useState } from 'react';
import { showToast } from '@devvit/web/client';
import {
  MARK_LABEL,
  MARK_SYMBOL,
  buildShareText,
  formatValue,
  type CrowdItem,
  type ItemResult,
  type RoundSummary,
  type ShareMark,
} from '../../shared/game';

type ResultCardProps = {
  summary: RoundSummary;
  score: number;
  results: ItemResult[];
  crowdData?: Record<string, CrowdItem> | null;
  rawScore?: number | null;
  hintPenalty?: number | null;
  topicEmoji?: string | undefined;
  topicLabel?: string | undefined;
  onPlayNext?: (() => void) | undefined;
  nextTopicEmoji?: string | undefined;
  nextTopicLabel?: string | undefined;
  onMakeItYours?: (() => void) | undefined;
  onBackToHome?: (() => void) | undefined;
  onShowStats?: (() => void) | undefined;
  onShowArchive?: (() => void) | undefined;
};

const markClass: Record<ShareMark, string> = {
  check: 'bg-tangerine text-ink',
  diamond: 'bg-ink text-paper',
  triangle: 'border-2 border-ink bg-card text-ink',
  cross: 'border-2 border-dashed border-ink bg-paper text-ink',
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

export const ResultCard = ({
  summary,
  score,
  results,
  crowdData,
  rawScore,
  hintPenalty,
  topicEmoji,
  topicLabel,
  onPlayNext,
  nextTopicEmoji,
  nextTopicLabel,
  onMakeItYours,
  onBackToHome,
  onShowStats,
  onShowArchive,
}: ResultCardProps) => {
  const [copied, setCopied] = useState(false);
  const byRank = [...results].sort((a, b) => a.trueRank - b.trueRank);

  const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
  const gradeClass = score >= 75 ? 'text-tangerine' : 'text-ink';

  const hintWasUsed = (hintPenalty ?? 0) > 0;

  const onCopy = () => {
    const text = buildShareText({
      date: summary.date,
      roundNumber: summary.roundNumber,
      category: summary.category,
      score,
      marks: results.map((result) => result.mark),
      hintUsed: hintWasUsed,
    });
    void copyText(text).then((ok) => {
      setCopied(ok);
      showToast(ok ? 'Result copied' : 'Could not copy');
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <article className="chunk flex min-h-0 flex-1 flex-col p-3">
        <header className="shrink-0">
          <p className="text-xs font-black tracking-[0.18em] text-tangerine uppercase">
            {topicEmoji && topicLabel ? `${topicEmoji} ${topicLabel}` : `Round ${summary.roundNumber}`}
          </p>
          <h1 className="text-xl leading-tight font-black">{summary.category}</h1>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="text-5xl leading-none font-black tabular-nums">
              {score}
              <span className="text-xl font-bold text-ink-soft">/100</span>
            </p>
            <span className={`text-3xl leading-none font-black ${gradeClass}`}>{grade}</span>
          </div>
          {hintWasUsed ? (
            <p className="mt-0.5 text-sm font-semibold text-ink-soft">
              💡 −{hintPenalty} hint{rawScore !== null && rawScore !== undefined ? ` · was ${rawScore}` : ''}
            </p>
          ) : null}
        </header>
        <ul className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {byRank.map((result) => {
            const crowd = crowdData?.[result.itemId];
            return (
              <li key={result.itemId} className="flex items-center gap-2 border-b border-line py-1.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center text-sm font-black ${markClass[result.mark]}`}
                  aria-label={MARK_LABEL[result.mark]}
                >
                  {MARK_SYMBOL[result.mark]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">
                    {result.emoji} {result.name}
                  </span>
                  <span className="block text-xs font-semibold text-ink-soft">
                    {formatValue(result.value, result.unit)} · true #{result.trueRank} · you #{result.chosenSlot} ·{' '}
                    {result.points} pts
                    {crowd ? ` · crowd avg #${crowd.avgSlot} · ${crowd.pctCorrect}% right` : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 shrink-0">
          <p className="text-xs font-black tracking-[0.14em] text-ink-soft uppercase">
            Share · order you saw them
          </p>
          <div className="mt-1 grid grid-cols-5 gap-1.5" aria-label="Spoiler-free result">
            {results.map((result) => (
              <div
                key={result.itemId}
                className={`flex h-11 items-center justify-center text-lg font-black ${markClass[result.mark]}`}
                aria-label={MARK_LABEL[result.mark]}
              >
                {MARK_SYMBOL[result.mark]}
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            ✓ exact · ◆ 1 off · ▲ 2 off · ✕ 3+
          </p>
          {onPlayNext ? (
            <button
              type="button"
              className="press chunk mt-2 w-full bg-tangerine text-base font-black text-ink"
              onClick={onPlayNext}
            >
              {nextTopicEmoji} Next: {nextTopicLabel ?? 'Next topic'}
            </button>
          ) : null}
          <button type="button" className="press chunk mt-2 w-full bg-tangerine font-black text-ink" onClick={onCopy}>
            {copied ? 'Copied' : 'Copy result'}
          </button>
          {onMakeItYours ? (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-sm font-black">Make it yours</p>
              <p className="mt-0.5 text-xs font-semibold text-ink-soft leading-snug">
                Pick topics you care about and get a custom round each day.
              </p>
              <button
                type="button"
                className="press chunk mt-2 w-full bg-tangerine font-black text-ink"
                onClick={onMakeItYours}
              >
                Choose my topics →
              </button>
            </div>
          ) : null}
          {(onBackToHome || onShowStats || onShowArchive) ? (
            <div className="mt-2 flex gap-2">
              {onBackToHome ? (
                <button type="button" className="press chunk flex-1 bg-card font-black text-ink" onClick={onBackToHome}>
                  Home
                </button>
              ) : null}
              {onShowStats ? (
                <button type="button" className="press chunk flex-1 bg-card font-black text-ink" onClick={onShowStats}>
                  My Stats
                </button>
              ) : null}
              {onShowArchive ? (
                <button type="button" className="press chunk flex-1 bg-card font-black text-ink" onClick={onShowArchive}>
                  Archive
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
};
