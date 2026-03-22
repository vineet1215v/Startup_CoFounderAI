import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

const MSGS = [
  { agent: 'mkt', av: 'MK', bg: 'linear-gradient(135deg,#d97706,#fbbf24)', name: 'Maya', role: 'Marketing', delay: 700, tone: 'insight', text: "Market timing looks strong here — demand in this category has been growing steadily. That said, I count at least 3 well-funded competitors. We need a razor-sharp positioning angle before spending a dollar on acquisition." },
  { agent: 'tech', av: 'TC', bg: 'linear-gradient(135deg,#2563eb,#60a5fa)', name: 'Tariq', role: 'Technical Lead', delay: 2300, tone: '', text: "Technically, this is very buildable with current tooling. A production-ready MVP in 10–12 weeks is realistic with 3 engineers. My flag: scalability architecture past 10k concurrent users needs to be decided upfront, not retrofitted." },
  { agent: 'fin', av: 'FN', bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)', name: 'Felix', role: 'Finance', delay: 4000, tone: 'debate', text: "Tariq, I need to pressure-test that timeline. 3 senior engineers for 12 weeks is $90–120k burn before a single dollar in. What's the pre-seed assumption? Because the unit economics only work if we raise $600k+ and hit 500 paying users by month 9." },
  { agent: 'prod', av: 'PD', bg: 'linear-gradient(135deg,#059669,#34d399)', name: 'Priya', role: 'Product', delay: 5600, tone: 'agree', text: "Felix is right to push back on scope. I'd argue for a stripped V1 — just the core loop, nothing more. That forces us to validate the real value prop before over-engineering. I'd rather talk to 50 real users than build for hypothetical ones." },
  { agent: 'tech', av: 'TC', bg: 'linear-gradient(135deg,#2563eb,#60a5fa)', name: 'Tariq', role: 'Technical Lead', delay: 7100, tone: 'debate', text: "Priya, agreed in principle — but there's a difference between lean and fragile. If we cut architectural corners now, we'll spend 3x rebuilding in month 7. I'd propose: minimal features, but no shortcuts on the infrastructure skeleton." },
  { agent: 'ops', av: 'OM', bg: 'linear-gradient(135deg,#dc2626,#f87171)', name: 'Omar', role: 'Operations', delay: 8600, tone: '', text: "While you all debate build scope — has anyone mapped operational dependencies? Payment processor, legal/compliance, customer support infrastructure. These quietly eat 15–20% of runway if not planned early. We need a dependency matrix before the deck goes out." },
  { agent: 'mkt', av: 'MK', bg: 'linear-gradient(135deg,#d97706,#fbbf24)', name: 'Maya', role: 'Marketing', delay: 10100, tone: 'insight', text: "Omar's point is critical. Decks die in due diligence because ops wasn't mapped. On GTM — we also need a channel thesis, not just a strategy. PLG or top-down sales? That decision determines who we hire first." },
  { agent: 'fin', av: 'FN', bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)', name: 'Felix', role: 'Finance', delay: 11600, tone: 'agree', text: "Updated numbers with phased build + 18-month runway target: raise $650k pre-seed, 3-person founding team, 500 paying users by month 9. Unit economics clear at that point. It's tight but achievable if we execute on positioning." },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('boardroom')
  const [ideaInput, setIdeaInput] = useState('')
  const [currentIdea, setCurrentIdea] = useState('Enter your startup idea below to begin')
  const [messages, setMessages] = useState([])
  const [showConsensus, setShowConsensus] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [discussionPhase, setDiscussionPhase] = useState('Idle')
  const [sessionId, setSessionId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const discussionRef = useRef(null)
  const socketRef = useRef(null)

  const [agentStates, setAgentStates] = useState({
    tech: { state: 'Waiting for idea', ind: 'status-idle' },
    mkt: { state: 'Waiting for idea', ind: 'status-idle' },
    fin: { state: 'Waiting for idea', ind: 'status-idle' },
    prod: { state: 'Waiting for idea', ind: 'status-idle' },
    ops: { state: 'Waiting for idea', ind: 'status-idle' },
    ceo: { state: 'Waiting for idea', ind: 'status-idle' },
  })

  const [verdict, setVerdict] = useState({ market: '—', tech: '—', finance: '—' })
  const [vaultIdeas, setVaultIdeas] = useState([])
  const [globalTasks, setGlobalTasks] = useState([])
  const [vaultStats, setVaultStats] = useState({ analyzed: 0, validated: 0, archived: 0 })

  // Connect to Boardroom WebSocket
  useEffect(() => {
    let isMounted = true
    let reconnectTimer = null

    const connect = () => {
      console.log('--- Establishing Boardroom Neural Link ---')
      const ws = new WebSocket('ws://127.0.0.1:8080/ws/boardroom')
      socketRef.current = ws

      ws.onopen = () => {
        console.log('--- Boardroom Neural Link Established ---')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        console.log('Neural Signal:', msg)

        if (msg.type === 'SESSION_READY') {
          setSessionId(msg.session_id)
          if (msg.history && msg.history.length > 0) {
            const formattedHistory = msg.history.map(item => {
              const roleKey = item.role.toLowerCase() === 'cpo' ? 'prod' : 
                              item.role.toLowerCase() === 'coo' ? 'ops' : 
                              item.role.toLowerCase() === 'founder' ? 'founder' :
                              item.role.toLowerCase()
              
              return {
                agent: roleKey,
                av: (item.role || '??').substring(0, 2).toUpperCase(),
                name: item.agent_name || 'Founder',
                role: item.role,
                text: item.content,
                type: item.message_type || 'AGENT_ANALYSIS',
                bg: roleKey === 'founder' ? 'linear-gradient(135deg,#6b7280,#9ca3af)' : undefined
              }
            })
            setMessages(formattedHistory)
          }
        } else if (msg.type === 'IDEA_PROPOSED') {
          setMessages(prev => [...prev, {
            agent: 'founder',
            av: 'F',
            bg: 'linear-gradient(135deg,#6b7280,#9ca3af)',
            name: 'Founder',
            role: 'Idea Origin',
            text: msg.data,
            type: 'IDEA_PROPOSED'
          }])
        } else if (msg.type === 'AGENT_ANALYSIS' || msg.type === 'AGENT_CHALLENGE' || msg.type === 'RISK_ALERT') {
          const agentData = msg.data
          const roleKey = agentData.role.toLowerCase() === 'cpo' ? 'prod' : 
                          agentData.role.toLowerCase() === 'coo' ? 'ops' : 
                          agentData.role.toLowerCase()

          setAgentStates(prev => ({
            ...prev,
            [roleKey]: { state: 'Speaking...', ind: 'status-active' }
          }))

          setMessages(prev => [...prev, {
            agent: roleKey,
            av: agentData.role.substring(0, 2).toUpperCase(),
            name: agentData.agent_name,
            role: agentData.role,
            text: agentData.content,
            type: msg.type
          }])

          setTimeout(() => {
            setAgentStates(prev => ({
              ...prev,
              [roleKey]: { state: 'Listening', ind: 'status-idle' }
            }))
          }, 3000)

        } else if (msg.type === 'CONSENSUS_SIGNAL') {
          const consensus = msg.metadata?.consensus
          if (consensus) {
            setDiscussionPhase('Consensus')
            setVerdict({
              market: (consensus.aggregate_confidence * 10).toFixed(1),
              tech: (consensus.aggregate_confidence * 9.5).toFixed(1),
              finance: (consensus.aggregate_confidence * 9.2).toFixed(1)
            })
            setShowConsensus(true)
          }
        } else if (msg.type === 'STATUS_UPDATE') {
          const textValue = typeof msg.data === 'string' ? msg.data : msg.data?.content || JSON.stringify(msg.data)
          setDiscussionPhase(textValue.includes('Boardroom initialized') ? 'Market Analysis' : 'Synthesizing')
          setMessages(prev => [...prev, {
            agent: 'ceo', // Using CEO as placeholder for moderator visibility
            av: 'B',
            bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            name: 'CoFounder Brain',
            role: 'System',
            text: textValue,
            type: 'STATUS_UPDATE'
          }])
        }
      }

      ws.onclose = () => {
        console.warn('--- Boardroom Neural Link Severed. Retrying in 3s ---')
        setIsConnected(false)
        if (isMounted) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = (err) => {
        console.error('Boardroom Neural Error:', err)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (socketRef.current) socketRef.current.close()
    }
  }, [])

  const startSession = () => {
    const trimmed = ideaInput.trim()
    const socket = socketRef.current
    if (!trimmed || !socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("🚫 Boardroom not ready for transmission.")
      return
    }
    
    setCurrentIdea(trimmed)
    setIdeaInput('')
    setMessages([])
    setShowConsensus(false)
    setVerdict({ market: '—', tech: '—', finance: '—' })
    setDiscussionPhase('Analyzing')

    // Reset agent states to thinking
    const thinkingStates = {}
    Object.keys(agentStates).forEach(k => {
      thinkingStates[k] = { state: 'Analyzing...', ind: 'status-thinking' }
    })
    setAgentStates(thinkingStates)

    // Send idea to backend
    socketRef.current.send(JSON.stringify({
      type: 'PROPOSE_IDEA',
      payload: trimmed,
      session_id: sessionId
    }))
  }

  useEffect(() => {
    if (discussionRef.current) {
      discussionRef.current.scrollTop = discussionRef.current.scrollHeight
    }
  }, [messages])

  // Fetch Vault Data
  useEffect(() => {
    if (currentView === 'ideas') {
      fetch('http://localhost:8080/api/vault/summary')
        .then(res => res.json())
        .then(data => {
          setVaultIdeas(data)
          // Calculate stats
          const analyzed = data.length
          const validated = data.filter(i => i.status === 'validated').length
          const archived = data.filter(i => i.status === 'archived').length
          setVaultStats({ analyzed, validated, archived })
        })
        .catch(err => console.error('Vault Fetch Error:', err))
    }
  }, [currentView])

  // Fetch Global Tasks
  useEffect(() => {
    if (currentView === 'tasks') {
      fetch('http://localhost:8080/api/tasks/global')
        .then(res => res.json())
        .then(data => setGlobalTasks(data))
        .catch(err => console.error('Tasks Fetch Error:', err))
    }
  }, [currentView])

  const handleKeyDown = (e) => { if (e.key === 'Enter') startSession() }
  const switchView = (v) => setCurrentView(v)
  const handleLogout = () => navigate('/')

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className={`dash-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">CoFounder AI</div>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Session</div>
          <button className={`sidebar-item ${currentView === 'boardroom' ? 'active' : ''}`} onClick={() => switchView('boardroom')}>
            <span className="sidebar-icon">⬡</span>
            <span className="sidebar-item-text">Boardroom</span>
          </button>
          <button className={`sidebar-item ${currentView === 'ideas' ? 'active' : ''}`} onClick={() => switchView('ideas')}>
            <span className="sidebar-icon">💡</span>
            <span className="sidebar-item-text">Idea Vault</span>
          </button>
          <button className={`sidebar-item ${currentView === 'tasks' ? 'active' : ''}`} onClick={() => switchView('tasks')}>
            <span className="sidebar-icon">✅</span>
            <span className="sidebar-item-text">Tasks</span>
          </button>
          <button className={`sidebar-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => switchView('history')}>
            <span className="sidebar-icon">◷</span>
            <span className="sidebar-item-text">Session History</span>
          </button>

          <div className="sidebar-section-label" style={{ marginTop: '12px' }}>My Startup</div>
          <button className={`sidebar-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => switchView('profile')}>
            <span className="sidebar-icon">🏢</span>
            <span className="sidebar-item-text">Company Profile</span>
          </button>
          <button className={`sidebar-item ${currentView === 'documents' ? 'active' : ''}`} onClick={() => switchView('documents')}>
            <span className="sidebar-icon">📑</span>
            <span className="sidebar-item-text">Documents</span>
          </button>
          <button className={`sidebar-item ${currentView === 'okrs' ? 'active' : ''}`} onClick={() => switchView('okrs')}>
            <span className="sidebar-icon">🎯</span>
            <span className="sidebar-item-text">OKRs & Goals</span>
          </button>
          <button className={`sidebar-item ${currentView === 'pipeline' ? 'active' : ''}`} onClick={() => switchView('pipeline')}>
            <span className="sidebar-icon">💼</span>
            <span className="sidebar-item-text">Investor Pipeline</span>
          </button>

          <div className="sidebar-section-label" style={{ marginTop: '12px' }}>Account</div>
          <button className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => switchView('settings')}>
            <span className="sidebar-icon">◉</span>
            <span className="sidebar-item-text">Settings</span>
          </button>
          <button className="sidebar-item" onClick={handleLogout}>
            <span className="sidebar-icon">↩</span>
            <span className="sidebar-item-text">Log out</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="dash-main">
        <div className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div className="topbar-title">
                {currentView === 'boardroom' ? 'Boardroom' : 
                 currentView === 'ideas' ? 'Idea Vault' : 
                 currentView === 'tasks' ? 'Action Items' : 
                 currentView === 'history' ? 'Session History' : 
                 currentView === 'profile' ? 'Company Profile' : 
                 currentView === 'documents' ? 'Documents' : 
                 currentView === 'okrs' ? 'OKRs & Goals' : 
                 currentView === 'pipeline' ? 'Investor Pipeline' : 
                 'Settings'}
              </div>
              <div className="topbar-sub">
                {currentView === 'boardroom' ? 'AI agents are ready to analyze your idea' : 
                 currentView === 'ideas' ? 'All your startup ideas and their analysis status' : 
                 currentView === 'tasks' ? 'Tasks extracted from your recent boardroom sessions' : 
                 currentView === 'history' ? 'Revisit and replay your previous AI discussions' : 
                 currentView === 'profile' ? 'Manage your startup identity and core data' : 
                 currentView === 'documents' ? 'Access all AI-generated assets and documents' : 
                 currentView === 'okrs' ? 'Track progress toward your strategic business goals' : 
                 currentView === 'pipeline' ? 'Manage fundraising rounds and investor outreach' : 
                 'Configure your platform experience'}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="dash-notif">🔔</div>
            <div className="dash-user">AC</div>
          </div>
        </div>

        <div className="dash-content">
          {currentView === 'boardroom' && (
            <motion.div className="boardroom-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="main-col">
                <motion.div className="dash-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="dash-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="dash-card-title">Live Session</div>
                      <div className="live-badge"><div className="live-dot"></div>LIVE</div>
                    </div>
                    <div className="boardroom-controls">
                      <button className="control-btn"><span className="control-icon">↻</span> Restart</button>
                      <button className="control-btn export-btn"><span className="control-icon">↓</span> Export Log</button>
                    </div>
                  </div>
                  <div className="phase-tracker">
                    <div className={`phase-step ${discussionPhase === 'Market Analysis' ? 'active' : ''} ${['Tech Review', 'Financials', 'Consensus'].includes(discussionPhase) ? 'completed' : ''}`}>1. Market</div>
                    <div className={`phase-line ${['Tech Review', 'Financials', 'Consensus'].includes(discussionPhase) ? 'filled' : ''}`}></div>
                    <div className={`phase-step ${discussionPhase === 'Tech Review' ? 'active' : ''} ${['Financials', 'Consensus'].includes(discussionPhase) ? 'completed' : ''}`}>2. Tech</div>
                    <div className={`phase-line ${['Financials', 'Consensus'].includes(discussionPhase) ? 'filled' : ''}`}></div>
                    <div className={`phase-step ${discussionPhase === 'Financials' ? 'active' : ''} ${['Consensus'].includes(discussionPhase) ? 'completed' : ''}`}>3. Finance</div>
                    <div className={`phase-line ${discussionPhase === 'Consensus' ? 'filled' : ''}`}></div>
                    <div className={`phase-step ${discussionPhase === 'Consensus' ? 'active pulse' : ''}`}>4. Consensus</div>
                  </div>
                  <div className="discussion-area" ref={discussionRef}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                        Your AI boardroom is ready.<br />
                        <span style={{ color: 'rgba(255,255,255,0.65)' }}>Type your startup idea below and press Enter.</span>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <div className="chat-msg" key={i}>
                          <div className="chat-av" style={{ background: m.bg }}>{m.av}</div>
                          <div className="chat-body">
                            <div className="chat-meta">
                              <span className="chat-name">{m.name}</span>
                              <span className="chat-role">{m.role}</span>
                              <span className="chat-time">Now</span>
                            </div>
                            <div className={`chat-bubble ${m.tone}`}>
                              {m.text}
                              <div className="chat-actions">
                                <button className="chat-action-btn" title="Agree">👍</button>
                                <button className="chat-action-btn" title="Elaborate">🔍 Elaborate</button>
                                <button className="chat-action-btn" title="Counter argument">⚡ Counter</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="input-wrap">
                    {messages.length > 0 && !showConsensus && (
                      <div className="quick-prompts">
                        <button className="prompt-chip">Pivot to B2B</button>
                        <button className="prompt-chip">Charge $99/mo</button>
                        <button className="prompt-chip">Detail the tech stack</button>
                      </div>
                    )}
                    <div className="input-row">
                      <button className="attach-btn" title="Upload pitch">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      </button>
                      <input className="boardroom-input" placeholder={messages.length === 0 ? "Describe your startup idea..." : "Reply to the team..."} value={ideaInput} onChange={(e) => setIdeaInput(e.target.value)} onKeyDown={handleKeyDown} />
                      <button className="send-btn" onClick={startSession}>→</button>
                    </div>
                    <div className="input-footer">
                      <div className="footer-setting"><div className="setting-toggle active"></div> Deep Analysis Mode</div>
                      <div className="footer-setting"><span style={{ color: '#a78bfa' }}>Web Search: ON</span></div>
                      <div className="footer-setting" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}><span className="kb-shortcut">Enter</span> to send</div>
                    </div>
                  </div>
                </motion.div>

                {/* Extracted Action Items */}
                {messages.length > 2 && (
                  <motion.div className="dash-card glass action-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="dash-card-header" style={{ padding: '14px 20px' }}>
                      <div className="dash-card-title">Extracted Action Items</div>
                      <button className="control-btn" style={{ padding: '4px 8px', fontSize: '11px' }}>Sync to Linear</button>
                    </div>
                    <div className="panel-body" style={{ overflowY: 'auto', padding: '12px 20px' }}>
                      <div className="action-row">
                        <input type="checkbox" className="action-check" />
                        <div style={{ flex: 1 }}>Define technical architecture scaling up to 10k users.</div>
                        <div className="action-tag tech">TC (Tech)</div>
                      </div>
                      <div className="action-row">
                        <input type="checkbox" className="action-check" />
                        <div style={{ flex: 1 }}>Build detailed target profile and acquisition thesis.</div>
                        <div className="action-tag mkt">MK (Mktg)</div>
                      </div>
                      {messages.length > 5 && (
                        <div className="action-row">
                          <input type="checkbox" className="action-check" />
                          <div style={{ flex: 1 }}>Map legal & compliance dependencies.</div>
                          <div className="action-tag ops">OM (Ops)</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="panels-col">
                <motion.div className="dash-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <div className="dash-card-header" style={{ padding: '14px 20px', fontSize: '14px' }}>Agent Status <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>real-time</span></div>
                  <div className="panel-body">
                    <div className="status-row">
                      <div className="agent-av" style={{ background: 'linear-gradient(135deg,#2563eb,#60a5fa)' }}>TC</div>
                      <div className="status-info"><div className="status-name">Tariq</div><div className="status-state">{agentStates.tech.state}</div></div>
                      <div className={`agent-status ${agentStates.tech.ind}`}></div>
                    </div>
                    <div className="status-row">
                      <div className="agent-av" style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}>MK</div>
                      <div className="status-info"><div className="status-name">Maya</div><div className="status-state">{agentStates.mkt.state}</div></div>
                      <div className={`agent-status ${agentStates.mkt.ind}`}></div>
                    </div>
                    <div className="status-row">
                      <div className="agent-av" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>FN</div>
                      <div className="status-info"><div className="status-name">Felix</div><div className="status-state">{agentStates.fin.state}</div></div>
                      <div className={`agent-status ${agentStates.fin.ind}`}></div>
                    </div>
                    <div className="status-row">
                      <div className="agent-av" style={{ background: 'linear-gradient(135deg,#059669,#34d399)' }}>PD</div>
                      <div className="status-info"><div className="status-name">Priya</div><div className="status-state">{agentStates.prod.state}</div></div>
                      <div className={`agent-status ${agentStates.prod.ind}`}></div>
                    </div>
                    <div className="status-row">
                      <div className="agent-av" style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)' }}>OM</div>
                      <div className="status-info"><div className="status-name">Omar</div><div className="status-state">{agentStates.ops.state}</div></div>
                      <div className={`agent-status ${agentStates.ops.ind}`}></div>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="dash-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <div className="dash-card-header" style={{ padding: '14px 20px', fontSize: '14px' }}>Verdict</div>
                  <div className="panel-body">
                    <div className="verdict-mini">
                       <div className="verdict-mini-card"><div className="verdict-label">Market</div><div className="verdict-val" style={{ color: verdict.market !== '—' ? '#4ade80' : 'var(--text-muted)' }}>{verdict.market}</div></div>
                       <div className="verdict-mini-card"><div className="verdict-label">Tech</div><div className="verdict-val" style={{ color: verdict.tech !== '—' ? '#60a5fa' : 'var(--text-muted)' }}>{verdict.tech}</div></div>
                       <div className="verdict-mini-card"><div className="verdict-label">Finance</div><div className="verdict-val" style={{ color: verdict.finance !== '—' ? '#fbbf24' : 'var(--text-muted)' }}>{verdict.finance}</div></div>
                    </div>
                    {showConsensus && (
                      <div className="consensus-banner show">
                        <div className="consensus-title">Consensus reached</div>
                        <div className="consensus-text">Team consensus: high-potential idea with manageable risk. Recommended raise: $650k pre-seed. Phase the build.</div>
                        <button className="exec-btn">Enter Execution Mode →</button>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div className="dash-card glass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <div className="dash-card-header" style={{ padding: '14px 20px', fontSize: '14px' }}>Market Intelligence</div>
                  <div className="panel-body">
                    <div className="insight-metric">
                      <div className="insight-label"><span>Trend Receptivity</span> <span style={{ color: '#4ade80' }}>High (84%)</span></div>
                      <div className="insight-bar-wrap"><div className="insight-bar" style={{ width: '84%', background: 'linear-gradient(90deg, #22c55e, #4ade80)' }}></div></div>
                    </div>
                    <div className="insight-metric">
                      <div className="insight-label"><span>Competitive Saturation</span> <span style={{ color: '#fbbf24' }}>Medium (62%)</span></div>
                      <div className="insight-bar-wrap"><div className="insight-bar" style={{ width: '62%', background: 'linear-gradient(90deg, #d97706, #fbbf24)' }}></div></div>
                    </div>
                    <div className="insight-metric">
                      <div className="insight-label"><span>Regulatory Risk</span> <span style={{ color: '#f87171' }}>Elevated (45%)</span></div>
                      <div className="insight-bar-wrap"><div className="insight-bar" style={{ width: '45%', background: 'linear-gradient(90deg, #dc2626, #f87171)' }}></div></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {currentView === 'ideas' && (
            <motion.div className="dash-view-ideas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="view-header">
                <div>
                  <h2 className="view-title">Idea Vault</h2>
                  <p className="view-desc">Centralized intelligence for all your conceptualized startup ideas.</p>
                </div>
                <div className="header-actions">
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}>+ New Strategy Session</button>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="dash-card glass stat-card">
                  <div className="stat-glow" style={{ background: 'rgba(139, 92, 246, 0.2)' }}></div>
                  <div className="stat-label">Analyzed Ideas</div>
                  <div className="stat-value">{vaultStats.analyzed}</div>
                  <div className="stat-change">+0 this month</div>
                </div>
                <div className="dash-card glass stat-card">
                   <div className="stat-glow" style={{ background: 'rgba(34, 197, 94, 0.2)' }}></div>
                  <div className="stat-label">Validated MVP</div>
                  <div className="stat-value">{vaultStats.validated}</div>
                  <div className="stat-change" style={{ color: '#4ade80' }}>
                    {vaultStats.analyzed > 0 ? ((vaultStats.validated / vaultStats.analyzed) * 100).toFixed(0) : 0}% conversion
                  </div>
                </div>
                <div className="dash-card glass stat-card">
                   <div className="stat-glow" style={{ background: 'rgba(239, 68, 68, 0.2)' }}></div>
                  <div className="stat-label">Drafts</div>
                  <div className="stat-value">{vaultIdeas.filter(i => i.status === 'draft').length}</div>
                  <div className="stat-change" style={{ color: '#94a3b8' }}>Session pending</div>
                </div>
              </div>

              <div className="table-controls">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input type="text" className="search-input" placeholder="Search ideas, industries, or keywords..." />
                </div>
                <div className="filter-group">
                  <button className="filter-btn active">All</button>
                  <button className="filter-btn">Validated</button>
                  <button className="filter-btn">Analyzing</button>
                  <button className="filter-btn">Draft</button>
                </div>
              </div>

              <div className="dash-card glass ideas-table">
                <div className="dash-card-header">
                  <div className="dash-card-title">Strategy Archive</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sorted by latest activity</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Startup Concept</th>
                      <th>Verdict</th>
                      <th>Agents</th>
                      <th>Status</th>
                      <th>Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaultIdeas.map((idea, idx) => (
                      <motion.tr 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="vault-row"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      >
                        <td style={{ padding: '24px', position: 'relative' }}>
                          <div style={{ fontWeight: 600, fontSize: '14.5px', color: '#fff', letterSpacing: '-0.01em' }}>{idea.title}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {idea.context || 'Strategic deep-dive session'}
                          </div>
                        </td>
                        <td style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`score-badge ${idea.verdict > 7.5 ? 'high' : idea.verdict > 5 ? 'mid' : 'low'}`}>
                              {idea.verdict ? idea.verdict.toFixed(1) : '—'}
                            </span>
                            {idea.verdict && (
                              <div className="verdict-trend" style={{ fontSize: '10px', color: '#4ade80' }}>
                                ↑ {Math.floor(Math.random() * 5 + 2)}%
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '24px' }}>
                          <div className="agent-avatar-stack">
                            {idea.agents && idea.agents.map((role, i) => (
                              <div key={i} className="mini-av" title={role} style={{ 
                                background: role === 'CEO' ? '#7c3aed' : role === 'CTO' ? '#2563eb' : '#059669',
                                border: '2px solid #111'
                              }}>
                                {role.substring(0, 1).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '24px' }}>
                          <span className={`status-pill ${idea.status}`} style={{ 
                            padding: '6px 12px', 
                            fontSize: '10px', 
                            letterSpacing: '0.04em',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {idea.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                          {new Date(idea.activity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn" title="Open Analysis">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {currentView === 'tasks' && (
            <motion.div className="dash-view-tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="view-header">
                <div>
                  <h2 className="view-title">Discovery Board</h2>
                  <p className="view-desc">Track execution status for actions from your sessions.</p>
                </div>
                <div className="header-actions">
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}>+ New Column</button>
                </div>
              </div>

              <div className="kanban-board">
                <div className="kanban-col">
                  <div className="kanban-col-header">To Do <span className="col-count">{globalTasks.filter(t => t.status === 'queued').length}</span></div>
                  <div className="kanban-list" style={{ minHeight: '300px' }}>
                    {globalTasks.filter(t => t.status === 'queued').map((task, i) => (
                      <motion.div key={i} className="task-card glass" whileHover={{ y: -4 }}>
                        <div className="task-priority mid"></div>
                        <div className="task-idea">{task.session_title}</div>
                        <div className="task-title">{task.title}</div>
                        <div className="task-footer">
                          <div className="mini-av">{task.owner_role.substring(0, 2)}</div>
                          <div className="task-time">Pending</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="kanban-col">
                  <div className="kanban-col-header">In Progress <span className="col-count">{globalTasks.filter(t => t.status === 'active').length}</span></div>
                  <div className="kanban-list" style={{ minHeight: '300px' }}>
                    {globalTasks.filter(t => t.status === 'active').map((task, i) => (
                      <motion.div key={i} className="task-card glass active" whileHover={{ y: -4 }}>
                        <div className="task-priority high"></div>
                        <div className="task-idea">{task.session_title}</div>
                        <div className="task-title">{task.title}</div>
                        <div className="task-footer">
                          <div className="mini-av">{task.owner_role.substring(0, 2)}</div>
                          <div className="task-active-label">Sprinting</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="kanban-col">
                  <div className="kanban-col-header">Completed <span className="col-count">{globalTasks.filter(t => t.status === 'completed').length}</span></div>
                  <div className="kanban-list" style={{ minHeight: '300px' }}>
                    {globalTasks.filter(t => t.status === 'completed').map((task, i) => (
                      <motion.div key={i} className="task-card glass done" style={{ opacity: 0.6 }}>
                        <div className="task-title">{task.title}</div>
                        <div className="task-footer">
                          <div className="mini-av">{task.owner_role.substring(0, 2)}</div>
                          <div className="task-time">Done</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div className="dash-view-history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="view-header">
                <div>
                  <h2 className="view-title">Strategic Intelligence Log</h2>
                  <p className="view-desc">A complete historical timeline of your boardroom brainstorms and strategic decisions.</p>
                </div>
                <div className="header-actions">
                  <button className="icon-btn" title="Export All Logs">📥</button>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="dash-card glass stat-card">
                  <div className="stat-glow" style={{ background: 'rgba(139, 92, 246, 0.15)' }}></div>
                  <div className="stat-label">Total Brainstorms</div>
                  <div className="stat-value">48</div>
                  <div className="stat-change" style={{ color: '#4ade80' }}>+12 this week</div>
                </div>
                <div className="dash-card glass stat-card">
                  <div className="stat-glow" style={{ background: 'rgba(34, 197, 94, 0.15)' }}></div>
                  <div className="stat-label">Consensus Rate</div>
                  <div className="stat-value">72%</div>
                  <div className="stat-change">Strong Alignment</div>
                </div>
                <div className="dash-card glass stat-card">
                   <div className="stat-glow" style={{ background: 'rgba(239, 68, 68, 0.15)' }}></div>
                   <div className="stat-label">Total Insights</div>
                   <div className="stat-value">1,240</div>
                   <div className="stat-change">Extracted by Agents</div>
                </div>
              </div>

              <div className="table-controls">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input type="text" className="search-input" placeholder="Search sessions by topic or agent..." />
                </div>
                <div className="filter-group">
                  <button className="filter-btn active">All Time</button>
                  <button className="filter-btn">High Verdicts</button>
                  <button className="filter-btn">Drafts</button>
                </div>
              </div>

              <div className="dash-card glass ideas-table">
                <div className="dash-card-header">Session Archives</div>
                <table>
                  <thead>
                    <tr>
                      <th>Session Topic</th>
                      <th>Verdict</th>
                      <th>Intelligence Team</th>
                      <th>Key Takeaway</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaultIdeas.map((idea, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{idea.title}</td>
                        <td><span className={`score-badge ${idea.verdict > 7.5 ? 'high' : idea.verdict > 5 ? 'mid' : 'low'}`}>
                          {idea.verdict ? idea.verdict.toFixed(1) : '—'}
                        </span></td>
                        <td className="agent-avatar-stack">
                          {idea.agents && idea.agents.map((role, i) => (
                            <div key={i} className="mini-av" title={role}>{role.substring(0, 2).toUpperCase()}</div>
                          ))}
                        </td>
                        <td style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                          {idea.context ? (idea.context.substring(0, 60) + '...') : 'No context provided.'}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(idea.activity).toLocaleString()}
                        </td>
                        <td><button className="icon-btn" title="View Transcript">📄</button></td>
                      </tr>
                    ))}
                    {vaultIdeas.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No historical sessions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {['profile', 'documents', 'okrs', 'pipeline', 'settings'].includes(currentView) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
               {currentView.toUpperCase()} PAGE
               <p>This module is currently being finalized by the AI agents.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
