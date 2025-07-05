import React, { useEffect, useState } from 'react';
import API from '../api';

const RELATIONSHIP_TYPES = [
  { label: 'Married', value: 'Married' },
  { label: 'Sibling', value: 'Sibling' },
  { label: 'Parent', value: 'Parent' },
  { label: 'Son-Daughter', value: 'Son-Daughter' },
  { label: 'Divorced', value: 'Divorced' },
];

function MergeTreePanel() {
  const [targetUsername, setTargetUsername] = useState('');
  const [localMembers, setLocalMembers] = useState([]);
  const [localMemberId, setLocalMemberId] = useState('');
  const [relationship, setRelationship] = useState('Married');
  const [targetMemberId, setTargetMemberId] = useState('');
  const [targetMembers, setTargetMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTargetMembers, setLoadingTargetMembers] = useState(false);
  const [targetMembersError, setTargetMembersError] = useState('');

  // Fetch local members
  const fetchLocalMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/members');
      setLocalMembers(res.data);
    } catch (err) {
      setError('Failed to load your members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalMembers();
  }, []);

  // Fetch target user's members
  const fetchTargetMembers = async () => {
    setLoadingTargetMembers(true);
    setTargetMembersError('');
    setTargetMembers([]);
    try {
      const res = await API.get(`/members?username=${encodeURIComponent(targetUsername)}`);
      setTargetMembers(res.data);
      if (res.data.length === 0) setTargetMembersError('No members found for this user.');
    } catch (err) {
      setTargetMembersError(err.response?.data?.msg || 'Failed to load target user members.');
    } finally {
      setLoadingTargetMembers(false);
    }
  };

  // Merge trees
  const handleMerge = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/merge_tree', {
        target_username: targetUsername,
        local_member_id: localMemberId,
        target_member_id: targetMemberId,
        relationship,
      });
      setMessage(res.data.msg || 'Trees merged successfully!');
      // Save tree after merge
      await API.post('/save_tree');
      // Refresh local members
      await fetchLocalMembers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to merge trees.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001'}}>
      <h2 style={{marginBottom: 18}}>Merge Family Trees</h2>
      <form onSubmit={handleMerge} style={{display: 'flex', flexDirection: 'column', gap: 14}}>
        <label>
          Target Username or Email:
          <div style={{display: 'flex', gap: 8, alignItems: 'center', marginTop: 4}}>
            <input
              type="text"
              value={targetUsername}
              onChange={e => { setTargetUsername(e.target.value); setTargetMembers([]); setTargetMemberId(''); setTargetMembersError(''); }}
              required
              style={{flex: 2, padding: 8}}
              placeholder="Enter target user's username or email"
            />
            <button type="button" onClick={fetchTargetMembers} disabled={!targetUsername || loadingTargetMembers} style={{flex: 1, padding: '8px 0'}}>Fetch Members</button>
          </div>
        </label>
        {targetMembersError && <div style={{color: '#e53935', marginTop: 4}}>{targetMembersError}</div>}
        <label>
          Your Family Member:
          <select
            value={localMemberId}
            onChange={e => setLocalMemberId(e.target.value)}
            required
            style={{width: '100%', marginTop: 4, padding: 8}}
          >
            <option value="">Select member</option>
            {localMembers.map(m => (
              <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <label>
          Relationship Type:
          <select
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            required
            style={{width: '100%', marginTop: 4, padding: 8}}
          >
            {RELATIONSHIP_TYPES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label>
          Target Member (from other user's tree):
          <select
            value={targetMemberId}
            onChange={e => setTargetMemberId(e.target.value)}
            required
            style={{width: '100%', marginTop: 4, padding: 8}}
            disabled={targetMembers.length === 0}
          >
            <option value="">Select target member</option>
            {targetMembers.map(m => (
              <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading || !targetMemberId} style={{padding: '10px 0', fontWeight: 600, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, marginTop: 8}}>
          {loading ? 'Merging...' : 'Merge Trees'}
        </button>
      </form>
      {message && <div style={{marginTop: 16, color: '#388e3c', fontWeight: 500}}>{message}</div>}
      {error && <div style={{marginTop: 16, color: '#e53935'}}>{error}</div>}
      {(loading || loadingTargetMembers) && <div style={{marginTop: 16, textAlign: 'center'}}><span className="spinner" style={{display: 'inline-block', width: 24, height: 24, border: '3px solid #bbb', borderTop: '3px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /></div>}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default MergeTreePanel; 