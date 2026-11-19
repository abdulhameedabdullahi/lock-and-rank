import { Hono } from 'hono';
import type { ArchiveListResponse, ArchiveRoundResponse, ErrorResponse, StatsResponse } from '../../shared/game';
import { MIX_ID } from '../../shared/categories';
import { GameError } from '../game/errors';
import {
  getDailyLeaderboard,
  getArchiveRound,
  getHomeData,
  getInit,
  getPreferences,
  getStats,
  listArchiveRounds,
  parsePlaceRequest,
  placeItem,
  resetToday,
  resetTodayForTopic,
  setPreferences,
  shareResult,
  subscribeToSub,
  useHint,
} from '../game/service';

export const api = new Hono();

function errorBody(error: unknown): { body: ErrorResponse; status: 400 | 409 | 500 } {
  if (error instanceof GameError) {
    return { body: { status: 'error', message: error.message }, status: error.status };
  }
  console.error('Lock & Rank request failed', error);
  return { body: { status: 'error', message: 'Something went wrong.' }, status: 500 };
}

api.get('/init', async (c) => {
  try {
    const topicId = c.req.query('category') ?? MIX_ID;
    return c.json(await getInit(topicId));
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/place', async (c) => {
  try {
    const topicId = c.req.query('category') ?? MIX_ID;
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      payload = null;
    }
    return c.json(await placeItem(parsePlaceRequest(payload), topicId));
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/home', async (c) => {
  try {
    return c.json(await getHomeData());
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/preferences', async (c) => {
  try {
    return c.json(await getPreferences());
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/preferences', async (c) => {
  try {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      payload = null;
    }
    const body = payload as Record<string, unknown> | null;
    const categoryIds = body !== null && typeof body === 'object' ? body['categories'] : undefined;
    return c.json(await setPreferences(categoryIds));
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/stats', async (c) => {
  try {
    const stats = await getStats();
    return c.json<StatsResponse>({ type: 'stats', stats });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/leaderboard', async (c) => {
  try {
    const topicId = c.req.query('category') ?? MIX_ID;
    const date = c.req.query('date');
    const data = await getDailyLeaderboard(topicId, date);
    return c.json({ type: 'leaderboard', ...data });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/share', async (c) => {
  try {
    const topicId = c.req.query('category') ?? MIX_ID;
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      payload = null;
    }
    const body = payload as Record<string, unknown> | null;
    const caption = typeof body?.caption === 'string' ? body.caption : '';
    return c.json(await shareResult(topicId, caption));
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/subscribe', async (c) => {
  try {
    await subscribeToSub();
    return c.json({ type: 'subscribed' });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/hint', async (c) => {
  try {
    const topicId = c.req.query('category') ?? MIX_ID;
    return c.json(await useHint(topicId));
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.post('/reset', async (c) => {
  try {
    const topicId = c.req.query('category');
    if (topicId) {
      await resetTodayForTopic(topicId);
    } else {
      await resetToday();
    }
    return c.json({ type: 'reset' });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/archive/list', (c) => {
  try {
    const rounds = listArchiveRounds();
    return c.json<ArchiveListResponse>({ type: 'archive-list', rounds });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});

api.get('/archive/round', (c) => {
  try {
    const indexParam = c.req.query('index');
    const index = indexParam !== undefined ? parseInt(indexParam, 10) : NaN;
    if (!Number.isInteger(index) || index < 0) {
      return c.json<ErrorResponse>({ status: 'error', message: 'Provide a valid round index.' }, 400);
    }
    const round = getArchiveRound(index);
    return c.json<ArchiveRoundResponse>({ type: 'archive-round', round });
  } catch (error) {
    const failure = errorBody(error);
    return c.json(failure.body, failure.status);
  }
});
