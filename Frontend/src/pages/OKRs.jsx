import React, { useState } from 'react'
import { motion } from 'framer-motion'

const OKRs = () => {
  const [okrs, setOkrs] = useState([
    { id: 1, objective: 'Launch MVP', keyResults: ['Achieve 100 signups', 'Complete core features', 'Validate PMF'], progress: 65, owner: 'Founder' },
    { id: 2, objective: 'Raise Seed Round', keyResults: ['10 investor meetings', 'Pitch deck finalized', 'Financial model validated'], progress: 30, owner: 'CEO' },
    { id: 3, objective: 'Build Team', keyResults: ['Hire CTO', 'Hire first PM', 'Establish processes'], progress: 10, owner: 'Founder' },
  ])
  const [newOKR, setNewOKR] = useState({ objective: '', keyResults: '', progress: 0 })

  const addOKR = () => {
    if (newOKR.objective.trim()) {
      setOkrs([...okrs, { id: Date.now(), ...newOKR, owner: 'Founder' }])
      setNewOKR({ objective: '', keyResults: '', progress: 0 })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-view-okrs">
      <div className="view-header">
        <div>
          <h2 className="view-title">OKRs & Goals</h2>
          <p className="view-desc">Track your quarterly objectives and measurable key results.</p>
        </div>
        <div className="header-actions">
          <button className="exec-btn" style={{ width: 'auto' }} onClick={addOKR} disabled={!newOKR.objective.trim()}>
            + Add OKR
          </button>
        </div>
      </div>

      <div className="dash-card glass">
        <div className="dash-card-header">
          <div className="dash-card-title">Q4 2024 OKRs</div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
              <input 
                placeholder="Objective (e.g. Launch MVP)" 
                value={newOKR.objective} 
                onChange={(e) => setNewOKR({...newOKR, objective: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: 'white', fontSize: '16px' }}
              />
              <textarea 
                placeholder="Key Results (one per line)" 
                value={newOKR.keyResults}
                onChange={(e) => setNewOKR({...newOKR, keyResults: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}
                rows="2"
              />
              <div style={{ marginTop: '12px' }}>
                <span>Progress:</span>
                <input 
                  type="range" min="0" max="100" 
                  value={newOKR.progress} 
                  onChange={(e) => setNewOKR({...newOKR, progress: Number(e.target.value)})}
                  style={{ marginLeft: '12px', width: '100px' }}
                />
                <span style={{ marginLeft: '8px' }}>{newOKR.progress}%</span>
              </div>
            </div>

            {okrs.map((okr) => (
              <div key={okr.id} className="glass" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{okr.objective}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Owner: {okr.owner}</div>
                </div>
                <ul style={{ margin: '12px 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
                  {okr.keyResults.map((kr, i) => (
                    <li key={i}>{kr}</li>
                  ))}
                </ul>
                <div className="progress-bar-wrap">
                  <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>Progress</span>
                    <span>{okr.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', width: `${okr.progress}%`, transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default OKRs

