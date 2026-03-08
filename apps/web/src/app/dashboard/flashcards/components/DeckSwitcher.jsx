import { PALETTE } from "../constants/flashcards";

export default function DeckSwitcher({ decks, activeDeckId, setActiveDeckId, onDelete }) {
  return (
    <div className="flex flex-wrap gap-2">
      {decks.map((d, idx) => {
        const color = PALETTE[idx % PALETTE.length];
        const active = d.id === activeDeckId;
        return (
          <div key={d.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveDeckId(d.id)}
              className="fc-deck-pill relative px-3.5 py-1.5 rounded-full text-sm font-semibold border"
              style={{
                "--accent": color,
                borderColor: active ? color : undefined,
                color: active ? "#fff" : "#475569",
                background: active ? color : "#fff",
              }}
            >
              {d.title} ({d.card_count ?? 0})
            </button>
            {active && onDelete && (
              <button
                onClick={() => onDelete(d.id)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold px-1"
                title="Delete set"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
