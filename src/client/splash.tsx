import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { readError, requestHome } from './api';
import { formatUtcDate, type HomeResponse } from '../shared/game';

export const Splash = () => {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestHome()
      .then(setHome)
      .catch((err) => setError(readError(err, "Could not load today's round.")));
  }, []);

  const mix = home?.mix;
  const savedTopics = home
    ? home.topics.filter((t) => home.preferences.includes(t.topicId))
    : [];
  const buttonLabel = mix?.completed ? "See today's score" : 'Play';

  return (
    <div className="flex h-full flex-col justify-center gap-3 overflow-hidden bg-paper px-4 py-3 text-ink">
      <div>
        <p className="text-xs font-black tracking-[0.22em] text-tangerine uppercase">Daily game</p>
        <h1 className="text-[2rem] leading-none font-black">Lock &amp; Rank</h1>
        {home && home.streak > 0 ? (
          <p className="mt-1 text-sm font-black text-tangerine">{home.streak} day streak 🔥</p>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-bold">{home ? formatUtcDate(home.date) : "Loading today's round"}</p>
        <p className="mt-1 text-xl leading-tight font-black">{mix?.roundTitle ?? '…'}</p>
        <p className="text-sm font-semibold text-ink-soft">{mix?.rule ?? ''}</p>
        {mix?.completed && mix.score !== null ? (
          <p className="mt-1 text-sm font-black">Scored {mix.score}/100</p>
        ) : null}
        {home && home.playersToday != null && home.playersToday > 0 ? (
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {home.playersToday.toLocaleString()} {home.playersToday === 1 ? 'player' : 'players'} today
          </p>
        ) : null}
        {savedTopics.length > 0 ? (
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Also today: {savedTopics.map((t) => `${t.emoji} ${t.label}`).join(' · ')}
          </p>
        ) : null}
        {error ? <p className="mt-1 text-sm font-bold">{error}</p> : null}
      </div>
      <button
        type="button"
        className="press chunk w-full bg-tangerine text-base font-black text-ink"
        onClick={(event) => requestExpandedMode(event.nativeEvent, 'game')}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');

createRoot(root).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
