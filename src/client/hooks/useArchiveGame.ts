import { useCallback, useState } from 'react';
import {
  SLOT_COUNT,
  markForDistance,
  pointsForDistance,
  type ArchiveRound,
  type ArchiveRoundItem,
  type ItemResult,
  type PublicItem,
  type PublicPlacement,
  type RoundSummary,
} from '../../shared/game';

export type ArchiveScreen = 'prompt' | 'play' | 'reveal' | 'result';

type ArchivePlacement = { itemId: string; slot: number };

function summaryFromRound(round: ArchiveRound): RoundSummary {
  return {
    date: round.date,
    roundNumber: round.roundNumber,
    category: round.category,
    rule: round.rule,
    unit: round.unit,
    difficulty: round.difficulty,
  };
}

function computeResults(round: ArchiveRound, placements: ArchivePlacement[]): ItemResult[] {
  return round.order.map((id) => {
    const item = round.items.find((it) => it.id === id) as ArchiveRoundItem;
    const placement = placements.find((p) => p.itemId === id) as ArchivePlacement;
    const distance = Math.abs(placement.slot - item.trueRank);
    return {
      itemId: item.id,
      name: item.name,
      emoji: item.emoji,
      value: item.value,
      unit: round.unit,
      chosenSlot: placement.slot,
      trueRank: item.trueRank,
      distance,
      points: pointsForDistance(distance),
      mark: markForDistance(distance),
    };
  });
}

export function useArchiveGame(round: ArchiveRound | null) {
  const [screen, setScreen] = useState<ArchiveScreen>('prompt');
  const [placements, setPlacements] = useState<ArchivePlacement[]>([]);
  const [results, setResults] = useState<ItemResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const summary: RoundSummary | null = round ? summaryFromRound(round) : null;

  const currentItem: PublicItem | null =
    round && screen === 'play' && placements.length < SLOT_COUNT
      ? (() => {
          const id = round.order[placements.length];
          const item = id ? round.items.find((it) => it.id === id) : null;
          return item ? { id: item.id, name: item.name, emoji: item.emoji } : null;
        })()
      : null;

  const publicPlacements: PublicPlacement[] =
    round
      ? placements.map((p) => {
          const item = round.items.find((it) => it.id === p.itemId);
          return { itemId: p.itemId, name: item?.name ?? p.itemId, emoji: item?.emoji ?? '', slot: p.slot };
        })
      : [];

  const start = useCallback(() => {
    if (round) setScreen('play');
  }, [round]);

  const lock = useCallback(
    (slot: number) => {
      if (!round || screen !== 'play') return;
      const id = round.order[placements.length];
      if (!id) return;
      const usedSlots = new Set(placements.map((p) => p.slot));
      if (usedSlots.has(slot)) return;
      const next = [...placements, { itemId: id, slot }];
      setPlacements(next);
      if (next.length === SLOT_COUNT) {
        const computed = computeResults(round, next);
        const total = computed.reduce((s, r) => s + r.points, 0);
        setResults(computed);
        setScore(total);
        setScreen('reveal');
      }
    },
    [round, screen, placements]
  );

  const showResult = useCallback(() => setScreen('result'), []);

  const reset = useCallback(() => {
    setScreen('prompt');
    setPlacements([]);
    setResults(null);
    setScore(null);
  }, []);

  return { summary, screen, currentItem, placements: publicPlacements, results, score, start, lock, showResult, reset };
}
