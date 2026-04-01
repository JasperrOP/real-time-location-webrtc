import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

// --- Helper: Render Map Avatars ---
const createAvatarIcon = (avatarUrl, colorHex = '#4f46e5', isVideoOn = false) => {
    // Adds a glowing green dot if video is active
    const videoIndicator = isVideoOn 
        ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20 animate-pulse"></div>` 
        : '';

    return new L.divIcon({
        className: 'custom-avatar-icon',
        html: `
            <div class="relative w-12 h-12 flex items-center justify-center transform -translate-y-3">
                <div class="absolute inset-0 rounded-full animate-ping opacity-20" style="background-color: ${colorHex}"></div>
                <div class="relative w-10 h-10 rounded-full border-[3px] shadow-xl overflow-hidden bg-white flex items-center justify-center z-10" style="border-color: ${colorHex}">
                    <img src="${avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}" class="w-full h-full object-cover" />
                    ${videoIndicator}
                </div>
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style="border-top-color: ${colorHex}"></div>
            </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -50]
    });
};

// --- Helper: Render Video Streams ---
const VideoPlayer = ({ stream, isMuted = false }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);
    return <video ref={videoRef} autoPlay muted={isMuted} className="w-full h-full object-cover rounded-xl" />;
};

const Room = () => {
    const { id: roomCode } = useParams();
    const navigate = useNavigate();
    
    // Engine Refs
    const userRef = useRef(null);
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const myStreamRef = useRef(null);
    const isVideoActiveRef = useRef(false);
    const chatEndRef = useRef(null);
    
    // Core State
    const [user, setUser] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const [peers, setPeers] = useState({}); 
    
    // Sidebar State
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [myStream, setMyStream] = useState(null);
    const [videoStreams, setVideoStreams] = useState({});
    
    // NEW: Track who has video on globally (even if we aren't viewing it)
    const [videoStatus, setVideoStatus] = useState({}); 

    useEffect(() => {
        const profile = localStorage.getItem('userProfile');
        if (!profile) return navigate('/auth');
        
        const parsedUser = JSON.parse(profile);
        setUser(parsedUser);
        userRef.current = parsedUser;

        socketRef.current = io('https://real-time-location-webrtc.onrender.com'); 
        socketRef.current.emit('join-room', { roomCode, user: parsedUser });

        // --- MAP & TRACKING EVENTS ---
        socketRef.current.on('receive-location', (data) => {
            setPeers(prev => ({ ...prev, [data.user._id]: data }));
        });

        socketRef.current.on('user-disconnected', (disconnectedUserId) => {
            setPeers(prev => { const next = {...prev}; delete next[disconnectedUserId]; return next; });
            setVideoStreams(prev => { const next = {...prev}; delete next[disconnectedUserId]; return next; });
            setVideoStatus(prev => { const next = {...prev}; delete next[disconnectedUserId]; return next; });
        });

        // --- CHAT EVENTS ---
        socketRef.current.on('receive-chat', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        // --- VIDEO EVENTS ---
        // Listen for general video status changes to update UI indicators
        socketRef.current.on('video-status-changed', ({ userId, isOn }) => {
             setVideoStatus(prev => ({ ...prev, [userId]: isOn }));
        });

        socketRef.current.on('user-joined-video', ({ user: remoteUser, peerId }) => {
            setVideoStatus(prev => ({ ...prev, [remoteUser._id]: true })); // Update indicator
            
            if (isVideoActiveRef.current && peerRef.current && myStreamRef.current) {
                const call = peerRef.current.call(peerId, myStreamRef.current, { metadata: { userId: userRef.current._id } });
                call.on('stream', (remoteStream) => {
                    setVideoStreams(prev => ({ ...prev, [remoteUser._id]: remoteStream }));
                });
            }
        });

        socketRef.current.on('user-left-video', (remoteUserId) => {
            setVideoStatus(prev => ({ ...prev, [remoteUserId]: false })); // Update indicator
            setVideoStreams(prev => { const next = {...prev}; delete next[remoteUserId]; return next; });
        });

        return () => {
            leaveVideoCall(); 
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [navigate, roomCode]);

    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = [pos.coords.latitude, pos.coords.longitude];
                setMyLocation(newLoc);
                if (socketRef.current && userRef.current) {
                    socketRef.current.emit('location-update', { roomCode, user: userRef.current, location: newLoc });
                }
            },
            (err) => console.log(err), { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [roomCode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const newMsg = { user, text: chatInput, id: Date.now() };
        setMessages(prev => [...prev, newMsg]); 
        socketRef.current.emit('send-chat', { roomCode, user, text: chatInput }); 
        setChatInput('');
    };

    const joinVideoCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setMyStream(stream);
            myStreamRef.current = stream;
            
            const peer = new Peer();
            peerRef.current = peer;

            peer.on('open', (myPeerId) => {
                socketRef.current.emit('join-video-call', { roomCode, user, peerId: myPeerId });
                socketRef.current.emit('video-status-changed', { roomCode, userId: user._id, isOn: true }); // Broadcast status
                setIsVideoActive(true);
                isVideoActiveRef.current = true;
            });

            peer.on('call', (call) => {
                call.answer(myStreamRef.current);
                call.on('stream', (remoteStream) => {
                    const callerUserId = call.metadata?.userId;
                    if (callerUserId) {
                        setVideoStreams(prev => ({ ...prev, [callerUserId]: remoteStream }));
                    }
                });
            });
        } catch (err) {
            alert("Camera & Microphone access is required to join the sync.");
        }
    };

    const leaveVideoCall = () => {
        setIsVideoActive(false);
        isVideoActiveRef.current = false;
        
        if (myStreamRef.current) {
            myStreamRef.current.getTracks().forEach(t => t.stop());
            myStreamRef.current = null;
            setMyStream(null);
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setVideoStreams({});
        if (socketRef.current && userRef.current) {
            socketRef.current.emit('leave-video-call', { roomCode, userId: userRef.current._id });
            socketRef.current.emit('video-status-changed', { roomCode, userId: userRef.current._id, isOn: false });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        alert("Room code copied to clipboard!");
    };

    if (!user || !myLocation) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#111318] text-[#888c96] font-mono tracking-[0.2em] text-xs">
                <div className="w-12 h-12 border-[3px] border-[#888c96]/30 border-t-[#e8442e] rounded-full animate-spin mb-6"></div>
                ACQUIRING SATELLITE SIGNAL...
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-[#111318] font-sans overflow-hidden text-slate-800">
            
            {/* LEFT: MAP AREA */}
            <div className="flex-1 relative z-0 h-full bg-[#1e222b]">
                
                {/* Floating Room Badge with Copy Interaction */}
                <div 
                    onClick={copyRoomCode}
                    className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-white/50 flex flex-col cursor-pointer hover:bg-white transition group"
                    title="Click to copy room code"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#2aad6f] animate-pulse"></div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase group-hover:text-[#2aad6f] transition">Live Sync Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-black text-[#111318] tracking-widest font-mono leading-none">
                            {roomCode}
                        </p>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-[#111318] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                </div>

                <MapContainer center={myLocation} zoom={16} className="h-full w-full" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    <Marker position={myLocation} icon={createAvatarIcon(user?.avatarUrl, '#e8442e', isVideoActive)}>
                        <Popup className="font-sans font-bold text-[#e8442e] rounded-xl">You</Popup>
                    </Marker>

                    {Object.values(peers).map((peerData) => (
                        <Marker key={peerData.user._id} position={peerData.location} icon={createAvatarIcon(peerData.user?.avatarUrl, '#4f46e5', videoStatus[peerData.user._id])}>
                            <Popup className="font-sans font-bold text-indigo-600 rounded-xl">
                                {peerData.user.name} {videoStatus[peerData.user._id] ? '📹' : ''}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* RIGHT: SIDEBAR */}
            <div className="w-full max-w-[400px] lg:max-w-[440px] bg-white flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.15)] z-10 relative">
                
                {/* Header with Active Roster */}
                <div className="px-6 py-5 flex flex-col border-b border-slate-100 bg-white/95 backdrop-blur z-20 shrink-0">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h2 className="text-lg font-black text-[#111318] tracking-tight">Intercom</h2>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">{Object.keys(peers).length + 1} Member(s) Connected</p>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-white hover:bg-[#e8442e] hover:border-[#e8442e] transition-all shadow-sm"
                            title="Exit Room"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                    {/* Active User Avatars */}
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 custom-scrollbar">
                         <div className="relative">
                             <img src={user.avatarUrl} alt="You" className="w-8 h-8 rounded-full border-2 border-[#e8442e]" title="You" />
                             {isVideoActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                         </div>
                         {Object.values(peers).map(p => (
                             <div key={p.user._id} className="relative">
                                 <img src={p.user.avatarUrl} alt={p.user.name} className="w-8 h-8 rounded-full border-2 border-indigo-500" title={p.user.name} />
                                 {videoStatus[p.user._id] && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                             </div>
                         ))}
                    </div>
                </div>

                {/* Video Section */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Video Sync</h3>
                        {isVideoActive && (
                            <button onClick={leaveVideoCall} className="text-[11px] uppercase font-bold text-[#e8442e] hover:text-red-700 transition">
                                Disconnect
                            </button>
                        )}
                    </div>

                    {!isVideoActive ? (
                        <div className="flex items-center justify-center h-[140px] border-2 border-dashed border-slate-300 rounded-2xl bg-white/50 hover:bg-white transition-colors cursor-pointer group" onClick={joinVideoCall}>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-[#e8442e] group-hover:text-white transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                </div>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-[#111318]">Enable Camera</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="relative aspect-video bg-[#111318] rounded-xl overflow-hidden shadow-inner ring-1 ring-black/5">
                                <VideoPlayer stream={myStream} isMuted={true} />
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                                    <span className="text-[10px] text-white font-bold tracking-wide">You</span>
                                </div>
                            </div>
                            
                            {Object.entries(videoStreams).map(([userId, stream]) => (
                                <div key={userId} className="relative aspect-video bg-[#111318] rounded-xl overflow-hidden shadow-inner ring-1 ring-black/5">
                                    <VideoPlayer stream={stream} isMuted={false} />
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-md">
                                        <span className="text-[10px] text-white font-bold tracking-wide">
                                            {peers[userId]?.user?.name?.split(' ')[0] || 'Peer'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full opacity-40">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">No messages yet</p>
                            </div>
                        )}
                        
                        {messages.map(msg => {
                            const isMe = msg.user._id === user._id;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-slate-400 mb-1.5 px-1 font-bold tracking-wide uppercase">
                                        {isMe ? 'You' : msg.user.name}
                                    </span>
                                    <div className={`px-4 py-3 max-w-[85%] text-[14px] font-medium leading-relaxed shadow-sm ${
                                        isMe ? 'bg-[#111318] text-white rounded-2xl rounded-tr-sm' : 'bg-[#f7f6f3] text-[#111318] border border-[#e8e7e4] rounded-2xl rounded-tl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} className="h-2" />
                    </div>

                    <div className="p-5 bg-white border-t border-slate-100 z-20 shrink-0">
                        <form onSubmit={sendChat} className="relative flex items-center">
                            <input 
                                type="text" 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                placeholder="Message room..." 
                                className="w-full bg-[#f7f6f3] border border-[#e8e7e4] rounded-full pl-5 pr-14 py-3.5 text-[14px] font-medium text-[#111318] placeholder:text-slate-400 outline-none focus:border-[#e8442e] focus:bg-white focus:ring-4 focus:ring-[#e8442e]/10 transition-all" 
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim()}
                                className="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center bg-[#111318] text-white disabled:bg-slate-300 disabled:text-slate-500 hover:bg-[#e8442e] transition-all shadow-md disabled:shadow-none"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default Room;