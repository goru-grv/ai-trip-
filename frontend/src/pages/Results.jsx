import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { ArrowLeft, Clock, DollarSign, MapPin, Bed, Calendar as CalendarIcon, Tag, Bus } from 'lucide-react';

const Results = ({ tripData, cartItems = [], addToCart, removeFromCart }) => {
  const navigate = useNavigate();

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
      <button onClick={() => navigate('/')} className="glass-button" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
        <ArrowLeft size={18} /> Back to Search
      </button>
      <button onClick={() => navigate('/checkout')} className="glass-button" style={{ marginBottom: '2rem' }}>
        Go To Cart & Pay ({cartItems.length})
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{tripData.trip_title}</h1>

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

        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon color="var(--accent-secondary)" /> Day Plan
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {tripData.itinerary?.map((dayPlan, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Day {dayPlan.day}: {dayPlan.theme}</h3>
                {dayPlan.activities?.map((activity, i) => (
                  <div key={i} style={{ marginBottom: '0.9rem' }}>
                    <p><Clock size={14} style={{ display: 'inline' }} /> {activity.time} - {activity.title}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{activity.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
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
