import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

// --- Helper: Render Map Avatars ---
const createAvatarIcon = (avatarUrl, color = 'indigo') => {
    return new L.divIcon({
        className: 'custom-avatar-icon',
        html: `<div class="w-10 h-10 rounded-full border-[3px] border-${color}-500 shadow-xl overflow-hidden bg-white transform -translate-y-2 flex items-center justify-center">
                 <img src="${avatarUrl}" class="w-full h-full object-cover" />
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
};

// --- Helper: Render Video Streams ---
const VideoPlayer = ({ stream, isMuted = false }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);
    return <video ref={videoRef} autoPlay muted={isMuted} className="w-full h-full object-cover" />;
};

const Room = () => {
    const { id: roomCode } = useParams();
    const navigate = useNavigate();
    
    // Engine Refs (Using refs to avoid React closure traps)
    const userRef = useRef(null);
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const myStreamRef = useRef(null);
    const isVideoActiveRef = useRef(false);
    const chatEndRef = useRef(null); // For auto-scrolling chat
    
    // Core State
    const [user, setUser] = useState(null);
    const [myLocation, setMyLocation] = useState(null);
    const [peers, setPeers] = useState({}); 
    
    // Sidebar State
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [myStream, setMyStream] = useState(null);
    const [videoStreams, setVideoStreams] = useState({}); // Mapped tightly by User ID!

    // 1. Initial Setup: Connect tracking socket ONLY
    useEffect(() => {
        const profile = localStorage.getItem('userProfile');
        if (!profile) return navigate('/auth');
        
        const parsedUser = JSON.parse(profile);
        setUser(parsedUser);
        userRef.current = parsedUser;

        // Connect switchboard
        // Connect switchboard
socketRef.current = io('https://geosync-backend-7b2h.onrender.com'); // <-- Updated to your IP
        socketRef.current.emit('join-room', { roomCode, user: parsedUser });

        // --- MAP & TRACKING EVENTS ---
        socketRef.current.on('receive-location', (data) => {
            setPeers(prev => ({ ...prev, [data.user._id]: data }));
        });

        socketRef.current.on('user-disconnected', (disconnectedUserId) => {
            setPeers(prev => { const next = {...prev}; delete next[disconnectedUserId]; return next; });
            setVideoStreams(prev => { const next = {...prev}; delete next[disconnectedUserId]; return next; });
        });

        // --- CHAT EVENTS ---
        socketRef.current.on('receive-chat', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        // --- VIDEO EVENTS ---
        socketRef.current.on('user-joined-video', ({ user: remoteUser, peerId }) => {
            // ONLY call them if WE are currently in video mode!
            if (isVideoActiveRef.current && peerRef.current && myStreamRef.current) {
                const call = peerRef.current.call(peerId, myStreamRef.current, { metadata: { userId: userRef.current._id } });
                call.on('stream', (remoteStream) => {
                    setVideoStreams(prev => ({ ...prev, [remoteUser._id]: remoteStream }));
                });
            }
        });

        socketRef.current.on('user-left-video', (remoteUserId) => {
            setVideoStreams(prev => { const next = {...prev}; delete next[remoteUserId]; return next; });
        });

        return () => {
            leaveVideoCall(); // Cleanup hardware
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [navigate, roomCode]);

    // 2. Fetch GPS (Unchanged)
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

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- SIDEBAR ACTIONS ---
    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const newMsg = { user, text: chatInput, id: Date.now() };
        setMessages(prev => [...prev, newMsg]); // Show instantly on our screen
        socketRef.current.emit('send-chat', { roomCode, user, text: chatInput }); // Send to others
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
                setIsVideoActive(true);
                isVideoActiveRef.current = true;
            });

            // Answer incoming calls
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
            alert("Camera & Microphone access is required.");
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
        }
    };

    if (!user || !myLocation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 font-mono tracking-widest text-sm">
                ACQUIRING SATELLITE SIGNAL...
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-slate-900 font-sans overflow-hidden">
            
            {/* --- LEFT: MAP AREA --- */}
            <div className="flex-1 relative z-0">
                <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-5 py-2 rounded-xl shadow-lg border border-white/20">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">Live Session</p>
                    <p className="text-xl font-black text-slate-800 tracking-widest font-mono">{roomCode}</p>
                </div>

                <MapContainer center={myLocation} zoom={16} className="h-full w-full" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    <Marker position={myLocation} icon={createAvatarIcon(user.avatarUrl, 'coral')}>
                        <Popup><div className="font-bold text-coral">You</div></Popup>
                    </Marker>

                    {Object.values(peers).map((peerData) => (
                        <Marker key={peerData.user._id} position={peerData.location} icon={createAvatarIcon(peerData.user.avatarUrl, 'indigo')}>
                            <Popup><div className="font-bold text-indigo-600">{peerData.user.name}</div></Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* --- RIGHT: SIDEBAR --- */}
            <div className="w-80 md:w-96 bg-slate-50 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.15)] z-10 border-l border-slate-200">
                
                {/* Header */}
                <div className="px-5 py-4 bg-white flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold text-sm text-slate-700">{Object.keys(peers).length + 1} Connected</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-slate-400 hover:text-red-500 transition">
                        EXIT ROOM
                    </button>
                </div>

                {/* Video Section */}
                <div className="p-4 bg-slate-100 border-b border-slate-200 min-h-[220px] flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Intercom</h3>
                        {isVideoActive && (
                            <button onClick={leaveVideoCall} className="text-[10px] uppercase font-bold text-red-500 hover:underline">
                                Disconnect
                            </button>
                        )}
                    </div>

                    {!isVideoActive ? (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                            <button onClick={joinVideoCall} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-coral transition shadow-md">
                                Start Video Call
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
                            {/* My Feed */}
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                                <VideoPlayer stream={myStream} isMuted={true} />
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">You</span>
                            </div>
                            
                            {/* Peer Feeds */}
                            {Object.entries(videoStreams).map(([userId, stream]) => (
                                <div key={userId} className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-sm">
                                    <VideoPlayer stream={stream} isMuted={false} />
                                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                        {peers[userId]?.user?.name?.split(' ')[0] || 'Peer'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-50">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Chat</h3>
                    </div>
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {messages.length === 0 && (
                            <p className="text-center text-xs text-slate-400 mt-4">Send a message to start chatting!</p>
                        )}
                        {messages.map(msg => {
                            const isMe = msg.user._id === user._id;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] text-slate-400 mb-1 px-1 font-medium tracking-wide">
                                        {isMe ? 'You' : msg.user.name}
                                    </span>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm ${
                                        isMe ? 'bg-slate-800 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Box */}
                    <form onSubmit={sendChat} className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                placeholder="Type a message..." 
                                className="w-full bg-white border border-slate-200 rounded-full pl-5 pr-12 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition shadow-sm" 
                            />
                            <button type="submit" className="absolute right-1.5 top-1.5 bg-zinc-700 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold hover:bg-red-600 transition shadow-md">
                                ↑
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Room;