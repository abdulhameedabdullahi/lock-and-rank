import { MARK_SYMBOL, type ShareMark } from '../../shared/game';

const URL_RE = /https?:\/\/\S+/gi;
const MENTION_RE = /@\w+|u\/\w+|r\/\w+/gi;

export function sanitizeCaption(raw: string): string {
  return raw
    .trim()
    .replace(URL_RE, '')
    .replace(MENTION_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/** Short result line appended to user-written comments. Format varies by time to avoid templates. */
export function buildResultLine(score: number, marks: ShareMark[], hintUsed: boolean): string {
  const syms = marks.map((m) => MARK_SYMBOL[m]).join('');
  const hint = hintUsed ? ' 💡' : '';
  const v = Date.now() % 3;
  if (v === 0) return `${syms}${hint} ${score}/100`;
  if (v === 1) return `${score}/100 · ${syms}${hint}`;
  return `${syms}${hint} — ${score} pts`;
}
