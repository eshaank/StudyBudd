export default function QuizStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

      /* ── Light mode (default) ── */
      .qz-root {
        font-family: 'Sora', sans-serif;
        min-height: 100vh;
        background: #f8fafc;
        background-image:
          radial-gradient(ellipse 90% 60% at 15% 0%,   rgba(59,130,246,0.06) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 85% 100%, rgba(139,92,246,0.05) 0%, transparent 60%);
        padding: 2rem 1rem 5rem;
        color: #1e293b;
      }
      .qz-wrap { max-width: 680px; margin: 0 auto; }

      .qz-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
      .qz-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 700; color: #0f172a; letter-spacing: -0.03em; line-height: 1.15; }
      .qz-subtitle { font-size: 0.78rem; color: #64748b; margin-top: 4px; font-weight: 500; }

      .qz-timer {
        background: #ffffff; border: 1px solid #e2e8f0;
        border-radius: 16px; padding: 0.85rem 1.1rem; text-align: right; min-width: 165px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .qz-timer-mode { font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; }
      .qz-timer-digits { font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 600; color: #1e293b; line-height: 1.1; letter-spacing: -0.02em; }
      .qz-timer-btns { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
      .qz-tbtn {
        font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 8px;
        border: none; cursor: pointer; font-family: 'Sora', sans-serif;
        transition: all 0.15s ease;
      }
      .qz-tbtn:hover { filter: brightness(1.15); transform: translateY(-1px); }
      .qz-tbtn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

      .qz-prog-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: #64748b; font-weight: 600; margin-bottom: 8px; }
      .qz-prog-track { height: 3px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: 1.75rem; }
      .qz-prog-fill {
        height: 100%; border-radius: 99px;
        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        transition: width 0.55s cubic-bezier(0.4,0,0.2,1);
      }

      .qz-card {
        background: #ffffff; border: 1px solid #e2e8f0;
        border-radius: 22px; padding: 1.75rem 1.75rem 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        animation: slideUp 0.42s cubic-bezier(0.34,1.4,0.64,1) both;
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(22px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }

      .qz-q-num { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; margin-bottom: 0.65rem; }
      .qz-q-text { font-size: clamp(0.95rem, 2.5vw, 1.15rem); font-weight: 700; color: #0f172a; line-height: 1.55; margin-bottom: 1.5rem; }

      .qz-opts { display: flex; flex-direction: column; gap: 9px; }
      .qz-opt {
        position: relative; width: 100%; text-align: left;
        padding: 0.8rem 1rem 0.8rem 3rem;
        border-radius: 13px; border: 1.5px solid #e2e8f0;
        background: #f8fafc; color: #475569;
        font-size: 0.88rem; font-weight: 500; font-family: 'Sora', sans-serif;
        cursor: pointer; transition: all 0.2s ease;
        animation: optIn 0.3s ease both;
      }
      .qz-opt:nth-child(1){ animation-delay:0.05s; }
      .qz-opt:nth-child(2){ animation-delay:0.10s; }
      .qz-opt:nth-child(3){ animation-delay:0.15s; }
      .qz-opt:nth-child(4){ animation-delay:0.20s; }
      @keyframes optIn {
        from { opacity:0; transform: translateX(-10px); }
        to   { opacity:1; transform: translateX(0); }
      }

      .qz-opt:not(.qz-locked):hover {
        border-color: rgba(59,130,246,0.55);
        background: rgba(59,130,246,0.06);
        color: #1e293b; transform: translateX(4px);
      }
      .qz-opt.qz-locked { cursor: default; }
      .qz-opt.qz-correct { border-color: #16a34a !important; background: rgba(22,163,74,0.08) !important; color: #15803d !important; }
      .qz-opt.qz-wrong   { border-color: #dc2626 !important; background: rgba(220,38,38,0.08) !important; color: #dc2626 !important; }
      .qz-opt.qz-dim     { opacity: 0.3; }

      .qz-opt-ltr {
        position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
        width: 25px; height: 25px; border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.68rem; font-weight: 700; font-family: 'JetBrains Mono', monospace;
        background: #e2e8f0; color: #64748b; transition: all 0.2s;
      }
      .qz-opt.qz-correct .qz-opt-ltr { background: #22c55e; color: #fff; }
      .qz-opt.qz-wrong   .qz-opt-ltr { background: #ef4444; color: #fff; }
      .qz-opt:not(.qz-locked):hover .qz-opt-ltr { background: #3b82f6; color: #fff; }

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

      .qz-results {
        background: #ffffff; border: 1px solid #e2e8f0;
        border-radius: 22px; padding: 2rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        animation: slideUp 0.42s cubic-bezier(0.34,1.4,0.64,1) both;
      }
      .qz-results-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 1.5rem; }

      .qz-bd-item { border-radius: 13px; border: 1.5px solid; padding: 0.85rem 1rem; }
      .qz-bd-item + .qz-bd-item { margin-top: 8px; }
      .qz-bd-prompt { font-size: 0.83rem; font-weight: 700; color: #0f172a; margin-bottom: 5px; }
      .qz-bd-ans { font-size: 0.78rem; font-weight: 500; }
      .qz-bd-expl {
        font-size: 0.75rem; color: #64748b; margin-top: 7px; line-height: 1.6;
        padding-top: 7px; border-top: 1px solid #e2e8f0;
      }

      .qz-retry {
        width: 100%; margin-top: 1.5rem; padding: 0.9rem; border-radius: 14px; border: none;
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        color: #fff; font-size: 0.95rem; font-weight: 700; font-family: 'Sora', sans-serif;
        cursor: pointer; transition: all 0.2s; letter-spacing: 0.01em;
      }
      .qz-retry:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,0.35); }

      .qz-back-btn {
        margin-top: 1rem; font-family: 'Sora', sans-serif; font-size: 0.8rem; font-weight: 600;
        padding: 7px 15px; border-radius: 10px; border: 1px solid #e2e8f0;
        background: #f1f5f9; color: #64748b; cursor: pointer; transition: all 0.15s;
      }
      .qz-back-btn:hover:not(:disabled) { background: #e2e8f0; color: #475569; }
      .qz-back-btn:disabled { opacity: 0.3; cursor: not-allowed; }

      /* ── Dark mode ── */
      .dark .qz-root {
        background: #0a0c12;
        background-image:
          radial-gradient(ellipse 90% 60% at 15% 0%,   rgba(59,130,246,0.13) 0%, transparent 65%),
          radial-gradient(ellipse 70% 50% at 85% 100%, rgba(139,92,246,0.11) 0%, transparent 60%);
        color: #f1f5f9;
      }
      .dark .qz-title { color: #f8fafc; }
      .dark .qz-subtitle { color: #475569; }

      .dark .qz-timer {
        background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09);
        box-shadow: none;
      }
      .dark .qz-timer-mode { color: #475569; }
      .dark .qz-timer-digits { color: #e2e8f0; }

      .dark .qz-prog-meta { color: #475569; }
      .dark .qz-prog-track { background: rgba(255,255,255,0.07); }

      .dark .qz-card {
        background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.08);
        box-shadow: none;
      }
      .dark .qz-q-text { color: #f1f5f9; }

      .dark .qz-opt {
        border-color: rgba(255,255,255,0.09);
        background: rgba(255,255,255,0.03); color: #94a3b8;
      }
      .dark .qz-opt:not(.qz-locked):hover {
        background: rgba(59,130,246,0.07);
        color: #e2e8f0;
      }
      .dark .qz-opt.qz-correct { background: rgba(22,163,74,0.12) !important; color: #86efac !important; }
      .dark .qz-opt.qz-wrong   { background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; }

      .dark .qz-opt-ltr { background: rgba(255,255,255,0.06); color: #475569; }

      .dark .qz-results {
        background: rgba(255,255,255,0.025); border-color: rgba(255,255,255,0.08);
        box-shadow: none;
      }
      .dark .qz-results-title { color: #f8fafc; }
      .dark .qz-bd-prompt { color: #f1f5f9; }
      .dark .qz-bd-expl { border-top-color: rgba(255,255,255,0.06); }

      .dark .qz-back-btn {
        border-color: rgba(255,255,255,0.09);
        background: rgba(255,255,255,0.04); color: #64748b;
      }
      .dark .qz-back-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); color: #94a3b8; }

      @media (max-width: 500px) {
        .qz-timer { min-width: unset; width: 100%; text-align: left; }
        .qz-timer-btns { justify-content: flex-start; }
        .qz-card { padding: 1.2rem; }
      }
    `}</style>
  );
}
