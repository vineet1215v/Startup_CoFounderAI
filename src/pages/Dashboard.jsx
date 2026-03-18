import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
    Users,
    Cpu,
    Zap,
    Database,
    Search,
    AlertCircle,
    LogOut,
    Mic,
    MoreHorizontal
} from 'lucide-react'
import Boardroom from '../components/dashboard/Boardroom'
import ExecutionCenter from '../components/dashboard/ExecutionCenter'
import Intelligence from '../components/dashboard/Intelligence'
import ParticleBackground from '../components/ParticleBackground'
import ErrorBoundary from '../components/common/ErrorBoundary'
import './Dashboard.css'

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('boardroom')
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    return (
        <div className="dashboard-page overflow-hidden">
            <ParticleBackground />

            {/* Sidebar: Premium Dark OS Style */}
            <aside className="dashboard-sidebar glass">
                <div className="sidebar-header">
                    <div className="logo-section">
                        <span className="logo-text">COFOUNDER <span className="highlight">AI</span></span>
                        <MoreHorizontal size={18} className="header-dots-icon" />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-btn ${activeTab === 'boardroom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('boardroom')}
                    >
                        <Users size={20} />
                        <span>Boardroom</span>
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'intelligence' ? 'active' : ''}`}
                        onClick={() => setActiveTab('intelligence')}
                    >
                        <Cpu size={20} />
                        <span>Intelligence</span>
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'execution' ? 'active' : ''}`}
                        onClick={() => setActiveTab('execution')}
                    >
                        <Zap size={20} />
                        <span>Execution</span>
                    </button>
                    <button
                        className={`nav-btn ${activeTab === 'vault' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vault')}
                    >
                        <Database size={20} />
                        <span>Vault</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="exit-os-btn glass" onClick={() => window.location.href = '/'}>
                        <LogOut size={16} />
                        <span>Exit OS</span>
                    </button>
                </div>
            </aside>

            <main className="dashboard-main-content">
                <header className="dashboard-top-bar">
                    <div className="command-search-container glass">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Command agents (e.g., 'Analyze market sentiment')..." />
                        <div className="command-hint">⌘K</div>
                    </div>

                    <div className="top-bar-actions">
                        <div className="risk-indicator glass">
                            <AlertCircle size={16} />
                            <span>Risk: Balanced</span>
                        </div>
                        <div className="user-profile glass">JD</div>
                    </div>
                </header>

                <div className="dashboard-body-inner">
                    <section className="dashboard-viewport">
                        {activeTab === 'boardroom' ? (
                            <ErrorBoundary>
                                <Boardroom />
                            </ErrorBoundary>
                        ) : activeTab === 'intelligence' ? (
                            <Intelligence />
                        ) : activeTab === 'execution' ? (
                            <ExecutionCenter />
                        ) : (
                            <div className="viewport-empty">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="loading-ring"
                                />
                                <h3>Initializing {activeTab.toUpperCase()}</h3>
                                <p>Syncing neural links across agent galaxy...</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
