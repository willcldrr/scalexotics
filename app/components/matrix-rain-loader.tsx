"use client"

export default function MatrixRainLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="matrix-rain">
        <div className="drop" />
        <div className="drop" />
        <div className="drop" />
        <div className="drop" />
        <div className="drop" />
        <div className="drop" />
      </div>

      <style jsx>{`
        .matrix-rain {
          display: flex;
          gap: 4px;
          height: 60px;
          align-items: flex-end;
          transform: scale(1.5) translateY(30px);
        }
        .matrix-rain .drop {
          width: 6px;
          background: linear-gradient(to bottom, transparent, #fff, #fff, transparent);
          border-radius: 2px;
          animation: matrix-fall 1s ease-in-out infinite;
        }
        .matrix-rain .drop:nth-child(1) { height: 40px; animation-delay: -0.5s; }
        .matrix-rain .drop:nth-child(2) { height: 55px; animation-delay: -0.3s; }
        .matrix-rain .drop:nth-child(3) { height: 35px; animation-delay: -0.1s; }
        .matrix-rain .drop:nth-child(4) { height: 50px; animation-delay: -0.4s; }
        .matrix-rain .drop:nth-child(5) { height: 45px; animation-delay: -0.2s; }
        .matrix-rain .drop:nth-child(6) { height: 30px; animation-delay: -0.6s; }
        @keyframes matrix-fall {
          0%, 100% { opacity: 0; transform: translateY(-20px); }
          50% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
