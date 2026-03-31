import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const T = {
  white:    '#ffffff',
  offwhite: '#f8f7f5',
  border:   '#ebebea',
  graphite: '#1c1f26',
  graphite2:'#2e323c',
  muted:    '#8a8d96',
  coral:    '#e8442e',
  coralDim: 'rgba(232,68,46,0.08)',
  success:  '#2aad6f',
  font:     "'Syne', sans-serif",
  mono:     "'DM Mono', monospace",
};

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
@keyframes fadeUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes spin {
  to { transform:rotate(360deg); }
}
@keyframes shimmer {
  from { left:-80%; }
  to   { left:130%; }
}
`;

const Spinner = ({ dark }) => (
  <span style={{
    display:'inline-block', width:14, height:14,
    border:`2px solid ${dark ? T.border : 'rgba(255,255,255,.3)'}`,
    borderTopColor: dark ? T.graphite : T.white,
    borderRadius:'50%',
    animation:'spin .65s linear infinite',
    verticalAlign:'middle', marginRight:8,
  }}/>
);

const FieldInput = ({ label, id, type='text', placeholder, value, onChange, mono, center }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label htmlFor={id} style={{
        fontFamily:T.mono, fontSize:10, letterSpacing:'.2em',
        color:T.muted, textTransform:'uppercase',
      }}>{label}</label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={value} onChange={onChange}
        required
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
        style={{
          width:'100%', padding:'13px 16px',
          background:T.offwhite,
          border:`1px solid ${focused ? T.coral : T.border}`,
          borderRadius:10, outline:'none',
          fontFamily: mono ? T.mono : T.font,
          fontSize: mono ? 18 : 14,
          color:T.graphite,
          letterSpacing: mono ? '.3em' : 'normal',
          textAlign: center ? 'center' : 'left',
          textTransform: mono ? 'uppercase' : 'none',
          transition:'border-color .2s, background .2s',
          ...(focused ? { background:T.white } : {}),
        }}
      />
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const [tab, setTab]         = useState('login');   // 'login' | 'signup'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [passStrength, setPS] = useState(0);

  const switchTab = t => { setTab(t); setError(''); };

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

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    
    try {
      if (tab === 'login') {
        // EXACT FIX 1: Point to /auth/login and save the exact 'data' object
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('userProfile', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        // EXACT FIX 2: Point to /auth/signup and save the exact 'data' object
        const { data } = await API.post('/auth/signup', { name, email, password });
        localStorage.setItem('userProfile', JSON.stringify(data));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || (tab === 'login' ? 'Invalid email or password.' : 'Signup failed. Try again.'));
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{
        minHeight:'100vh', background:T.offwhite,
        fontFamily:T.font, display:'flex',
        position:'relative', overflow:'hidden',
      }}>

        {/* subtle grid bg */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
          backgroundImage:`
            linear-gradient(${T.border} 1px, transparent 1px),
            linear-gradient(90deg, ${T.border} 1px, transparent 1px)
          `,
          backgroundSize:'60px 60px', opacity:.55,
        }}/>

        {/* coral bleed corner */}
        <div style={{
          position:'absolute', top:-120, left:-120,
          width:380, height:380, borderRadius:'50%',
          background:'rgba(232,68,46,0.07)',
          filter:'blur(80px)', zIndex:0, pointerEvents:'none',
        }}/>

        {/* ── LEFT PANEL (desktop) ── */}
        <div style={{
          display:'flex', flexDirection:'column',
          justifyContent:'space-between',
          width:'46%', minWidth:340,
          background:T.graphite,
          padding:'44px 52px', position:'relative', zIndex:1,
          overflow:'hidden',
        }}>

          {/* graphite grid overlay */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:`
              linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)
            `,
            backgroundSize:'60px 60px',
          }}/>

          {/* coral accent strip */}
          <div style={{
            position:'absolute', top:0, right:0, bottom:0, width:2,
            background:`linear-gradient(to bottom, transparent, ${T.coral} 40%, ${T.coral} 60%, transparent)`,
            opacity:.5,
          }}/>

          {/* wordmark */}
          <div style={{ position:'relative', zIndex:1, animation:'fadeUp .5s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:34, height:34, borderRadius:8,
                background:T.coral,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3" fill="white"/>
                  <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1" strokeOpacity=".5"/>
                  <line x1="8" y1="1"  x2="8"  y2="4"  stroke="white" strokeWidth="1.2"/>
                  <line x1="8" y1="12" x2="8"  y2="15" stroke="white" strokeWidth="1.2"/>
                  <line x1="1" y1="8"  x2="4"  y2="8"  stroke="white" strokeWidth="1.2"/>
                  <line x1="12" y1="8" x2="15" y2="8"  stroke="white" strokeWidth="1.2"/>
                </svg>
              </div>
              <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em', color:T.white }}>
                GeoSync<span style={{ color:T.coral }}>.</span>
              </span>
            </div>
          </div>

          {/* hero text */}
          <div style={{ position:'relative', zIndex:1, animation:'fadeUp .7s .15s ease both', opacity:0 }}>
            <p style={{
              fontFamily:T.mono, fontSize:11, letterSpacing:'.2em',
              color:T.coral, textTransform:'uppercase', marginBottom:20,
            }}>Real-time location sharing</p>

            <h2 style={{
              fontSize:'clamp(42px,4.5vw,72px)', fontWeight:800,
              lineHeight:.93, letterSpacing:'-.03em',
              color:T.white, marginBottom:24,
            }}>
              Find your<br/>
              people,<br/>
              <em style={{ fontStyle:'italic', color:T.coral }}>anywhere.</em>
            </h2>

            <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', lineHeight:1.75, maxWidth:320 }}>
              Create private rooms, share your live location and stay in sync — powered by Socket.IO and Leaflet.js.
            </p>

            {/* feature list */}
            <div style={{ marginTop:32, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                'Private rooms with 6-digit codes',
                'Live map with OpenStreetMap',
                'Sub-100ms Socket.IO sync',
                'Geo-fencing + SOS alerts',
              ].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:T.coral, flexShrink:0 }}/>
                  <span style={{ fontFamily:T.mono, fontSize:11, letterSpacing:'.07em', color:'rgba(255,255,255,.4)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* bottom label */}
          <div style={{ position:'relative', zIndex:1, animation:'fadeUp .7s .3s ease both', opacity:0 }}>
            <div style={{ fontFamily:T.mono, fontSize:10, letterSpacing:'.16em', color:'rgba(255,255,255,.2)', textTransform:'uppercase' }}>
              Built on MERN stack / v1.0.0
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', alignItems:'center',
          padding:'48px 40px', position:'relative', zIndex:1,
        }}>

          <div style={{ width:'100%', maxWidth:400 }}>

            {/* tab switcher */}
            <div style={{
              display:'flex', marginBottom:40,
              borderBottom:`1px solid ${T.border}`,
              animation:'fadeUp .5s .1s ease both', opacity:0,
            }}>
              {['login','signup'].map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  style={{
                    flex:1, padding:'12px 0', background:'none', border:'none',
                    fontFamily:T.font, fontWeight:700, fontSize:13,
                    letterSpacing:'.07em', textTransform:'uppercase',
                    color: tab === t ? T.graphite : T.muted,
                    cursor:'pointer', position:'relative',
                    transition:'color .2s',
                  }}
                >
                  {t === 'login' ? 'Log In' : 'Sign Up'}
                  {tab === t && (
                    <div style={{
                      position:'absolute', bottom:-1, left:0, right:0,
                      height:2, background:T.coral, borderRadius:1,
                    }}/>
                  )}
                </button>
              ))}
            </div>

            {/* progress pips */}
            <div style={{ display:'flex', gap:5, marginBottom:28, animation:'fadeUp .5s .18s ease both', opacity:0 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  height:5, borderRadius:999,
                  background: i === 0 ? T.coral : (i === 1 && tab==='login') ? T.coral : T.border,
                  width: i === 0 ? 24 : 8,
                  transition:'background .3s, width .3s',
                }}/>
              ))}
            </div>

            {/* heading */}
            <div style={{ marginBottom:32, animation:'fadeUp .5s .22s ease both', opacity:0 }}>
              <h1 style={{ fontSize:34, fontWeight:800, letterSpacing:'-.02em', marginBottom:6, lineHeight:1.1 }}>
                {tab === 'login' ? 'Welcome back.' : 'Create account.'}
              </h1>
              <p style={{ fontFamily:T.mono, fontSize:11, letterSpacing:'.12em', color:T.muted, textTransform:'uppercase' }}>
                {tab === 'login' ? 'Enter your credentials to continue' : 'Join the network in 30 seconds'}
              </p>
            </div>

            {/* error */}
            {error && (
              <div style={{
                padding:'11px 14px', borderRadius:8, marginBottom:20,
                background:'rgba(232,68,46,.06)', border:`1px solid rgba(232,68,46,.22)`,
                fontFamily:T.mono, fontSize:11, color:T.coral, letterSpacing:'.07em',
              }}>{error}</div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {tab === 'signup' && (
                <FieldInput
                  label="Full Name" id="name" type="text"
                  placeholder="Jane Smith"
                  value={name} onChange={e => setName(e.target.value)}
                />
              )}

              <FieldInput
                label="Email Address" id="email" type="email"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <FieldInput
                  label={`Password${tab==='signup' ? '  — min 6 chars' : ''}`}
                  id="password" type="password"
                  placeholder="••••••••"
                  value={password} onChange={handlePasswordChange}
                />
                {tab === 'signup' && password && (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:3, borderRadius:2, background:T.border, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:2,
                        width:`${passStrength * 25}%`,
                        background:strengthColor,
                        transition:'width .3s, background .3s',
                      }}/>
                    </div>
                    <span style={{ fontFamily:T.mono, fontSize:10, color:strengthColor, letterSpacing:'.1em', width:44 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* submit */}
              <div style={{ position:'relative', overflow:'hidden', borderRadius:10, marginTop:4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width:'100%', padding:'15px',
                    background: loading ? T.graphite2 : T.graphite,
                    color:T.white, border:'none', borderRadius:10,
                    fontFamily:T.font, fontWeight:800, fontSize:14,
                    letterSpacing:'.08em', textTransform:'uppercase',
                    cursor: loading ? 'default' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'background .2s, transform .1s',
                    position:'relative', overflow:'hidden',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background=T.coral; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background=T.graphite; }}
                  onMouseDown={e  => { e.currentTarget.style.transform='scale(.99)'; }}
                  onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}
                >
                  {loading && <Spinner/>}
                  {loading
                    ? (tab === 'login' ? 'Authenticating…' : 'Creating account…')
                    : (tab === 'login' ? 'Log In  →' : 'Create Account  →')
                  }
                </button>
              </div>
            </form>

            {/* switch link */}
            <p style={{
              marginTop:24, textAlign:'center',
              fontFamily:T.mono, fontSize:11, color:T.muted, letterSpacing:'.07em',
            }}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
                style={{ color:T.coral, cursor:'pointer', borderBottom:`1px solid transparent`,
                  transition:'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=T.coral}
                onMouseLeave={e => e.currentTarget.style.borderColor='transparent'}
              >
                {tab === 'login' ? 'Sign up' : 'Log in'}
              </span>
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;