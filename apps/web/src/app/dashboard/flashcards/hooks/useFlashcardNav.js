import { useEffect, useMemo, useState } from "react";
import { DEMO_DECKS, DEMO_CARDS } from "../constants/flashcards";

export function useFlashcardNav() {
  const [activeDeckId, setActiveDeckId] = useState(DEMO_DECKS[0].id);
  const [tab, setTab] = useState("flashcards");
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const deck = useMemo(() => DEMO_DECKS.find((d) => d.id === activeDeckId), [activeDeckId]);
  const cards = useMemo(() => DEMO_CARDS.filter((c) => c.deckId === activeDeckId), [activeDeckId]);
  const current = useMemo(() => {
    if (!cards.length) return null;
    return cards[Math.min(index, cards.length - 1)];
  }, [cards, index]);

  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [activeDeckId]);

  function flip() {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped((v) => !v);
    setTimeout(() => setIsAnimating(false), 500);
  }

  function prev() {
    setIsFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setIsFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }

  function goToCard(i) {
    setIsFlipped(false);
    setIndex(i);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " " || e.code === "Space") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, isAnimating]);

  const progressPct = cards.length ? ((index + 1) / cards.length) * 100 : 0;
  const accentColor = deck?.color ?? "#6366f1";

  return {
    activeDeckId, setActiveDeckId, tab, setTab,
    index, isFlipped, setIsFlipped,
    deck, cards, current, accentColor, progressPct,
    flip, prev, next, goToCard,
    disabledPrev: index <= 0,
    disabledNext: index >= cards.length - 1,
  };
}
