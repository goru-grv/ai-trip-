import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Heart,
  Camera,
  Gem,
  Mountain,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

const loadingStages = [
  "Awakening Flip Life Trip travel core...",
  "Mapping destination and weather coordinates...",
  "Curating elite stays and local suggestions...",
  "Optimizing transport routes and Tatkal fares...",
  "Discovering traditional culinary layers...",
  "Weaving your signature travel story..."
];

const stories = [
  { icon: Camera, title: 'Visual Diaries', copy: 'Each day is styled like a cinematic scene with timing and mood.' },
  { icon: Gem, title: 'Premium Routes', copy: 'Balanced plans with iconic highlights and hidden local gems.' },
  { icon: Mountain, title: 'Adventure Layers', copy: 'Food, culture, nature, and nightlife blended by your vibe.' }
];

const Home = ({ setTripData }) => {
  const [formData, setFormData] = useState({
    origin_city: '',
    start_date: '',
    destination: '',
    number_of_days: 0,
    budget: '',
    travel_type: '',
    interests: ''
  });
  const [dailyPlans, setDailyPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) return;
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % loadingStages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'number_of_days') {
      const daysVal = parseInt(value, 10) || 0;
      setFormData({ ...formData, [name]: value });
      
      const count = Math.min(Math.max(daysVal, 0), 30);
      setDailyPlans((prev) => {
        const newPlans = [...prev];
        if (count > prev.length) {
          for (let i = prev.length; i < count; i++) {
            newPlans.push('');
          }
        } else if (count < prev.length) {
          newPlans.splice(count);
        }
        return newPlans;
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parsedDays = parseInt(formData.number_of_days, 10);
      const cleanedDailyPlans = dailyPlans.slice(0, parsedDays);
      while (cleanedDailyPlans.length < parsedDays) {
        cleanedDailyPlans.push('');
      }

      const response = await axios.post('http://localhost:8000/api/generate-trip', {
        ...formData,
        number_of_days: parsedDays,
        daily_plans: cleanedDailyPlans
      });
      
      const tripDataResult = response.data.data;
      tripDataResult.daily_plans = cleanedDailyPlans;
      tripDataResult.searchParams = { ...formData, number_of_days: parsedDays };
      
      setTripData(tripDataResult);
      navigate('/results');
    } catch (err) {
      setError('Failed to generate trip. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-shell">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cosmic-loader-overlay"
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
              <h2 className="loader-title">FLIP LIFE TRIP AI</h2>

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
                  transition={{ duration: 15, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <section className="hero-grid container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-copy"
        >
          <p className="eyebrow">LUXURY AI TRAVEL STUDIO</p>
          <h1>
            Travel stories with
            <span className="gradient-text"> depth, mood, and motion</span>
          </h1>
          <p className="hero-subcopy">
            Crafted like an editorial portfolio. Your itinerary is generated with atmosphere,
            practical timing, and a premium visual direction.
          </p>
          <div className="hero-pill-row">
            <span><Sparkles size={16} /> AI Curated</span>
            <span><Compass size={16} /> Personal Style</span>
            <span><Calendar size={16} /> Day by Day</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} perspective={1200} scale={1.01} transitionSpeed={1800} gyroscope>
            <div className="glass-panel planner-panel">
              <h2>Build Your Signature Journey</h2>
              <form onSubmit={handleSubmit} className="planner-form">
                <div className="planner-grid">
                  <div className="form-group">
                    <label><MapPin size={16} /> Origin City</label>
                    <input
                      type="text"
                      name="origin_city"
                      className="glass-input"
                      placeholder="e.g., New Delhi"
                      value={formData.origin_city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><MapPin size={16} /> Destination</label>
                    <input
                      type="text"
                      name="destination"
                      className="glass-input"
                      placeholder="e.g., Kyoto, Japan"
                      value={formData.destination}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><Calendar size={16} /> Departure Date</label>
                    <input
                      type="date"
                      name="start_date"
                      className="glass-input"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label><Calendar size={16} /> Number of Days</label>
                    <input
                      type="number"
                      name="number_of_days"
                      className="glass-input"
                      min="1"
                      max="30"
                      value={formData.number_of_days}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label><Wallet size={16} /> Budget</label>
                    <select name="budget" className="glass-input" value={formData.budget} onChange={handleChange}>
                      <option value="Backpacker (Under ₹40,000)">Backpacker (Under ₹40,000)</option>
                      <option value="Budget (₹40,000 - ₹80,000)">Budget (₹40,000 - ₹80,000)</option>
                      <option value="Medium (₹80,000 - ₹2,50,000)">Medium (₹80,000 - ₹2,50,000)</option>
                      <option value="Luxury (Over ₹2,50,000)">Luxury (Over ₹2,50,000)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label><Users size={16} /> Travel Type</label>
                    <select name="travel_type" className="glass-input" value={formData.travel_type} onChange={handleChange}>
                      <option value="Solo">Solo</option>
                      <option value="Couple">Couple</option>
                      <option value="Family">Family</option>
                      <option value="Friends">Friends Group</option>
                    </select>
                  </div>
                  <div className="form-group planner-grid-wide">
                    <label><Heart size={16} /> Interests</label>
                    <input
                      type="text"
                      name="interests"
                      className="glass-input"
                      placeholder="e.g., Culture, Food, Nature, Nightlife"
                      value={formData.interests}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {parseInt(formData.number_of_days, 10) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', textAlign: 'left' }}
                  >
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                      <Sparkles size={16} color="var(--accent-secondary)" /> Customize Your Daily Plans (Optional)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                      Specify key attractions, activities, or a vibe for each day. Leave blank to let the AI fully plan.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {dailyPlans.map((plan, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Day {index + 1} Plan</label>
                          <input
                            type="text"
                            className="glass-input"
                            style={{ width: '100%' }}
                            placeholder={
                              index === 0 
                                ? "e.g., Jagdish Mandir, Fatehsagar Lake boat ride" 
                                : index === 1 
                                  ? "e.g., City Palace, Lake Pichola, shopping" 
                                  : "e.g., Local market exploration and departure"
                            }
                            value={plan}
                            onChange={(e) => {
                              const newPlans = [...dailyPlans];
                              newPlans[index] = e.target.value;
                              setDailyPlans(newPlans);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="glass-button planner-submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Generating Your Story...</> : 'Create My Trip'}
                </button>
              </form>
            </div>
          </Tilt>
        </motion.div>
      </section>

      <section className="container story-section">
        <div className="section-head">
          <p className="eyebrow">FEATURED EXPERIENCE</p>
          <h2>Every journey feels like a cover story</h2>
        </div>
        <div className="story-grid">
          {stories.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Tilt tiltMaxAngleX={12} tiltMaxAngleY={12} perspective={1000} scale={1.03} transitionSpeed={1400}>
                  <article className="glass-panel story-card">
                    <Icon size={20} />
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </article>
                </Tilt>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
