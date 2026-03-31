import React, { useState } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Decide which backend route to hit based on the toggle
        const endpoint = isSignup ? '/auth/signup' : '/auth/login';
        
        try {
            // Send the data to the backend
            const { data } = await API.post(endpoint, formData);
            
            // Save the user data (and token) to the browser's memory
            localStorage.setItem('userProfile', JSON.stringify(data));
            
            // Redirect them to the dashboard
            navigate('/dashboard');
        } catch (err) {
            // If wrong password or duplicate email, show the error message from the backend
            alert(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-8">
                    {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {isSignup && (
                        <input 
                            type="text" placeholder="Full Name" required
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition shadow-sm"
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    )}
                    <input 
                        type="email" placeholder="Email Address" required
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition shadow-sm"
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                    <input 
                        type="password" placeholder="Password" required
                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-400 outline-none transition shadow-sm"
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    
                    <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg transform hover:-translate-y-0.5">
                        {isSignup ? 'Sign Up' : 'Login'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-600 font-medium">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    <button 
                        onClick={() => setIsSignup(!isSignup)}
                        className="ml-2 text-purple-600 font-bold hover:underline"
                    >
                        {isSignup ? 'Log In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;