import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import axios from 'axios';
import { 
  ArrowLeft, Clock, DollarSign, MapPin, Bed, Calendar as CalendarIcon, Tag, Bus, 
  ChevronDown, ChevronUp, Utensils, Camera, Sun, Sunrise, Sunset, Moon, 
  Compass, Shield, Thermometer, Phone, ExternalLink, Star 
} from 'lucide-react';

const Results = ({ tripData, setTripData, cartItems = [], addToCart, removeFromCart }) => {
  const navigate = useNavigate();
  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const [selectedHotels, setSelectedHotels] = useState({});
  const [showAlternatives, setShowAlternatives] = useState({});
  const [hotelPhotos, setHotelPhotos] = useState({});

  useEffect(() => {
    if (!tripData || !tripData.itinerary) return;

    const fetchPhotos = async () => {
      const hotelsToFetch = [];
      tripData.itinerary.forEach((dayPlan) => {
        if (dayPlan.suggested_hotel?.name && dayPlan.suggested_hotel.source !== "Google Places Live") {
          hotelsToFetch.push(dayPlan.suggested_hotel.name);
        }
        dayPlan.alternative_hotels?.forEach((alt) => {
          if (alt.name && alt.source !== "Google Places Live") {
            hotelsToFetch.push(alt.name);
          }
        });
      });

      const uniqueHotels = [...new Set(hotelsToFetch)];
      
      const photoPromises = uniqueHotels.map(async (hotelName) => {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
              hotelName
            )}&gsrlimit=1&prop=pageimages&pithumbsize=600&format=json&origin=*`
          );
          if (!response.ok) return { name: hotelName, url: null };
          const data = await response.json();
          const pages = data?.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const thumbnail = pages[pageId]?.thumbnail?.source;
            if (thumbnail) {
              return { name: hotelName, url: thumbnail };
            }
          }
        } catch (err) {
          console.warn("Could not fetch Wikipedia image for:", hotelName, err);
        }
        return { name: hotelName, url: null };
      });

      const results = await Promise.all(photoPromises);
      const photoMap = {};
      results.forEach((res) => {
        if (res.url) {
          photoMap[res.name] = res.url;
        }
      });

      setHotelPhotos(photoMap);
    };

    fetchPhotos();
  }, [tripData]);

  const getSelectedHotelForDay = (dayPlan, dayNumber) => {
    return selectedHotels[dayNumber] || dayPlan.suggested_hotel;
  };

  const isHotelInCart = (dayNumber, hotelName) => {
    const cartName = `${hotelName} (Day ${dayNumber})`;
    return cartItems.some((item) => item.item_type === 'hotel' && item.name === cartName);
  };

  const toggleHotelCart = (dayPlan, hotel, dayNumber) => {
    const cartName = `${hotel.name} (Day ${dayNumber})`;
    const selected = isHotelInCart(dayNumber, hotel.name);
    
    if (selected) {
      removeFromCart({ item_type: 'hotel', name: cartName });
    } else {
      addToCart({
        item_type: 'hotel',
        name: cartName,
        price: hotel.price_per_night,
        details: `Day ${dayNumber} Stay - ${hotel.address}`
      });
    }
  };

  const selectAlternativeHotel = (dayPlan, newHotel, dayNumber) => {
    const currentHotel = getSelectedHotelForDay(dayPlan, dayNumber);
    const oldCartName = `${currentHotel.name} (Day ${dayNumber})`;
    const wasInCart = cartItems.some((item) => item.item_type === 'hotel' && item.name === oldCartName);
    
    setSelectedHotels((prev) => ({
      ...prev,
      [dayNumber]: newHotel,
    }));
    
    if (wasInCart) {
      removeFromCart({ item_type: 'hotel', name: oldCartName });
      addToCart({
        item_type: 'hotel',
        name: `${newHotel.name} (Day ${dayNumber})`,
        price: newHotel.price_per_night,
        details: `Day ${dayNumber} Stay - ${newHotel.address}`
      });
    }
  };

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

  const toggleDay = (idx) => {
    setExpandedDays((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getSlotIcon = (slot) => {
    const s = (slot || '').toLowerCase();
    if (s.includes('morning')) return <Sunrise size={16} color="var(--accent-secondary)" />;
    if (s.includes('afternoon')) return <Sun size={16} color="#f59e0b" />;
    if (s.includes('evening')) return <Sunset size={16} color="#f97316" />;
    return <Moon size={16} color="#a855f7" />;
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} className="glass-button" style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
          <ArrowLeft size={18} /> Back to Search
        </button>
        <button onClick={() => navigate('/checkout')} className="glass-button" style={{ padding: '0.5rem 1.2rem', marginLeft: 'auto' }}>
          Go To Cart & Pay ({cartItems.length})
        </button>
      </div>

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
          <CalendarIcon color="var(--accent-secondary)" /> Premium Itinerary Guide
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {tripData.itinerary?.map((dayPlan, index) => {
            const isExpanded = !!expandedDays[index];
            const dayNumber = index + 1;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    cursor: 'pointer',
                    border: '1px solid var(--glass-border)',
                    boxShadow: isExpanded ? '0 8px 32px 0 rgba(0, 240, 255, 0.05)' : 'none'
                  }}
                  onClick={() => toggleDay(index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold', 
                        color: 'var(--accent-secondary)', 
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Day {dayNumber}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                        {dayPlan.theme}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isExpanded ? <ChevronUp size={24} color="var(--text-secondary)" /> : <ChevronDown size={24} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />
                        
                        {dayPlan.optimized_route_summary && (
                          <div style={{ 
                            background: 'rgba(255, 255, 255, 0.02)', 
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            textAlign: 'left'
                          }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Compass size={16} /> OPTIMIZED ROUTE & LOGISTICS
                            </p>
                            <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              {dayPlan.optimized_route_summary}
                            </p>
                          </div>
                        )}

                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                          gap: '1rem', 
                          marginBottom: '2rem' 
                        }}>
                          {dayPlan.weather_prep && (
                            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                <Thermometer size={14} color="#f59e0b" /> Weather Prep
                              </span>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dayPlan.weather_prep}</p>
                            </div>
                          )}
                          {dayPlan.safety_tips && (
                            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                <Shield size={14} color="#10b981" /> Safety Advice
                              </span>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dayPlan.safety_tips}</p>
                            </div>
                          )}
                          {dayPlan.budget_tips && (
                            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                <DollarSign size={14} color="var(--accent-primary)" /> Budget Tip
                              </span>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dayPlan.budget_tips}</p>
                            </div>
                          )}
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '1.8rem', textAlign: 'left' }}>
                          <div style={{ 
                            position: 'absolute', 
                            left: '8px', 
                            top: '12px', 
                            bottom: '12px', 
                            width: '2px', 
                            background: 'linear-gradient(to bottom, var(--accent-primary), var(--accent-secondary))',
                            opacity: 0.5
                          }} />

                          {dayPlan.time_slots?.map((slotData, sIdx) => (
                            <div key={sIdx} style={{ position: 'relative', marginBottom: '2rem' }}>
                              <div style={{ 
                                position: 'absolute', 
                                left: '-30px', 
                                top: '4px', 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                background: 'var(--bg-primary)', 
                                border: '3px solid var(--accent-secondary)',
                                boxShadow: '0 0 8px var(--accent-secondary)'
                              }} />

                              <div className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold', 
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: 'var(--text-primary)'
                                  }}>
                                    {getSlotIcon(slotData.slot)} {slotData.slot}
                                  </span>
                                  {slotData.best_visiting_time && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={12} /> {slotData.best_visiting_time}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                                    {slotData.place_name}
                                  </h4>
                                  {slotData.map_link && (
                                    <a 
                                      href={slotData.map_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="glass-button"
                                      style={{ 
                                        padding: '4px 10px', 
                                        fontSize: '0.75rem', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        textDecoration: 'none',
                                        boxShadow: 'none',
                                        border: '1px solid rgba(0, 240, 255, 0.2)'
                                      }}
                                    >
                                      <MapPin size={12} /> View on Map
                                    </a>
                                  )}
                                </div>

                                <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                  {slotData.why_it_matters}
                                </p>

                                <p style={{ margin: '8px 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                  {slotData.activity}
                                </p>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '10px 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Bus size={12} color="var(--accent-secondary)" /> TRANSIT & DIRECTION
                                    </p>
                                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                      {slotData.travel_time_from_previous} ({slotData.transport_suggestion})
                                    </p>
                                  </div>

                                  {slotData.food_spot && (
                                    <div>
                                      <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Utensils size={12} color="#f59e0b" /> NEARBY DINING
                                      </p>
                                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                        <strong>{slotData.food_spot}</strong>: {slotData.local_dishes}
                                      </p>
                                    </div>
                                  )}

                                  {slotData.photo_point && (
                                    <div>
                                      <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Camera size={12} color="#ec4899" /> PHOTO SPOT
                                      </p>
                                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                        {slotData.photo_point}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Day-Wise Hotel Stay Recommendation */}
                        {(() => {
                          const hotel = getSelectedHotelForDay(dayPlan, dayNumber);
                          if (!hotel) return null;
                          const selected = isHotelInCart(dayNumber, hotel.name);
                          const isAltOpen = !!showAlternatives[dayNumber];

                          return (
                            <div style={{ marginTop: '2.5rem' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} />
                              
                              <h4 style={{ 
                                fontSize: '1rem', 
                                fontWeight: 'bold', 
                                color: 'var(--accent-secondary)', 
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Bed size={18} /> Day {dayNumber} Recommended Stay
                              </h4>

                              <div 
                                className="glass-panel" 
                                style={{ 
                                  padding: '1.5rem', 
                                  background: 'rgba(13, 9, 26, 0.4)',
                                  border: '1px solid var(--glass-border)',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                  gap: '1.5rem',
                                  alignItems: 'start'
                                }}
                              >
                                {/* Hotel Photo with Hover Zoom */}
                                <div style={{ 
                                  height: '200px', 
                                  borderRadius: '1rem', 
                                  overflow: 'hidden', 
                                  position: 'relative',
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                                }}>
                                  <img 
                                    src={hotelPhotos[hotel.name] || hotel.photo} 
                                    alt={hotel.name} 
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      transition: 'transform 0.5s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                                  />
                                  <span style={{ 
                                    position: 'absolute', 
                                    bottom: '10px', 
                                    right: '10px', 
                                    background: 'rgba(16, 185, 129, 0.9)', 
                                    backdropFilter: 'blur(4px)', 
                                    padding: '4px 10px', 
                                    borderRadius: '10px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold',
                                    color: '#ffffff'
                                  }}>
                                    {hotel.price_per_night} / night
                                  </span>
                                </div>

                                {/* Hotel Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%', justifyContent: 'space-between' }}>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>{hotel.name}</h3>
                                        {hotel.source && (
                                          <span style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center',
                                            width: 'fit-content',
                                            fontSize: '0.65rem', 
                                            color: hotel.source === 'Google Places Live' ? '#10b981' : hotel.source.includes('Amadeus') ? '#3b82f6' : hotel.source.includes('OpenStreetMap') ? '#00f0ff' : '#a855f7', 
                                            background: hotel.source === 'Google Places Live' ? 'rgba(16, 185, 129, 0.1)' : hotel.source.includes('Amadeus') ? 'rgba(59, 130, 246, 0.1)' : hotel.source.includes('OpenStreetMap') ? 'rgba(0, 240, 255, 0.1)' : 'rgba(168, 85, 247, 0.1)', 
                                            border: `1px solid ${hotel.source === 'Google Places Live' ? 'rgba(16, 185, 129, 0.2)' : hotel.source.includes('Amadeus') ? 'rgba(59, 130, 246, 0.2)' : hotel.source.includes('OpenStreetMap') ? 'rgba(0, 240, 255, 0.2)' : 'rgba(168, 85, 247, 0.2)'}`,
                                            padding: '2px 6px', 
                                            borderRadius: '4px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                          }}>
                                            {hotel.source}
                                          </span>
                                        )}
                                      </div>
                                      <span style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '4px', 
                                        fontSize: '0.8rem', 
                                        color: '#fbbf24', 
                                        background: 'rgba(251, 191, 36, 0.1)', 
                                        padding: '2px 8px', 
                                        borderRadius: '6px',
                                        fontWeight: '600'
                                      }}>
                                        <Star size={12} fill="#fbbf24" color="#fbbf24" /> {hotel.rating} Stars
                                      </span>
                                    </div>

                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {hotel.reviews}
                                    </p>

                                    <p style={{ margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                      <strong>Why recommended:</strong> {hotel.why_recommended}
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={12} color="var(--accent-primary)" /> {hotel.address}
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={12} color="var(--accent-primary)" /> {hotel.contact_number}
                                      </span>
                                    </div>

                                    {/* Amenities Badges */}
                                    {hotel.amenities && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                        {hotel.amenities.map((amenity, amIdx) => (
                                          <span key={amIdx} style={{ 
                                            fontSize: '0.72rem', 
                                            background: 'rgba(139, 92, 246, 0.12)', 
                                            border: '1px solid rgba(139, 92, 246, 0.25)', 
                                            padding: '2px 8px', 
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)'
                                          }}>
                                            {amenity}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                                    <button
                                      className="glass-button"
                                      onClick={() => toggleHotelCart(dayPlan, hotel, dayNumber)}
                                      style={{ 
                                        padding: '0.6rem 1.2rem', 
                                        fontSize: '0.9rem',
                                        background: selected ? 'rgba(16, 185, 129, 0.25)' : undefined,
                                        border: selected ? '1px solid #10b981' : undefined
                                      }}
                                    >
                                      {selected ? '✓ Selected Stay' : 'Select Hotel'}
                                    </button>
                                    
                                    {hotel.book_link && (
                                      <a 
                                        href={hotel.book_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="glass-button"
                                        style={{ 
                                          padding: '0.6rem 1.2rem', 
                                          fontSize: '0.9rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          background: 'rgba(255,255,255,0.05)',
                                          border: '1px solid rgba(255,255,255,0.1)',
                                          textDecoration: 'none',
                                          boxShadow: 'none'
                                        }}
                                      >
                                        Book Now <ExternalLink size={14} />
                                      </a>
                                    )}

                                    {hotel.map_link && (
                                      <a 
                                        href={hotel.map_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="glass-button"
                                        style={{ 
                                          padding: '0.6rem 1.2rem', 
                                          fontSize: '0.9rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          background: 'rgba(255,255,255,0.05)',
                                          border: '1px solid rgba(255,255,255,0.1)',
                                          textDecoration: 'none',
                                          boxShadow: 'none'
                                        }}
                                      >
                                        Maps Link <MapPin size={14} />
                                      </a>
                                    )}

                                    <button
                                      className="glass-button"
                                      onClick={() => setShowAlternatives(prev => ({ ...prev, [dayNumber]: !prev[dayNumber] }))}
                                      style={{ 
                                        padding: '0.6rem 1.2rem', 
                                        fontSize: '0.9rem',
                                        background: 'rgba(217, 70, 239, 0.05)',
                                        border: '1px solid rgba(217, 70, 239, 0.15)',
                                        boxShadow: 'none'
                                      }}
                                    >
                                      {isAltOpen ? 'Hide Alternatives' : 'Alternative Hotels'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Alternatives Dropdown Section */}
                              <AnimatePresence>
                                {isAltOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ 
                                      overflow: 'hidden', 
                                      marginTop: '1rem',
                                      padding: '1.2rem',
                                      background: 'rgba(13, 9, 26, 0.35)',
                                      border: '1px solid rgba(217, 70, 239, 0.1)',
                                      borderRadius: '1rem'
                                    }}
                                  >
                                    <h5 style={{ color: 'var(--accent-tertiary)', marginBottom: '1rem', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                                      Other stays nearby Day {dayNumber} itinerary
                                    </h5>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                      {dayPlan.alternative_hotels?.map((alt, altIdx) => (
                                        <div 
                                          key={altIdx} 
                                          className="glass-panel"
                                          onClick={() => selectAlternativeHotel(dayPlan, alt, dayNumber)}
                                          style={{ 
                                            padding: '0.8rem', 
                                            background: 'rgba(255,255,255,0.01)',
                                            border: '1px solid rgba(255,255,255,0.04)',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                          }}
                                          onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                                            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.02)';
                                          }}
                                          onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                                          }}
                                        >
                                          <img 
                                            src={hotelPhotos[alt.name] || alt.photo} 
                                            alt={alt.name} 
                                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} 
                                          />
                                          <div style={{ flex: 1, textAlign: 'left' }}>
                                            <h6 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-primary)' }}>{alt.name}</h6>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0', flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                ⭐ {alt.rating}
                                              </span>
                                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                • {alt.price_per_night}
                                              </span>
                                              {alt.source && (
                                                <span style={{ 
                                                  fontSize: '0.55rem', 
                                                  color: alt.source === 'Google Places Live' ? '#10b981' : alt.source.includes('Amadeus') ? '#3b82f6' : alt.source.includes('OpenStreetMap') ? '#00f0ff' : '#a855f7', 
                                                  background: alt.source === 'Google Places Live' ? 'rgba(16, 185, 129, 0.1)' : alt.source.includes('Amadeus') ? 'rgba(59, 130, 246, 0.1)' : alt.source.includes('OpenStreetMap') ? 'rgba(0, 240, 255, 0.1)' : 'rgba(168, 85, 247, 0.1)', 
                                                  padding: '1px 4px', 
                                                  borderRadius: '3px',
                                                  fontWeight: '600'
                                                }}>
                                                  {alt.source.split(' ')[0]}
                                                </span>
                                              )}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-tertiary)', fontWeight: 'bold' }}>
                                              Swap to this stay →
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
