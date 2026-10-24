import React from 'react';

export default function FloatingBubbles() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none -z-10"
    >
      {/* Bubble 1: Large subtle Teal glow top-right */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[420px] h-[420px] rounded-full blur-[80px] animate-bubble-1 transition-colors duration-700"
        style={{
          background: 'radial-gradient(circle, var(--color-bubble-teal) 0%, transparent 70%)',
        }}
      />

      {/* Bubble 2: Medium Navy tone bottom-left */}
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[90px] animate-bubble-2 transition-colors duration-700"
        style={{
          background: 'radial-gradient(circle, var(--color-bubble-navy) 0%, transparent 70%)',
        }}
      />

      {/* Bubble 3: Gentle neutral teal/navy center right */}
      <div
        className="absolute top-[40%] right-[15%] w-[320px] h-[320px] rounded-full blur-[70px] animate-bubble-3 transition-colors duration-700"
        style={{
          background: 'radial-gradient(circle, var(--color-bubble-teal) 0%, transparent 75%)',
        }}
      />

      {/* Bubble 4: Soft light tone top-left */}
      <div
        className="absolute top-[15%] left-[8%] w-[260px] h-[260px] rounded-full blur-[65px] animate-bubble-1 transition-colors duration-700 opacity-60"
        style={{
          background: 'radial-gradient(circle, var(--color-bubble-navy) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
