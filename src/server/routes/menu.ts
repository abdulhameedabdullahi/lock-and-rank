import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { GameError } from '../game/errors';
import { resetToday } from '../game/service';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

menu.post('/reset-play', async (c) => {
  try {
    await resetToday();
    return c.json<UiResponse>({
      showToast: "Today's plays and preferences are cleared. Refresh the post.",
    });
  } catch (error) {
    const message = error instanceof GameError ? error.message : "Could not reset today's play";
    console.error('Lock & Rank reset failed', error);
    return c.json<UiResponse>({ showToast: message }, 400);
  }
});

menu.post('/example-form', async (c) => {
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'exampleForm',
        form: {
          title: 'Example form',
          fields: [{ name: 'message', label: 'Message', type: 'string' }],
        },
      },
    },
    200
  );
});
