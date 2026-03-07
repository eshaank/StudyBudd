import { DEMO_DECKS, DEMO_CARDS, TABS } from "../app/dashboard/flashcards/constants/flashcards";

describe("Flashcard constants", () => {
  describe("DEMO_DECKS", () => {
    it("has at least one deck", () => {
      expect(DEMO_DECKS.length).toBeGreaterThan(0);
    });

    it("each deck has required fields", () => {
      for (const deck of DEMO_DECKS) {
        expect(deck).toHaveProperty("id");
        expect(deck).toHaveProperty("title");
        expect(deck).toHaveProperty("subtitle");
        expect(deck).toHaveProperty("color");
        expect(typeof deck.id).toBe("string");
        expect(typeof deck.title).toBe("string");
      }
    });

    it("deck ids are unique", () => {
      const ids = DEMO_DECKS.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("DEMO_CARDS", () => {
    it("has at least one card", () => {
      expect(DEMO_CARDS.length).toBeGreaterThan(0);
    });

    it("each card has front and back", () => {
      for (const card of DEMO_CARDS) {
        expect(card).toHaveProperty("front");
        expect(card).toHaveProperty("back");
        expect(typeof card.front).toBe("string");
        expect(typeof card.back).toBe("string");
      }
    });

    it("each card references a valid deck", () => {
      const deckIds = new Set(DEMO_DECKS.map((d) => d.id));
      for (const card of DEMO_CARDS) {
        expect(deckIds.has(card.deckId)).toBe(true);
      }
    });
  });

  describe("TABS", () => {
    it("has the expected tabs", () => {
      const keys = TABS.map((t) => t.key);
      expect(keys).toContain("flashcards");
      expect(keys).toContain("learn");
      expect(keys).toContain("test");
      expect(keys).toContain("match");
    });

    it("each tab has key, label, and icon", () => {
      for (const tab of TABS) {
        expect(tab).toHaveProperty("key");
        expect(tab).toHaveProperty("label");
        expect(tab).toHaveProperty("icon");
      }
    });
  });
});
