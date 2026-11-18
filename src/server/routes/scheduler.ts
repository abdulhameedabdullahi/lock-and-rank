import { Hono } from 'hono';
import type { TaskResponse } from '@devvit/scheduler';
import { createPost } from '../core/post';

export const scheduler = new Hono();

scheduler.post('/create-daily-post', async (c) => {
  try {
    try {
      await c.req.json();
    } catch {
      // body is optional for cron tasks
    }
    const post = await createPost();
    console.log(`Daily post created: ${post.id}`);
    return c.json<TaskResponse>({});
  } catch (error) {
    console.error('Failed to create daily post:', error);
    return c.json<TaskResponse>({}, 500);
  }
});
