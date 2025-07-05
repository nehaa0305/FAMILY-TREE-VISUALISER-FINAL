import React, { useEffect, useState } from 'react';
import API from '../api';

const RELATIONSHIP_TYPES = [
  { label: 'Parent', value: 'Parent' },
  { label: 'Son-Daughter', value: 'Son-Daughter' },
  { label: 'Sibling', value: 'Sibling' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
];

const GENDERS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other', value: 'Other' },
];

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 12px #0001',
  padding: 24,
  marginBottom: 28,
};

function FamilyTreeForm() {
  // Member list and loading
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  // Add member
  const [addName, setAddName] = useState('');
  const [addGender, setAddGender] = useState('M');
  const [addAge, setAddAge] = useState('');
  const [addMsg, setAddMsg] = useState('');
  // Edit member
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('M');
  const [editAge, setEditAge] = useState('');
  const [editMsg, setEditMsg] = useState('');
  // Delete member
  const [deleteMsg, setDeleteMsg] = useState('');
  // Relationship
  const [rel1, setRel1] = useState('');
  const [rel2, setRel2] = useState('');
  const [relType, setRelType] = useState('Parent');
  const [relMsg, setRelMsg] = useState('');
  // Relatives
  const [relativesId, setRelativesId] = useState('');
  const [relatives, setRelatives] = useState([]);
  const [relativesMsg, setRelativesMsg] = useState('');
  // Kinship queries
  const [k1, setK1] = useState('');
  const [k2, setK2] = useState('');
  const [cousins, setCousins] = useState(null);
  const [ancestors, setAncestors] = useState(null);
  const [related, setRelated] = useState(null);
  const [kinMsg, setKinMsg] = useState('');
  // General
  const [globalMsg, setGlobalMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all members
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await API.get('/relatives/' + (members[0]?.mid || ''));
      // The backend returns all relatives from a root; for all, we can use a workaround:
      // If no members, skip. If members, get all by traversing from one.
      // But for now, let's assume backend has /members (if not, fallback to /relatives/root).
      setMembers(res.data);
    } catch (err) {
      setGlobalMsg('Failed to load members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    // Try to fetch all members on mount
    const load = async () => {
      setLoadingMembers(true);
      try {
        // Try /members endpoint first
        let res;
        try {
          res = await API.get('/members');
          setMembers(res.data);
        } catch {
          // fallback: try relatives from a random member
          const fallback = await API.get('/relatives/' + (members[0]?.mid || ''));
          setMembers(fallback.data);
        }
      } catch {
        setGlobalMsg('Failed to load members.');
      } finally {
        setLoadingMembers(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, []);

  // Helper: refresh members
  const refreshMembers = async () => {
    setLoadingMembers(true);
    try {
      let res;
      try {
        res = await API.get('/members');
        setMembers(res.data);
      } catch {
        const fallback = await API.get('/relatives/' + (members[0]?.mid || ''));
        setMembers(fallback.data);
      }
    } catch {
      setGlobalMsg('Failed to refresh members.');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddMsg('');
    setLoading(true);
    try {
      await API.post('/add_member', { name: addName, gender: addGender, age: Number(addAge) });
      setAddMsg('Member added!');
      setAddName(''); setAddGender('M'); setAddAge('');
      await refreshMembers();
    } catch (err) {
      setAddMsg(err.response?.data?.msg || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Edit member
  const handleEditMember = async (e) => {
    e.preventDefault();
    setEditMsg('');
    setLoading(true);
    try {
      await API.post('/edit_member', {
        member_id: editId,
        name: editName,
        gender: editGender,
        age: Number(editAge),
      });
      setEditMsg('Member updated!');
      setEditId(''); setEditName(''); setEditGender('M'); setEditAge('');
      await refreshMembers();
    } catch (err) {
      setEditMsg(err.response?.data?.msg || 'Failed to edit member');
    } finally {
      setLoading(false);
    }
  };

  // Delete member
  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    setDeleteMsg('');
    setLoading(true);
    try {
      await API.post('/delete_member', { member_id: id });
      setDeleteMsg('Member deleted!');
      await refreshMembers();
    } catch (err) {
      setDeleteMsg(err.response?.data?.msg || 'Failed to delete member');
    } finally {
      setLoading(false);
    }
  };



  // View relatives
  const handleFindRelatives = async () => {
    setRelativesMsg('');
    setRelatives([]);
    setLoading(true);
    try {
      const res = await API.get(`/relatives/${relativesId}`);
      setRelatives(res.data);
      setRelativesMsg('Relatives loaded.');
    } catch (err) {
      setRelativesMsg(err.response?.data?.msg || 'Failed to load relatives');
    } finally {
      setLoading(false);
    }
  };

  // Kinship queries
  const handleKinship = async (type) => {
    setKinMsg('');
    setCousins(null); setAncestors(null); setRelated(null);
    setLoading(true);
    try {
      if (type === 'cousins') {
        const res = await API.get(`/are_cousins/${k1}/${k2}`);
        setCousins(res.data.are_cousins);
        setKinMsg('Cousin check complete.');
      } else if (type === 'ancestors') {
        const res = await API.get(`/common_ancestors/${k1}/${k2}`);
        setAncestors(res.data);
        setKinMsg('Common ancestors loaded.');
      } else if (type === 'related') {
        const res = await API.get(`/relationship_path/${k1}/${k2}`);
        setRelated(res.data);
        setKinMsg('Relationship path loaded.');
      }
    } catch (err) {
      setKinMsg(err.response?.data?.msg || 'Kinship query failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper: get member name by id
  const getMemberName = (id) => {
    const m = members.find(x => x.mid === id || x.member_id === id || x.id === id);
    return m ? m.name : id;
  };

  return (
    <div style={{maxWidth: 900, margin: '40px auto', padding: 24}}>
      <h2 style={{marginBottom: 32}}>Family Tree Management</h2>
      {/* 1. Member List */}
      <div style={cardStyle}>
        <h3>Current Family Members</h3>
        {loadingMembers ? <p>Loading members...</p> : (
          <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: 8}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th>Name</th><th>Gender</th><th>Age</th><th>ID</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.mid || m.member_id || m.id} style={{borderBottom: '1px solid #eee'}}>
                  <td>{m.name}</td>
                  <td>{m.gender}</td>
                  <td>{m.age}</td>
                  <td style={{fontSize: 12, color: '#888'}}>{m.mid || m.member_id || m.id}</td>
                  <td>
                    <button onClick={() => {
                      setEditId(m.mid || m.member_id || m.id);
                      setEditName(m.name);
                      setEditGender(m.gender);
                      setEditAge(m.age);
                    }} style={{marginRight: 8}}>Edit</button>
                    <button onClick={() => handleDeleteMember(m.mid || m.member_id || m.id)} style={{color: '#e53935'}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {deleteMsg && <p style={{color: '#e53935'}}>{deleteMsg}</p>}
      </div>
      {/* 2. Add Member */}
      <div style={cardStyle}>
        <h3>Add New Member</h3>
        <form onSubmit={handleAddMember} style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
          <input placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)} required style={{flex: 2, minWidth: 120}} />
          <select value={addGender} onChange={e => setAddGender(e.target.value)} style={{flex: 1, minWidth: 80}}>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <input type="number" placeholder="Age" value={addAge} onChange={e => setAddAge(e.target.value)} required min={0} style={{flex: 1, minWidth: 60}} />
          <button type="submit" disabled={loading}>Add</button>
        </form>
        {addMsg && <p style={{color: addMsg.includes('added') ? '#388e3c' : '#e53935'}}>{addMsg}</p>}
      </div>
      {/* 3. Edit Member */}
      {editId && (
        <div style={cardStyle}>
          <h3>Edit Member</h3>
          <form onSubmit={handleEditMember} style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
            <input placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} required style={{flex: 2, minWidth: 120}} />
            <select value={editGender} onChange={e => setEditGender(e.target.value)} style={{flex: 1, minWidth: 80}}>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <input type="number" placeholder="Age" value={editAge} onChange={e => setEditAge(e.target.value)} required min={0} style={{flex: 1, minWidth: 60}} />
            <button type="submit" disabled={loading}>Update</button>
            <button type="button" onClick={() => { setEditId(''); setEditName(''); setEditGender('M'); setEditAge(''); }}>Cancel</button>
          </form>
          {editMsg && <p style={{color: editMsg.includes('updated') ? '#388e3c' : '#e53935'}}>{editMsg}</p>}
        </div>
      )}
      {/* 5. Add Relationship */}
      <div style={cardStyle}>
        <h3>Add Relationships</h3>
        
        {/* Parent-Child Relationship */}
        <div style={{marginBottom: 24, padding: 16, border: '1px solid #e0e7ef', borderRadius: 8}}>
          <h4 style={{marginBottom: 12, color: '#1976d2'}}>Parent-Child Relationship</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setRelMsg('');
            setLoading(true);
            try {
              await API.post('/add_parent_child', {
                parent_id: rel1,
                child_id: rel2,
              });
              setRelMsg('Parent-child relationship added!');
              setRel1(''); setRel2('');
              await refreshMembers();
            } catch (err) {
              setRelMsg(err.response?.data?.msg || 'Failed to add parent-child relationship');
            } finally {
              setLoading(false);
            }
          }} style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
            <select value={rel1} onChange={e => setRel1(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Parent</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <span style={{fontWeight: 'bold', color: '#1976d2'}}>→</span>
            <select value={rel2} onChange={e => setRel2(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Child</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <button type="submit" disabled={loading}>Add Parent-Child</button>
          </form>
        </div>

        {/* Marriage Relationship */}
        <div style={{marginBottom: 24, padding: 16, border: '1px solid #e0e7ef', borderRadius: 8}}>
          <h4 style={{marginBottom: 12, color: '#9c27b0'}}>Marriage Relationship</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setRelMsg('');
            setLoading(true);
            try {
              await API.post('/add_marriage', {
                spouse1_id: rel1,
                spouse2_id: rel2,
              });
              setRelMsg('Marriage relationship added!');
              setRel1(''); setRel2('');
              await refreshMembers();
            } catch (err) {
              setRelMsg(err.response?.data?.msg || 'Failed to add marriage relationship');
            } finally {
              setLoading(false);
            }
          }} style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
            <select value={rel1} onChange={e => setRel1(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Spouse 1</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <span style={{fontWeight: 'bold', color: '#9c27b0'}}>💕</span>
            <select value={rel2} onChange={e => setRel2(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Spouse 2</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <button type="submit" disabled={loading}>Add Marriage</button>
          </form>
        </div>

        {/* Sibling Relationship */}
        <div style={{marginBottom: 24, padding: 16, border: '1px solid #e0e7ef', borderRadius: 8}}>
          <h4 style={{marginBottom: 12, color: '#388e3c'}}>Sibling Relationship</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setRelMsg('');
            setLoading(true);
            try {
              await API.post('/add_sibling', {
                sibling1_id: rel1,
                sibling2_id: rel2,
              });
              setRelMsg('Sibling relationship added!');
              setRel1(''); setRel2('');
              await refreshMembers();
            } catch (err) {
              setRelMsg(err.response?.data?.msg || 'Failed to add sibling relationship');
            } finally {
              setLoading(false);
            }
          }} style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
            <select value={rel1} onChange={e => setRel1(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Sibling 1</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <span style={{fontWeight: 'bold', color: '#388e3c'}}>👥</span>
            <select value={rel2} onChange={e => setRel2(e.target.value)} required style={{flex: 2, minWidth: 120}}>
              <option value="">Select Sibling 2</option>
              {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
            </select>
            <button type="submit" disabled={loading}>Add Siblings</button>
          </form>
        </div>

        {relMsg && <p style={{color: relMsg.includes('added') ? '#388e3c' : '#e53935'}}>{relMsg}</p>}
        
        <div style={{marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 14}}>
          <strong>How it works:</strong>
          <ul style={{margin: '8px 0 0 20px'}}>
            <li><strong>Parent-Child:</strong> Select who is the parent, then who is the child. Children automatically become siblings when they share a parent.</li>
            <li><strong>Marriage:</strong> Select two people to marry them. The relationship is bidirectional.</li>
            <li><strong>Siblings:</strong> Select two people to make them siblings. The relationship is bidirectional.</li>
          </ul>
        </div>
      </div>
      {/* 6. View Relatives */}
      <div style={cardStyle}>
        <h3>View Relatives</h3>
        <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
          <select value={relativesId} onChange={e => setRelativesId(e.target.value)} style={{flex: 2, minWidth: 120}}>
            <option value="">Select Member</option>
            {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
          </select>
          <button onClick={handleFindRelatives} disabled={!relativesId || loading}>Find Relatives</button>
        </div>
        {relativesMsg && <p>{relativesMsg}</p>}
        {relatives.length > 0 && (
          <ul style={{marginTop: 8}}>
            {relatives.map(r => <li key={r.mid || r.member_id || r.id}>{r.name} ({r.gender}, {r.age})</li>)}
          </ul>
        )}
      </div>
      {/* 7. Kinship Queries */}
      <div style={cardStyle}>
        <h3>Kinship Queries</h3>
        <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
          <select value={k1} onChange={e => setK1(e.target.value)} style={{flex: 2, minWidth: 120}}>
            <option value="">Select Member 1</option>
            {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
          </select>
          <select value={k2} onChange={e => setK2(e.target.value)} style={{flex: 2, minWidth: 120}}>
            <option value="">Select Member 2</option>
            {members.map(m => <option key={m.mid || m.member_id || m.id} value={m.mid || m.member_id || m.id}>{m.name}</option>)}
          </select>
          <button onClick={() => handleKinship('cousins')} disabled={!k1 || !k2 || loading}>Are Cousins?</button>
          <button onClick={() => handleKinship('ancestors')} disabled={!k1 || !k2 || loading}>Common Ancestors</button>
          <button onClick={() => handleKinship('related')} disabled={!k1 || !k2 || loading}>Relationship Path</button>
        </div>
        {kinMsg && <p>{kinMsg}</p>}
        {cousins !== null && <p>Cousins? <b>{cousins ? 'Yes' : 'No'}</b></p>}
        {ancestors && (
          <div><b>Common Ancestors:</b> {ancestors.length === 0 ? 'None' : ancestors.map(a => a.name).join(', ')}</div>
        )}
        {related && (
          <div style={{marginTop: 8}}>
            <b>Relationship Path:</b>
            <ul>
              {related.length === 0 ? <li>None</li> : related.map((step, i) => (
                <li key={i}>{getMemberName(step.from)} → {getMemberName(step.to)} ({step.relationship})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* General loading spinner */}
      {loading && <div style={{marginTop: 16, textAlign: 'center'}}><span className="spinner" style={{display: 'inline-block', width: 24, height: 24, border: '3px solid #bbb', borderTop: '3px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /></div>}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        table th, table td { padding: 6px 8px; }
      `}</style>
      {globalMsg && <p style={{color: '#e53935'}}>{globalMsg}</p>}
    </div>
  );
}

export default FamilyTreeForm;
