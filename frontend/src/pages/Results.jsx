import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import axios from 'axios';
import { ArrowLeft, Clock, DollarSign, MapPin, Bed, Calendar as CalendarIcon, Tag, Bus, Sparkles, Edit3, X, RefreshCw, Compass } from 'lucide-react';

const loadingStages = [
  "Refining travel paths and coordinates...",
  "Incorporating your updated daily plans...",
  "Recalculating routing and time sequences...",
  "Updating local attraction priorities...",
  "Re-weaving your signature travel story..."
];

const Results = ({ tripData, setTripData, cartItems = [], addToCart, removeFromCart }) => {
  const navigate = useNavigate();

  const [isEditingPlans, setIsEditingPlans] = useState(false);
  const [editedDailyPlans, setEditedDailyPlans] = useState(() => {
    const duration = tripData?.duration || 1;
    const initialPlans = tripData?.daily_plans ? [...tripData.daily_plans] : [];
    while (initialPlans.length < duration) {
      initialPlans.push('');
    }
    return initialPlans;
  });
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);

  // Sync state if tripData changes
  useEffect(() => {
    if (tripData) {
      const duration = tripData.duration || 1;
      const initialPlans = tripData.daily_plans ? [...tripData.daily_plans] : [];
      while (initialPlans.length < duration) {
        initialPlans.push('');
      }
      setEditedDailyPlans(initialPlans);
    }
  }, [tripData]);

  // Loading stages for regeneration
  useEffect(() => {
    if (!regenerating) return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % loadingStages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [regenerating]);

  if (!tripData) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <h2>No trip data found.</h2>
        <button onClick={() => navigate('/')} className="glass-button" style={{ marginTop: '2rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const searchParams = tripData.searchParams || {
        destination: tripData.destination,
        number_of_days: tripData.duration,
        budget: tripData.budget || 'Medium (₹80,000 - ₹2,50,000)',
        travel_type: 'Solo',
        interests: 'sightseeing',
        origin_city: 'New Delhi'
      };

      const response = await axios.post('http://localhost:8000/api/generate-trip', {
        ...searchParams,
        daily_plans: editedDailyPlans
      });

      const updatedTrip = response.data.data;
      updatedTrip.daily_plans = editedDailyPlans;
      updatedTrip.searchParams = searchParams;

      setTripData(updatedTrip);
      setIsEditingPlans(false);
    } catch (err) {
      console.error(err);
      setRegenerateError('Failed to regenerate itinerary. Please check your connection and try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const isInCart = (itemType, name) =>
    cartItems.some((item) => item.item_type === itemType && item.name === name);

  const toggleCart = (item) => {
    if (isInCart(item.item_type, item.name)) {
      removeFromCart(item);
      return;
    }
    addToCart(item);
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <AnimatePresence>
        {regenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cosmic-loader-overlay"
            style={{ zIndex: 1000 }}
          >
            <div className="cosmic-loader-content">
              {/* Laser scanning sweep */}
              <div className="scanner-line" />

              {/* Glowing, Pulsing Quantum Orb */}
              <div className="orb-wrapper">
                <motion.div
                  animate={{
                    scale: [1, 1.25, 0.95, 1.15, 1],
                    rotate: 360,
                    borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "70% 30% 52% 48% / 60% 40% 60% 40%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
                  }}
                  transition={{
                    duration: 8,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  className="quantum-orb"
                />

                {/* Embedded Spinning Compass Logo */}
                <div className="orb-core">
                  <Compass className="spinning-compass" size={48} color="#00f0ff" />
                </div>

                {/* Floating twinkling neon particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="orb-particle"
                    animate={{
                      y: [-25, 25, -25],
                      x: [-20, 20, -20],
                      opacity: [0.2, 0.8, 0.2],
                      scale: [0.7, 1.3, 0.7]
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.4
                    }}
                    style={{
                      top: `${25 + Math.random() * 50}%`,
                      left: `${25 + Math.random() * 50}%`,
                    }}
                  />
                ))}
              </div>

              {/* Loader Header */}
              <h2 className="loader-title">RE-WEAVING YOUR JOURNEY</h2>

              {/* Shifting Status Stages */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={stageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="loader-stage"
                >
                  <Sparkles size={16} className="sparkle-icon" /> {loadingStages[stageIndex]}
                </motion.p>
              </AnimatePresence>

              {/* Progress Shimmer */}
              <div className="loader-progress-bg">
                <motion.div
                  className="loader-progress-bar"
                  animate={{ width: "100%" }}
                  transition={{ duration: 12, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} className="glass-button" style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
          <ArrowLeft size={18} /> Back to Search
        </button>
        <button onClick={() => setIsEditingPlans(!isEditingPlans)} className="glass-button" style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px', background: isEditingPlans ? 'rgba(0, 240, 255, 0.15)' : 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <Edit3 size={18} color="var(--accent-secondary)" /> {isEditingPlans ? 'Hide Adjustments' : 'Adjust Daily Plans'}
        </button>
        <button onClick={() => navigate('/checkout')} className="glass-button" style={{ padding: '0.5rem 1.2rem', marginLeft: 'auto' }}>
          Go To Cart & Pay ({cartItems.length})
        </button>
      </div>

      <AnimatePresence>
        {isEditingPlans && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-panel"
            style={{ padding: '2rem', marginBottom: '3rem', border: '1px solid rgba(0, 240, 255, 0.25)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="var(--accent-secondary)" /> Adjust Daily Plans
              </h2>
              <button 
                onClick={() => setIsEditingPlans(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Change the attractions, plans, or departure details for specific days. Leave a field blank to let the AI plan that day.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
              {editedDailyPlans.map((plan, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 'bold', textAlign: 'left' }}>Day {index + 1} Plan</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={plan}
                    placeholder={`e.g., Focus on specific sites or travel timing`}
                    onChange={(e) => {
                      const newPlans = [...editedDailyPlans];
                      newPlans[index] = e.target.value;
                      setEditedDailyPlans(newPlans);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>

            {regenerateError && (
              <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'left' }}>{regenerateError}</p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setIsEditingPlans(false);
                  if (tripData.daily_plans) {
                    setEditedDailyPlans([...tripData.daily_plans]);
                  }
                }} 
                className="glass-button" 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRegenerate} 
                className="glass-button" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#000', fontWeight: 'bold' }}
              >
                <RefreshCw size={16} /> Regenerate Itinerary
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem', textAlign: 'left' }}>{tripData.trip_title}</h1>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <MapPin size={18} color="var(--accent-primary)" /> {tripData.destination}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <CalendarIcon size={18} color="var(--accent-primary)" /> {tripData.duration} Days
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <DollarSign size={18} color="var(--accent-primary)" /> Budget: {tripData.budget}
          </span>
        </div>

        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
          <CalendarIcon color="var(--accent-secondary)" /> Day Plan
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {tripData.itinerary?.map((dayPlan, index) => {
            const userCustomFocus = tripData.daily_plans?.[index];
            return (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1.2rem' }}>
                    <h3 style={{ margin: 0, textAlign: 'left' }}>Day {dayPlan.day}: {dayPlan.theme}</h3>
                    {userCustomFocus && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.25)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> Custom Focus: {userCustomFocus}
                      </span>
                    )}
                  </div>
                  {dayPlan.activities?.map((activity, i) => (
                    <div key={i} style={{ marginBottom: '0.9rem', textAlign: 'left' }}>
                      <p style={{ textAlign: 'left' }}><Clock size={14} style={{ display: 'inline' }} /> {activity.time} - {activity.title}</p>
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>{activity.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <h2 style={{ marginTop: '4rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bed color="var(--accent-secondary)" /> Recommended Stays
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {tripData.hotel_suggestions?.map((hotel, index) => {
            const selected = isInCart('hotel', hotel.name);
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1000} scale={1.02}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>{hotel.name}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}><Tag size={14} style={{ display: 'inline' }} /> {hotel.rating} stars</p>
                    <p style={{ color: '#10b981' }}><DollarSign size={14} style={{ display: 'inline' }} /> {hotel.price_per_night} / night</p>
                    <p style={{ marginTop: '0.6rem' }}>{hotel.description}</p>
                    <button
                      className="glass-button"
                      onClick={() => toggleCart({ item_type: 'hotel', name: hotel.name, price: hotel.price_per_night, details: hotel.description })}
                      style={{ width: '100%', marginTop: '1rem', background: selected ? 'rgba(16, 185, 129, 0.25)' : undefined }}
                    >
                      {selected ? 'Remove From Cart' : 'Select Hotel'}
                    </button>
                  </div>
                </Tilt>
              </motion.div>
            );
          })}
        </div>

        <h2 style={{ marginTop: '4rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bus color="var(--accent-secondary)" /> Transport Options
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {tripData.transport_options?.map((transport, index) => {
            const name = `${transport.mode} - ${transport.route}`;
            const selected = isInCart('transport', name);
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
                  <h3>{transport.mode}</h3>
                  <p><strong>Route:</strong> {transport.route}</p>
                  <p><strong>Price:</strong> {transport.estimated_price}</p>
                  <p style={{ color: 'var(--text-secondary)' }}><strong>Tip:</strong> {transport.booking_tip}</p>
                  <button
                    className="glass-button"
                    onClick={() => toggleCart({ item_type: 'transport', name, price: transport.estimated_price, details: transport.route })}
                    style={{ width: '100%', marginTop: '1rem', background: selected ? 'rgba(16, 185, 129, 0.25)' : undefined }}
                  >
                    {selected ? 'Remove From Cart' : 'Select Transport'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Results;
