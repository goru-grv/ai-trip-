import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { MapPin, Calendar, ArrowRight, Sparkles, CreditCard, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const getDestinationImage = (dest) => {
  const query = (dest || '').toLowerCase();
  if (query.includes('paris')) {
    return 'https://images.unsplash.com/photo-1502602898657-3e907a5ea0ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('japan') || query.includes('kyoto') || query.includes('tokyo')) {
    return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('new york') || query.includes('ny')) {
    return 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
  if (query.includes('india') || query.includes('jaipur') || query.includes('delhi') || query.includes('mumbai') || query.includes('taj')) {
    return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
  // General high-quality scenic travel fallback image
  return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
};

const SavedTrips = ({ user, setTripData }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.email) return;

    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`http://localhost:8000/api/bookings?email=${user.email}`);
        if (response.data.status === 'success') {
          setBookings(response.data.data);
        } else {
          setError('Failed to fetch your saved bookings.');
        }
      } catch (err) {
        console.error('Error fetching bookings from MongoDB:', err);
        setError('Could not connect to the database. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleViewItinerary = (booking) => {
    if (booking.trip_data) {
      setTripData(booking.trip_data);
      navigate('/results');
    } else {
      // If trip_data is missing, construct a minimal version to avoid errors
      const fallbackTrip = {
        trip_title: `Trip to ${booking.destination}`,
        destination: booking.destination,
        duration: 3,
        budget: 'Budget',
        summary: 'Detailed itinerary plan not saved. Booking details are below.',
        hotel_suggestions: booking.tickets.filter(t => t.item_type === 'hotel').map(t => ({
          name: t.name,
          rating: 'N/A',
          price_per_night: 'Booked',
          description: t.details || 'Your booked hotel stay'
        })),
        transport_options: booking.tickets.filter(t => t.item_type === 'transport').map(t => ({
          mode: t.name.split('-')[0].strip || 'Transport',
          route: t.details || 'Booked Route',
          estimated_price: 'Booked',
          booking_tip: 'Tickets confirmed.'
        }))
      };
      setTripData(fallbackTrip);
      navigate('/results');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '3rem', paddingBottom: '3rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="gradient-text">Your Saved Trips</h1>
        <p style={{ marginBottom: '3rem' }}>Relive your past adventures or view itineraries for your booked tickets.</p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your journeys from MongoDB...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button className="glass-button" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      ) : bookings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel" 
          style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}
        >
          <Inbox size={48} color="var(--accent-primary)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h2 style={{ marginBottom: '0.8rem' }}>No Booked Trips Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
            You haven't completed any travel bookings yet! Go back to the planner, generate a customized itinerary, and add your favorite stays/transport options to checkout.
          </p>
          <button className="glass-button" style={{ display: 'flex', margin: '0 auto', gap: '8px', alignItems: 'center' }} onClick={() => navigate('/')}>
            Plan a New Journey <Sparkles size={16} />
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2.5rem' }}>
          {bookings.map((booking, index) => {
            const tripDays = booking.trip_data?.duration || 3;
            const bookingDate = formatDate(booking.booked_at);
            const imgUrl = getDestinationImage(booking.destination);
            
            return (
              <motion.div 
                key={booking._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} perspective={1000} scale={1.03} transitionSpeed={2000}>
                  <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '180px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                      <img src={imgUrl} alt={booking.destination} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid var(--glass-border)', color: 'var(--accent-secondary)' }}>
                        {booking.booking_reference}
                      </span>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', lineHeight: '1.3' }}>
                        {booking.trip_data?.trip_title || `Adventure to ${booking.destination}`}
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={15} color="var(--accent-primary)"/> {booking.destination}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={15} color="var(--accent-secondary)"/> {tripDays} Days • Booked {bookingDate}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CreditCard size={15} color="#10b981"/> Total Paid: ₹{Number(booking.paid_amount_inr).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Render Booked Items Tag Row */}
                      {booking.tickets && booking.tickets.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.5rem' }}>
                          {booking.tickets.map((ticket, idx) => (
                            <span key={idx} style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.07)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                              {ticket.item_type}: {ticket.name.split('-')[0].trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 'auto' }}>
                        <button 
                          onClick={() => handleViewItinerary(booking)}
                          className="glass-button" 
                          style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                        >
                          View Itinerary <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedTrips;
