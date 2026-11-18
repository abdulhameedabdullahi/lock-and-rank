export type Category = {
  id: string;
  label: string;
  emoji: string;
};

/** Special id for the shared Daily Mix round. Users cannot select this. */
export const MIX_ID = 'mix';

/**
 * All user-selectable topic categories.
 * To add a new category: add an entry here and add rounds with the matching topicId.
 */
export const CATEGORIES: Category[] = [
  { id: 'tech', label: 'Tech & Gadgets', emoji: '💻' },
  { id: 'anime', label: 'Anime & Manga', emoji: '🎌' },
  { id: 'movies', label: 'Movies & TV', emoji: '🎬' },
  { id: 'games', label: 'Video Games', emoji: '🎮' },
  { id: 'soccer', label: 'Soccer', emoji: '⚽' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'science', label: 'Science & Space', emoji: '🔭' },
  { id: 'geography', label: 'Geography & World', emoji: '🌍' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'wildfacts', label: 'Wild Facts', emoji: '🤯' },
];

/** All valid topicId values including "mix". */
export const ALL_TOPIC_IDS: string[] = [MIX_ID, ...CATEGORIES.map((c) => c.id)];

/** Returns true for any valid topic id (including "mix"). */
export function isTopicId(value: unknown): value is string {
  return typeof value === 'string' && ALL_TOPIC_IDS.includes(value);
}

/** Returns true for user-selectable category ids (excluding "mix"). */
export function isSelectableCategoryId(value: unknown): value is string {
  return typeof value === 'string' && CATEGORIES.some((c) => c.id === value);
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
