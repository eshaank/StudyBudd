import { DEMO_DECKS } from "../constants/flashcards";

export default function DeckSwitcher({ activeDeckId, setActiveDeckId }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEMO_DECKS.map((d) => {
        const active = d.id === activeDeckId;
        return (
          <button
            key={d.id}
            onClick={() => setActiveDeckId(d.id)}
            className="fc-deck-pill relative px-3.5 py-1.5 rounded-full text-sm font-semibold border"
            style={{
              "--accent": d.color,
              borderColor: active ? d.color : "#e2e8f0",
              color: active ? "#fff" : "#475569",
              background: active ? d.color : "#fff",
            }}
          >
            {d.title}
          </button>
        );
      })}
    </div>
  );
}
