import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import FamilyTreeForm from './components/FamilyTreeForm';
import TreeView from './components/TreeView';
import KinshipQueries from './components/KinshipQueries';
import MergeTreePanel from './components/MergeTreePanel';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="container">
              <a href="/dashboard">Dashboard</a>
              <a href="/family-tree">Family Tree</a>
              <a href="/tree-view">Tree View</a>
              <a href="/kinship-queries">Kinship Queries</a>
              <a href="/merge-trees">Merge Trees</a>
              <button onClick={handleLogout} className="btn btn-danger" style={{ float: 'right' }}>
                Logout
              </button>
            </div>
          </nav>
        )}
        
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm onLogin={handleLogin} />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterForm />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/family-tree" 
              element={isAuthenticated ? <FamilyTreeForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/tree-view" 
              element={isAuthenticated ? <TreeView /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/kinship-queries" 
              element={isAuthenticated ? <KinshipQueries /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/merge-trees" 
              element={isAuthenticated ? <MergeTreePanel /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 