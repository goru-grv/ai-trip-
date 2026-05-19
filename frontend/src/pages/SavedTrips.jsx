import React from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SavedTrips = () => {
  const navigate = useNavigate();
  
  // Mock data for saved trips
  const trips = [
    { id: 1, title: 'Romantic Getaway to Paris', destination: 'Paris, France', days: 5, date: 'May 15, 2026', img: 'https://images.unsplash.com/photo-1502602898657-3e907a5ea0ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Backpacking across Japan', destination: 'Kyoto, Japan', days: 14, date: 'Oct 02, 2026', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Weekend in New York', destination: 'New York, USA', days: 3, date: 'Dec 20, 2026', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '3rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="gradient-text">Your Saved Trips</h1>
        <p style={{ marginBottom: '3rem' }}>Relive your past adventures or continue planning upcoming ones.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {trips.map((trip, index) => (
          <motion.div 
            key={trip.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} perspective={1000} scale={1.05} transitionSpeed={2000}>
              <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, height: '100%' }}>
                <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                  <img src={trip.img} alt={trip.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: '1.3' }}>{trip.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="var(--accent-primary)"/> {trip.destination}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="var(--accent-secondary)"/> {trip.days} Days • {trip.date}</span>
                  </div>
                  <button className="glass-button" style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    View Itinerary <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SavedTrips;
