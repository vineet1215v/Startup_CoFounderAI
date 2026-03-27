import React, { useState } from 'react'
import { motion } from 'framer-motion'

const Pipeline = () => {
  const [investors, setInvestors] = useState([
    { id: 1, name: 'Sequoia Capital', stage: 'Contacted', amount: '$2M', contact: 'john@sequoia.com', notes: 'AI specialist partner', lastContact: '2024-12-03' },
    { id: 2, name: 'a16z', stage: 'Meeting Scheduled', amount: '$1.5M', contact: 'sarah@a16z.com', notes: 'Strong SaaS portfolio', lastContact: '2024-12-01' },
    { id: 3, name: 'Y Combinator', stage: 'Intro Email', amount: '$500K', contact: 'demo@yc.com', notes: 'Batch S25', lastContact: '2024-11-28' },
    { id: 4, name: 'AngelList Angels', stage: 'Researching', amount: '$750K', contact: 'angels@angel.co', notes: '10+ interested', lastContact: '2024-11-25' },
  ])

  const stages = ['Researching', 'Intro Email', 'Contacted', 'Meeting Scheduled', 'Term Sheet', 'Closed Won', 'Closed Lost']

  const moveToStage = (id, stage) => {
    setInvestors(prev => prev.map(inv => inv.id === id ? {...inv, stage} : inv))
  }

  const addInvestor = () => {
    const newInvestor = {
      id: Date.now(),
      name: 'New Investor',
      stage: 'Researching',
      amount: '$1M',
      contact: 'contact@email.com',
      notes: '',
      lastContact: new Date().toISOString().split('T')[0]
    }
    setInvestors([...investors, newInvestor])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-view-pipeline">
      <div className="view-header">
        <div>
          <h2 className="view-title">Investor Pipeline</h2>
          <p className="view-desc">Track fundraising progress across your investor relationships.</p>
        </div>
        <div className="header-actions">
          <button className="exec-btn" style={{ width: 'auto' }} onClick={addInvestor}>
            + Add Investor
          </button>
        </div>
      </div>

      <div className="kanban-board pipeline-board">
        {stages.map((stage) => (
          <div key={stage} className="kanban-col">
            <div className="kanban-col-header" style={{ color: stage === 'Closed Won' ? '#10b981' : stage === 'Closed Lost' ? '#ef4444' : 'white' }}>
              {stage} 
              <span className="col-count">
                {investors.filter(i => i.stage === stage).length}
              </span>
            </div>
            <div className="kanban-list" style={{ minHeight: '400px' }}>
              {investors.filter(i => i.stage === stage).map((investor) => (
                <motion.div 
                  key={investor.id} 
                  className="task-card glass" 
                  whileHover={{ y: -4 }}
                  style={{ 
                    padding: '16px', 
                    marginBottom: '12px',
                    borderLeft: `4px solid ${stage === 'Closed Won' ? '#10b981' : stage === 'Closed Lost' ? '#ef4444' : '#6b7280'}`
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{investor.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {investor.amount} • {investor.contact}
                  </div>
                  {investor.notes && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                      {investor.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {stages.map((s) => (
                      s !== stage && (
                        <button 
                          key={s}
                          className="control-btn" 
                          style={{ padding: '4px 12px', fontSize: '11px' }}
                          onClick={() => moveToStage(investor.id, s)}
                        >
                          {s}
                        </button>
                      )
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Last contact: {investor.lastContact}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default Pipeline

