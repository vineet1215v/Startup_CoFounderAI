import React from 'react'
import { motion } from 'framer-motion'

const Documents = () => {
  const documents = [
    { name: 'Business Model Canvas', type: 'PDF', date: '2024-12-01', size: '2.1 MB' },
    { name: 'Market Research Report', type: 'PDF', date: '2024-11-28', size: '8.4 MB' },
    { name: 'Tech Stack Recommendation', type: 'DOCX', date: '2024-11-25', size: '1.2 MB' },
    { name: 'Financial Model v1.2', type: 'XLSX', date: '2024-11-20', size: '45 KB' },
    { name: 'Pitch Deck - Dec 2024', type: 'PPTX', date: '2024-12-05', size: '3.8 MB' },
  ]

  const downloadDoc = (name) => {
    console.log(`Download ${name}`)
    // TODO: API call or blob download
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-view-documents">
      <div className="view-header">
        <div>
          <h2 className="view-title">AI Generated Documents</h2>
          <p className="view-desc">Download all reports, canvases, and assets created by your AI team.</p>
        </div>
        <div className="header-actions">
          <button className="exec-btn" style={{ width: 'auto' }} onClick={() => console.log('Regenerate all docs')}>
            🔄 Regenerate All
          </button>
        </div>
      </div>

      <div className="dash-card glass">
        <div className="dash-card-header">
          <div className="dash-card-title">Document Library</div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            {documents.map((doc, idx) => (
              <motion.div 
                key={idx} 
                className="doc-item glass" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                whileHover={{ scale: 1.02 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="doc-icon">📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{doc.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {doc.type} • {doc.date} • {doc.size}
                    </div>
                  </div>
                  <button 
                    className="control-btn" 
                    onClick={() => downloadDoc(doc.name)}
                    style={{ padding: '8px 16px' }}
                  >
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Documents

