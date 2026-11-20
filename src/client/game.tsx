import './index.css';

import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchiveListScreen } from './components/ArchiveListScreen';
import { HomeScreen } from './components/HomeScreen';
import { PlayScreen } from './components/PlayScreen';
import { PromptScreen } from './components/PromptScreen';
import { ResultCard } from './components/ResultCard';
import { RevealScreen } from './components/RevealScreen';
import { StatsScreen } from './components/StatsScreen';
import { TopicPicker } from './components/TopicPicker';
import { useArchiveGame } from './hooks/useArchiveGame';
import { useGame } from './hooks/useGame';
import { useHome } from './hooks/useHome';
import { requestArchiveRound, readError } from './api';
import type { ArchiveRound } from '../shared/game';

type AppMode = 'loading' | 'home' | 'playing' | 'picker' | 'stats' | 'archive-list' | 'archive-game';

export const App = () => {
  const { home, loading: homeLoading, reload: reloadHome } = useHome();

  const [mode, setMode] = useState<AppMode>('loading');
  const [activeTopicId, setActiveTopicId] = useState('mix');
  const [pickerFromPost, setPickerFromPost] = useState(false);
  const [archiveRound, setArchiveRound] = useState<ArchiveRound | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const game = useGame(activeTopicId);
  const archive = useArchiveGame(archiveRound);

  useEffect(() => {
    if (homeLoading || mode !== 'loading') return;
    if (home && home.preferences.length > 0) {
      setMode('home'); // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      setMode('playing');
    }
  }, [homeLoading, home, mode]);

  useEffect(() => {
    if (game.session?.phase === 'complete' && mode === 'playing') {
      void reloadHome();
    }
  }, [game.session?.phase, mode, reloadHome]);

  const nextUnplayed = useMemo(() => {
    if (!home) return null;
    for (const id of home.preferences) {
      if (id === activeTopicId) continue;
      const t = home.topics.find((x) => x.topicId === id);
      if (t && !t.completed) return t;
    }
    return null;
  }, [home, activeTopicId]);

  const playTopic = useCallback((topicId: string) => {
    setActiveTopicId(topicId);
    setMode('playing');
  }, []);

  const goHome = useCallback(() => {
    setMode('home');
    void reloadHome();
  }, [reloadHome]);

  const loadArchiveRound = useCallback(async (index: number) => {
    setArchiveLoading(true);
    setArchiveError(null);
    try {
      const round = await requestArchiveRound(index);
      setArchiveRound(round);
      setMode('archive-game');
    } catch (err) {
      setArchiveError(readError(err, 'Could not load archive round.'));
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  const isNewPlayer = !home || home.preferences.length === 0;
  const hasHome = home && home.preferences.length > 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (mode === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
        <p className="text-lg font-black">Loading…</p>
      </div>
    );
  }

  // ── Archive game ──────────────────────────────────────────────────────────
  if (mode === 'archive-game') {
    if (archiveLoading) {
      return (
        <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
          <p className="text-lg font-black">Loading round…</p>
        </div>
      );
    }
    if (archiveError || !archive.summary) {
      return (
        <div className="flex h-full flex-col items-start justify-center gap-4 bg-paper px-4 text-ink">
          <h1 className="text-3xl font-black">Lock &amp; Rank</h1>
          <p className="font-semibold">{archiveError ?? 'Could not load archive round.'}</p>
          <button type="button" className="press chunk bg-tangerine px-4 font-black text-ink" onClick={() => setMode('archive-list')}>
            ← Archive
          </button>
        </div>
      );
    }
    if (archive.screen === 'prompt') {
      return (
        <div className="flex h-full flex-col overflow-hidden">
          <div className="shrink-0 px-4 pt-3">
            <button type="button" className="text-sm font-black text-tangerine" onClick={() => setMode('archive-list')}>
              ← Archive
            </button>
          </div>
          <PromptScreen summary={archive.summary} onStart={archive.start} />
        </div>
      );
    }
    if (archive.screen === 'play' && archive.currentItem) {
      return (
        <PlayScreen
          key={archive.currentItem.id}
          summary={archive.summary}
          placements={archive.placements}
          currentItem={archive.currentItem}
          pending={false}
          error={null}
          onLock={(slot) => archive.lock(slot)}
          hintAvailable={false}
          hintUsed={false}
          hintEliminatedSlots={[]}
          onHint={() => { /* archive has no hint */ }}
        />
      );
    }
    if (archive.screen === 'reveal' && archive.results && archive.score !== null) {
      return <RevealScreen summary={archive.summary} results={archive.results} onDone={archive.showResult} />;
    }
    if (archive.screen === 'result' && archive.results && archive.score !== null) {
      return (
        <div className="flex h-full flex-col overflow-hidden">
          <ResultCard
            summary={archive.summary}
            score={archive.score}
            results={archive.results}
            crowdData={null}
            onShowStats={() => setMode('stats')}
            onShowArchive={() => setMode('archive-list')}
          />
          <div className="shrink-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="press w-full bg-card font-black text-ink"
              onClick={() => { archive.reset(); setMode('archive-list'); }}
            >
              ← Archive list
            </button>
          </div>
        </div>
      );
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  if (mode === 'stats') {
    return <StatsScreen onBack={hasHome ? goHome : () => setMode('playing')} />;
  }

  // ── Archive list ─────────────────────────────────────────────────────────
  if (mode === 'archive-list') {
    return (
      <ArchiveListScreen
        onSelect={(index) => void loadArchiveRound(index)}
        onBack={hasHome ? goHome : () => setMode('playing')}
      />
    );
  }

  // ── Topic picker ─────────────────────────────────────────────────────────
  if (mode === 'picker') {
    if (!home) {
      return (
        <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
          <p className="text-lg font-black">Loading…</p>
        </div>
      );
    }
    return (
      <TopicPicker
        home={home}
        initialSelected={home.preferences}
        showHint={pickerFromPost}
        onSaved={() => {
          void reloadHome();
          setPickerFromPost(false);
          setMode('home');
        }}
        onDismiss={() => {
          setPickerFromPost(false);
          setMode(hasHome ? 'home' : 'playing');
        }}
      />
    );
  }

  // ── Home screen ──────────────────────────────────────────────────────────
  if (mode === 'home') {
    if (!home) {
      return (
        <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
          <p className="text-lg font-black">Loading…</p>
        </div>
      );
    }
    return (
      <HomeScreen
        home={home}
        onPlay={playTopic}
        onOpenPicker={() => setMode('picker')}
      />
    );
  }

  // ── Playing a round ───────────────────────────────────────────────────────
  if (game.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
        <p className="text-lg font-black">Loading today&apos;s round…</p>
      </div>
    );
  }

  const session = game.session;

  if (!session) {
    return (
      <div className="flex h-full flex-col items-start justify-center gap-4 bg-paper px-4 text-ink">
        <h1 className="text-3xl font-black">Lock &amp; Rank</h1>
        <p className="font-semibold">{game.error ?? "Could not load today's round."}</p>
        <button type="button" className="press chunk bg-tangerine px-4 font-black text-ink" onClick={() => void game.load()}>
          Try again
        </button>
      </div>
    );
  }

  if (game.screen === 'prompt') {
    return (
      <PromptScreen
        summary={session.summary}
        onStart={game.start}
        onBack={hasHome ? goHome : undefined}
      />
    );
  }

  if (game.screen === 'play' && session.currentItem) {
    const hintEliminatedSlots =
      session.hintState !== null && session.hintState.itemIndex === session.placements.length
        ? session.hintState.eliminatedSlots
        : [];
    return (
      <PlayScreen
        key={session.currentItem.id}
        summary={session.summary}
        placements={session.placements}
        currentItem={session.currentItem}
        pending={game.pending}
        error={game.error}
        onLock={(slot) => { void game.lock(slot); }}
        hintAvailable={session.hintAvailable}
        hintUsed={session.hintState !== null}
        hintEliminatedSlots={hintEliminatedSlots}
        onHint={() => { void game.hint(); }}
      />
    );
  }

  if (game.screen === 'reveal' && session.results && session.score !== null) {
    return <RevealScreen summary={session.summary} results={session.results} onDone={game.showResult} />;
  }

  if (game.screen === 'result' && session.results && session.score !== null) {
    const activeTopic = home?.topics.find((t) => t.topicId === activeTopicId);
    const topicEmoji = activeTopicId === 'mix' ? '🎲' : activeTopic?.emoji;
    const topicLabel = activeTopicId === 'mix' ? 'Daily Mix' : activeTopic?.label;

    return (
      <ResultCard
        summary={session.summary}
        score={session.score}
        results={session.results}
        crowdData={session.crowdData}
        rawScore={session.rawScore}
        hintPenalty={session.hintPenalty}
        topicEmoji={topicEmoji}
        topicLabel={topicLabel}
        topicId={activeTopicId}
        subredditName={game.subredditName}
        leaderboard={game.leaderboard}
        onPlayNext={nextUnplayed ? () => playTopic(nextUnplayed.topicId) : undefined}
        nextTopicEmoji={nextUnplayed?.emoji}
        nextTopicLabel={nextUnplayed?.label}
        onMakeItYours={activeTopicId === 'mix' && isNewPlayer ? () => { setPickerFromPost(true); setMode('picker'); } : undefined}
        onBackToHome={hasHome ? goHome : undefined}
        onShowStats={() => setMode('stats')}
        onShowArchive={() => setMode('archive-list')}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-paper px-4 text-ink">
      <button type="button" className="press chunk bg-tangerine px-4 font-black text-ink" onClick={() => void game.load()}>
        Reload round
      </button>
    </div>
  );
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
