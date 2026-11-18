import { useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';

interface SplashScreenProps {
  onEnter: () => void;
}

interface DustParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-advance gracefully after 12s unless user taps CTA earlier
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onEnter();
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [onEnter]);

  // Volumetric 24K gold dust particles floating gently down from the top-right rays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 0;
    let height = 0;
    const particles: DustParticle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(58, Math.max(32, Math.floor((width * height) / 20000)));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.75 + Math.random() * 2.0,
        vx: -(0.12 + Math.random() * 0.22),
        vy: 0.16 + Math.random() * 0.34,
        alpha: 0.28 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const drawFrame = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx + Math.sin(time * 0.0007 + p.phase) * 0.08;
          p.y += p.vy;
          if (p.y > height + 10) {
            p.y = -10;
            p.x = width * (0.2 + Math.random() * 0.85);
          }
          if (p.x < -10) {
            p.x = width + 10;
            p.y = Math.random() * height * 0.65;
          }
        }
        const twinkle = prefersReducedMotion
          ? p.alpha
          : p.alpha * (0.62 + 0.38 * Math.sin(time * 0.0022 + p.phase));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.4);
        grad.addColorStop(0, `rgba(255, 240, 178, ${twinkle.toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(212, 175, 55, ${(twinkle * 0.56).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      rafId = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      aria-label="Shahi Kiswah Welcome Splash Screen"
      data-testid="kiswah-splash-screen"
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden bg-[#050507] px-4 py-4 sm:px-8 sm:py-6 text-center text-[#F5E6B3]"
    >
      {/* 1. Deep Obsidian Shahi Kiswah Silk Base & Wavy Drapery Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 72% at 62% 28%, #1E170C 0%, #0D0B08 46%, #040406 100%)',
        }}
      />

      {/* Wavy Kiswah Silk Folds & Embroidered Dark-Gold Calligraphy Pattern */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.52]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="silkFoldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#241C0F" stopOpacity="0.65" />
            <stop offset="38%" stopColor="#070709" stopOpacity="0.92" />
            <stop offset="68%" stopColor="#2C210F" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#050507" stopOpacity="0.96" />
          </linearGradient>

          <linearGradient id="silkRidgeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#08080A" stopOpacity="0" />
            <stop offset="35%" stopColor="#5C4415" stopOpacity="0.22" />
            <stop offset="65%" stopColor="#85631F" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#08080A" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="embroideredGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4E380B" stopOpacity="0.24" />
            <stop offset="50%" stopColor="#A87E24" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#3F2C08" stopOpacity="0.2" />
          </linearGradient>

          <pattern id="kiswahWovenWeave" width="144" height="120" patternUnits="userSpaceOnUse">
            {/* Wavy Kiswah silk threads */}
            <path
              d="M0 30 Q36 8 72 30 T144 30 M0 90 Q36 68 72 90 T144 90"
              fill="none"
              stroke="#332610"
              strokeWidth="1.1"
              opacity="0.72"
            />
            {/* Geometric Kufic weave */}
            <path
              d="M72 14 L86 47 L120 60 L86 73 L72 106 L58 73 L24 60 L58 47 Z"
              fill="none"
              stroke="#684D16"
              strokeWidth="0.75"
              opacity="0.46"
            />
            <circle cx="72" cy="60" r="9" fill="none" stroke="#7A5B1A" strokeWidth="0.65" opacity="0.38" />
            {/* Subtle dark-gold embroidered calligraphy woven into silk folds */}
            <text
              x="72"
              y="38"
              textAnchor="middle"
              fill="#8D691F"
              opacity="0.38"
              fontSize="11.5"
              fontFamily="Amiri Quran, Amiri, serif"
            >
              لَا إِلٰهَ إِلَّا اللّٰهُ
            </text>
            <text
              x="72"
              y="98"
              textAnchor="middle"
              fill="#7A5B1A"
              opacity="0.34"
              fontSize="10.5"
              fontFamily="Amiri Quran, Amiri, serif"
            >
              يَا حَيُّ يَا قَيُّومُ
            </text>
          </pattern>
        </defs>

        <rect width="1440" height="900" fill="url(#kiswahWovenWeave)" />

        {/* Undulating Shahi Kiswah Drapery Waves */}
        <path
          d="M-80 155 C240 85, 480 235, 820 145 C1080 75, 1280 190, 1520 115 L1520 330 C1220 410, 960 270, 660 350 C380 425, 160 300, -80 380 Z"
          fill="url(#silkFoldShadow)"
          opacity="0.72"
        />
        <path
          d="M-80 155 C240 85, 480 235, 820 145 C1080 75, 1280 190, 1520 115"
          fill="none"
          stroke="url(#silkRidgeHighlight)"
          strokeWidth="22"
        />
        <path
          d="M-80 495 C220 415, 520 575, 860 475 C1120 400, 1300 525, 1520 455 L1520 710 C1200 790, 920 650, 620 740 C320 825, 140 680, -80 760 Z"
          fill="url(#silkFoldShadow)"
          opacity="0.74"
        />
        <path
          d="M-80 495 C220 415, 520 575, 860 475 C1120 400, 1300 525, 1520 455"
          fill="none"
          stroke="url(#silkRidgeHighlight)"
          strokeWidth="24"
        />

        {/* Woven Diagonal Dark-Gold Kiswah Ribbon Bands */}
        <path
          d="M-120 305 Q360 230 720 305 T1560 285"
          fill="none"
          stroke="url(#embroideredGold)"
          strokeWidth="1.5"
        />
        <path
          d="M-120 585 Q360 510 720 585 T1560 565"
          fill="none"
          stroke="url(#embroideredGold)"
          strokeWidth="1.3"
        />
      </svg>

      {/* Warm Volumetric Gold Rays Streaming Down From Top-Right */}
      <div
        aria-hidden="true"
        className="splash-ray-pulse pointer-events-none absolute -right-[12%] -top-[18%] h-[115%] w-[115%]"
        style={{
          background:
            'conic-gradient(from 198deg at 82% 8%, transparent 0deg, rgba(255,224,132,0.24) 11deg, transparent 23deg, rgba(212,175,55,0.17) 34deg, transparent 48deg, rgba(255,232,155,0.2) 58deg, transparent 74deg, rgba(212,175,55,0.13) 92deg, transparent 130deg)',
          maskImage:
            'radial-gradient(ellipse 82% 80% at 75% 15%, #000 12%, rgba(0,0,0,0.42) 55%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 82% 80% at 75% 15%, #000 12%, rgba(0,0,0,0.42) 55%, transparent 88%)',
        }}
      />

      {/* Central Golden Backlit Halo Behind Medallion */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[52%] h-[340px] w-[340px] sm:h-[490px] sm:w-[490px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(242,198,82,0.32) 0%, rgba(176,128,24,0.14) 48%, transparent 74%)',
        }}
      />

      {/* Golden Dust Particles Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Subtle Sacred Arch Silhouette Framing Edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 sm:inset-4 rounded-2xl border border-[#D4AF37]/25"
        style={{
          boxShadow: 'inset 0 0 64px rgba(0,0,0,0.8)',
        }}
      />

      {/* Dark Polished Obsidian Floor Plane + Warm Gold Reflection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[23%] border-t border-[#D4AF37]/18"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,14,9,0.52) 0%, rgba(7,6,5,0.92) 42%, #040405 100%)',
        }}
      />

      {/* 1. TOP LUMINOUS TITLES */}
      <header className="relative z-10 mt-1 sm:mt-3 flex max-w-2xl flex-col items-center px-2">
        <p
          data-testid="splash-arabic-title"
          className="font-quran text-4xl sm:text-5xl md:text-6xl leading-[1.42] tracking-normal select-none"
          dir="rtl"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FFFBE0 0%, #F7DA7E 34%, #D4AF37 68%, #88610D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter:
              'drop-shadow(0 2px 0 rgba(48,32,4,0.95)) drop-shadow(0 6px 16px rgba(0,0,0,0.95)) drop-shadow(0 0 28px rgba(212,175,55,0.55)) brightness(1.06)',
          }}
        >
          الْقُرْآنُ الْكَرِيمُ
        </p>

        <h1
          data-testid="splash-english-subtitle"
          className="font-display mt-1 text-xs sm:text-base md:text-lg font-bold tracking-[0.16em] uppercase text-[#F9E192] text-balance"
          style={{
            textShadow:
              '0 2px 6px rgba(0,0,0,0.95), 0 0 22px rgba(212,175,55,0.42)',
          }}
        >
          15 LINE QURAN WITH TAFSEER SIRAT-UL-JINAN
        </h1>

        <p
          data-testid="splash-urdu-title"
          className="font-urdu mt-1 text-sm sm:text-lg text-[#EDE0B1] leading-relaxed"
          dir="rtl"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 14px rgba(212,175,55,0.24)',
          }}
        >
          ۱۵ سطری قرآنِ پاک مع تفسیر صراط الجنان
        </p>
      </header>

      {/* 2. CENTERPIECE: 3D-Embossed 24K Gold Teardrop Medallion (Shahi Kiswah Emblem) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-1">
        <div className="splash-medallion-3d relative flex h-[250px] w-[200px] sm:h-[320px] sm:w-[256px] items-center justify-center">
          {/* Deep 3D Back Glow Behind Teardrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(245,200,80,0.4) 0%, rgba(168,120,22,0.18) 58%, transparent 80%)',
            }}
          />

          <svg
            viewBox="0 0 320 400"
            role="img"
            aria-label="3D Embossed 24K Gold Shahi Kiswah Teardrop Medallion"
            className="relative h-full w-full drop-shadow-[0_22px_34px_rgba(0,0,0,0.95)]"
          >
            <defs>
              <radialGradient id="teardropGoldBody" cx="36%" cy="30%" r="76%">
                <stop offset="0%" stopColor="#FFFBE0" />
                <stop offset="22%" stopColor="#F7D973" />
                <stop offset="52%" stopColor="#D4AF37" />
                <stop offset="80%" stopColor="#8F6711" />
                <stop offset="100%" stopColor="#3E2B04" />
              </radialGradient>

              <linearGradient id="teardropGoldBevel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF8D2" />
                <stop offset="28%" stopColor="#E6BE4A" />
                <stop offset="55%" stopColor="#7C590D" />
                <stop offset="80%" stopColor="#D8B23E" />
                <stop offset="100%" stopColor="#FFF0B0" />
              </linearGradient>

              <radialGradient id="kiswahCoreObsidian" cx="42%" cy="35%" r="72%">
                <stop offset="0%" stopColor="#282118" />
                <stop offset="55%" stopColor="#120F0D" />
                <stop offset="100%" stopColor="#050506" />
              </radialGradient>

              <radialGradient id="coreEmeraldInset" cx="44%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#1B6D47" />
                <stop offset="55%" stopColor="#0A3B24" />
                <stop offset="100%" stopColor="#04190F" />
              </radialGradient>

              <filter id="highRelief3d" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.92" />
              </filter>

              <filter id="goldInnerGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.96" />
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F8DC78" floodOpacity="0.45" />
              </filter>

              <clipPath id="teardropClip">
                <path d="M160 18 C176 46, 208 82, 246 134 C282 184, 294 226, 294 260 C294 334, 234 388, 160 388 C86 388, 26 334, 26 260 C26 226, 38 184, 74 134 C112 82, 144 46, 160 18 Z" />
              </clipPath>
            </defs>

            {/* Outer Pointed Shahi Finial Pearl & Collar */}
            <path
              d="M150 24 L160 6 L170 24 Z"
              fill="url(#teardropGoldBody)"
              stroke="#FFF6C4"
              strokeWidth="1"
            />
            <circle
              cx="160"
              cy="14"
              r="7.5"
              fill="url(#teardropGoldBody)"
              stroke="#FFF8D2"
              strokeWidth="1.2"
              filter="url(#highRelief3d)"
            />

            {/* Main 3D-Embossed 24K Gold Teardrop Outer Shell */}
            <path
              d="M160 20 C176 48, 208 84, 246 136 C282 186, 294 226, 294 260 C294 334, 234 388, 160 388 C86 388, 26 334, 26 260 C26 226, 38 186, 74 136 C112 84, 144 48, 160 20 Z"
              fill="url(#teardropGoldBevel)"
              stroke="#FFF6C4"
              strokeWidth="2.4"
              filter="url(#highRelief3d)"
            />

            {/* Second Braided Gold Rope Trim Inside Outer Teardrop */}
            <path
              d="M160 29 C175 55, 206 90, 241 139 C275 186, 286 225, 286 259 C286 329, 230 380, 160 380 C90 380, 34 329, 34 259 C34 225, 45 186, 79 139 C114 90, 145 55, 160 29 Z"
              fill="none"
              stroke="#5A3F08"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              opacity="0.75"
            />

            {/* Recessed Obsidian Silk Teardrop Cavity */}
            <path
              d="M160 36 C174 62, 203 94, 237 142 C269 187, 280 225, 280 258 C280 324, 226 374, 160 374 C94 374, 40 324, 40 258 C40 225, 51 187, 83 142 C117 94, 146 62, 160 36 Z"
              fill="url(#kiswahCoreObsidian)"
              stroke="url(#teardropGoldBody)"
              strokeWidth="3.4"
            />

            {/* Ornate 3D Gold Arabesque Filigree & Crown Palmette Filling Teardrop Neck */}
            <g filter="url(#highRelief3d)">
              {/* Central vertical palmette spear */}
              <path
                d="M160 44 C169 66, 179 86, 160 120 C141 86, 151 66, 160 44 Z"
                fill="url(#teardropGoldBody)"
                stroke="#493206"
                strokeWidth="1"
              />
              {/* Symmetric curving arabesque wings */}
              <path
                d="M160 68 C134 86, 108 114, 92 146 C118 134, 140 128, 160 130 C180 128, 202 134, 228 146 C212 114, 186 86, 160 68 Z"
                fill="none"
                stroke="url(#teardropGoldBody)"
                strokeWidth="3"
              />
              {/* Lower flanking filigree scrolls */}
              <path
                d="M114 140 C98 148, 82 162, 72 182 C88 174, 104 170, 120 172"
                fill="none"
                stroke="url(#teardropGoldBody)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M206 140 C222 148, 238 162, 248 182 C232 174, 216 170, 200 172"
                fill="none"
                stroke="url(#teardropGoldBody)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="160" cy="84" r="5" fill="#FFFBE0" stroke="#7A560C" strokeWidth="1" />
              <circle cx="132" cy="116" r="3" fill="#F8DC78" />
              <circle cx="188" cy="116" r="3" fill="#F8DC78" />
            </g>

            {/* Core Circular Emblem Heavy Golden Beaded & Braided Borders */}
            <circle
              cx="160"
              cy="252"
              r="104"
              fill="url(#teardropGoldBevel)"
              filter="url(#highRelief3d)"
            />
            <circle
              cx="160"
              cy="252"
              r="99"
              fill="none"
              stroke="#5A3F08"
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
            <circle
              cx="160"
              cy="252"
              r="94"
              fill="url(#kiswahCoreObsidian)"
              stroke="#FFF4BD"
              strokeWidth="1.6"
            />

            {/* 20 Scalloped 3D Gold Sunburst Filigree Petals Surrounding Core Emblem */}
            <g filter="url(#highRelief3d)">
              {Array.from({ length: 20 }, (_, idx) => (
                <g key={idx} transform={`rotate(${idx * 18} 160 252)`}>
                  <path
                    d="M160 158 L167 175 L160 183 L153 175 Z"
                    fill="url(#teardropGoldBody)"
                    stroke="#3E2B05"
                    strokeWidth="0.7"
                  />
                  <circle cx="160" cy="153.5" r="2" fill="#FFF7CC" />
                </g>
              ))}
            </g>

            {/* Inner Heavy 24K Gold Frame Ring & Deep Emerald Royal Core */}
            <circle
              cx="160"
              cy="252"
              r="70"
              fill="url(#coreEmeraldInset)"
              stroke="url(#teardropGoldBevel)"
              strokeWidth="6"
              filter="url(#highRelief3d)"
            />
            <circle
              cx="160"
              cy="252"
              r="61"
              fill="none"
              stroke="#FFF2B2"
              strokeWidth="1.3"
              strokeDasharray="3.5 3.5"
              opacity="0.86"
            />

            {/* Deeply Embossed, Gleaming 24K Gold Core Islamic Calligraphy */}
            <g filter="url(#goldInnerGlow)">
              <text
                x="160"
                y="245"
                textAnchor="middle"
                fill="url(#teardropGoldBody)"
                fontSize="29"
                fontWeight="700"
                fontFamily="Amiri Quran, Amiri, Georgia, serif"
              >
                اَلْقُرْآنُ
              </text>
              <text
                x="160"
                y="279"
                textAnchor="middle"
                fill="url(#teardropGoldBody)"
                fontSize="25.5"
                fontWeight="700"
                fontFamily="Amiri Quran, Amiri, Georgia, serif"
              >
                الْكَرِيمُ
              </text>
            </g>

            {/* Specular Sheen Sweep Across 3D Teardrop Surface */}
            <g clipPath="url(#teardropClip)">
              <rect
                x="-80"
                y="-40"
                width="96"
                height="480"
                fill="rgba(255,248,214,0.22)"
                className="splash-specular-sweep"
              />
            </g>
          </svg>
        </div>

        {/* Warm Golden Floor Reflection Under Teardrop Base */}
        <div
          aria-hidden="true"
          className="pointer-events-none -mt-1 flex flex-col items-center"
        >
          <div
            className="h-7 w-44 sm:w-60 rounded-[100%] blur-[4px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,222,120,0.58) 0%, rgba(212,175,55,0.28) 48%, transparent 78%)',
            }}
          />
          <div
            className="-mt-3.5 h-2.5 w-28 sm:w-36 rounded-[100%] blur-[1px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,245,196,0.48) 0%, transparent 75%)',
            }}
          />
        </div>
      </div>

      {/* 3. BOTTOM ZONE: Glossy 3D Emerald Green & 24K Gold CTA Button + Updated Footer */}
      <footer className="relative z-10 mb-1 sm:mb-2 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onEnter}
          data-testid="splash-open-mushaf-btn"
          className="group relative inline-flex min-h-[54px] items-center justify-center gap-3.5 overflow-hidden rounded-2xl border-2 border-[#D4AF37] px-7 py-2.5 text-[#FFF4CC] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#FFE99D] hover:brightness-110 active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE89E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] whitespace-nowrap cursor-pointer"
          style={{
            background:
              'linear-gradient(180deg, #16794B 0%, #0D5735 46%, #073822 100%)',
            boxShadow:
              '0 6px 0 #5C420A, 0 14px 32px rgba(0,0,0,0.92), 0 0 30px rgba(212,175,55,0.44), inset 0 1px 0 rgba(255,250,214,0.58)',
          }}
        >
          {/* Glossy Top Specular Glass Reflection */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 top-0.5 h-[44%] rounded-t-[12px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.03) 100%)',
            }}
          />

          {/* Inner 24K Gold Hairline Bezel */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px] rounded-[11px] border border-[#F5D675]/45 group-hover:border-[#FFF0B8]/75 transition-colors"
          />

          <BookOpen
            className="relative h-4 w-4 text-[#F7DA7E] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] shrink-0"
            aria-hidden="true"
          />

          <span className="relative flex items-center gap-3">
            <span
              className="font-display text-xs sm:text-sm font-bold tracking-[0.12em] uppercase text-[#FFF6D6]"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
            >
              Open Al-Mushaf
            </span>
            <span aria-hidden="true" className="text-[#E6C153]">
              •
            </span>
            <span
              className="font-urdu text-base sm:text-lg leading-none text-[#F9E39B]"
              dir="rtl"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
            >
              مصحف کھولیں
            </span>
          </span>
        </button>

        <p
          data-testid="splash-footer-meta"
          className="text-[11px] sm:text-xs font-medium tracking-wider text-[#E2C265]/90"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
        >
          100% Offline Architecture &nbsp;•&nbsp; 619-Page Hafizi PDF &nbsp;•&nbsp; Sirat-ul-Jinan jild 1-10
        </p>
      </footer>
    </section>
  );
}
