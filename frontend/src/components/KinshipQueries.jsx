import React, { useEffect, useState } from 'react';
import API from '../api';

function KinshipQueries() {
  const [members, setMembers] = useState([]);
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch members
  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/members');
      setMembers(res.data);
    } catch (err) {
      setError('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Helper: get member name by id
  const getMemberName = (id) => {
    const m = members.find(x => x.mid === id || x.member_id === id || x.id === id);
    return m ? m.name : id;
  };

  // Query handler
  const handleRelationshipQuery = async () => {
    if (!id1 || !id2) {
      setError('Please select both members.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');
    
    try {
      const res = await API.get(`/relationship_analysis/${id1}/${id2}`);
      
      if (!res.data.relationship) {
        setResult({
          relationship: null,
          path: null,
          message: 'No relationship found between these members.'
        });
      } else {
        setResult({
          relationship: res.data.relationship,
          path: res.data.path,
          message: `Relationship found: ${res.data.relationship}`
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.msg || 'Query failed.');
    } finally {
      setLoading(false);
    }
  };

  // Render result
  const renderResult = () => {
    if (!result) return null;

    return (
      <div style={{marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef'}}>
        <h4 style={{margin: '0 0 12px 0', color: '#1976d2'}}>Relationship Analysis</h4>
        
        {!result.relationship ? (
          <p style={{margin: 0, color: '#666'}}>{result.message}</p>
        ) : (
          <div>
            <div style={{marginBottom: 16}}>
              <h5 style={{margin: '0 0 8px 0', color: '#333'}}>Relationship:</h5>
              <div style={{padding: 12, background: '#e3f2fd', borderRadius: 6, border: '1px solid #2196f3'}}>
                <strong style={{color: '#1976d2'}}>
                  {getMemberName(id1)} is the {result.relationship} of {getMemberName(id2)}
                </strong>
              </div>
            </div>
            
            {result.path && (
              <div style={{marginBottom: 16}}>
                <h5 style={{margin: '0 0 8px 0', color: '#333'}}>Relationship Path:</h5>
                <div style={{padding: 12, background: '#fff3cd', borderRadius: 6, border: '1px solid #ffc107'}}>
                  <p style={{margin: 0, color: '#856404', fontSize: '14px'}}>{result.path}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001'}}>
      <h2 style={{marginBottom: 18, color: '#1976d2', textAlign: 'center'}}>Relationship Analysis</h2>
      
      <div style={{marginBottom: 24, padding: 16, background: '#e3f2fd', borderRadius: 8, border: '1px solid #2196f3'}}>
        <h4 style={{margin: '0 0 8px 0', color: '#1976d2'}}>How it works:</h4>
        <p style={{margin: 0, color: '#1976d2', fontSize: '14px'}}>
          Select two family members to find their relationship. The system will tell you exactly what relationship they have, 
          such as "mother", "uncle", "cousin", etc. For complex relationships, it will also show the path that connects them.
        </p>
      </div>

      <div style={{marginBottom: 24}}>
        <h4 style={{marginBottom: 12, color: '#333'}}>Select Family Members</h4>
        <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'}}>
          <select 
            value={id1} 
            onChange={e => setId1(e.target.value)} 
            style={{flex: 1, minWidth: 200, padding: 8, borderRadius: 4, border: '1px solid #ddd'}}
          >
            <option value="">Select First Member</option>
            {members.map(m => (
              <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>
                {m.name} ({m.gender}, {m.age})
              </option>
            ))}
          </select>
          <select 
            value={id2} 
            onChange={e => setId2(e.target.value)} 
            style={{flex: 1, minWidth: 200, padding: 8, borderRadius: 4, border: '1px solid #ddd'}}
          >
            <option value="">Select Second Member</option>
            {members.map(m => (
              <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>
                {m.name} ({m.gender}, {m.age})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{marginBottom: 24}}>
        <button 
          onClick={handleRelationshipQuery} 
          disabled={!id1 || !id2 || loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Analyzing...' : 'Find Relationship'}
        </button>
      </div>

      {loading && (
        <div style={{textAlign: 'center', margin: '20px 0'}}>
          <div style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{marginTop: 8, color: '#666'}}>Analyzing relationship...</p>
        </div>
      )}

      {error && (
        <div style={{
          margin: '16px 0',
          padding: 12,
          background: '#ffebee',
          color: '#c62828',
          borderRadius: 6,
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}

      {renderResult()}

      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}

export default KinshipQueries; 