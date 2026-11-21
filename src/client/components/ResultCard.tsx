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
import { requestShare, requestSubscribe, type LeaderboardData } from '../api';
import { Btn, Surface } from './primitives';

function useCountdown(): string {
  const compute = () => {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = Math.max(0, midnight.getTime() - now.getTime());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };
  const [label, setLabel] = useState(compute);
  useEffect(() => {
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
  leaderboard?: LeaderboardData | null;
  onPlayNext?: (() => void) | undefined;
  nextTopicEmoji?: string | undefined;
  nextTopicLabel?: string | undefined;
  onMakeItYours?: (() => void) | undefined;
  onBackToHome?: (() => void) | undefined;
  onShowStats?: (() => void) | undefined;
  onShowArchive?: (() => void) | undefined;
};

const markTileClass: Record<ShareMark, string> = {
  check:    'bg-signal text-bg',
  diamond:  'bg-tile text-bg',
  triangle: 'bg-groove text-soft',
  cross:    'bg-miss text-tile',
};

async function clipboardCopy(text: string): Promise<boolean> {
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
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if ('share' in navigator) {
    try {
      await (navigator as Navigator & { share: (d: { text: string; title: string }) => Promise<void> })
        .share({ text, title: 'Lock & Rank' });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  return (await clipboardCopy(text)) ? 'copied' : 'failed';
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
  leaderboard,
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
      ? ['Nailed it! All 5 exact!', 'Perfect score', 'Got every rank right']
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
    void shareOrCopy(shareText).then((result) => {
      setCopied(result !== 'failed');
      showToast(result === 'shared' ? 'Shared!' : result === 'copied' ? 'Result copied' : 'Could not copy');
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <Surface className="min-h-0 flex-1 overflow-y-auto p-3">

        {/* Score header */}
        <header className="shrink-0">
          <p className="text-xs font-bold text-soft">
            {topicEmoji && topicLabel ? `${topicEmoji} ${topicLabel}` : `Round ${summary.roundNumber}`}
          </p>
          <h1 className="text-lg leading-tight font-black text-tile">{summary.category}</h1>
          <div className="mt-1 flex items-baseline gap-3">
            <p className="font-display font-black tabular-nums text-tile" style={{ fontSize: '3.5rem', lineHeight: 1 }}>
              {score}
              <span className="text-xl font-bold text-soft">/100</span>
            </p>
            <span className={`text-3xl leading-none font-black font-display ${score >= 75 ? 'text-signal' : 'text-soft'}`}>
              {grade}
            </span>
          </div>
          {hintWasUsed ? (
            <p className="mt-0.5 text-sm font-medium text-soft">
              Hint used −{hintPenalty}{rawScore !== null && rawScore !== undefined ? ` (was ${rawScore})` : ''}
            </p>
          ) : null}
        </header>

        {/* Results list */}
        <ul className="mt-3">
          {byRank.map((result) => {
            const crowd = crowdData?.[result.itemId];
            const diff = Math.abs(result.chosenSlot - result.trueRank);
            const offsetLabel = diff === 0 ? 'Exact' : diff === 1 ? '1 off' : `${diff} off`;
            return (
              <li key={result.itemId} className="flex items-center gap-2 border-b border-groove py-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${markTileClass[result.mark]}`}
                  aria-label={MARK_LABEL[result.mark]}
                >
                  {MARK_SYMBOL[result.mark]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-tile">
                    {result.emoji} {result.name}
                  </p>
                  <p className="text-xs font-medium text-soft">
                    {formatValue(result.value, result.unit)} · {offsetLabel} · {result.points} pts
                    {crowd ? ` · crowd #${crowd.avgSlot}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Share grid */}
        <div className="mt-3">
          <p className="text-xs font-bold text-soft">Spoiler-free result</p>
          <div className="mt-1 grid grid-cols-5 gap-1.5" aria-label="Spoiler-free result">
            {results.map((result) => (
              <div
                key={result.itemId}
                className={`flex h-10 items-center justify-center rounded-lg text-base font-black ${markTileClass[result.mark]}`}
                aria-label={MARK_LABEL[result.mark]}
              >
                {MARK_SYMBOL[result.mark]}
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] font-medium text-soft">
            ✓ exact · ◆ 1 off · ▲ 2 off · ✕ 3+
          </p>

          {/* Score histogram */}
          {leaderboard && leaderboard.distributionTotal > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-soft">
                Score distribution · {leaderboard.distributionTotal} player{leaderboard.distributionTotal !== 1 ? 's' : ''}
              </p>
              <div className="mt-1 flex h-8 items-end gap-px" aria-label="Score distribution histogram">
                {leaderboard.distribution.map((count, i) => {
                  const maxCount = Math.max(...leaderboard.distribution, 1);
                  const heightPct = Math.max(8, Math.round((count / maxCount) * 100));
                  const myBucket = Math.min(9, Math.floor(score / 10));
                  const isMe = i === myBucket;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center justify-end"
                      title={`${i * 10}–${i === 9 ? 100 : i * 10 + 9}: ${count}`}
                    >
                      <div
                        className={`w-full rounded-t-sm ${isMe ? 'bg-signal' : 'bg-soft'}`}
                        style={{ height: `${heightPct}%`, opacity: isMe ? 1 : 0.4 }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-0.5 flex justify-between text-[9px] font-medium text-soft">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>
          ) : null}

          {/* Leaderboard */}
          {leaderboard && leaderboard.entries.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-soft">Today's top scores</p>
              <ol className="mt-1">
                {leaderboard.entries.slice(0, 5).map((entry) => (
                  <li key={entry.rank} className="flex items-center gap-2 border-b border-groove py-1 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs font-black tabular-nums text-soft">{entry.rank}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-tile">{entry.username}</span>
                    <span className="shrink-0 font-black tabular-nums text-tile">{entry.score}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {countdown ? (
            <p className="mt-2 text-xs font-medium text-soft text-center">
              Next round in {countdown}
            </p>
          ) : null}

          {/* Play next */}
          {onPlayNext ? (
            <Btn variant="primary" className="mt-2" onClick={onPlayNext}>
              {nextTopicEmoji} Play {nextTopicLabel ?? 'next topic'}
            </Btn>
          ) : null}

          {/* Share to comments */}
          {sharedUrl ? (
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press surface mt-2 flex w-full items-center justify-center gap-1.5 p-2 font-bold text-tile text-sm"
            >
              Shared — view comment
            </a>
          ) : shareOpen && topicId ? (
            <div className="mt-2 surface p-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-soft">Post as comment</p>
              <pre className="text-[10px] leading-snug text-soft whitespace-pre-wrap break-words select-none bg-groove rounded-lg p-2">
                {shareText}
              </pre>
              <div className="flex flex-wrap gap-1.5">
                {scoreSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="press rounded-lg border border-soft bg-groove px-2 py-1 text-xs font-medium text-tile"
                    onClick={() => setCaption(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                ref={captionRef}
                className="w-full resize-none rounded-lg border border-soft bg-groove p-2 text-sm font-medium text-tile placeholder:text-soft focus:outline-none focus:border-signal"
                rows={2}
                maxLength={140}
                placeholder="Add a caption… (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <p className="text-right text-[10px] font-medium text-soft">{caption.length}/140</p>
              {shareError ? <p className="text-xs font-medium text-miss">{shareError}</p> : null}
              <div className="flex gap-2">
                <Btn variant="primary" className="flex-1" disabled={sharing} onClick={() => void onShare()}>
                  {sharing ? 'Posting…' : 'Post comment'}
                </Btn>
                <button
                  type="button"
                  className="press btn-secondary px-4 text-sm font-bold"
                  style={{ width: 'auto' }}
                  onClick={() => { setShareOpen(false); setShareError(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : topicId ? (
            <div className="mt-2 flex gap-2">
              <Btn variant="primary" className="flex-1" onClick={openShare}>
                Share to comments
              </Btn>
              <button
                type="button"
                className="press btn-secondary px-3 text-sm font-bold"
                style={{ width: 'auto' }}
                aria-label="Copy result"
                onClick={onCopy}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          ) : (
            <Btn variant="primary" className="mt-2" onClick={onCopy}>
              {copied ? 'Shared' : 'Share result'}
            </Btn>
          )}

          {/* Join subreddit */}
          {subredditName && !subscribed ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-soft">
                Join r/{subredditName} for daily rounds
              </p>
              <button
                type="button"
                className="press btn-secondary shrink-0 px-3 py-1 text-xs font-bold"
                style={{ minHeight: 36, width: 'auto', borderRadius: 8 }}
                disabled={subscribing}
                onClick={() => void onSubscribe()}
              >
                {subscribing ? '…' : `Join r/${subredditName}`}
              </button>
            </div>
          ) : null}

          {/* Make it yours (new player CTA) */}
          {onMakeItYours ? (
            <div className="mt-3 border-t border-groove pt-3">
              <p className="text-sm font-black text-tile">Make it yours</p>
              <p className="mt-0.5 text-xs font-medium text-soft leading-snug">
                Pick topics you care about and get a custom round each day.
              </p>
              <Btn variant="primary" className="mt-2" onClick={onMakeItYours}>
                Choose my topics
              </Btn>
            </div>
          ) : null}

          {/* Nav buttons */}
          {(onBackToHome || onShowStats || onShowArchive) ? (
            <div className="mt-2 flex gap-2">
              {onBackToHome ? (
                <button type="button" className="press surface flex-1 py-2 text-sm font-bold text-tile" onClick={onBackToHome}>
                  Home
                </button>
              ) : null}
              {onShowStats ? (
                <button type="button" className="press surface flex-1 py-2 text-sm font-bold text-tile" onClick={onShowStats}>
                  My stats
                </button>
              ) : null}
              {onShowArchive ? (
                <button type="button" className="press surface flex-1 py-2 text-sm font-bold text-tile" onClick={onShowArchive}>
                  Past rounds
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
};
