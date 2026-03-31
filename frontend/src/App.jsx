import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Auth Route */}
        <Route path="/auth" element={<Auth />} />
        
        {/* A temporary placeholder for the Dashboard */}
        <Route path="/dashboard" element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-3xl font-bold text-slate-800">
                Dashboard Coming Soon!
            </div>
        } />
        
        {/* If they go to an unknown route, send them to the login page */}
        <Route path="*" element={<Navigate replace to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;