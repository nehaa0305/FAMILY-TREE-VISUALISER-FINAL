import React, { useEffect, useState, useRef } from 'react';
import API from '../api';
import { flextree } from 'd3-flextree';

function TreeView() {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const svgRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, relationshipsRes] = await Promise.all([
        API.get('/members'),
        API.get('/export_json')
      ]);
      setMembers(membersRes.data);
      setRelationships(relationshipsRes.data.edges || []);
      setError('');
    } catch (err) {
      setError('Failed to load family tree data.');
    } finally {
      setLoading(false);
    }
  };

  function buildGenealogyTree(members, relationships) {
    const memberMap = {};
    members.forEach(m => { memberMap[m.mid] = { ...m, spouses: [], children: [] }; });
    
    relationships.forEach(rel => {
      if (rel.relationship === 11) {
        if (!memberMap[rel.from].spouses.includes(rel.to)) memberMap[rel.from].spouses.push(rel.to);
        if (!memberMap[rel.to].spouses.includes(rel.from)) memberMap[rel.to].spouses.push(rel.from);
      }
    });
    
    relationships.forEach(rel => {
      if (rel.relationship === 13) {
        if (!memberMap[rel.from].children.includes(rel.to)) memberMap[rel.from].children.push(rel.to);
      }
    });
    
    Object.values(memberMap).forEach(m => { m._isChild = false; });
    Object.values(memberMap).forEach(m => {
      m.children.forEach(cid => { if (memberMap[cid]) memberMap[cid]._isChild = true; });
    });
    
    const couples = [];
    const seen = new Set();
    Object.values(memberMap).forEach(m => {
      m.spouses.forEach(sid => {
        const key = [m.mid, sid].sort().join('-');
        if (!seen.has(key) && !m._isChild && !memberMap[sid]._isChild) {
          couples.push([m, memberMap[sid]]);
          seen.add(key);
        }
      });
    });

    const singles = Object.values(memberMap).filter(m => !m._isChild && m.spouses.length === 0);
    
    if (couples.length === 1 && singles.length === 0) {
      return makeCoupleNode(couples[0][0], couples[0][1], memberMap);
    } else if (couples.length === 0 && singles.length === 1) {
      return makePersonNode(singles[0], memberMap);
    } else {
      let root = { name: 'Family Tree', children: [] };
      couples.forEach(([p1, p2]) => {
        root.children.push(makeCoupleNode(p1, p2, memberMap));
      });
      singles.forEach(single => {
        root.children.push(makePersonNode(single, memberMap));
      });
      return root;
    }
  }

  function makeCoupleNode(p1, p2, memberMap) {
    const children = Object.values(memberMap).filter(m => p1.children.includes(m.mid) && p2.children.includes(m.mid));
    return {
      isCouple: true,
      couple: [p1, p2],
      name: p1.name + ' + ' + p2.name,
      children: children.map(child => {
        if (child.spouses.length > 0) {
          const spouse = memberMap[child.spouses[0]];
          if (spouse) return makeCoupleNode(child, spouse, memberMap);
        }
        return makePersonNode(child, memberMap);
      })
    };
  }

  function makePersonNode(person, memberMap) {
    return {
      isPerson: true,
      person,
      name: person.name,
      children: []
    };
  }

  function renderFlextree(root) {
    if (!root) return null;
    const layout = flextree().nodeSize([120, 120]);
    const tree = layout.hierarchy(root);
    layout(tree);
    const nodes = tree.descendants();
    const links = tree.links();
    const width = 1500, height = 800;
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const offsetX = width / 2 - (Math.max(...nodes.map(n => n.x)) + minX) / 2;
    const offsetY = 60 - minY;
    const svgLinks = links.map((link, i) => (
              <line
        key={i}
        x1={link.source.x + offsetX}
        y1={link.source.y + offsetY + 40}
        x2={link.target.x + offsetX}
        y2={link.target.y + offsetY - 40}
        stroke="#1976d2"
        strokeWidth={2}
      />
    ));
    const svgNodes = nodes.map((node, i) => {
      if (node.data.isCouple) {
        const [p1, p2] = node.data.couple;
        const cx1 = node.x + offsetX - 40;
        const cx2 = node.x + offsetX + 40;
        const cy = node.y + offsetY;
        return (
          <g key={i}>
            <rect x={cx1 - 50} y={cy - 30} width={100} height={60} rx={16} fill={p1.gender === 'M' ? '#2196F3' : p1.gender === 'F' ? '#E91E63' : '#9C27B0'} stroke="#333" strokeWidth={2} />
            <text x={cx1} y={cy - 5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#fff">{p1.name}</text>
            <text x={cx1} y={cy + 15} textAnchor="middle" fontSize={12} fill="#fff">{p1.gender}, {p1.age}</text>
            <rect x={cx2 - 50} y={cy - 30} width={100} height={60} rx={16} fill={p2.gender === 'M' ? '#2196F3' : p2.gender === 'F' ? '#E91E63' : '#9C27B0'} stroke="#333" strokeWidth={2} />
            <text x={cx2} y={cy - 5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#fff">{p2.name}</text>
            <text x={cx2} y={cy + 15} textAnchor="middle" fontSize={12} fill="#fff">{p2.gender}, {p2.age}</text>
            <line x1={cx1 + 50} y1={cy} x2={cx2 - 50} y2={cy} stroke="#E91E63" strokeWidth={4} />
            </g>
          );
      } else if (node.data.isPerson) {
        const p = node.data.person;
        const cx = node.x + offsetX;
        const cy = node.y + offsetY;
          return (
          <g key={i}>
            <rect x={cx - 50} y={cy - 30} width={100} height={60} rx={16} fill={p.gender === 'M' ? '#2196F3' : p.gender === 'F' ? '#E91E63' : '#9C27B0'} stroke="#333" strokeWidth={2} />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#fff">{p.name}</text>
            <text x={cx} y={cy + 15} textAnchor="middle" fontSize={12} fill="#fff">{p.gender}, {p.age}</text>
            </g>
          );
      } else {
        const cx = node.x + offsetX;
        const cy = node.y + offsetY;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={30} fill="#9C27B0" stroke="#333" strokeWidth={2} />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#fff">{node.data.name}</text>
          </g>
        );
      }
    });
    return (
      <svg ref={svgRef} width={width} height={height} style={{ background: '#f8f9fa', borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
        {svgLinks}
        {svgNodes}
      </svg>
    );
  }

  if (loading) {
    return <div style={{textAlign: 'center', padding: '40px'}}><h3>Loading family tree...</h3></div>;
  }
  if (error) {
    return <div style={{textAlign: 'center', padding: '40px'}}><h3 style={{color: 'red'}}>Error: {error}</h3></div>;
  }

  const root = buildGenealogyTree(members, relationships);

  return (
    <div style={{ width: '100%', height: '80vh', background: '#f8f9fa', borderRadius: 12, boxShadow: '0 2px 12px #0001', margin: '40px auto', maxWidth: 1600, position: 'relative' }}>
      <h2 style={{textAlign: 'center', marginBottom: '20px', paddingTop: '20px', color: '#1976d2'}}>Family Tree Visualization</h2>
      {renderFlextree(root)}
      <div style={{textAlign: 'center', marginTop: 20, color: '#666'}}>
        <b>Legend:</b> <span style={{color:'#E91E63'}}>Pink</span>=Female, <span style={{color:'#2196F3'}}>Blue</span>=Male, <span style={{color:'#9C27B0'}}>Purple</span>=Other<br/>
        <span style={{color:'#E91E63'}}>Pink line</span>=Marriage, <span style={{color:'#1976d2'}}>Blue line</span>=Parent-Child
      </div>
    </div>
  );
}

export default TreeView; 