import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

/* ─────────────────────────── TOKENS ─────────────────────────── */
const T = {
  white:     '#ffffff',
  offwhite:  '#f7f6f3',
  border:    '#e8e7e4',
  graphite:  '#111318',
  graphite2: '#1e222b',
  muted:     '#888c96',
  coral:     '#e8442e',
  coralDim:  'rgba(232,68,46,0.09)',
  coralGlow: 'rgba(232,68,46,0.15)',
  success:   '#2aad6f',
  font:      "'Cabinet Grotesk','Syne',sans-serif",
  mono:      "'DM Mono',monospace",
};

/* ─────────────────────────── GLOBAL CSS ─────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}

@keyframes spin       { to{transform:rotate(360deg)} }
@keyframes radarSpin  { to{transform:rotate(360deg)} }
@keyframes blink      { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes pingRing   { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.4);opacity:0} }
@keyframes particleFly{
  0%  {transform:translate(0,0) scale(1);   opacity:.7}
  100%{transform:translate(var(--tx),var(--ty)) scale(0); opacity:0}
}

/* ── Nav ── */
.gs-nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  background:rgba(247,246,243,0.85);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid ${T.border};
  height:66px;padding:0 40px;
  display:flex;align-items:center;justify-content:space-between;
}
@media(max-width:640px){
  .gs-nav{padding:0 18px;height:58px}
  .gs-nav-actions{gap:10px!important}
  .gs-nav-name{display:none!important}
}

/* ── Cards ── */
.room-card{
  border-radius:22px;padding:34px 32px 30px;
  transition:border-color .3s;
  position:relative;overflow:hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}
.room-card-light{background:${T.white};border:1.5px solid ${T.border}}
.room-card-light:hover{border-color:${T.coral}55;}
.room-card-dark{background:${T.graphite};border:1.5px solid rgba(255,255,255,.07)}
.room-card-dark:hover{border-color:rgba(255,255,255,.18);}

/* ── Inputs ── */
.gs-input{
  width:100%;padding:14px 16px;
  background:${T.offwhite};
  border:1.5px solid ${T.border};
  border-radius:12px;outline:none;
  font-family:${T.font};font-size:14px;color:${T.graphite};
  transition:border-color .25s,background .25s,box-shadow .25s;
  caret-color:${T.coral};
}
.gs-input::placeholder{color:${T.muted}}
.gs-input:focus{border-color:${T.coral};background:${T.white};box-shadow:0 0 0 3px rgba(232,68,46,.1)}

.gs-input-dark{
  width:100%;padding:14px 16px;
  background:rgba(255,255,255,.06);
  border:1.5px solid rgba(255,255,255,.1);
  border-radius:12px;outline:none;
  font-family:${T.mono};font-size:22px;font-weight:500;
  color:${T.white};letter-spacing:.38em;text-align:center;text-transform:uppercase;
  transition:border-color .25s,background .25s,box-shadow .25s;
  caret-color:${T.coral};
}
.gs-input-dark::placeholder{color:rgba(255,255,255,.2);letter-spacing:.2em}
.gs-input-dark:focus{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.1);box-shadow:0 0 0 3px rgba(255,255,255,.06)}

/* ── Buttons ── */
.btn-coral{
  width:100%;padding:16px;
  background:${T.coral};color:${T.white};
  border:none;border-radius:13px;
  font-family:${T.font};font-weight:800;font-size:15px;letter-spacing:.05em;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
  position:relative;overflow:hidden;
  box-shadow:0 6px 24px rgba(232,68,46,.38),0 2px 8px rgba(232,68,46,.2);
}
.btn-coral:disabled{opacity:.65;cursor:default}
.btn-coral::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);transform:translateX(-100%);transition:transform .55s}
.btn-coral:hover::after{transform:translateX(100%)}

.btn-white{
  width:100%;padding:16px;
  background:${T.white};color:${T.graphite};
  border:none;border-radius:13px;
  font-family:${T.font};font-weight:800;font-size:15px;letter-spacing:.05em;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
  position:relative;overflow:hidden;
  box-shadow:0 4px 16px rgba(255,255,255,.12);
}
.btn-white:disabled{opacity:.65;cursor:default}

/* ── Stats strip ── */
.stat-strip{
  display:flex;flex-wrap:wrap;gap:0;
  background:${T.white};
  border:1.5px solid ${T.border};
  border-radius:18px;overflow:hidden;
}
.stat-item{
  flex:1;min-width:140px;padding:22px 28px;
  border-right:1px solid ${T.border};
  position:relative;
}
.stat-item:last-child{border-right:none}

/* Text Reveal Utilities */
.reveal-wrap { display: inline-block; overflow: hidden; vertical-align: bottom; }
.reveal-text { display: inline-block; transform-origin: left bottom; }

/* Marquee */
.marquee-container {
  width: 100vw; overflow: hidden; white-space: nowrap; 
  padding: 20px 0; margin-left: calc(-50vw + 50%); margin-bottom: 40px;
  background: ${T.coral}; color: ${T.white}; font-family: ${T.font};
  font-weight: 900; font-size: 3rem; text-transform: uppercase; letter-spacing: -0.02em;
  transform: rotate(-2deg); box-shadow: 0 10px 30px rgba(232,68,46,.2);
}
.marquee-track { display: inline-flex; align-items: center; gap: 40px; }

/* ── Horizontal Scroll Section ── */
.hz-section {
  height: 100vh;
  width: 100vw;
  background: ${T.graphite};
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  margin-left: calc(-50vw + 50%); /* Break out of container to full width */
}
.hz-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10vw;
  white-space: nowrap;
  position: relative;
  /* Will be translated by GSAP */
}
.hz-text {
  font-family: ${T.font};
  font-size: clamp(80px, 16vw, 250px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  color: ${T.white};
  display: flex;
  align-items: center;
  gap: 40px;
}
.hz-outline {
  -webkit-text-stroke: 2px rgba(255,255,255,0.2);
  color: transparent;
}
.hz-sticker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 30px;
  padding: 15px 30px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  color: ${T.coral};
  font-family: ${T.mono};
  font-size: clamp(14px, 2vw, 24px);
  font-weight: 600;
  letter-spacing: 0.1em;
}
.hz-bg-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(255,255,255,0.05) 2px, transparent 2px);
  background-size: 40px 40px;
}

/* ── Mobile ── */
@media(max-width:700px){
  .cards-grid{grid-template-columns:1fr!important}
  .stat-item{border-right:none;border-bottom:1px solid ${T.border}}
  .stat-item:last-child{border-bottom:none}
  .main-pad{padding:90px 18px 60px!important}
  .radar-wrap{display:none!important}
  .greeting-row{flex-direction:column!important;align-items:flex-start!important}
  .marquee-container { font-size: 2rem; transform: rotate(-1deg); }
  .hz-text { gap: 20px; }
  .hz-sticker { padding: 10px 20px; border-radius: 20px; }
}
`;

/* ─── Magnetic Wrapper for Buttons ─── */
const Magnetic = ({ children }) => {
  const ref = useRef(null);
  
  const handleMouseMove = (e) => {
    if(!window.gsap) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.3;
    const y = (clientY - (top + height / 2)) * 0.3;
    window.gsap.to(ref.current, { x, y, duration: 1, ease: 'power3.out' });
  };

  const handleMouseLeave = () => {
    if(!window.gsap) return;
    window.gsap.to(ref.current, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' });
  };

  return React.cloneElement(children, {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { ...children.props.style, display: 'inline-block', width: '100%' }
  });
};

/* ─── Word Splitter ─── */
const SplitText = ({ text }) => {
  return text.split(' ').map((word, i) => (
    <span key={i} className="reveal-wrap" style={{ marginRight: '0.25em' }}>
      <span className="reveal-text">{word}</span>
    </span>
  ));
};

/* ─── Spinner ─── */
const Spinner = ({ dark }) => (
  <span style={{
    display:'inline-block',width:16,height:16,flexShrink:0,
    border:`2px solid ${dark ? T.border : 'rgba(255,255,255,.3)'}`,
    borderTopColor: dark ? T.graphite : T.white,
    borderRadius:'50%',animation:'spin .6s linear infinite',
  }}/>
);

/* ─── Particle burst on card hover ─── */
const PARTICLES = 10;
const ParticleBurst = ({ active, color='#e8442e' }) => {
  const particles = Array.from({length:PARTICLES},(_,i)=>{
    const angle = (i/PARTICLES)*360;
    const dist  = 40 + Math.random()*40;
    const tx    = Math.cos(angle*Math.PI/180)*dist;
    const ty    = Math.sin(angle*Math.PI/180)*dist;
    return { tx, ty, delay: Math.random()*0.15 };
  });
  if (!active) return null;
  return (
    <div style={{position:'absolute',top:'50%',left:'50%',pointerEvents:'none',zIndex:10}}>
      {particles.map((p,i)=>(
        <div key={i} style={{
          position:'absolute',width:5,height:5,borderRadius:'50%',
          background:color,top:-2.5,left:-2.5,
          '--tx':`${p.tx}px`,'--ty':`${p.ty}px`,
          animation:`particleFly .7s ${p.delay}s ease-out forwards`,
        }}/>
      ))}
    </div>
  );
};

/* ─── Radar SVG ─── */
const Radar = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" style={{display:'block'}}>
    <defs>
      <radialGradient id="rg" cx="50%" cy="50%">
        <stop offset="0%" stopColor={T.coral} stopOpacity=".15"/>
        <stop offset="100%" stopColor={T.coral} stopOpacity="0"/>
      </radialGradient>
    </defs>
    {[20,36,52].map(r=>(
      <circle key={r} cx="60" cy="60" r={r} fill="none"
        stroke={T.coral} strokeWidth=".8" strokeOpacity=".18"/>
    ))}
    <line x1="60" y1="8" x2="60" y2="112" stroke={T.coral} strokeWidth=".6" strokeOpacity=".14"/>
    <line x1="8"  y1="60" x2="112" y2="60" stroke={T.coral} strokeWidth=".6" strokeOpacity=".14"/>
    <g style={{transformOrigin:'60px 60px',animation:'radarSpin 3s linear infinite'}}>
      <path d="M60 60 L60 8 A52 52 0 0 1 112 60 Z" fill={`url(#rg)`} opacity=".7"/>
      <line x1="60" y1="60" x2="60" y2="8" stroke={T.coral} strokeWidth="1.2" strokeOpacity=".8"/>
    </g>
    <circle cx="60" cy="60" fill="none" stroke={T.coral} strokeWidth="1"
      style={{animation:'pingRing 2s .3s ease-out infinite'}} r="0"/>
    <circle cx="60" cy="60" fill="none" stroke={T.coral} strokeWidth="1"
      style={{animation:'pingRing 2s 1.3s ease-out infinite'}} r="0"/>
    {[{cx:38,cy:44},{cx:74,cy:70},{cx:55,cy:76}].map((d,i)=>(
      <circle key={i} cx={d.cx} cy={d.cy} r="3.5" fill={T.coral}
        style={{animation:`blink ${1.2+i*.4}s ${i*.3}s ease-in-out infinite`}}/>
    ))}
    <circle cx="60" cy="60" r="4" fill={T.coral}/>
    <circle cx="60" cy="60" r="7" fill="none" stroke={T.coral} strokeWidth="1" strokeOpacity=".4"/>
  </svg>
);


/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const [user,       setUser]      = useState(null);
  const [roomName,   setRoomName]  = useState('');
  const [joinCode,   setJoinCode]  = useState('');
  const [creating,   setCreating]  = useState(false);
  const [joining,    setJoining]   = useState(false);
  const [createErr,  setCreateErr] = useState('');
  const [joinErr,    setJoinErr]   = useState('');
  const [burstC,     setBurstC]    = useState(false);
  const [burstJ,     setBurstJ]    = useState(false);

  const shellRef           = useRef(null);
  const navRef             = useRef(null);
  const greetRef           = useRef(null);
  const radarRef           = useRef(null);
  const cardsRef           = useRef(null);
  const stripRef           = useRef(null);
  const card1Ref           = useRef(null);
  const card2Ref           = useRef(null);
  const marqueeRef         = useRef(null);
  
  // New Refs for Horizontal Scroll
  const horizontalRef        = useRef(null);
  const horizontalContentRef = useRef(null);
  
  const gsapLoaded         = useRef(false);

  /* ── Load GSAP + ScrollTrigger ── */
  const loadGSAP = useCallback(() => {
    return new Promise(resolve => {
      if (window.gsap && window.ScrollTrigger) { resolve(); return; }
      if (document.getElementById('gsap-sc')) {
        const check = setInterval(() => {
          if (window.gsap && window.ScrollTrigger) { clearInterval(check); resolve(); }
        }, 50);
        return;
      }
      const s1 = document.createElement('script');
      s1.id  = 'gsap-sc';
      s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
        s2.onload = () => { window.gsap.registerPlugin(window.ScrollTrigger); resolve(); };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    });
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) setUser(JSON.parse(profile));
    else navigate('/auth');
  }, [navigate]);

  /* ── Init GSAP animations ── */
  useEffect(() => {
    if (!user) return;
    loadGSAP().then(() => {
      const g  = window.gsap;
      const ST = window.ScrollTrigger;
      if (!g || gsapLoaded.current) return;
      gsapLoaded.current = true;

      /* NAV */
      g.fromTo(navRef.current,
        { y:-70, opacity:0 },
        { y:0, opacity:1, duration:.8, ease:'power3.out' }
      );

      /* HERO Text Split Reveal */
      const heroTexts = greetRef.current.querySelectorAll('.reveal-text');
      g.fromTo(heroTexts, 
        { y: '120%', rotateZ: 8, opacity: 0 },
        { y: '0%', rotateZ: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: 'power4.out', delay: 0.2 }
      );

      /* HERO subtext fade up */
      g.fromTo('.hero-sub',
        { opacity:0, y:20 },
        { opacity:1, y:0, duration:1, delay:0.8, ease:'power3.out' }
      );

      /* CARDS 3D Hover/Scroll Reveal */
      [card1Ref.current, card2Ref.current].forEach((el,i) => {
        if (!el) return;
        g.fromTo(el,
          { opacity:0, y:80, rotationX: -15, scale: 0.95 },
          {
            opacity:1, y:0, rotationX: 0, scale: 1,
            duration: 1.2, ease:'back.out(1.2)',
            scrollTrigger:{
              trigger: el, start:'top 90%',
              toggleActions:'play none none reverse',
            },
            delay: i * .2,
          }
        );
        
        // 3D Card Hover effect
        el.addEventListener("mousemove", (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            g.to(el, {
                rotationX: rotateX,
                rotationY: rotateY,
                boxShadow: `0 30px 60px -12px rgba(0,0,0,0.25)`,
                duration: 0.4, ease: "power2.out", transformPerspective: 1000
            });
        });
        
        el.addEventListener("mouseleave", () => {
            g.to(el, {
                rotationX: 0, rotationY: 0,
                boxShadow: `none`,
                duration: 0.6, ease: "elastic.out(1, 0.5)"
            });
        });
      });

      /* STAT STRIP */
      if (stripRef.current) {
        g.fromTo(stripRef.current,
          { opacity:0, y:40, scale: 0.98 },
          {
            opacity:1, y:0, scale: 1, duration:1, ease:'power3.out',
            scrollTrigger:{ trigger:stripRef.current, start:'top 90%' },
          }
        );
      }

      /* Infinite Marquee Scrubbing */
      if (marqueeRef.current) {
        const track = marqueeRef.current.querySelector('.marquee-track');
        g.to(track, {
          xPercent: -50,
          ease: "none",
          duration: 15,
          repeat: -1
        });
        // Scroll velocity scrub
        ST.create({
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            onUpdate: (self) => {
                g.to(track, { timeScale: self.direction === 1 ? 1 + (self.getVelocity() / 300) : 1 - (self.getVelocity() / 300), overwrite: true });
                g.to(track, { timeScale: 1, delay: 0.5, overwrite: "auto" }); // return to normal
            }
        });
      }

      /* 3D Radar Mouse Tracking */
      const handleGlobalMouse = (e) => {
        if (!radarRef.current) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 40; 
        const y = (e.clientY / window.innerHeight - 0.5) * -40;
        
        g.to(radarRef.current, {
            rotationY: x,
            rotationX: y,
            duration: 1.5,
            ease: "power3.out",
            transformPerspective: 1000,
            transformOrigin: "center center"
        });
      };
      window.addEventListener('mousemove', handleGlobalMouse);

      /* ─── HORIZONTAL SCROLL LOGIC ─── */
      if (horizontalRef.current && horizontalContentRef.current) {
        
        // Calculate the total horizontal scroll distance
        const getScrollAmount = () => {
          const scrollWidth = horizontalContentRef.current.scrollWidth;
          return -(scrollWidth - window.innerWidth);
        };

        const tween = g.to(horizontalContentRef.current, {
          x: getScrollAmount,
          ease: "none"
        });

        ST.create({
          trigger: horizontalRef.current,
          start: "top top",
          end: () => `+=${getScrollAmount() * -1}`, // The scroll duration matches the width
          pin: true,
          animation: tween,
          scrub: 1, // Smooth scrub effect
          invalidateOnRefresh: true, // Recalculates on resize
        });

        // Float the stickers inside the horizontal section
        g.to('.hz-sticker', {
          y: "random(-25, 25)",
          rotation: "random(-10, 10)",
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.2
        });
      }

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouse);
        ST.getAll().forEach(t => t.kill());
      };

    });
  }, [user, loadGSAP]);


  /* ── Backend logic (unchanged) ── */
  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    navigate('/auth');
  };

  const handleCreateRoom = async e => {
    e.preventDefault();
    setCreateErr(''); setCreating(true);
    try {
      const { data } = await API.post('/api/rooms/create', { name: roomName });
      navigate(`/room/${data.code}`);
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const handleJoinRoom = async e => {
    e.preventDefault();
    setJoinErr(''); setJoining(true);
    try {
      const { data } = await API.post('/api/rooms/join', { code: joinCode.toUpperCase() });
      navigate(`/room/${data.code}`);
    } catch (err) {
      setJoinErr(err.response?.data?.message || 'Invalid room code');
    } finally { setJoining(false); }
  };

  if (!user) return null;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <>
      <style>{G}</style>

      <div ref={shellRef} style={{
        minHeight:'100vh', background:T.offwhite,
        fontFamily:T.font, color:T.graphite,
        position:'relative', overflowX:'hidden', paddingTop: '66px'
      }}>

        {/* ── Dot grid ── */}
        <div style={{
          position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
          backgroundImage:`radial-gradient(circle, rgba(17,19,24,.06) 1px, transparent 1px)`,
          backgroundSize:'32px 32px',
        }}/>

        {/* ═══════════════ NAV ═══════════════ */}
        <nav ref={navRef} className="gs-nav" style={{opacity:0}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{
              width:36,height:36,borderRadius:10,
              background:T.graphite,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,.18)', flexShrink:0,
            }}>
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill={T.coral}/>
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1"/>
                <line x1="8" y1="1"  x2="8"  y2="4"  stroke="white" strokeWidth="1.3"/>
                <line x1="8" y1="12" x2="8"  y2="15" stroke="white" strokeWidth="1.3"/>
                <line x1="1" y1="8"  x2="4"  y2="8"  stroke="white" strokeWidth="1.3"/>
                <line x1="12" y1="8" x2="15" y2="8"  stroke="white" strokeWidth="1.3"/>
              </svg>
            </div>
            <span style={{fontWeight:900,fontSize:19,letterSpacing:'-.02em',color:T.graphite}}>
              GeoSync<span style={{color:T.coral}}>.</span>
            </span>
          </div>

          <div className="gs-nav-actions" style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'5px 12px', background:'rgba(42,173,111,.1)',
              border:'1px solid rgba(42,173,111,.25)', borderRadius:999,
            }}>
              <div style={{
                width:6,height:6,borderRadius:'50%',background:T.success,
                animation:'blink 1.6s ease-in-out infinite',
              }}/>
              <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'.16em',color:T.success,textTransform:'uppercase'}}>
                Live
              </span>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{
                width:36,height:36,borderRadius:'50%',
                background:`linear-gradient(135deg, ${T.coral}, #ff8c7a)`,
                display:'flex',alignItems:'center',justifyContent:'center',
                border:`2px solid ${T.border}`,flexShrink:0,
                boxShadow:'0 2px 8px rgba(232,68,46,.3)',
              }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                  : <span style={{color:T.white,fontWeight:800,fontSize:14}}>{user.name?.[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="gs-nav-name" style={{fontWeight:700,fontSize:14,color:T.graphite2}}>
                {user.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding:'8px 16px',borderRadius:8,
                border:`1.5px solid ${T.border}`,
                background:'transparent',fontFamily:T.font,
                fontSize:13,fontWeight:700,color:T.muted,
                cursor:'pointer',transition:'all .2s',letterSpacing:'.04em',
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.coral;e.currentTarget.style.color=T.coral;e.currentTarget.style.background=T.coralDim}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;e.currentTarget.style.background='transparent'}}
            >Logout</button>
          </div>
        </nav>

        {/* ═══════════════ MAIN ═══════════════ */}
        <main className="main-pad" ref={greetRef} style={{
          position:'relative',zIndex:1,
          maxWidth:980,margin:'0 auto',
          padding:'68px 28px 40px',
        }}>

          {/* ── HERO ROW ── */}
          <div className="greeting-row" style={{
            display:'flex',alignItems:'center',
            justifyContent:'space-between',
            marginBottom:64,gap:28,
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div className="hero-sub" style={{
                display:'inline-flex',alignItems:'center',gap:8,
                padding:'5px 14px',marginBottom:20,
                background:T.coralDim,
                border:`1px solid rgba(232,68,46,.18)`,
                borderRadius:999,
              }}>
                <div style={{
                  width:5,height:5,borderRadius:'50%',background:T.coral,
                  animation:'blink 1.4s ease-in-out infinite',
                }}/>
                <span style={{fontFamily:T.mono,fontSize:10,letterSpacing:'.18em',color:T.coral,textTransform:'uppercase'}}>
                  {greeting}, {firstName}
                </span>
              </div>

              <h1 className="hero-title" style={{
                fontSize:'clamp(40px,6.5vw,76px)',
                fontWeight:900,lineHeight:.92,
                letterSpacing:'-.04em',color:T.graphite,
                marginBottom:20,
              }}>
                <SplitText text="Your location" />
                <br />
                <span style={{
                  WebkitTextStroke:`2px ${T.graphite}`,
                  color:'transparent', display:'block', marginTop:4,
                }}>
                  <SplitText text="network awaits." />
                </span>
              </h1>

              <p className="hero-sub" style={{
                fontSize:15,color:T.muted,lineHeight:1.8,
                maxWidth:420,fontWeight:400,
              }}>
                Create a private room or drop a code to join one. Your live position syncs to everyone in the room in real time.
              </p>
            </div>

            {/* Radar 3D Container */}
            <div style={{ perspective: '800px', flexShrink: 0 }} className="radar-wrap">
                <div ref={radarRef} style={{
                width:180,height:180,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:T.graphite,borderRadius:32,
                border:'1px solid rgba(255,255,255,.06)',
                position:'relative',overflow:'hidden',
                boxShadow:'0 30px 60px rgba(0,0,0,.3)',
                }}>
                <div style={{
                    position:'absolute',inset:0,pointerEvents:'none',
                    backgroundImage:`linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
                    backgroundSize:'20px 20px',
                }}/>
                <Radar/>
                </div>
            </div>
          </div>

          {/* ── Continuous Marquee ── */}
          <div ref={marqueeRef} className="marquee-container">
            <div className="marquee-track">
                <span>CONNECT ANYWHERE • REAL-TIME SYNC • PRIVATE ROOMS • SECURE LOCATIONS • </span>
                <span>CONNECT ANYWHERE • REAL-TIME SYNC • PRIVATE ROOMS • SECURE LOCATIONS • </span>
                <span>CONNECT ANYWHERE • REAL-TIME SYNC • PRIVATE ROOMS • SECURE LOCATIONS • </span>
            </div>
          </div>

          {/* ── CARDS GRID ── */}
          <div ref={cardsRef} className="cards-grid" style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))',
            gap:24,marginBottom:40,
          }}>

            {/* ── CREATE ROOM ── */}
            <div ref={card1Ref} className="room-card room-card-light"
              onMouseEnter={() => setBurstC(true)} onMouseLeave={() => setBurstC(false)}
            >
              <ParticleBurst active={burstC} color={T.coral}/>

              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
                <div style={{
                  width:50,height:50,borderRadius:14, background:T.coralDim,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9.5" stroke={T.coral} strokeWidth="1.5"/>
                    <line x1="11" y1="5"  x2="11" y2="17" stroke={T.coral} strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="5"  y1="11" x2="17" y2="11" stroke={T.coral} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{
                  padding:'4px 12px',borderRadius:999, background:T.coralDim,
                  fontFamily:T.mono,fontSize:10,letterSpacing:'.14em',
                  textTransform:'uppercase',color:T.coral,fontWeight:500,
                }}>New room</div>
              </div>

              <h2 style={{fontSize:25,fontWeight:900,letterSpacing:'-.025em',marginBottom:8}}>
                Create a Map Room
              </h2>
              <p style={{fontSize:14,color:T.muted,lineHeight:1.75,marginBottom:28}}>
                Start a private session and share the 6-digit code with whoever you want to track together.
              </p>

              {createErr && (
                <div style={{
                  padding:'11px 14px',borderRadius:10,marginBottom:16,
                  background:'rgba(232,68,46,.06)',border:'1px solid rgba(232,68,46,.2)',
                  display:'flex',alignItems:'center',gap:8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                    <circle cx="7" cy="7" r="6.5" stroke={T.coral}/>
                    <line x1="7" y1="3.5" x2="7" y2="7.5" stroke={T.coral} strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="7" cy="9.5" r=".7" fill={T.coral}/>
                  </svg>
                  <span style={{fontFamily:T.mono,fontSize:11,color:T.coral,letterSpacing:'.06em'}}>{createErr}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{display:'block',fontFamily:T.mono,fontSize:10,letterSpacing:'.2em',color:T.muted,textTransform:'uppercase',marginBottom:7}}>
                    Room Name
                  </label>
                  <input
                    type="text" placeholder="e.g. Weekend Roadtrip" required
                    value={roomName} onChange={e => setRoomName(e.target.value)}
                    className="gs-input"
                  />
                </div>
                <Magnetic>
                    <button type="submit" disabled={creating} className="btn-coral" style={{marginTop:4}}>
                    {creating ? <><Spinner/> Creating room…</> : <>Create Map Room <ArrowIcon/></>}
                    </button>
                </Magnetic>
              </form>

              <div style={{
                position:'absolute',bottom:-20,right:-20,
                width:100,height:100,borderRadius:'50%', background:'rgba(232,68,46,.05)',
                filter:'blur(20px)',pointerEvents:'none',
              }}/>
            </div>

            {/* ── JOIN ROOM ── */}
            <div ref={card2Ref} className="room-card room-card-dark" style={{color:T.white}}
              onMouseEnter={() => setBurstJ(true)} onMouseLeave={() => setBurstJ(false)}
            >
              <ParticleBurst active={burstJ} color="rgba(255,255,255,0.6)"/>

              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24}}>
                <div style={{
                  width:50,height:50,borderRadius:14, background:'rgba(255,255,255,.08)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11h14M12 5l6 6-6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{
                  padding:'4px 12px',borderRadius:999, background:'rgba(255,255,255,.1)',
                  fontFamily:T.mono,fontSize:10,letterSpacing:'.14em',
                  textTransform:'uppercase',color:'rgba(255,255,255,.6)',fontWeight:500,
                }}>Join existing</div>
              </div>

              <div style={{
                position:'absolute',inset:0,pointerEvents:'none',borderRadius:22,
                backgroundImage:`linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px, transparent 1px)`,
                backgroundSize:'36px 36px',
              }}/>

              <h2 style={{fontSize:25,fontWeight:900,letterSpacing:'-.025em',marginBottom:8,position:'relative',zIndex:1}}>
                Join a Map Room
              </h2>
              <p style={{fontSize:14,color:'rgba(255,255,255,.42)',lineHeight:1.75,marginBottom:28,position:'relative',zIndex:1}}>
                Got a 6-digit code? Drop it below and jump straight into a live session.
              </p>

              {joinErr && (
                <div style={{
                  padding:'11px 14px',borderRadius:10,marginBottom:16,
                  background:'rgba(232,68,46,.12)',border:'1px solid rgba(232,68,46,.35)',
                  display:'flex',alignItems:'center',gap:8,position:'relative',zIndex:1,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}>
                    <circle cx="7" cy="7" r="6.5" stroke="#ff7a6a"/>
                    <line x1="7" y1="3.5" x2="7" y2="7.5" stroke="#ff7a6a" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="7" cy="9.5" r=".7" fill="#ff7a6a"/>
                  </svg>
                  <span style={{fontFamily:T.mono,fontSize:11,color:'#ff7a6a',letterSpacing:'.06em'}}>{joinErr}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} style={{display:'flex',flexDirection:'column',gap:12,position:'relative',zIndex:1}}>
                <div>
                  <label style={{display:'block',fontFamily:T.mono,fontSize:10,letterSpacing:'.2em',color:'rgba(255,255,255,.35)',textTransform:'uppercase',marginBottom:7}}>
                    Room Code
                  </label>
                  <input
                    type="text" placeholder="ABC123" required maxLength={6}
                    value={joinCode} onChange={e => setJoinCode(e.target.value)}
                    className="gs-input-dark"
                  />
                </div>
                <Magnetic>
                    <button type="submit" disabled={joining} className="btn-white" style={{marginTop:4}}>
                    {joining ? <><Spinner dark/> Joining room…</> : <>Join Map Room <ArrowIcon color={T.graphite}/></>}
                    </button>
                </Magnetic>
              </form>

              <div style={{
                position:'absolute',bottom:-40,right:-30, width:180,height:180,borderRadius:'50%',
                background:'rgba(232,68,46,.07)', filter:'blur(50px)',pointerEvents:'none',
              }}/>
            </div>
          </div>

          {/* ── STAT STRIP ── */}
          <div ref={stripRef} className="stat-strip" style={{opacity:0}}>
            {[
              { label:'Protocol',   val:'Socket.IO',  note:'Real-time',  icon:'⚡' },
              { label:'Map engine', val:'Leaflet.js',  note:'OpenStreetMap', icon:'🗺' },
              { label:'Auth',       val:'JWT Bearer',  note:'Secure',     icon:'🔒' },
              { label:'Stack',      val:'MERN',        note:'Full-stack', icon:'⚙' },
            ].map((s,i) => (
              <div key={s.label} className="stat-item" style={{ transition:'background .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background=T.offwhite}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:'.18em',color:T.muted,textTransform:'uppercase',marginBottom:6}}>
                  {s.icon} {s.label}
                </div>
                <div style={{fontWeight:800,fontSize:15,color:T.graphite,letterSpacing:'-.01em'}}>
                  {s.val}
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.coral,marginLeft:6,fontWeight:400}}>
                    / {s.note}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </main>

        {/* ═══════════════ HORIZONTAL SCROLL SECTION ═══════════════ */}
        <section ref={horizontalRef} className="hz-section">
          <div className="hz-bg-grid" />
          
          <div ref={horizontalContentRef} className="hz-content">
            
            <div className="hz-text">
              <span className="hz-outline">DESIGNED &</span>
              
              <div className="hz-sticker">✦ CRAFTED WITH REACT</div>
              
              <span>MADE BY</span>
              
              <div className="hz-sticker" style={{ borderColor: T.coral, color: T.white, background: T.coral }}>
                ⚙ FULL-STACK
              </div>

              <span style={{ color: T.coral }}>AYUSH</span>
              
              <div className="hz-sticker">🌐 GEOSYNC V1.0</div>
              
              <span className="hz-outline">IN 2026</span>
            </div>

          </div>
        </section>

      </div>
    </>
  );
};

/* ─── Arrow icon helper ─── */
const ArrowIcon = ({ color='white' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
    <path d="M3 8h10M9 4l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Dashboard;