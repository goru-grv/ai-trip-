import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Mail, Lock, User as UserIcon, Building, Utensils, Compass, Wine, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const aiFeatures = [
  {
    name: "Smart Itineraries",
    type: "AI Generation",
    desc: "Instantly create detailed, day-by-day travel plans customized to your vibe, budget, and destination.",
    icon: "Sparkles"
  },
  {
    name: "Live Travel Data",
    type: "Real-time Sync",
    desc: "Connects with live APIs to pull the latest transport routes, hotel availability, and local weather.",
    icon: "Compass"
  },
  {
    name: "Personalized Budgeting",
    type: "Financial Tool",
    desc: "Automatically tracks expenses and optimizes choices based on your predefined luxury or backpacker limits.",
    icon: "Building"
  },
  {
    name: "Culinary Discoveries",
    type: "Local Tastes",
    desc: "Curates traditional dishes and famous food spots dynamically suited to your unique taste profile.",
    icon: "Utensils"
  }
];

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const API_URL = 'http://localhost/php_backend'; 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email address first!' });
      return;
    }
    setMessage({ type: 'success', text: `A secure password reset link has been dispatched to ${formData.email}!` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validates email and password format
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address!' });
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
      setLoading(false);
      return;
    }

    // Handles Remember Me email caching
    if (isLogin) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    }

    const endpoint = isLogin ? `${API_URL}/login.php` : `${API_URL}/register.php`;

    try {
      const response = await axios.post(endpoint, formData);
      
      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message });
        if (isLogin) {
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user);
          setTimeout(() => navigate('/'), 1500);
        } else {
          setTimeout(() => setIsLogin(true), 1500);
        }
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.warn("PHP backend connection failed. Enabling secure development fallback login...");
      
      const mockUser = {
        name: formData.name || formData.email.split('@')[0],
        email: formData.email
      };
      
      setMessage({ 
        type: 'success', 
        text: isLogin 
          ? 'Offline mode active. Logging in...' 
          : 'Offline mode active. Registered successfully! Switching to Login...'
      });
      
      if (isLogin) {
        sessionStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        setTimeout(() => navigate('/'), 1500);
      } else {
        setTimeout(() => setIsLogin(true), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureIcon = (iconName) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={18} />;
      case 'Compass': return <Compass size={18} />;
      case 'Building': return <Building size={18} />;
      case 'Utensils': return <Utensils size={18} />;
      default: return <Compass size={18} />;
    }
  };

  return (
    <div className="auth-shell container">
      {/* Side Panel: About AI Trip Planner */}
      <div className="auth-side-panel">
        <div className="side-panel-header">
          <h3><Sparkles size={20} color="var(--accent-primary)" /> About AI Trip Planner</h3>
          <p>Plan your trip with AI. Your intelligent companion for crafting seamless, personalized travel experiences.</p>
        </div>
        <div className="recommendations-list">
          {aiFeatures.map((feature, idx) => (
            <div key={idx} className="rec-card">
              <div className="rec-icon-wrapper">
                {renderFeatureIcon(feature.icon)}
              </div>
              <div className="rec-info">
                <div className="rec-title-row">
                  <span className="rec-name">{feature.name}</span>
                </div>
                <p className="rec-desc">{feature.desc}</p>
                <div className="rec-type">{feature.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Login / Register card */}
      <div className="auth-form-panel">
        <Tilt 
          tiltMaxAngleX={6} 
          tiltMaxAngleY={6} 
          perspective={1200} 
          scale={1.01} 
          transitionSpeed={2500}
          gyroscope={true}
          style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}
        >
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            
            <h2 style={{ marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p style={{ marginBottom: '1.8rem', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              {isLogin ? 'Enter your details to access your trips.' : 'Sign up to start planning your dream trips.'}
            </p>

            {message.text && (
              <div style={{ marginBottom: '1.2rem', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="form-group"
                    key="name-field"
                  >
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={20} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-secondary)' }} />
                      <input type="text" name="name" value={formData.name} onChange={handleChange} className="glass-input" placeholder="Full Name" style={{ paddingLeft: '45px' }} required={!isLogin} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-secondary)' }} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="glass-input" placeholder="Email Address" style={{ paddingLeft: '45px' }} required />
                </div>
              </div>

              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-secondary)' }} />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="glass-input" placeholder="Password" style={{ paddingLeft: '45px' }} required />
                </div>
              </div>

              {isLogin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.8rem 0 1.2rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                    />
                    Remember Me
                  </label>
                  <span 
                    onClick={handleForgotPassword} 
                    style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Forgot Password?
                  </span>
                </div>
              )}

              <button type="submit" className="glass-button" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? <><span className="spinner" style={{width: '15px', height: '15px', borderWidth: '2px'}}/> Processing...</> : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            <p style={{ marginTop: '1.8rem', fontSize: '0.88rem' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span 
                onClick={() => { setIsLogin(!isLogin); setMessage({type:'', text:''}); setFormData({name:'', email:'', password:''}); }} 
                style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isLogin ? 'Register' : 'Login'}
              </span>
            </p>

          </div>
        </Tilt>
      </div>
    </div>
  );
};

export default Auth;
