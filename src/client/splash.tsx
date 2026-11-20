import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { readError, requestHome } from './api';
import { formatUtcDate, type HomeResponse } from '../shared/game';

const TITLE_CHARS = ['L', 'O', 'C', 'K', '&', 'R', 'A', 'N', 'K'];
const AMP_INDEX = 4; // the "&" tile gets signal yellow

const TitleTiles = () => (
  <div className="flex items-center gap-1" aria-label="Lock and Rank" role="heading" aria-level={1}>
    {TITLE_CHARS.map((ch, i) => {
      const isAmp = i === AMP_INDEX;
      const isGap = i === AMP_INDEX - 1; // gap before &
      return (
        <div
          key={i}
          className={`flap-tile text-xl font-display w-9 h-12 ${isAmp ? 'bg-signal text-bg' : 'bg-tile text-bg'} ${isGap ? 'mr-1' : ''}`}
          aria-hidden="true"
        >
          {ch}
        </div>
      );
    })}
  </div>
);

export const Splash = () => {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestHome()
      .then(setHome)
      .catch((err) => setError(readError(err, "Could not load today's round.")));
  }, []);

  const mix = home?.mix;
  const buttonLabel = mix?.completed ? "See today's score" : "Play today's round";

  return (
    <div className="flex h-full flex-col justify-center gap-4 overflow-hidden bg-bg px-4 py-4">
      <TitleTiles />

      <div>
        {home ? (
          <>
            <p className="text-sm text-soft font-medium">{formatUtcDate(home.date)}</p>
            <p className="mt-1 text-lg leading-tight font-black text-tile">{mix?.roundTitle ?? '…'}</p>
          </>
        ) : error ? (
          <p className="text-sm font-bold text-miss">{error}</p>
        ) : (
          <p className="text-sm text-soft">Loading…</p>
        )}
      </div>

      <button
        type="button"
        className="press btn-primary w-full font-bold text-base"
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
