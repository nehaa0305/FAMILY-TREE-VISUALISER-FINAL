import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formValid = username && password;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      const res = await API.post('/login', { username, password });
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setMessage('Login successful! Redirecting...');
      setMessageType('success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Login failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 400, margin: '40px auto', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', background: '#fff',
    }}>
      <h2 style={{textAlign: 'center'}}>Login</h2>
      <form onSubmit={handleLogin} aria-label="Login form">
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
        <label htmlFor="password" style={{display: 'block', marginTop: 12}}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{width: '100%', padding: 8, marginBottom: 8}}
        />
        <button
          type="submit"
          disabled={!formValid || loading}
          style={{
            width: '100%', padding: 10, marginTop: 18, background: '#1976d2', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16,
            opacity: (!formValid || loading) ? 0.6 : 1, cursor: (!formValid || loading) ? 'not-allowed' : 'pointer'
          }}
          aria-busy={loading}
        >
          {loading ? <span className="spinner" style={{
            display: 'inline-block', width: 18, height: 18, border: '2px solid #fff',
            borderTop: '2px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite'
          }} /> : 'Login'}
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
      
      <div style={{textAlign: 'center', marginTop: '20px'}}>
        <p>Don't have an account? <a href="/register" style={{color: '#1976d2'}}>Register here</a></p>
      </div>
    </div>
  );
}

export default LoginForm;
