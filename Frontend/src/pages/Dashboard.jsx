import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../config/api'
// WebSocket functionality removed - now using direct API calls
// import { apiFetch, boardroomSocket } from '../config/api'
// socket.io handled by boardroomSocket() from api.js
// import socketIoClient from 'socket.io-client' // REMOVED - use boardroomSocket()
import '../styles/Dashboard.css'

// REMOVED: Static demo messages - now live streaming from Python agents

const INITIAL_AGENT_STATE = {
  tech: { state: 'Waiting for idea', ind: 'status-idle' },
  mkt: { state: 'Waiting for idea', ind: 'status-idle' },
  fin: { state: 'Waiting for idea', ind: 'status-idle' },
  prod: { state: 'Waiting for idea', ind: 'status-idle' },
  ops: { state: 'Waiting for idea', ind: 'status-idle' },
  ceo: { state: 'Waiting for idea', ind: 'status-idle' },
}

const EMPTY_VERDICT = { market: '-', tech: '-', finance: '-' }

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const founderId = user?.id || user?.email || 'default-founder'
  const [currentView, setCurrentView] = useState('boardroom')
  const [ideaInput, setIdeaInput] = useState('')
  const [currentIdea, setCurrentIdea] = useState('Enter your startup idea below to begin')
  const [messages, setMessages] = useState([])
  const [showConsensus, setShowConsensus] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [discussionPhase, setDiscussionPhase] = useState('Idle')
  const [sessionId, setSessionId] = useState(null)
  // WebSocket state removed - now using direct API calls
  // const [socket, setSocket] = useState(null)
  // const socketRef = useRef(null)

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
  const [sessionTasks, setSessionTasks] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [ideaSearch, setIdeaSearch] = useState('')
  const [ideaFilter, setIdeaFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [profileForm, setProfileForm] = useState({
    startup_name: '',
    tagline: '',
    industry: '',
    stage: 'idea',
    problem: '',
    solution: '',
    target_audience: '',
    website: '',
    fundraising_stage: '',
    team_size: 1,
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const discussionRef = useRef(null);

  const buildAgentStateMap = (state, ind) => ({
    tech: { state, ind },
    mkt: { state, ind },
    fin: { state, ind },
    prod: { state, ind },
    ops: { state, ind },
    ceo: { state, ind: ind === 'status-thinking' ? 'status-active' : ind },
  })

  const mapRoleToAgentKey = (role = '') => {
    const normalizedRole = role.toLowerCase()

    if (['cto', 'technical lead', 'tech'].includes(normalizedRole)) return 'tech'
    if (['cmo', 'marketing'].includes(normalizedRole)) return 'mkt'
    if (['cfo', 'finance'].includes(normalizedRole)) return 'fin'
    if (['cpo', 'product'].includes(normalizedRole)) return 'prod'
    if (['coo', 'operations', 'ops'].includes(normalizedRole)) return 'ops'
    if (['ceo', 'system'].includes(normalizedRole)) return 'ceo'
    if (normalizedRole === 'founder') return 'founder'

    return normalizedRole || 'ceo'
  }

  const formatHistoryItem = (item) => {
    const role = item.role || 'System'
    const roleKey = mapRoleToAgentKey(role)

    return {
      agent: roleKey,
      av: role.substring(0, 2).toUpperCase(),
      name: item.agent_name || item.agentName || role,
      role,
      text: item.content,
      type: item.message_type || item.messageType || 'AGENT_ANALYSIS',
      bg: roleKey === 'founder' ? 'linear-gradient(135deg,#6b7280,#9ca3af)' : undefined,
    }
  }

  const applySessionData = (payload) => {
    const consensus = payload.session?.consensus
    const aggregateConfidence = consensus?.aggregateConfidence ?? consensus?.aggregate_confidence

    setActiveSession(payload.session || null)
    setSessionId(payload.session?.id || null)
    setCurrentIdea(payload.session?.idea_text || payload.session?.title || 'Enter your startup idea below to begin')
    setMessages((payload.history || []).map(formatHistoryItem))
    setSessionTasks(payload.tasks || [])
    setAgentStates(buildAgentStateMap('Review complete', 'status-idle'))

    if (aggregateConfidence) {
      setVerdict({
        market: (aggregateConfidence * 10).toFixed(1),
        tech: (aggregateConfidence * 9.5).toFixed(1),
        finance: (aggregateConfidence * 9.2).toFixed(1),
      })
      setShowConsensus(true)
      setDiscussionPhase('Consensus')
    } else {
      setShowConsensus(false)
      setDiscussionPhase('Market Analysis')
    }
  }

  const handleUnauthorized = () => {
    logout()
    navigate('/login')
  }

  const resetBoardroom = () => {
    setSessionId(null)
    setActiveSession(null)
    setCurrentIdea('Enter your startup idea below to begin')
    setIdeaInput('')
    setMessages([])
    setSessionTasks([])
    setShowConsensus(false)
    setDiscussionPhase('Idle')
    setVerdict({ market: '-', tech: '-', finance: '-' })
    setAgentStates(buildAgentStateMap('Waiting for idea', 'status-idle'))
  }

  const loadSessionDetails = async (id, view = 'boardroom') => {
    const response = await apiFetch(`/api/sessions/${id}`)
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      throw new Error(data.message || 'Unable to load the selected session')
    }

    applySessionData(data)
    setCurrentView(view)
  }

  const updateTaskInState = (updatedTask) => {
    setGlobalTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    setSessionTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  const changeTaskStatus = async (taskId, status) => {
    const response = await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      throw new Error(data.message || 'Unable to update task')
    }

    updateTaskInState(data.task)
  }

  const loadCompanyProfile = async () => {
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await apiFetch('/api/company-profile')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          return
        }

        throw new Error(data.message || 'Unable to load company profile')
      }

      if (data.profile) {
        setProfileForm({
          startup_name: data.profile.startup_name || '',
          tagline: data.profile.tagline || '',
          industry: data.profile.industry || '',
          stage: data.profile.stage || 'idea',
          problem: data.profile.problem || '',
          solution: data.profile.solution || '',
          target_audience: data.profile.target_audience || '',
          website: data.profile.website || '',
          fundraising_stage: data.profile.fundraising_stage || '',
          team_size: data.profile.team_size || 1,
        })
      } else {
        setProfileForm({
          startup_name: '',
          tagline: '',
          industry: '',
          stage: 'idea',
          problem: '',
          solution: '',
          target_audience: '',
          website: '',
          fundraising_stage: '',
          team_size: 1,
        })
      }
    } catch (error) {
      console.error('Company Profile Error:', error)
      setProfileMessage(error.message || 'Unable to load company profile right now.')
    } finally {
      setProfileLoading(false)
    }
  }

  const saveCompanyProfile = async () => {
    setProfileSaving(true)
    setProfileMessage('')

    try {
      const response = await apiFetch('/api/company-profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          return
        }

        throw new Error(data.message || 'Unable to save company profile')
      }

      setProfileForm({
        startup_name: data.profile.startup_name || '',
        tagline: data.profile.tagline || '',
        industry: data.profile.industry || '',
        stage: data.profile.stage || 'idea',
        problem: data.profile.problem || '',
        solution: data.profile.solution || '',
        target_audience: data.profile.target_audience || '',
        website: data.profile.website || '',
        fundraising_stage: data.profile.fundraising_stage || '',
        team_size: data.profile.team_size || 1,
      })
      setProfileMessage('Company profile saved successfully.')
    } catch (error) {
      console.error('Company Profile Save Error:', error)
      setProfileMessage(error.message || 'Unable to save company profile right now.')
    } finally {
      setProfileSaving(false)
    }
  }

  const loadVaultSummary = async () => {
    const response = await apiFetch('/api/vault/summary')
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load vault summary')
    }

    setVaultIdeas(data)
    setVaultStats({
      analyzed: data.length,
      validated: data.filter((idea) => idea.status === 'validated').length,
      archived: data.filter((idea) => idea.status === 'archived').length,
    })
  }

  const loadGlobalTasks = async () => {
    const response = await apiFetch('/api/tasks/global')
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load tasks')
    }

    setGlobalTasks(data)
  }

  // WebSocket connection removed - now using direct API calls

  const startSession = async () => {
    const trimmed = ideaInput.trim()
    if (!trimmed) {
      console.warn("🚫 Boardroom not ready for transmission.")
      return
    }
    
    setCurrentIdea(trimmed)
    setIdeaInput('')
    setMessages([])
    setShowConsensus(false)
    setVerdict({ market: '—', tech: '—', finance: '—' })
    setDiscussionPhase('Analyzing')

    setAgentStates(buildAgentStateMap('Analyzing with AI...', 'status-thinking'))

    try {
      const response = await apiFetch('/api/boardroom/analyze-idea', {
        method: 'POST',
        body: JSON.stringify({ 
          ideaText: trimmed,
          founder_id: founderId
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          return
        }
        throw new Error(data.message || 'Unable to analyze idea')
      }

      // Analysis complete - show results
      setSessionId(data.session.id)
      applySessionData(data)
      setGlobalTasks(data.tasks || [])
      setDiscussionPhase('Complete')
      setAgentStates(buildAgentStateMap('Analysis complete', 'status-idle'))
    } catch (error) {
      console.error('Analysis Error:', error)
      setDiscussionPhase('Idle')
      setAgentStates(buildAgentStateMap('Analysis failed', 'status-idle'))
    }
  }

  // Live WebSocket connection for real-time agent streaming - REMOVED
  // useEffect(() => {
  //   connectBoardroomSocket()
  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.disconnect()
  //     }
  //   }
  // }, [connectBoardroomSocket])

  useEffect(() => {
    if (discussionRef.current) {
      discussionRef.current.scrollTop = discussionRef.current.scrollHeight
    }
  }, [messages])

  // Fetch Vault Data
  useEffect(() => {
    if (currentView === 'ideas' || currentView === 'history' || currentView === 'settings') {
      loadVaultSummary().catch((error) => {
        console.error('Vault Fetch Error:', error)
      })
    }
  }, [currentView])

  // Fetch Global Tasks
  useEffect(() => {
    if (currentView === 'tasks' || currentView === 'settings') {
      loadGlobalTasks().catch((error) => {
        console.error('Tasks Fetch Error:', error)
      })
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === 'profile') {
      loadCompanyProfile()
    }
  }, [currentView])

  const filteredVaultIdeas = vaultIdeas.filter((idea) => {
    const search = ideaSearch.trim().toLowerCase()
    const matchesSearch =
      !search ||
      idea.title.toLowerCase().includes(search) ||
      (idea.context || '').toLowerCase().includes(search) ||
      (idea.agents || []).some((role) => role.toLowerCase().includes(search))

    const matchesFilter = ideaFilter === 'all' || idea.status === ideaFilter
    return matchesSearch && matchesFilter
  })

  const filteredHistoryIdeas = vaultIdeas.filter((idea) => {
    const search = historySearch.trim().toLowerCase()
    const matchesSearch =
      !search ||
      idea.title.toLowerCase().includes(search) ||
      (idea.context || '').toLowerCase().includes(search) ||
      (idea.agents || []).some((role) => role.toLowerCase().includes(search))

    const matchesFilter =
      historyFilter === 'all' ||
      (historyFilter === 'high' && (idea.verdict || 0) >= 7.5) ||
      (historyFilter === 'draft' && idea.status === 'draft')

    return matchesSearch && matchesFilter
  })

  const historyConsensusRate = vaultIdeas.length > 0
    ? `${Math.round((vaultIdeas.filter((idea) => idea.status === 'validated').length / vaultIdeas.length) * 100)}%`
    : '0%'

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const openIdeaSession = (id, view = 'boardroom') => {
    loadSessionDetails(id, view).catch((error) => {
      console.error('Load Session Error:', error)
    })
  }

  const exportCurrentTranscript = async () => {
    const transcript = messages.length > 0
      ? messages.map((message) => `${message.name} (${message.role}): ${message.text}`).join('\n\n')
      : vaultIdeas.map((idea) => `${idea.title} | ${idea.status} | ${idea.verdict ?? 'n/a'}\n${idea.context || ''}`).join('\n\n')

    if (!transcript.trim()) {
      return
    }

    try {
      await navigator.clipboard.writeText(transcript)
    } catch (error) {
      console.error('Transcript Export Error:', error)
    }
  }

  const updateTaskStatus = (taskId, status) => {
    changeTaskStatus(taskId, status).catch((error) => {
      console.error('Task Update Error:', error)
    })
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') startSession() }
  const switchView = (v) => setCurrentView(v)
  const handleLogout = () => {
    logout()
    navigate('/')
  }

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
            <div className="dash-user">{user?.name ? user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'CF'}</div>
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
                      <button className="control-btn" onClick={resetBoardroom}><span className="control-icon">↻</span> Restart</button>
                      <button className="control-btn export-btn" onClick={exportCurrentTranscript}><span className="control-icon">↓</span> Export Log</button>
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
                                <button className="chat-action-btn" title="Agree" onClick={() => setIdeaInput(`I agree with ${m.name}. Turn that into a concrete next step.`)}>👍</button>
                                <button className="chat-action-btn" title="Elaborate" onClick={() => setIdeaInput(`Elaborate on ${m.name}'s point and make it more specific.`)}>🔍 Elaborate</button>
                                <button className="chat-action-btn" title="Counter argument" onClick={() => setIdeaInput(`Give me the strongest counter-argument to ${m.name}'s point.`)}>⚡ Counter</button>
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
                        <button className="prompt-chip" onClick={() => setIdeaInput('Pivot this concept toward a B2B buyer and tell me what changes.')}>Pivot to B2B</button>
                        <button className="prompt-chip" onClick={() => setIdeaInput('Evaluate whether $99 per month is the right starting price for this.')}>Charge $99/mo</button>
                        <button className="prompt-chip" onClick={() => setIdeaInput('Break down the most realistic MVP tech stack and architecture.')}>Detail the tech stack</button>
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
                {sessionTasks.length > 0 && (
                  <motion.div className="dash-card glass action-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="dash-card-header" style={{ padding: '14px 20px' }}>
                      <div className="dash-card-title">Extracted Action Items</div>
                      <button className="control-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => switchView('tasks')}>Open Task Board</button>
                    </div>
                    <div className="panel-body" style={{ overflowY: 'auto', padding: '12px 20px' }}>
                      {sessionTasks.map((task) => (
                        <div className="action-row" key={task.id}>
                          <input
                            type="checkbox"
                            className="action-check"
                            checked={task.status === 'completed'}
                            onChange={() => updateTaskStatus(task.id, task.status === 'completed' ? 'queued' : 'completed')}
                          />
                          <div style={{ flex: 1 }}>{task.title}</div>
                          <div className={`action-tag ${mapRoleToAgentKey(task.owner_role)}`}>{task.owner_role}</div>
                        </div>
                      ))}
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
                        <button className="exec-btn" onClick={() => switchView('tasks')}>Enter Execution Mode →</button>
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
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }} onClick={() => switchView('boardroom')}>+ New Strategy Session</button>
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
                  <input type="text" className="search-input" placeholder="Search ideas, industries, or keywords..." value={ideaSearch} onChange={(e) => setIdeaSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                  <button className={`filter-btn ${ideaFilter === 'all' ? 'active' : ''}`} onClick={() => setIdeaFilter('all')}>All</button>
                  <button className={`filter-btn ${ideaFilter === 'validated' ? 'active' : ''}`} onClick={() => setIdeaFilter('validated')}>Validated</button>
                  <button className={`filter-btn ${ideaFilter === 'analyzing' ? 'active' : ''}`} onClick={() => setIdeaFilter('analyzing')}>Analyzing</button>
                  <button className={`filter-btn ${ideaFilter === 'draft' ? 'active' : ''}`} onClick={() => setIdeaFilter('draft')}>Draft</button>
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
                    {filteredVaultIdeas.map((idea, idx) => (
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
                            <button className="icon-btn" title="Open Analysis" onClick={() => openIdeaSession(idea.id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredVaultIdeas.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No sessions match your current filters.
                        </td>
                      </tr>
                    )}
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
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }} onClick={() => loadGlobalTasks().catch((error) => console.error('Tasks Refresh Error:', error))}>Refresh Tasks</button>
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
                          <button className="control-btn" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => updateTaskStatus(task.id, 'active')}>Start</button>
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
                          <button className="control-btn" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => updateTaskStatus(task.id, 'completed')}>Complete</button>
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
                          <button className="control-btn" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => updateTaskStatus(task.id, 'queued')}>Reopen</button>
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
                  <button className="icon-btn" title="Export All Logs" onClick={exportCurrentTranscript}>📥</button>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="dash-card glass stat-card">
                  <div className="stat-glow" style={{ background: 'rgba(139, 92, 246, 0.15)' }}></div>
                  <div className="stat-label">Total Brainstorms</div>
                  <div className="stat-value">{vaultIdeas.length}</div>
                  <div className="stat-change" style={{ color: '#4ade80' }}>Live from your vault</div>
                </div>
                <div className="dash-card glass stat-card">
                  <div className="stat-glow" style={{ background: 'rgba(34, 197, 94, 0.15)' }}></div>
                  <div className="stat-label">Consensus Rate</div>
                  <div className="stat-value">{historyConsensusRate}</div>
                  <div className="stat-change">Validated sessions share</div>
                </div>
                <div className="dash-card glass stat-card">
                   <div className="stat-glow" style={{ background: 'rgba(239, 68, 68, 0.15)' }}></div>
                   <div className="stat-label">Total Insights</div>
                   <div className="stat-value">{vaultIdeas.reduce((count, idea) => count + (idea.agents?.length || 0), 0)}</div>
                   <div className="stat-change">Agent perspectives logged</div>
                </div>
              </div>

              <div className="table-controls">
                <div className="search-wrap">
                  <span className="search-icon">🔍</span>
                  <input type="text" className="search-input" placeholder="Search sessions by topic or agent..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
                <div className="filter-group">
                  <button className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`} onClick={() => setHistoryFilter('all')}>All Time</button>
                  <button className={`filter-btn ${historyFilter === 'high' ? 'active' : ''}`} onClick={() => setHistoryFilter('high')}>High Verdicts</button>
                  <button className={`filter-btn ${historyFilter === 'draft' ? 'active' : ''}`} onClick={() => setHistoryFilter('draft')}>Drafts</button>
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
                    {filteredHistoryIdeas.map((idea, idx) => (
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
                        <td><button className="icon-btn" title="View Transcript" onClick={() => openIdeaSession(idea.id)}>📄</button></td>
                      </tr>
                    ))}
                    {filteredHistoryIdeas.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No historical sessions match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '24px' }}>
              <div className="dash-card glass" style={{ padding: '24px' }}>
                <div className="dash-card-header" style={{ marginBottom: '20px' }}>
                  <div className="dash-card-title">Company Profile</div>
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 18px', fontSize: '12px' }} onClick={saveCompanyProfile} disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
                {profileMessage && <div style={{ marginBottom: '16px', color: '#cbd5e1' }}>{profileMessage}</div>}
                {profileLoading ? (
                  <div style={{ color: 'var(--text-muted)' }}>Loading company profile...</div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Startup Name</span>
                      <input className="search-input" value={profileForm.startup_name} onChange={(e) => handleProfileFieldChange('startup_name', e.target.value)} placeholder="Acme AI" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Tagline</span>
                      <input className="search-input" value={profileForm.tagline} onChange={(e) => handleProfileFieldChange('tagline', e.target.value)} placeholder="Your one-line pitch" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Industry</span>
                      <input className="search-input" value={profileForm.industry} onChange={(e) => handleProfileFieldChange('industry', e.target.value)} placeholder="SaaS, Fintech, AI..." />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Stage</span>
                      <select className="search-input" value={profileForm.stage} onChange={(e) => handleProfileFieldChange('stage', e.target.value)}>
                        <option value="idea">Idea</option>
                        <option value="validation">Validation</option>
                        <option value="mvp">MVP</option>
                        <option value="growth">Growth</option>
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Target Audience</span>
                      <input className="search-input" value={profileForm.target_audience} onChange={(e) => handleProfileFieldChange('target_audience', e.target.value)} placeholder="Who is this for?" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Website</span>
                      <input className="search-input" value={profileForm.website} onChange={(e) => handleProfileFieldChange('website', e.target.value)} placeholder="https://example.com" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Fundraising Stage</span>
                      <input className="search-input" value={profileForm.fundraising_stage} onChange={(e) => handleProfileFieldChange('fundraising_stage', e.target.value)} placeholder="Bootstrapped / Pre-seed / Seed" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span>Team Size</span>
                      <input className="search-input" type="number" min="1" value={profileForm.team_size} onChange={(e) => handleProfileFieldChange('team_size', Number(e.target.value) || 1)} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
                      <span>Problem</span>
                      <textarea className="search-input" rows="4" value={profileForm.problem} onChange={(e) => handleProfileFieldChange('problem', e.target.value)} placeholder="What painful problem are you solving?" />
                    </label>
                    <label style={{ display: 'grid', gap: '8px', gridColumn: '1 / -1' }}>
                      <span>Solution</span>
                      <textarea className="search-input" rows="4" value={profileForm.solution} onChange={(e) => handleProfileFieldChange('solution', e.target.value)} placeholder="Describe the solution and product wedge." />
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '24px' }}>
              <div className="dash-card glass" style={{ padding: '24px' }}>
                <div className="dash-card-title" style={{ marginBottom: '16px' }}>Account</div>
                <div style={{ display: 'grid', gap: '10px', color: '#cbd5e1' }}>
                  <div><strong>Name:</strong> {user?.name || 'Unknown user'}</div>
                  <div><strong>Email:</strong> {user?.email || 'Unknown email'}</div>
                  <div><strong>Saved Sessions:</strong> {vaultIdeas.length}</div>
                  <div><strong>Tracked Tasks:</strong> {globalTasks.length}</div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button className="exec-btn" style={{ width: 'auto', padding: '10px 18px', fontSize: '12px' }} onClick={handleLogout}>Log Out</button>
                </div>
              </div>
            </motion.div>
          )}

          {['documents', 'okrs', 'pipeline'].includes(currentView) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-card glass" style={{ padding: '32px', color: 'var(--text-muted)' }}>
              <div className="dash-card-title" style={{ marginBottom: '12px', color: '#fff' }}>Current Release Focus</div>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                This release is production-focused around idea analysis, session history, task tracking, company profile, and account settings.
                Documents, OKRs, and the investor pipeline are intentionally left for a later release so the current workflow stays clean and reliable.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
