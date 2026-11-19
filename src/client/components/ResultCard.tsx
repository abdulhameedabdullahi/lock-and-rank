import { useEffect, useRef, useState } from 'react';
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
import { requestShare, requestSubscribe } from '../api';

function useCountdown(): string {
  const [label, setLabel] = useState('');
  const compute = () => {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = Math.max(0, midnight.getTime() - now.getTime());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };
  useEffect(() => {
    setLabel(compute());
    const id = window.setInterval(() => setLabel(compute()), 60000);
    return () => window.clearInterval(id);
  }, []);
  return label;
}

type ResultCardProps = {
  summary: RoundSummary;
  score: number;
  results: ItemResult[];
  crowdData?: Record<string, CrowdItem> | null;
  rawScore?: number | null;
  hintPenalty?: number | null;
  topicEmoji?: string | undefined;
  topicLabel?: string | undefined;
  topicId?: string | undefined;
  subredditName?: string | undefined;
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
  topicId,
  subredditName,
  onPlayNext,
  nextTopicEmoji,
  nextTopicLabel,
  onMakeItYours,
  onBackToHome,
  onShowStats,
  onShowArchive,
}: ResultCardProps) => {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const countdown = useCountdown();
  const byRank = [...results].sort((a, b) => a.trueRank - b.trueRank);

  const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
  const gradeClass = score >= 75 ? 'text-tangerine' : 'text-ink';

  const hintWasUsed = (hintPenalty ?? 0) > 0;

  const shareText = buildShareText({
    date: summary.date,
    roundNumber: summary.roundNumber,
    category: summary.category,
    score,
    marks: results.map((r) => r.mark),
    hintUsed: hintWasUsed,
  });

  const scoreSuggestions: string[] =
    score >= 90
      ? ['Nailed it! All 5 exact!', 'Perfect score 🔒', 'Got every rank right']
      : score >= 55
      ? ['Solid round!', 'Tricky one today', 'Better than the crowd?']
      : ['This one got me', 'Harder than it looks!', 'Still learning the ranks'];

  const openShare = () => {
    setShareOpen(true);
    setShareError(null);
    setTimeout(() => captionRef.current?.focus(), 50);
  };

  const onShare = async () => {
    if (sharing || !topicId) return;
    setSharing(true);
    setShareError(null);
    try {
      const result = await requestShare(topicId, caption);
      setSharedUrl(result.commentUrl || result.permalink);
      setShareOpen(false);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Could not post comment.');
    } finally {
      setSharing(false);
    }
  };

  const onSubscribe = async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      await requestSubscribe();
      setSubscribed(true);
      showToast(`Joined r/${subredditName ?? 'the community'}!`);
    } catch {
      showToast('Could not subscribe — try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const onCopy = () => {
    void copyText(shareText).then((ok) => {
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
          {countdown ? (
            <p className="mt-2 text-xs font-semibold text-ink-soft text-center">
              Next round in {countdown}
            </p>
          ) : null}
          {onPlayNext ? (
            <button
              type="button"
              className="press chunk mt-2 w-full bg-tangerine text-base font-black text-ink"
              onClick={onPlayNext}
            >
              {nextTopicEmoji} Next: {nextTopicLabel ?? 'Next topic'}
            </button>
          ) : null}
          {sharedUrl ? (
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press chunk mt-2 flex w-full items-center justify-center gap-1.5 bg-card font-black text-ink text-sm"
            >
              Shared ✓ — View comment
            </a>
          ) : shareOpen && topicId ? (
            <div className="mt-2 chunk p-3 flex flex-col gap-2">
              <p className="text-xs font-black text-tangerine uppercase tracking-[0.14em]">Post as comment</p>
              <pre className="text-[10px] font-mono leading-snug text-ink-soft whitespace-pre-wrap break-words select-none bg-paper p-2 rounded">
                {shareText}
              </pre>
              <div className="flex flex-wrap gap-1.5">
                {scoreSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="press rounded border border-line bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft"
                    onClick={() => setCaption(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                ref={captionRef}
                className="w-full resize-none rounded border border-line bg-paper p-2 text-sm font-semibold text-ink placeholder:text-ink-soft focus:outline-none focus:border-tangerine"
                rows={2}
                maxLength={140}
                placeholder="Add a caption… (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <p className="text-right text-[10px] font-semibold text-ink-soft">{caption.length}/140</p>
              {shareError ? <p className="text-xs font-semibold text-tangerine">{shareError}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="press chunk flex-1 bg-tangerine font-black text-ink"
                  disabled={sharing}
                  onClick={() => void onShare()}
                >
                  {sharing ? 'Posting…' : 'Post comment'}
                </button>
                <button
                  type="button"
                  className="press chunk bg-card px-3 font-black text-ink"
                  onClick={() => { setShareOpen(false); setShareError(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : topicId ? (
            <div className="mt-2 flex gap-2">
              <button type="button" className="press chunk flex-1 bg-tangerine font-black text-ink" onClick={openShare}>
                Share to comments
              </button>
              <button type="button" className="press chunk bg-card px-3 font-black text-ink" onClick={onCopy}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          ) : (
            <button type="button" className="press chunk mt-2 w-full bg-tangerine font-black text-ink" onClick={onCopy}>
              {copied ? 'Copied' : 'Copy result'}
            </button>
          )}
          {subredditName && !subscribed ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-soft">
                Join r/{subredditName} for daily rounds
              </p>
              <button
                type="button"
                className="press chunk shrink-0 bg-card px-3 py-1 text-xs font-black text-ink"
                disabled={subscribing}
                onClick={() => void onSubscribe()}
              >
                {subscribing ? '…' : 'Join'}
              </button>
            </div>
          ) : null}
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
