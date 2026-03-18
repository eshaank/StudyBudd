export default function QuizStyles() {
  return (
    <style>{`
      /* ── Quiz: inherits from dashboard container ── */
      .qz-root { color: #1e293b; }
      .dark .qz-root { color: #f1f5f9; }

      /* ── Progress bar ── */
      .qz-prog-meta {
        display: flex; justify-content: space-between;
        font-size: 0.72rem; font-weight: 600;
        color: #94a3b8; margin-bottom: 8px;
      }
      .dark .qz-prog-meta { color: #475569; }

      .qz-prog-track {
        height: 4px; border-radius: 99px; overflow: hidden; margin-bottom: 1.5rem;
        background: #e2e8f0;
      }
      .dark .qz-prog-track { background: rgba(255,255,255,0.08); }

      .qz-prog-fill {
        height: 100%; border-radius: 99px;
        background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
        transition: width 0.55s cubic-bezier(0.4,0,0.2,1);
      }

      /* ── Question card ── */
      .qz-card {
        border-radius: 20px; padding: 1.75rem;
        border: 1px solid #e2e8f0;
        background: linear-gradient(to bottom, #f8fafc, #ffffff);
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        animation: qz-slideUp 0.4s cubic-bezier(0.34,1.4,0.64,1) both;
      }
      .dark .qz-card {
        border-color: rgba(255,255,255,0.08);
        background: linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
        box-shadow: none;
      }

      @keyframes qz-slideUp {
        from { opacity: 0; transform: translateY(18px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0)   scale(1); }
      }

      .qz-q-num {
        font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em;
        text-transform: uppercase; color: #6366f1; margin-bottom: 0.6rem;
      }
      .dark .qz-q-num { color: #818cf8; }

      .qz-q-text {
        font-size: clamp(0.95rem, 2.5vw, 1.12rem); font-weight: 700;
        line-height: 1.55; margin-bottom: 1.5rem;
        color: #0f172a;
      }
      .dark .qz-q-text { color: #f1f5f9; }

      /* ── Option buttons ── */
      .qz-opts { display: flex; flex-direction: column; gap: 8px; }

      .qz-opt {
        position: relative; width: 100%; text-align: left;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        border-radius: 12px; border: 1.5px solid #e2e8f0;
        background: #ffffff; color: #475569;
        font-size: 0.86rem; font-weight: 500; font-family: inherit;
        cursor: pointer; transition: all 0.2s ease;
        animation: qz-optIn 0.3s ease both;
      }
      .dark .qz-opt {
        border-color: rgba(255,255,255,0.09);
        background: rgba(255,255,255,0.03); color: #94a3b8;
      }
      .qz-opt:nth-child(1){ animation-delay:0.04s; }
      .qz-opt:nth-child(2){ animation-delay:0.08s; }
      .qz-opt:nth-child(3){ animation-delay:0.12s; }
      .qz-opt:nth-child(4){ animation-delay:0.16s; }

      @keyframes qz-optIn {
        from { opacity:0; transform: translateX(-8px); }
        to   { opacity:1; transform: translateX(0); }
      }

      .qz-opt:not(.qz-locked):hover {
        border-color: #6366f1;
        background: rgba(99,102,241,0.06);
        color: #1e293b; transform: translateX(3px);
      }
      .dark .qz-opt:not(.qz-locked):hover {
        background: rgba(99,102,241,0.1);
        color: #e2e8f0;
      }
      .qz-opt.qz-locked { cursor: default; }
      .qz-opt.qz-correct { border-color: #16a34a !important; background: rgba(22,163,74,0.08) !important; color: #15803d !important; }
      .qz-opt.qz-wrong   { border-color: #dc2626 !important; background: rgba(220,38,38,0.07) !important; color: #dc2626 !important; }
      .qz-opt.qz-dim     { opacity: 0.3; }
      .dark .qz-opt.qz-correct { background: rgba(22,163,74,0.12) !important; color: #86efac !important; }
      .dark .qz-opt.qz-wrong   { background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; }

      .qz-opt-ltr {
        position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
        width: 24px; height: 24px; border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.66rem; font-weight: 700; font-family: 'JetBrains Mono', ui-monospace, monospace;
        background: #f1f5f9; color: #64748b; transition: all 0.2s;
      }
      .dark .qz-opt-ltr { background: rgba(255,255,255,0.06); color: #475569; }
      .qz-opt.qz-correct .qz-opt-ltr { background: #22c55e; color: #fff; }
      .qz-opt.qz-wrong   .qz-opt-ltr { background: #ef4444; color: #fff; }
      .qz-opt:not(.qz-locked):hover .qz-opt-ltr { background: #6366f1; color: #fff; }

      @keyframes qzShake {
        0%,100% { transform: translateX(0); }
        15%  { transform: translateX(-8px); }
        30%  { transform: translateX(7px); }
        45%  { transform: translateX(-5px); }
        60%  { transform: translateX(4px); }
        75%  { transform: translateX(-3px); }
        90%  { transform: translateX(2px); }
      }
      .qz-shake { animation: qzShake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both; }

      @keyframes qzPopIn {
        from { transform: scale(0); opacity: 0; }
        to   { transform: scale(1); opacity: 1; }
      }

      /* ── Results ── */
      .qz-results {
        border-radius: 20px; padding: 2rem;
        border: 1px solid #e2e8f0;
        background: linear-gradient(to bottom, #f8fafc, #ffffff);
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        animation: qz-slideUp 0.4s cubic-bezier(0.34,1.4,0.64,1) both;
      }
      .dark .qz-results {
        border-color: rgba(255,255,255,0.08);
        background: linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
        box-shadow: none;
      }
      .qz-results-title {
        font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 1.5rem;
        color: #0f172a;
      }
      .dark .qz-results-title { color: #f8fafc; }

      .qz-bd-item { border-radius: 12px; border: 1.5px solid; padding: 0.85rem 1rem; }
      .qz-bd-item + .qz-bd-item { margin-top: 8px; }
      .qz-bd-prompt { font-size: 0.83rem; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
      .dark .qz-bd-prompt { color: #f1f5f9; }
      .qz-bd-ans { font-size: 0.78rem; font-weight: 500; }
      .qz-bd-expl {
        font-size: 0.75rem; color: #64748b; margin-top: 7px; line-height: 1.6;
        padding-top: 7px; border-top: 1px solid #e2e8f0;
      }
      .dark .qz-bd-expl { border-top-color: rgba(255,255,255,0.06); }

      .qz-retry {
        width: 100%; margin-top: 1.5rem; padding: 0.85rem; border-radius: 14px; border: none;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: #fff; font-size: 0.9rem; font-weight: 700; font-family: inherit;
        cursor: pointer; transition: all 0.2s; letter-spacing: 0.01em;
      }
      .qz-retry:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,0.3); }

      @media (max-width: 500px) {
        .qz-card { padding: 1.2rem; }
      }
    `}</style>
  );
}
