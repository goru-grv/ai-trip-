import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ tripData, cartItems = [], removeFromCart, clearCart }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const total = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const numeric = Number((item.price || '').toString().replace(/[^\d]/g, ''));
        return sum + (Number.isNaN(numeric) ? 0 : numeric);
      }, 0),
    [cartItems]
  );

  const payAndBook = async () => {
    if (!email) {
      setError('Enter your email for ticket delivery.');
      return;
    }
    if (!cartItems.length) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/checkout', {
        user_email: email,
        destination: tripData?.destination || 'Unknown Destination',
        payment_method: paymentMethod,
        cart_items: cartItems
      });
      setResult(response.data);
      clearCart();
    } catch (err) {
      setError('Payment/booking failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (result?.status === 'success') {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>Payment Successful, Tickets Booked</h2>
          <p style={{ marginTop: '0.6rem' }}>Booking Reference: <strong>{result.booking_reference}</strong></p>
          <p>Paid: ₹{result.paid_amount_inr}</p>
          <h3 style={{ marginTop: '1.2rem' }}>Booked Items</h3>
          <ul style={{ marginTop: '0.6rem', paddingLeft: '1rem' }}>
            {result.tickets?.map((ticket) => (
              <li key={ticket.ticket_id}>
                {ticket.item_type.toUpperCase()} - {ticket.name} ({ticket.ticket_id})
              </li>
            ))}
          </ul>
          <button className="glass-button" style={{ marginTop: '1.2rem' }} onClick={() => navigate('/')}>
            Plan Another Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <h1 className="gradient-text">Checkout & Agent Booking</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Select hotel and transport in cart, pay once, and our agent books all tickets for you.
      </p>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3>Cart Items ({cartItems.length})</h3>
        {!cartItems.length ? (
          <p style={{ marginTop: '0.8rem' }}>No items selected yet.</p>
        ) : (
          <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.8rem' }}>
            {cartItems.map((item) => (
              <div key={`${item.item_type}-${item.name}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <p><strong>{item.item_type.toUpperCase()}</strong>: {item.name}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.details}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p>{item.price}</p>
                  <button className="glass-button" style={{ marginTop: '0.35rem', padding: '0.4rem 0.8rem' }} onClick={() => removeFromCart(item)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3>Payment</h3>
        <div className="form-group" style={{ marginTop: '0.8rem' }}>
          <label>Email</label>
          <input className="glass-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Payment Method</label>
          <select className="glass-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="NetBanking">Net Banking</option>
          </select>
        </div>
        <p style={{ marginTop: '0.5rem' }}>Total: <strong>₹{total}</strong></p>
        {error && <p style={{ color: '#ef4444', marginTop: '0.5rem' }}>{error}</p>}
        <button className="glass-button" style={{ marginTop: '1rem', width: '100%' }} onClick={payAndBook} disabled={loading}>
          {loading ? 'Processing Payment & Booking...' : 'Pay Online & Book All Tickets'}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
