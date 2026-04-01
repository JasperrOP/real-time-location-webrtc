import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

/* ─── GSAP (loaded from CDN via useEffect) ─── */
let gsap = null;

/* ─── DESIGN TOKENS ─── */
const T = {
  white:     '#ffffff',
  offwhite:  '#f7f6f3',
  border:    '#e8e7e4',
  graphite:  '#111318',
  graphite2: '#1e222b',
  muted:     '#888c96',
  coral:     '#e8442e',
  coralDim:  'rgba(232,68,46,0.09)',
  success:   '#2aad6f',
  font:      "'Cabinet Grotesk', 'Syne', sans-serif",
  mono:      "'DM Mono', monospace",
};

/* ─── GLOBAL STYLES ─── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulseRing {
  0%   { transform: scale(1);   opacity: .6; }
  100% { transform: scale(2.2); opacity: 0;  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-8px) rotate(1deg); }
  66%       { transform: translateY(4px) rotate(-1deg); }
}

@keyframes scanline {
  0%   { top: -10%; }
  100% { top: 110%; }
}

.auth-input-light {
  width: 100%;
  padding: 14px 16px;
  background: ${T.offwhite};
  border: 1.5px solid ${T.border};
  border-radius: 12px;
  outline: none;
  font-family: ${T.mono};
  font-size: 14px;
  color: ${T.graphite};
  transition: border-color .25s, background .25s, box-shadow .25s;
  caret-color: ${T.coral};
}
.auth-input-light::placeholder { color: ${T.muted}; }
.auth-input-light:focus {
  border-color: ${T.coral};
  background: ${T.white};
  box-shadow: 0 0 0 3px rgba(232,68,46,.10);
}

.tab-btn {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  font-family: ${T.font};
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  transition: color .2s;
}

.submit-btn {
  width: 100%;
  padding: 17px;
  background: ${T.coral};
  color: ${T.white};
  border: none;
  border-radius: 14px;
  font-family: ${T.font};
  font-weight: 800;
  font-size: 15px;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  transition: transform .15s, box-shadow .2s, background .2s;
  box-shadow: 0 6px 24px rgba(232,68,46,.35), 0 2px 8px rgba(232,68,46,.2);
}
.submit-btn:hover:not(:disabled) {
  background: #d43520;
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(232,68,46,.45), 0 4px 12px rgba(232,68,46,.25);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0px) scale(.98);
}
.submit-btn:disabled { opacity: .7; cursor: default; }

.submit-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.18) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform .5s;
}
.submit-btn:hover::after { transform: translateX(100%); }

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

/* Mobile breakpoint */
@media (max-width: 768px) {
  .left-panel { display: none !important; }
  .right-panel { padding: 32px 24px !important; min-height: 100dvh; }
  .form-card { max-width: 100% !important; }
  .mobile-header { display: flex !important; }
}
@media (min-width: 769px) {
  .mobile-header { display: none !important; }
}
`;

/* ─── Spinner ─── */
const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(255,255,255,.3)',
    borderTopColor: T.white, borderRadius: '50%',
    animation: 'spin .6s linear infinite', flexShrink: 0,
  }}/>
);

/* ─── Field component ─── */
const Field = ({ label, id, type = 'text', placeholder, value, onChange }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="form-element" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label htmlFor={id} style={{
        fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em',
        color: T.muted, textTransform: 'uppercase',
        transition: 'color .2s',
        ...(focused ? { color: T.coral } : {}),
      }}>{label}</label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={value} onChange={onChange}
        required
        className="auth-input-light"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

/* ─── Main Auth Component ─── */
const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [passStrength, setPS]   = useState(0);

  const leftRef   = useRef(null);
  const rightRef  = useRef(null);
  const formRef   = useRef(null);
  const logoRef   = useRef(null);
  const heroRef   = useRef(null);
  const gsapReady = useRef(false);

  /* Load GSAP from CDN */
  useEffect(() => {
    if (document.getElementById('gsap-cdn')) { initAnimations(); return; }
    const s = document.createElement('script');
    s.id  = 'gsap-cdn';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s.onload = () => { gsap = window.gsap; gsapReady.current = true; initAnimations(); };
    document.head.appendChild(s);
  }, []);

  const initAnimations = () => {
    if (!window.gsap) return;
    const g = window.gsap;
    
    // Master Timeline for synchronized loading
    const tl = g.timeline();

    // 1. Left Panel Cinematic Entrance
    tl.fromTo(leftRef.current,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }
    )
    .fromTo(logoRef.current,
      { opacity: 0, y: -30, rotationX: -20 },
      { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'back.out(1.5)' },
      "-=0.8"
    )
    // 2. Hero Text Staggered Reveal
    .fromTo(".hero-line",
      { opacity: 0, y: 40, rotationX: -45, transformOrigin: "0% 50% -50" },
      { opacity: 1, y: 0, rotationX: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out' },
      "-=0.6"
    )
    // 3. Map Mockup & Elastic Dots
    .fromTo(".map-mockup",
      { opacity: 0, scale: 0.9, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.4"
    )
    .fromTo(".map-dot",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: { amount: 0.4, grid: [3, 6], from: "center" }, ease: "back.out(3)" },
      "-=0.6"
    )
    // 4. Feature Pills
    .fromTo(".hero-pill",
      { opacity: 0, scale: 0.8, y: 15 },
      { opacity: 1, scale: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'back.out(1.5)' },
      "-=0.4"
    );

    // 5. Right Panel & Form Entrance (Runs parallel to left panel)
    g.fromTo(rightRef.current,
      { opacity: 0, backgroundColor: '#ffffff' },
      { opacity: 1, backgroundColor: T.offwhite, duration: 1, delay: 0.2, ease: 'power2.out' }
    );
    g.fromTo(formRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' }
    );
    g.fromTo(".form-element",
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, delay: 0.6, ease: 'power2.out' }
    );

    // Continuous Orb Breathing
    g.to(".orb-1", { x: "random(-30, 30)", y: "random(-30, 30)", duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    g.to(".orb-2", { x: "random(-40, 40)", y: "random(-40, 40)", duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
  };

  /* ─── 3D Mouse Parallax Effect on Left Panel ─── */
  const handleMouseMove = (e) => {
    if (!window.gsap || window.innerWidth <= 768) return;
    const rect = leftRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    window.gsap.to(heroRef.current, {
      x: x * 30, y: y * 30, 
      rotationY: x * 15, rotationX: -y * 15, 
      duration: 0.6, ease: "power2.out" 
    });
    window.gsap.to(".orb-1", { x: x * -80, y: y * -80, duration: 1, ease: "power2.out" });
    window.gsap.to(".orb-2", { x: x * 100, y: y * 100, duration: 1, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    if (!window.gsap) return;
    window.gsap.to([heroRef.current, ".orb-1", ".orb-2"], { 
      x: 0, y: 0, rotationY: 0, rotationX: 0, 
      duration: 1, ease: "elastic.out(1, 0.5)" 
    });
  };

  /* Tab switch animation */
  const switchTab = t => {
    if (t === tab) return;
    setError('');
    if (formRef.current && window.gsap) {
      window.gsap.to(".form-element", {
        opacity: 0, x: -10, duration: .15, stagger: 0.02, ease: 'power2.in',
        onComplete: () => {
          setTab(t);
          window.gsap.fromTo(".form-element",
            { opacity: 0, x: 15 },
            { opacity: 1, x: 0, duration: .3, stagger: 0.05, ease: 'power3.out' }
          );
        }
      });
    } else {
      setTab(t);
    }
  };

  const calcStrength = v => {
    if (!v) return 0;
    if (v.length < 4) return 1;
    if (v.length < 6) return 2;
    if (v.length < 10) return 3;
    return 4;
  };

  const handlePasswordChange = e => {
    setPassword(e.target.value);
    setPS(calcStrength(e.target.value));
  };

  const strengthColor = [T.border, '#e8442e', '#f5a623', '#f5c842', T.success][passStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passStrength];

  /* ── Backend logic unchanged ── */
  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        const { data } = await API.post('/api/auth/login', { email, password });
        localStorage.setItem('userProfile', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        const { data } = await API.post('/api/auth/signup', { name, email, password });
        localStorage.setItem('userProfile', JSON.stringify(data));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || (tab === 'login' ? 'Invalid email or password.' : 'Signup failed. Try again.'));
      if (window.gsap && formRef.current) {
        window.gsap.to(formRef.current, {
          x: [-8, 8, -5, 5, -2, 2, 0], // Aggressive shake
          duration: .5, ease: 'power2.inOut',
        });
      }
    } finally { setLoading(false); }
  };

  /* ── Map dots for left panel ── */
  const mapDots = Array.from({ length: 18 }, (_, i) => ({
    x: 12 + (i % 6) * 16 + (Math.floor(i / 6) % 2 === 0 ? 0 : 8),
    y: 18 + Math.floor(i / 6) * 20,
    pulse: i === 4 || i === 11,
  }));

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{
        minHeight: '100dvh', display: 'flex',
        fontFamily: T.font, background: T.offwhite,
        overflow: 'hidden',
      }}>

        {/* ════════════════════════════════════════
            LEFT PANEL — dark cinematic
        ════════════════════════════════════════ */}
        <div
          ref={leftRef}
          className="left-panel"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '48%', minWidth: 380, maxWidth: 560,
            background: T.graphite,
            display: 'flex', flexDirection: 'column',
            padding: '44px 52px',
            position: 'relative', overflow: 'hidden',
            flexShrink: 0,
            perspective: '1000px', // Required for 3D mouse parallax
          }}
        >
          {/* Background texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(232,68,46,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(232,68,46,0.05) 0%, transparent 50%)
            `,
          }}/>

          {/* Fine grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}/>

          {/* Scanline sweep */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(232,68,46,.2), transparent)',
            animation: 'scanline 6s linear infinite',
            pointerEvents: 'none', zIndex: 0,
          }}/>

          {/* Orbs with classes for GSAP targeting */}
          <div className="orb orb-1" style={{ width: 300, height: 300, background: 'rgba(232,68,46,0.12)', top: -100, right: -80 }}/>
          <div className="orb orb-2" style={{ width: 200, height: 200, background: 'rgba(44,80,160,0.08)', bottom: 40, left: -60 }}/>

          {/* Coral right edge */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 2,
            background: `linear-gradient(to bottom, transparent 10%, ${T.coral} 40%, ${T.coral} 60%, transparent 90%)`,
            opacity: .4,
          }}/>

          {/* ── Logo ── */}
          <div ref={logoRef} style={{ position: 'relative', zIndex: 2, opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: T.coral, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(232,68,46,.5)',
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3" fill="white"/>
                  <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
                  <line x1="8" y1="1"  x2="8"  y2="4"  stroke="white" strokeWidth="1.3"/>
                  <line x1="8" y1="12" x2="8"  y2="15" stroke="white" strokeWidth="1.3"/>
                  <line x1="1" y1="8"  x2="4"  y2="8"  stroke="white" strokeWidth="1.3"/>
                  <line x1="12" y1="8" x2="15" y2="8"  stroke="white" strokeWidth="1.3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: T.white, lineHeight: 1 }}>
                  GeoSync<span style={{ color: T.coral }}>.</span>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '.18em', color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', marginTop: 2 }}>
                  Live Location
                </div>
              </div>
            </div>
          </div>

          {/* ── Hero ── */}
          <div ref={heroRef} style={{ 
            position: 'relative', zIndex: 2, flex: 1, 
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transformStyle: 'preserve-3d' // Keeps nested elements 3D during rotation
          }}>

            {/* Tag */}
            <div className="hero-line" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginBottom: 22, padding: '5px 12px',
              background: 'rgba(232,68,46,.12)', border: '1px solid rgba(232,68,46,.22)',
              borderRadius: 999, alignSelf: 'flex-start'
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.coral, animation: 'pulseRing 1.5s ease-out infinite' }}/>
              <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.18em', color: T.coral, textTransform: 'uppercase' }}>
                Real-time sync active
              </span>
            </div>

            <h2 className="hero-line" style={{
              fontSize: 'clamp(44px, 4.8vw, 76px)',
              fontWeight: 900,
              lineHeight: .9,
              letterSpacing: '-.04em',
              color: T.white,
              marginBottom: 22,
            }}>
              Find your<br/>
              people<span style={{ color: T.coral }}>.</span><br/>
              <span style={{
                background: `linear-gradient(135deg, ${T.coral} 0%, #ff8c7a 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
              }}>Anywhere.</span>
            </h2>

            <p className="hero-line" style={{
              fontSize: 13, color: 'rgba(255,255,255,.38)', lineHeight: 1.8,
              maxWidth: 300, marginBottom: 36,
            }}>
              Create private rooms, share live location and stay in sync — powered by Socket.IO and Leaflet.js.
            </p>

            {/* Animated map mockup */}
            <div className="map-mockup" style={{
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 16, padding: '18px 20px',
              position: 'relative', overflow: 'hidden',
              animation: 'float 7s ease-in-out infinite',
              transformZ: '40px' // Pops out slightly during 3D rotation
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.coral }}/>
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '.18em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase' }}>
                  Room #4F9K2 • 3 active
                </span>
              </div>
              {/* Dot grid map */}
              <svg width="100%" viewBox="0 0 100 64" style={{ display: 'block' }}>
                {mapDots.map((d, i) => (
                  <g key={i} className="map-dot" style={{ transformOrigin: `${d.x}px ${d.y}px` }}>
                    <circle cx={d.x} cy={d.y} r={d.pulse ? 3 : 1.5}
                      fill={d.pulse ? T.coral : 'rgba(255,255,255,.15)'}/>
                    {d.pulse && (
                      <circle cx={d.x} cy={d.y} r="6"
                        fill="none" stroke={T.coral} strokeWidth=".5" opacity=".3"/>
                    )}
                  </g>
                ))}
                {/* connection line */}
                <line x1={mapDots[4].x} y1={mapDots[4].y} x2={mapDots[11].x} y2={mapDots[11].y}
                  stroke={T.coral} strokeWidth=".6" strokeDasharray="3 2" opacity=".4"/>
              </svg>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {['Private Rooms', 'Sub-100ms Sync', 'SOS Alerts', 'Geo-fencing'].map(f => (
                <div key={f} className="hero-pill" style={{
                  padding: '5px 11px',
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 999,
                  fontFamily: T.mono, fontSize: 10,
                  letterSpacing: '.1em', color: 'rgba(255,255,255,.4)',
                  textTransform: 'uppercase',
                }}>{f}</div>
              ))}
            </div>
          </div>

          {/* Version */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '.16em', color: 'rgba(255,255,255,.15)', textTransform: 'uppercase' }}>
              MERN Stack · v1.0.0 · MIT License
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            MOBILE HEADER (hidden on desktop)
        ════════════════════════════════════════ */}
        <div className="mobile-header" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: T.graphite,
          padding: '14px 24px',
          alignItems: 'center', gap: 10,
          borderBottom: `1px solid rgba(255,255,255,.07)`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: T.coral,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="white"/>
              <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
              <line x1="8" y1="1"  x2="8"  y2="4"  stroke="white" strokeWidth="1.3"/>
              <line x1="8" y1="12" x2="8"  y2="15" stroke="white" strokeWidth="1.3"/>
              <line x1="1" y1="8"  x2="4"  y2="8"  stroke="white" strokeWidth="1.3"/>
              <line x1="12" y1="8" x2="15" y2="8"  stroke="white" strokeWidth="1.3"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', color: T.white }}>
            GeoSync<span style={{ color: T.coral }}>.</span>
          </span>
        </div>

        {/* ════════════════════════════════════════
            RIGHT PANEL — form
        ════════════════════════════════════════ */}
        <div
          ref={rightRef}
          className="right-panel"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            padding: '56px 48px',
            position: 'relative', zIndex: 1,
            background: T.offwhite,
            opacity: 0,
          }}
        >
          {/* subtle bg texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(circle at 70% 20%, rgba(232,68,46,.04) 0%, transparent 55%)`,
          }}/>

          <div className="form-card" ref={formRef} style={{
            width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
            paddingTop: 'env(safe-area-inset-top)',
          }}>

            {/* ── Tab switcher ── */}
            <div className="form-element" style={{
              display: 'flex',
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 4,
              marginBottom: 36,
              gap: 4,
            }}>
              {['login', 'signup'].map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className="tab-btn"
                  style={{
                    borderRadius: 10,
                    color: tab === t ? T.white : T.muted,
                    background: tab === t ? T.graphite : 'transparent',
                    transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                    boxShadow: tab === t ? '0 2px 12px rgba(17,19,24,.18)' : 'none',
                  }}
                >
                  {t === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* ── Heading ── */}
            <div className="form-element" style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 'clamp(30px,5vw,40px)',
                fontWeight: 900,
                letterSpacing: '-.03em',
                color: T.graphite,
                lineHeight: 1.05,
                marginBottom: 8,
              }}>
                {tab === 'login' ? 'Welcome back.' : 'Create account.'}
              </h1>
              <p style={{
                fontFamily: T.mono, fontSize: 11,
                letterSpacing: '.12em', color: T.muted,
                textTransform: 'uppercase',
              }}>
                {tab === 'login' ? 'Enter your credentials to continue' : 'Join the network in 30 seconds'}
              </p>
            </div>

            {/* ── Error ── */}
            {error && (
              <div style={{
                padding: '12px 15px', borderRadius: 10, marginBottom: 18,
                background: 'rgba(232,68,46,.06)',
                border: `1px solid rgba(232,68,46,.22)`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6.5" stroke={T.coral}/>
                  <line x1="7" y1="4" x2="7" y2="7.5" stroke={T.coral} strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="9.5" r=".7" fill={T.coral}/>
                </svg>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.coral, letterSpacing: '.06em', lineHeight: 1.6 }}>
                  {error}
                </span>
              </div>
            )}

            {/* ── Form fields ── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {tab === 'signup' && (
                <Field
                  label="Full Name" id="name" type="text"
                  placeholder="Jane Smith"
                  value={name} onChange={e => setName(e.target.value)}
                />
              )}

              <Field
                label="Email Address" id="email" type="email"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />

              <div className="form-element">
                <Field
                  label={tab === 'signup' ? 'Password — min 6 chars' : 'Password'}
                  id="password" type="password"
                  placeholder="••••••••"
                  value={password} onChange={handlePasswordChange}
                />
                {tab === 'signup' && password && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <div style={{
                      flex: 1, height: 4, borderRadius: 999,
                      background: T.border, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${passStrength * 25}%`,
                        background: strengthColor,
                        transition: 'width .35s cubic-bezier(.4,0,.2,1), background .35s',
                      }}/>
                    </div>
                    <span style={{
                      fontFamily: T.mono, fontSize: 10, letterSpacing: '.1em',
                      color: strengthColor, width: 42, textAlign: 'right',
                    }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="form-element" style={{ marginTop: 6 }}>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? (
                    <>
                      <Spinner/>
                      {tab === 'login' ? 'Authenticating…' : 'Creating account…'}
                    </>
                  ) : (
                    <>
                      {tab === 'login' ? 'Log In' : 'Create Account'}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="form-element" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              margin: '24px 0 20px',
            }}>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
              <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.15em', color: T.muted, textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
            </div>

            {/* Switch link */}
            <p className="form-element" style={{
              textAlign: 'center',
              fontFamily: T.mono, fontSize: 11,
              color: T.muted, letterSpacing: '.07em',
            }}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
                style={{
                  color: T.coral, cursor: 'pointer',
                  borderBottom: `1px solid ${T.coral}`,
                  paddingBottom: 1,
                  transition: 'opacity .2s',
                  fontWeight: 500,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {tab === 'login' ? 'Sign up free' : 'Log in'}
              </span>
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;