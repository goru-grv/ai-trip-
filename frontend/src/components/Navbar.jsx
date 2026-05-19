import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, User, Bookmark, ShoppingCart, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ cartCount = 0, user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
    navigate('/auth');
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <Link to="/" className="brand-link">
        <Compass color="var(--accent-primary)" size={24} />
        <span className="brand-text">FLIP LIFE TRIP</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/checkout" className={`nav-link ${location.pathname === '/checkout' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShoppingCart size={18} /> <span className="nav-text">Cart ({cartCount})</span>
            </Link>
            <Link to="/saved" className={`nav-link ${location.pathname === '/saved' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Bookmark size={18} /> <span className="nav-text">Saved Trips</span>
            </Link>
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              <LogOut size={18} /> <span className="nav-text">Logout ({user.name})</span>
            </button>
          </>
        ) : (
          <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <User size={18} /> <span className="nav-text">Login / Register</span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
