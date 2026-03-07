import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";
import { PALETTE } from "../constants/flashcards";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

export function useFlashcardNav() {
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("flashcards");
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate modal state
  const [showGenerate, setShowGenerate] = useState(false);
  const [folders, setFolders] = useState([]);

  // Sources state
  const [sources, setSources] = useState({ source_documents: [], source_chunks: [] });
  const [showCardSources, setShowCardSources] = useState(false);

  const deck = useMemo(() => decks.find((d) => d.id === activeDeckId), [decks, activeDeckId]);
  const current = useMemo(() => {
    if (!cards.length) return null;
    return cards[Math.min(index, cards.length - 1)];
  }, [cards, index]);

  const accentColor = useMemo(() => {
    if (!deck) return PALETTE[0];
    const idx = decks.indexOf(deck);
    return PALETTE[idx % PALETTE.length];
  }, [deck, decks]);

  const fetchDecks = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/flashcards/sets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch flashcard sets");
      const data = await res.json();
      setDecks(data);
      if (data.length && !activeDeckId) setActiveDeckId(data[0].id);
    } catch (err) {
      console.error("Error fetching decks:", err);
    } finally {
      setLoading(false);
    }
  }, [activeDeckId]);

  const fetchCards = useCallback(async (deckId) => {
    if (!deckId) return;
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/flashcards/sets/${deckId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data = await res.json();
      setCards(data.cards || []);
      setSources({
        source_documents: data.source_documents ?? [],
        source_chunks: data.source_chunks ?? [],
      });
    } catch (err) {
      console.error("Error fetching cards:", err);
      setCards([]);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : data.folders ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  useEffect(() => {
    if (activeDeckId) {
      setIndex(0);
      setIsFlipped(false);
      setShowCardSources(false);
      fetchCards(activeDeckId);
    }
  }, [activeDeckId, fetchCards]);

  function flip() {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowCardSources(false);
    setIsFlipped((v) => !v);
    setTimeout(() => setIsAnimating(false), 500);
  }

  function prev() {
    setIsFlipped(false);
    setShowCardSources(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setIsFlipped(false);
    setShowCardSources(false);
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }

  function goToCard(i) {
    setIsFlipped(false);
    setShowCardSources(false);
    setIndex(i);
  }

  async function deleteDeck(deckId) {
    if (!confirm("Delete this flashcard set?")) return;
    try {
      const token = await getAccessToken();
      await fetch(`${API_URL}/api/flashcards/sets/${deckId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeDeckId === deckId) {
        setActiveDeckId(null);
        setCards([]);
      }
      await fetchDecks();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function handleGenerate({ title, folderId, topic, numCards }) {
    const token = await getAccessToken();
    const body = { num_cards: numCards };
    if (title?.trim()) body.title = title.trim();
    if (folderId) body.folder_id = folderId;
    if (topic?.trim()) body.topic = topic.trim();

    const res = await fetch(`${API_URL}/api/flashcards/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Generation failed");
    }
    const newSet = await res.json();
    await fetchDecks();
    setActiveDeckId(newSet.id);
    return newSet;
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (showGenerate) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.code === "Space") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, isAnimating, showGenerate]);

  const progressPct = cards.length ? ((index + 1) / cards.length) * 100 : 0;

  return {
    decks, activeDeckId, setActiveDeckId, tab, setTab,
    index, isFlipped, setIsFlipped, loading,
    deck, cards, current, accentColor, progressPct,
    flip, prev, next, goToCard,
    disabledPrev: index <= 0,
    disabledNext: index >= cards.length - 1,
    // API actions
    deleteDeck, handleGenerate, fetchFolders,
    // Generate modal
    showGenerate, setShowGenerate, folders,
    // Sources
    sources, showCardSources, setShowCardSources,
  };
}
