import { difficultyLabel, formatUtcDate, type HomeResponse, type TopicDailySummary } from '../../shared/game';

type HomeScreenProps = {
  home: HomeResponse;
  onPlay: (topicId: string) => void;
  onOpenPicker: () => void;
};

export const HomeScreen = ({ home, onPlay, onOpenPicker }: HomeScreenProps) => {
  const savedTopics = home.topics.filter((t) => home.preferences.includes(t.topicId));

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-tangerine uppercase">Daily game</p>
            <h1 className="text-[2rem] leading-none font-black">Lock &amp; Rank</h1>
          </div>
          <button
            type="button"
            className="press chunk mt-1 px-3 text-sm font-black text-ink"
            onClick={onOpenPicker}
            aria-label="Edit topics"
          >
            ✦ Topics
          </button>
        </div>
        {home.streak > 0 ? (
          <p className="mt-1 text-sm font-black text-tangerine">{home.streak} day streak 🔥</p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-ink-soft">Build a streak — play every day!</p>
        )}
        <p className="mt-1 text-sm font-semibold text-ink-soft">{formatUtcDate(home.date)}</p>
      </header>

      <div className="mt-4 flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3">
          <TopicCard summary={home.mix} label="Daily Mix" emoji="🎲" onPlay={() => onPlay('mix')} />
          {savedTopics.map((t) => (
            <TopicCard key={t.topicId} summary={t} label={t.label} emoji={t.emoji} onPlay={() => onPlay(t.topicId)} />
          ))}
        </div>
      </div>
    </section>
  );
};

type TopicCardProps = {
  summary: TopicDailySummary;
  label: string;
  emoji: string;
  onPlay: () => void;
};

const TopicCard = ({ summary, label, emoji, onPlay }: TopicCardProps) => (
  <button type="button" className="press chunk w-full p-3 text-left" onClick={onPlay}>
    <p className="text-xs font-black tracking-[0.14em] text-tangerine uppercase">
      {emoji} {label}
    </p>
    <div className="mt-1 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg leading-tight font-black">{summary.roundTitle}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink-soft">{summary.rule}</p>
        <p className="mt-0.5 text-xs font-semibold text-ink-soft">{difficultyLabel(summary.difficulty)}</p>
      </div>
      {summary.completed ? (
        <div className="shrink-0 text-right">
          <p className="text-xs font-black text-tangerine">Done ✓</p>
          {summary.score !== null ? (
            <p className="text-xl font-black tabular-nums leading-none">
              {summary.score}
              <span className="text-sm font-bold text-ink-soft">/100</span>
            </p>
          ) : null}
        </div>
      ) : (
        <span className="press chunk shrink-0 bg-tangerine px-3 py-1 text-sm font-black text-ink">
          Play
        </span>
      )}
    </div>
  </button>
);
