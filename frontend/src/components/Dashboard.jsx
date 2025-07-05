import React from 'react';

function Dashboard() {
  const username = localStorage.getItem('username');
  return (
    <div style={{maxWidth: 600, margin: '40px auto', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', background: '#fff'}}>
      <h2>Welcome{username ? `, ${username}` : ''}!</h2>
      <p>This is your dashboard. Add your family members, view your tree, and explore relationships here.</p>
      {/* Add more dashboard features/components here */}
    </div>
  );
}

export default Dashboard; 