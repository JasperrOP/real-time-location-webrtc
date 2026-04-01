import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const T = {
  white:   '#ffffff',
  offwhite:'#f8f7f5',
  border:  '#ebebea',
  graphite:'#1c1f26',
  graphite2:'#2e323c',
  muted:   '#8a8d96',
  coral:   '#e8442e',
  coralDim:'rgba(232,68,46,0.08)',
  coralGlow:'rgba(232,68,46,0.15)',
  success: '#2aad6f',
  font:    "'Syne', sans-serif",
  mono:    "'DM Mono', monospace",
};

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
@keyframes fadeUp {
  from { opacity:0; transform:translateY(22px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes pulse {
  0%,100% { transform:scale(1);   opacity:.35; }
  50%      { transform:scale(1.08);opacity:.55; }
}
@keyframes spin {
  to { transform:rotate(360deg); }
}
`;

const Chip = ({ children, color = T.coral }) => (
  <span style={{
    display:'inline-block', padding:'3px 10px',
    background:`${color}14`, color, borderRadius:999,
    fontFamily:T.mono, fontSize:10, letterSpacing:'.14em',
    textTransform:'uppercase', fontWeight:500,
  }}>{children}</span>
);

const Spinner = () => (
  <span style={{
    display:'inline-block', width:16, height:16,
    border:`2px solid ${T.border}`,
    borderTopColor:T.white,
    borderRadius:'50%',
    animation:'spin .65s linear infinite',
    verticalAlign:'middle', marginRight:8,
  }}/>
);

const Dashboard = () => {
  const navigate  = useNavigate();
  const [user, setUser]         = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining,  setJoining]  = useState(false);
  const [createErr,setCreateErr]= useState('');
  const [joinErr,  setJoinErr]  = useState('');
  const [hoverCreate, setHC]    = useState(false);
  const [hoverJoin,   setHJ]    = useState(false);
  const orb = useRef(null);
  const shell = useRef(null);

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) setUser(JSON.parse(profile));
    else navigate('/auth');
  }, [navigate]);

  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const move = e => {
      if (!orb.current) return;
      const r = el.getBoundingClientRect();
      orb.current.style.left = (e.clientX - r.left - 200) + 'px';
      orb.current.style.top  = (e.clientY - r.top  - 200) + 'px';
    };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div ref={shell} style={{
        minHeight:'100vh', background:T.offwhite,
        fontFamily:T.font, color:T.graphite,
        position:'relative', overflow:'hidden',
      }}>

        {/* ambient orb */}
        <div ref={orb} style={{
          position:'absolute', width:400, height:400,
          borderRadius:'50%', background:T.coralGlow,
          filter:'blur(90px)', pointerEvents:'none',
          transition:'left .8s ease, top .8s ease',
          zIndex:0, animation:'pulse 6s ease-in-out infinite',
        }}/>

        {/* subtle grid */}
        <div style={{
          position:'absolute', inset:0, zIndex:0, pointerEvents:'none',
          backgroundImage:`
            linear-gradient(${T.border} 1px, transparent 1px),
            linear-gradient(90deg, ${T.border} 1px, transparent 1px)
          `,
          backgroundSize:'60px 60px', opacity:.5,
        }}/>

        {/* ── NAVBAR ── */}
        <nav style={{
          position:'sticky', top:0, zIndex:50,
          background:'rgba(248,247,245,0.82)',
          backdropFilter:'blur(16px)',
          borderBottom:`1px solid ${T.border}`,
          padding:'0 40px', height:64,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          animation:'fadeUp .5s ease both',
        }}>
          {/* wordmark */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:T.graphite,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill={T.coral}/>
                <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1"/>
                <line x1="8" y1="1" x2="8" y2="4"  stroke="white" strokeWidth="1.2"/>
                <line x1="8" y1="12" x2="8" y2="15" stroke="white" strokeWidth="1.2"/>
                <line x1="1" y1="8" x2="4"  y2="8"  stroke="white" strokeWidth="1.2"/>
                <line x1="12" y1="8" x2="15" y2="8" stroke="white" strokeWidth="1.2"/>
              </svg>
            </div>
            <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em' }}>
              GeoSync<span style={{ color:T.coral }}>.</span>
            </span>
          </div>

          {/* right */}
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Chip color={T.success}>● Live</Chip>

            {/* avatar + name */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background:T.graphite, overflow:'hidden',
                border:`2px solid ${T.border}`,
                flexShrink:0,
              }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{
                      width:'100%', height:'100%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:T.white, fontWeight:700, fontSize:13,
                    }}>{user.name?.[0]?.toUpperCase()}</div>
                }
              </div>
              <span style={{ fontWeight:600, fontSize:14, color:T.graphite2 }}>{user.name}</span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                padding:'8px 16px', borderRadius:6,
                border:`1px solid ${T.border}`,
                background:'transparent', fontFamily:T.font,
                fontSize:13, fontWeight:600, color:T.muted,
                cursor:'pointer', transition:'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=T.coral; e.currentTarget.style.color=T.coral; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}
            >Logout</button>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main style={{
          position:'relative', zIndex:1,
          maxWidth:960, margin:'0 auto',
          padding:'64px 24px 80px',
        }}>

          {/* greeting */}
          <div style={{ marginBottom:56, animation:'fadeUp .6s .1s ease both', opacity:0 }}>
            <p style={{
              fontFamily:T.mono, fontSize:11, letterSpacing:'.2em',
              color:T.coral, textTransform:'uppercase', marginBottom:12,
            }}>{greeting}, {user.name?.split(' ')[0]}</p>
            <h1 style={{
              fontSize:'clamp(36px,5vw,60px)', fontWeight:800,
              lineHeight:.95, letterSpacing:'-.03em', color:T.graphite,
              marginBottom:14,
            }}>
              Your location<br/>
              <span style={{
                WebkitTextStroke:`1.5px ${T.graphite}`,
                color:'transparent',
              }}>network awaits.</span>
            </h1>
            <p style={{
              fontSize:14, color:T.muted, fontWeight:400,
              maxWidth:420, lineHeight:1.7,
            }}>
              Create a private room or drop a code to join one. Your live position syncs to everyone in the room in real time.
            </p>
          </div>

          {/* ── CARDS GRID ── */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',
            gap:24,
          }}>

            {/* ── CREATE ROOM CARD ── */}
            <div
              onMouseEnter={() => setHC(true)}
              onMouseLeave={() => setHC(false)}
              style={{
                background:T.white,
                border:`1px solid ${hoverCreate ? T.coral+'44' : T.border}`,
                borderRadius:20,
                padding:'36px 36px 32px',
                transition:'border-color .25s, box-shadow .25s, transform .25s',
                boxShadow: hoverCreate
                  ? `0 20px 60px rgba(232,68,46,.1), 0 4px 16px rgba(0,0,0,.06)`
                  : '0 2px 12px rgba(0,0,0,.04)',
                transform: hoverCreate ? 'translateY(-3px)' : 'none',
                animation:'fadeUp .65s .25s ease both', opacity:0,
              }}
            >
              {/* card top */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background:T.coralDim,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9.5" stroke={T.coral} strokeWidth="1.4"/>
                    <line x1="11" y1="5"  x2="11" y2="17" stroke={T.coral} strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="5"  y1="11" x2="17" y2="11" stroke={T.coral} strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <Chip>New room</Chip>
              </div>

              <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>
                Create a Map Room
              </h2>
              <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:28 }}>
                Start a private session and share the 6-digit code with whoever you want to track together.
              </p>

              {createErr && (
                <div style={{
                  padding:'10px 14px', borderRadius:8, marginBottom:16,
                  background:'rgba(232,68,46,.06)', border:`1px solid rgba(232,68,46,.2)`,
                  fontFamily:T.mono, fontSize:11, color:T.coral, letterSpacing:'.06em',
                }}>{createErr}</div>
              )}

              <form onSubmit={handleCreateRoom} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <input
                  type="text"
                  placeholder="Room name  —  e.g. Weekend Roadtrip"
                  required
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  style={{
                    width:'100%', padding:'13px 16px',
                    border:`1px solid ${T.border}`,
                    borderRadius:10, background:T.offwhite,
                    fontFamily:T.font, fontSize:14, color:T.graphite,
                    outline:'none', transition:'border-color .2s',
                  }}
                  onFocus={e  => e.target.style.borderColor = T.coral}
                  onBlur={e   => e.target.style.borderColor = T.border}
                />
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    width:'100%', padding:'14px',
                    background: creating ? T.graphite2 : T.coral,
                    color:T.white, border:'none', borderRadius:10,
                    fontFamily:T.font, fontWeight:700, fontSize:14,
                    letterSpacing:'.04em', cursor: creating ? 'default' : 'pointer',
                    transition:'background .2s, transform .1s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}
                  onMouseEnter={e => { if (!creating) e.currentTarget.style.background='#d43a23'; }}
                  onMouseLeave={e => { if (!creating) e.currentTarget.style.background=T.coral;    }}
                  onMouseDown={e  => { e.currentTarget.style.transform='scale(.98)'; }}
                  onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}
                >
                  {creating && <Spinner/>}
                  {creating ? 'Creating room…' : 'Create Map Room →'}
                </button>
              </form>
            </div>

            {/* ── JOIN ROOM CARD ── */}
            <div
              onMouseEnter={() => setHJ(true)}
              onMouseLeave={() => setHJ(false)}
              style={{
                background:T.graphite,
                border:`1px solid ${hoverJoin ? '#ffffff22' : '#ffffff0f'}`,
                borderRadius:20,
                padding:'36px 36px 32px',
                transition:'border-color .25s, box-shadow .25s, transform .25s',
                boxShadow: hoverJoin
                  ? '0 20px 60px rgba(0,0,0,.28), 0 4px 16px rgba(0,0,0,.18)'
                  : '0 2px 12px rgba(0,0,0,.12)',
                transform: hoverJoin ? 'translateY(-3px)' : 'none',
                animation:'fadeUp .65s .4s ease both', opacity:0,
                color:T.white,
              }}
            >
              {/* card top */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background:'rgba(255,255,255,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11h14M12 5l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{
                  padding:'3px 10px', borderRadius:999,
                  background:'rgba(255,255,255,0.1)',
                  fontFamily:T.mono, fontSize:10,
                  letterSpacing:'.14em', textTransform:'uppercase',
                  color:'rgba(255,255,255,0.6)',
                }}>Join existing</span>
              </div>

              <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', marginBottom:8 }}>
                Join a Map Room
              </h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:28 }}>
                Got a 6-digit code from someone? Drop it below and jump straight into their live session.
              </p>

              {joinErr && (
                <div style={{
                  padding:'10px 14px', borderRadius:8, marginBottom:16,
                  background:'rgba(232,68,46,.12)', border:'1px solid rgba(232,68,46,.35)',
                  fontFamily:T.mono, fontSize:11, color:'#ff7a6a', letterSpacing:'.06em',
                }}>{joinErr}</div>
              )}

              <form onSubmit={handleJoinRoom} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <input
                  type="text"
                  placeholder="A B C 1 2 3"
                  required
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  style={{
                    width:'100%', padding:'13px 16px',
                    border:'1px solid rgba(255,255,255,0.12)',
                    borderRadius:10, background:'rgba(255,255,255,0.06)',
                    fontFamily:T.mono, fontSize:20, fontWeight:500,
                    color:T.white, outline:'none',
                    letterSpacing:'.35em', textAlign:'center',
                    textTransform:'uppercase',
                    transition:'border-color .2s',
                  }}
                  onFocus={e  => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
                  onBlur={e   => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
                <button
                  type="submit"
                  disabled={joining}
                  style={{
                    width:'100%', padding:'14px',
                    background: joining ? 'rgba(255,255,255,0.1)' : T.white,
                    color: joining ? T.white : T.graphite,
                    border:'none', borderRadius:10,
                    fontFamily:T.font, fontWeight:700, fontSize:14,
                    letterSpacing:'.04em', cursor: joining ? 'default' : 'pointer',
                    transition:'background .2s, transform .1s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}
                  onMouseEnter={e => { if (!joining) e.currentTarget.style.background='rgba(255,255,255,0.88)'; }}
                  onMouseLeave={e => { if (!joining) e.currentTarget.style.background=T.white; }}
                  onMouseDown={e  => { e.currentTarget.style.transform='scale(.98)'; }}
                  onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}
                >
                  {joining && <Spinner/>}
                  {joining ? 'Joining room…' : 'Join Map Room →'}
                </button>
              </form>
            </div>
          </div>

          {/* ── BOTTOM INFO STRIP ── */}
          <div style={{
            marginTop:48,
            display:'flex', flexWrap:'wrap', gap:24,
            padding:'24px 28px',
            background:T.white,
            border:`1px solid ${T.border}`,
            borderRadius:16,
            animation:'fadeUp .65s .55s ease both', opacity:0,
          }}>
            {[
              { label:'Protocol',   val:'Socket.IO',        note:'Real-time' },
              { label:'Map engine', val:'Leaflet.js',        note:'OpenStreetMap' },
              { label:'Auth',       val:'JWT Bearer',        note:'Secure' },
              { label:'Stack',      val:'MERN',              note:'Full-stack' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div>
                  <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:'.16em', color:T.muted, textTransform:'uppercase', marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{s.val} <span style={{ fontFamily:T.mono, fontSize:10, color:T.coral }}>/ {s.note}</span></div>
                </div>
                <div style={{ width:1, height:32, background:T.border, marginLeft:10 }}/>
              </div>
            ))}
          </div>

        </main>
      </div>
    </>
  );
};

export default Dashboard;