import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';
import Auth from './pages/Auth';
import SavedTrips from './pages/SavedTrips';
import Checkout from './pages/Checkout';
import Navbar from './components/Navbar';
import Background3D from './components/Background3D';
import './index.css';

// A ProtectedRoute wrapper to ensure the user is logged in before accessing planner/results/checkout
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Redirect logged-in users away from Auth page back to the trip planner
const PublicRoute = ({ user, children }) => {
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [tripData, setTripData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || 'null'));

  const addToCart = (item) => {
    setCartItems((prev) => {
      const exists = prev.some((p) => p.item_type === item.item_type && p.name === item.name);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (item) => {
    setCartItems((prev) => prev.filter((p) => !(p.item_type === item.item_type && p.name === item.name)));
  };

  const clearCart = () => setCartItems([]);

  return (
    <Router>
      <Background3D />
      <Navbar cartCount={cartItems.length} user={user} setUser={setUser} />
      <Routes>
        {/* Protected Trip Planner (Default Landing) */}
        <Route path="/" element={<ProtectedRoute user={user}><Home setTripData={setTripData} /></ProtectedRoute>} />
        
        {/* Protected Results */}
        <Route
          path="/results"
          element={
            <ProtectedRoute user={user}>
              <Results
                tripData={tripData}
                setTripData={setTripData}
                cartItems={cartItems}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
              />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Checkout */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute user={user}>
              <Checkout
                user={user}
                tripData={tripData}
                cartItems={cartItems}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
              />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Saved Trips */}
        <Route path="/saved" element={<ProtectedRoute user={user}><SavedTrips user={user} setTripData={setTripData} /></ProtectedRoute>} />
        
        {/* Authentication Page (Login/Sign In) */}
        <Route path="/auth" element={<PublicRoute user={user}><Auth setUser={setUser} /></PublicRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
