import { difficultyLabel, formatUtcDate, type HomeResponse, type TopicDailySummary } from '../../shared/game';
import { Surface } from './primitives';

function grade(s: number): string {
  if (s >= 90) return 'S';
  if (s >= 75) return 'A';
  if (s >= 55) return 'B';
  if (s >= 35) return 'C';
  return 'D';
}

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
            <h1 className="text-[2rem] leading-none font-black font-display text-tile">Lock &amp; Rank</h1>
            {home.streak > 0 ? (
              <p className="mt-0.5 text-sm font-bold text-signal">{home.streak} day streak</p>
            ) : (
              <p className="mt-0.5 text-sm font-medium text-soft">Build a streak — play every day</p>
            )}
          </div>
          <button
            type="button"
            className="press btn-secondary mt-1 px-3 py-0 text-sm font-bold"
            style={{ minHeight: 36, borderRadius: 8 }}
            onClick={onOpenPicker}
            aria-label="Edit topics"
          >
            Topics
          </button>
        </div>
        <p className="mt-1 text-sm font-medium text-soft">{formatUtcDate(home.date)}</p>
      </header>

      <div className="mt-4 flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3">
          <TopicCard summary={home.mix} label="Daily Mix" emoji="🎲" isMix onPlay={() => onPlay('mix')} />
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
  isMix?: boolean;
  onPlay: () => void;
};

const TopicCard = ({ summary, label, emoji, isMix, onPlay }: TopicCardProps) => (
  <Surface className="overflow-hidden">
    <button type="button" className="press w-full p-3 text-left" onClick={onPlay}>
      <p className="text-xs font-bold text-soft">
        {emoji} {label}
      </p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`leading-tight font-black text-tile ${isMix ? 'text-xl' : 'text-base'}`}>{summary.roundTitle}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-soft">{summary.rule}</p>
          <p className="mt-0.5 text-xs font-medium text-soft">{difficultyLabel(summary.difficulty)}</p>
        </div>
        {summary.completed ? (
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-signal">Done</p>
            {summary.score !== null ? (
              <>
                <p className="text-xl font-black tabular-nums leading-none text-tile">
                  {summary.score}
                  <span className="text-sm font-bold text-soft">/100</span>
                </p>
                <p className={`text-sm font-black leading-none ${summary.score >= 75 ? 'text-signal' : 'text-soft'}`}>
                  {grade(summary.score)}
                </p>
              </>
            ) : null}
          </div>
        ) : (
          <span
            className="press btn-primary shrink-0 px-3 py-1 text-sm font-bold"
            style={{ minHeight: 36, borderRadius: 8 }}
            aria-hidden="true"
          >
            Play
          </span>
        )}
      </div>
    </button>
  </Surface>
);
