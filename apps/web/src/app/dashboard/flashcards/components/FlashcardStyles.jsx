export default function FlashcardStyles({ accentColor }) {
  return (
    <style>{`
      .fc-root {
        --accent: ${accentColor};
        --card-bg: white;
      }
      .dark .fc-root {
        --card-bg: #1e293b;
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

      .fc-tab-active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: var(--accent);
        border-radius: 2px;
      }

      .fc-deck-pill {
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .fc-deck-pill::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--accent);
        opacity: 0;
        transition: opacity 0.2s;
      }

      .fc-deck-pill.active::before { opacity: 1; }

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

      .fc-shine {
        background: linear-gradient(135deg,
          rgba(255,255,255,0.0) 40%,
          rgba(255,255,255,0.06) 50%,
          rgba(255,255,255,0.0) 60%
        );
      }
    `}</style>
  );
}
