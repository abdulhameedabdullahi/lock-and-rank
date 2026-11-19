const URL_RE = /https?:\/\/\S+/gi;
const MENTION_RE = /@\w+|u\/\w+|r\/\w+/gi;

export function sanitizeCaption(raw: string): string {
  return raw
    .trim()
    .replace(URL_RE, '')
    .replace(MENTION_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}
