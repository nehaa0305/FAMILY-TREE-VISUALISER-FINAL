// Build a registration form using React.
// Fields: username, password
// On submit, send POST /register to backend using API from api.js
// If success, redirect to /login
// If error, show error message

import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'error' or 'success'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const formValid = username && emailValid && password && passwordsMatch && passwordStrength >= 3;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      await API.post('/register', { username, password, email });
      setMessage('Registered successfully! Redirecting...');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Registration failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#6d4c41'];

  return (
    <div style={{
      maxWidth: 400, margin: '40px auto', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', background: '#fff',
    }}>
      <h2 style={{textAlign: 'center'}}>Register</h2>
      <form onSubmit={handleRegister} aria-label="Register form">
        <label htmlFor="username" style={{display: 'block', marginTop: 12}}>Username</label>
        <input
          id="username"
          name="username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="username"
          style={{width: '100%', padding: 8, marginBottom: 8}}
        />
        <label htmlFor="email" style={{display: 'block', marginTop: 12}}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-invalid={!emailValid}
          style={{width: '100%', padding: 8, marginBottom: 8, borderColor: email && !emailValid ? '#e53935' : undefined}}
        />
        {!emailValid && email && <span style={{color: '#e53935', fontSize: 12}}>Invalid email address</span>}
        <label htmlFor="password" style={{display: 'block', marginTop: 12}}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          aria-describedby="password-strength"
          style={{width: '100%', padding: 8, marginBottom: 8}}
        />
        <div id="password-strength" style={{marginBottom: 8}}>
          <div style={{height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden'}}>
            <div style={{width: `${(passwordStrength/5)*100}%`, height: 6, background: strengthColors[passwordStrength], transition: 'width 0.3s'}} />
          </div>
          <span style={{fontSize: 12, color: strengthColors[passwordStrength]}}>
            {password ? strengthLabels[passwordStrength] : ''}
          </span>
        </div>
        <label htmlFor="confirmPassword" style={{display: 'block', marginTop: 12}}>Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          aria-invalid={confirmPassword && !passwordsMatch}
          style={{width: '100%', padding: 8, marginBottom: 8, borderColor: confirmPassword && !passwordsMatch ? '#e53935' : undefined}}
        />
        {confirmPassword && !passwordsMatch && <span style={{color: '#e53935', fontSize: 12}}>Passwords do not match</span>}
        <button
          type="submit"
          disabled={!formValid || loading}
          style={{width: '100%', padding: 10, marginTop: 18, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, opacity: (!formValid || loading) ? 0.6 : 1, cursor: (!formValid || loading) ? 'not-allowed' : 'pointer'}}
          aria-busy={loading}
        >
          {loading ? <span className="spinner" style={{display: 'inline-block', width: 18, height: 18, border: '2px solid #fff', borderTop: '2px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /> : 'Register'}
        </button>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </form>
      {message && (
        <div
          role="alert"
          style={{
            marginTop: 18,
            color: messageType === 'error' ? '#e53935' : '#388e3c',
            background: messageType === 'error' ? '#ffebee' : '#e8f5e9',
            border: `1px solid ${messageType === 'error' ? '#e53935' : '#388e3c'}`,
            borderRadius: 6,
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
          }}
        >
          {messageType === 'error' ? (
            <span aria-label="Error" style={{fontSize: 20}}>❌</span>
          ) : (
            <span aria-label="Success" style={{fontSize: 20}}>✅</span>
          )}
          {message}
        </div>
      )}
    </div>
  );
}

export default RegisterForm;
