import { reddit } from '@devvit/web/server';
import { MIX_ID } from '../../shared/categories';
import { roundForDate, utcDateString } from '../game/rounds';

export const createPost = async (date?: string) => {
  const d = date ?? utcDateString(new Date());
  const { round, roundNumber } = roundForDate(MIX_ID, d);
  return await reddit.submitCustomPost({
    title: `Round #${roundNumber}: ${round.category}`,
  });
};
