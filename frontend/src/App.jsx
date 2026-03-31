import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* The new Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Placeholder for Phase 3: The Leaflet Map Room */}
            <Route path="/room/:id" element={<Room />} />
        
        <Route path="*" element={<Navigate replace to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;