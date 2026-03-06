"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import StudyAIPanel from "../../../components/StudyAIPanel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function FlashcardsPage() {
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [folders, setFolders] = useState([]);
  const [genTitle, setGenTitle] = useState("");
  const [genFolderId, setGenFolderId] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genNumCards, setGenNumCards] = useState(10);
  const [generating, setGenerating] = useState(false);
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
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  useEffect(() => {
    if (activeDeckId) {
      setIndex(0);
      setIsFlipped(false);
      fetchCards(activeDeckId);
    }
  }, [activeDeckId, fetchCards]);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const token = await getAccessToken();
      const body = { num_cards: genNumCards };
      if (genTitle.trim()) body.title = genTitle.trim();
      if (genFolderId) body.folder_id = genFolderId;
      if (genTopic.trim()) body.topic = genTopic.trim();

      const res = await fetch(`${API_URL}/api/flashcards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Generation failed");
      }
      const newSet = await res.json();
      setShowGenerate(false);
      setGenTitle("");
      setGenTopic("");
      setGenFolderId("");
      setGenNumCards(10);
      await fetchDecks();
      setActiveDeckId(newSet.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(deckId) {
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

  useEffect(() => {
    function onKeyDown(e) {
      if (showGenerate) return;
      // Don't intercept shortcuts when typing in an input or textarea (e.g. AI panel)
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
  const disabledPrev = index <= 0;
  const disabledNext = index >= cards.length - 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&display=swap');

        .fc-root {
          font-family: 'DM Sans', sans-serif;
          --accent: ${accentColor};
        }

        .fc-card-scene { perspective: 1800px; }

        .fc-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.645, 0.045, 0.355, 1.000);
        }

        .fc-card-inner.flipped { transform: rotateY(180deg); }

        .fc-card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .fc-card-back { transform: rotateY(180deg); }

        .fc-progress-fill {
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--accent);
        }

        .fc-nav-btn {
          transition: all 0.2s ease;
        }

        .fc-nav-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .fc-card-glow {
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
          box-shadow: 0 0 0 1px var(--accent), 0 8px 40px color-mix(in srgb, var(--accent) 20%, transparent);
        }

        .fc-card-wrapper:hover .fc-card-glow { opacity: 1; }
        .fc-serif { font-family: 'DM Serif Display', serif; }

        .fc-shine {
          background: linear-gradient(135deg,
            rgba(255,255,255,0.0) 40%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.0) 60%
          );
        }

        .fc-sources-panel {
          animation: fc-slide-up 0.2s ease-out;
        }

        @keyframes fc-slide-up {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fc-root" style={{ "--accent": accentColor }}>

        {/* Compact toolbar */}
        <div className={`flex items-center gap-2 min-w-0 ${showAIPanel ? "mb-3" : "mb-5"}`}>
          {/* Deck dropdown */}
          {decks.length > 0 && (
            <div className="relative">
              <select
                value={activeDeckId ?? ""}
                onChange={(e) => setActiveDeckId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm font-semibold bg-white cursor-pointer focus:outline-none transition-all"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.title} ({d.card_count})</option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowAIPanel((v) => !v)}
              className="px-3 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: showAIPanel ? accentColor : "#fff",
                color: showAIPanel ? "#fff" : "#475569",
                borderColor: showAIPanel ? accentColor : "#e2e8f0",
              }}
            >
              {showAIPanel ? "Hide AI" : "Ask AI"}
            </button>
            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-3 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              + Generate
            </button>
            {deck && (
              <button
                onClick={() => handleDelete(deck.id)}
                className="px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all"
              >
                Delete
              </button>
            )}
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Main content row: card viewer + AI panel */}
        <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Empty state */}
        {!decks.length ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No flashcard sets yet</h3>
            <p className="text-slate-500 mb-5">Generate flashcards from your uploaded documents to start studying.</p>
            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: PALETTE[0] }}
            >
              + Generate Flashcards
            </button>
          </div>
        ) : (

          /* Main Card Viewer */
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white shadow-sm overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                <span className="text-sm font-semibold text-slate-700">Flashcards</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm text-slate-500 tabular-nums">
                  {cards.length ? `${index + 1} of ${cards.length}` : "0 of 0"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFlipped(false)}
                  disabled={!current}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Front
                </button>
                <button
                  onClick={flip}
                  disabled={!current}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition hover:opacity-90"
                  style={{ background: accentColor }}
                >
                  Flip <kbd className="ml-1 opacity-75 font-mono">Space</kbd>
                </button>
                <button
                  onClick={() => setIsFlipped(true)}
                  disabled={!current}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Card area */}
            <div className={showAIPanel ? "p-4" : "p-5 sm:p-8"}>
              {!current ? (
                <div className="h-64 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No cards in this deck yet.</p>
                </div>
              ) : (
                <div className={`mx-auto max-w-3xl ${showAIPanel ? "space-y-3" : "space-y-5"}`}>

                  {/* 3-D flip card */}
                  <div className="fc-card-wrapper relative cursor-pointer" onClick={flip}>
                    <div className="fc-card-glow" style={{ "--accent": accentColor }} />

                    <div className={`fc-card-scene ${showAIPanel ? "h-[280px]" : "h-[340px] sm:h-[400px]"}`}>
                      <div className={`fc-card-inner h-full ${isFlipped ? "flipped" : ""}`}>

                        {/* Front */}
                        <div className="fc-card-face fc-card-front rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
                          <div className="fc-shine absolute inset-0 rounded-3xl pointer-events-none" />
                          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 40%, transparent))` }} />
                          <div className={`h-full flex flex-col ${showAIPanel ? "px-6 pt-5 pb-5" : "px-8 sm:px-12 pt-7 pb-8"}`}>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                                style={{ background: `color-mix(in srgb, ${accentColor} 10%, white)`, color: accentColor }}
                              >
                                Question
                              </span>
                              <span className="text-xs text-slate-400 font-medium">tap to reveal →</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center py-3">
                              <p className={`fc-serif text-center leading-snug text-slate-900 ${showAIPanel ? "text-xl sm:text-2xl" : "text-2xl sm:text-[2rem]"}`}>
                                {current.front}
                              </p>
                            </div>
                            {!showAIPanel && (
                              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
                                <span><kbd className="font-mono font-bold text-slate-500">Space</kbd> to flip</span>
                                <span className="opacity-40">·</span>
                                <span><kbd className="font-mono font-bold text-slate-500">←→</kbd> to navigate</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Back */}
                        <div className="fc-card-face fc-card-back rounded-3xl border overflow-hidden shadow-md"
                          style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`, background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 6%, white), white)` }}
                        >
                          <div className="h-1 w-full" style={{ background: accentColor }} />
                          <div className={`h-full flex flex-col ${showAIPanel ? "px-6 pt-5 pb-5" : "px-8 sm:px-12 pt-7 pb-8"}`}>
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                                style={{ background: accentColor }}
                              >
                                Answer
                              </span>
                              <span className="text-xs text-slate-400 font-medium">← tap to go back</span>
                            </div>

                            {/* Answer text — shrink when sources panel is open */}
                            <div className={`flex-1 flex items-center justify-center py-3 transition-all duration-200 ${showCardSources ? "max-h-[100px] overflow-y-auto" : ""}`}>
                              <p className={`text-center leading-relaxed text-slate-800 font-medium ${showAIPanel ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
                                {current.back}
                              </p>
                            </div>

                            {/* Sources toggle + expandable panel */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              {showCardSources && (sources.source_documents?.length > 0 || sources.source_chunks?.length > 0) && (
                                <div className="mb-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm p-3 space-y-2 max-h-[140px] overflow-y-auto fc-sources-panel">
                                  {sources.source_documents?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source files</p>
                                      <ul className="space-y-0.5">
                                        {sources.source_documents.map((doc) => (
                                          <li key={doc.id} className="flex items-center gap-1.5 text-xs text-slate-700 truncate" title={doc.original_filename}>
                                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                            {doc.original_filename}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {sources.source_chunks?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supporting chunks</p>
                                      <ul className="space-y-1.5">
                                        {sources.source_chunks.map((chunk, i) => {
                                          const docName = sources.source_documents?.find((d) => d.id === chunk.document_id)?.original_filename ?? "Document";
                                          return (
                                            <li key={i} className="text-[11px] text-slate-600 leading-tight">
                                              <span className="font-semibold text-slate-700">{docName}</span>
                                              <span className="text-slate-400 ml-1">chunk {chunk.chunk_index + 1}</span>
                                              {chunk.content_preview && (
                                                <p className="mt-0.5 text-slate-500 line-clamp-2 text-[10px]">{chunk.content_preview}</p>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setShowCardSources((v) => !v)}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all"
                                  style={{
                                    borderColor: showCardSources ? accentColor : "#e2e8f0",
                                    color: showCardSources ? accentColor : "#94a3b8",
                                    background: showCardSources ? `color-mix(in srgb, ${accentColor} 8%, white)` : "transparent",
                                  }}
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                  {showCardSources ? "Hide Sources" : "Sources"}
                                </button>
                                <span className="text-[11px] text-slate-400 italic">
                                  Can you explain this in your own words?
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={prev}
                      disabled={disabledPrev}
                      className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Prev
                    </button>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="fc-progress-fill h-full rounded-full" style={{ width: `${progressPct}%`, background: accentColor }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                        <span>{index + 1}</span>
                        <span>{cards.length}</span>
                      </div>
                    </div>
                    <button
                      onClick={next}
                      disabled={disabledNext}
                      className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ background: disabledNext ? "#cbd5e1" : accentColor }}
                    >
                      Next
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>

                  {/* Dot indicators */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {cards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setIsFlipped(false); setShowCardSources(false); setIndex(i); }}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === index ? "20px" : "6px",
                          height: "6px",
                          background: i === index ? accentColor : "#cbd5e1",
                        }}
                        aria-label={`Go to card ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <StudyAIPanel
            context={{
              type: "flashcard",
              question: current?.front,
              answer: isFlipped ? current?.back : undefined,
              deckTitle: deck?.title,
            }}
            accentColor={accentColor}
            theme="light"
            onClose={() => setShowAIPanel(false)}
          />
        )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm pt-3">
          <Link href="/dashboard/files" className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Files
          </Link>
          <Link
            href="/dashboard/quizzes"
            className="flex items-center gap-1.5 font-semibold transition-colors group hover:opacity-80"
            style={{ color: accentColor }}
          >
            Quizzes
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !generating && setShowGenerate(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Generate Flashcards</h2>
              <p className="text-sm text-slate-500 mt-1">Create flashcards from your uploaded documents.</p>
            </div>

            <form onSubmit={handleGenerate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Set name
                </label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. Biology Ch. 5, Midterm Review"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Folder
                </label>
                <select
                  value={genFolderId}
                  onChange={(e) => setGenFolderId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All documents</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Prompt the agent to generate flashcards on:
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Chapter 3 vocabulary"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Number of cards: {genNumCards}
                </label>
                <input
                  type="range"
                  min={3}
                  max={30}
                  value={genNumCards}
                  onChange={(e) => setGenNumCards(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>3</span>
                  <span>30</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerate(false)}
                  disabled={generating}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: "#6366f1" }}
                >
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
