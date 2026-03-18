import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
    Brain,
    Zap,
    Network,
    TrendingUp,
    Globe,
    Target,
    Activity
} from 'lucide-react'
import './Intelligence.css'

const Intelligence = () => {
    const [telemetry, setTelemetry] = useState({
        neuralLoad: '0 TFLOPs',
        synapticSpeed: '0ms',
        simulationAccuracy: '0%',
        conviction: 0
    })
    const [insights, setInsights] = useState([])

    const agents = [
        { name: 'Core', role: 'CTO', color: '#3b82f6' },
        { name: 'Growth', role: 'CGO', color: '#10b981' },
        { name: 'Strategy', role: 'COO', color: '#8b5cf6' },
        { name: 'Product', role: 'CPO', color: '#06b6d4' },
        { name: 'Marketing', role: 'CMO', color: '#ec4899' },
    ]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [telRes, insRes] = await Promise.all([
                    fetch('http://localhost:5000/api/telemetry/telemetry'),
                    fetch('http://localhost:5000/api/telemetry/insights')
                ])
                const telData = await telRes.json()
                const insData = await insRes.json()
                setTelemetry(telData)
                setInsights(insData)
            } catch (err) {
                console.error("Intelligence data fetch failed:", err)
            }
        }
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="intelligence-container">
            <div className="intelligence-grid">
                {/* Left: Neural Matrix */}
                <div className="neural-matrix-panel glass">
                    <div className="panel-header">
                        <Network size={18} className="header-icon" />
                        <span>AGENT KNOWLEDGE MATRIX</span>
                    </div>

                    <div className="matrix-visualization">
                        <div className="matrix-grid">
                            {[...Array(25)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="matrix-cell"
                                    animate={{
                                        opacity: [0.1, 0.3, 0.1],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2
                                    }}
                                />
                            ))}
                        </div>

                        {/* Connecting Lines (Simulated SVG) */}
                        <svg className="neural-connections">
                            <motion.path
                                d="M 50 50 Q 150 100 250 50"
                                stroke="var(--accent-color)"
                                strokeWidth="1"
                                fill="transparent"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.4 }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </svg>

                        {/* Agent Nodes */}
                        {agents.map((agent, i) => (
                            <motion.div
                                key={i}
                                className="agent-node glass"
                                style={{
                                    borderColor: agent.color,
                                    boxShadow: `0 0 15px ${agent.color}33`,
                                    left: `${20 + (i % 3) * 30}%`,
                                    top: `${20 + Math.floor(i / 3) * 40}%`
                                }}
                                whileHover={{ scale: 1.1 }}
                            >
                                <Brain size={16} />
                                <div className="node-label">
                                    <span style={{ color: agent.color }}>{agent.name}</span>
                                    <small>{agent.role}</small>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right: Intel Feed & Sentiment */}
                <div className="intel-sidebar">
                    {/* Global Intel Stream */}
                    <div className="intel-panel glass">
                        <div className="panel-header">
                            <Globe size={18} className="header-icon" />
                            <span>GLOBAL INTEL STREAM</span>
                        </div>
                        <div className="intel-feed">
                            {insights.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="intel-item"
                                >
                                    <div className="intel-bullet" />
                                    <div className="intel-content">
                                        <p>{item.text}</p>
                                        <span>{item.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div className="intel-panel glass">
                        <div className="panel-header">
                            <Target size={18} className="header-icon" />
                            <span>BOARDROOM SENTIMENT</span>
                        </div>
                        <div className="sentiment-visualization">
                            <div className="sentiment-radial">
                                <motion.div
                                    className="radial-progress"
                                    initial={{ rotate: -90 }}
                                    animate={{ rotate: (telemetry.conviction / 100) * 360 - 90 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <div className="sentiment-value">
                                    <h3>{telemetry.conviction}%</h3>
                                    <span>CONVICTION</span>
                                </div>
                            </div>
                            <div className="sentiment-metrics">
                                <div className="metric-row">
                                    <span>Confidence</span>
                                    <div className="progress-mini"><motion.div initial={{ width: 0 }} animate={{ width: '92%' }} /></div>
                                </div>
                                <div className="metric-row">
                                    <span>Alignment</span>
                                    <div className="progress-mini"><motion.div initial={{ width: 0 }} animate={{ width: '78%' }} /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Quick Stats */}
            <div className="intelligence-footer">
                <div className="quick-metric glass">
                    <Activity size={16} className="metric-icon" />
                    <div className="metric-info">
                        <span>NEURAL LOAD</span>
                        <strong>{telemetry.neuralLoad}</strong>
                    </div>
                </div>
                <div className="quick-metric glass">
                    <Zap size={16} className="metric-icon purple" />
                    <div className="metric-info">
                        <span>SYNAPTIC SPEED</span>
                        <strong>{telemetry.synapticSpeed}</strong>
                    </div>
                </div>
                <div className="quick-metric glass">
                    <TrendingUp size={16} className="metric-icon green" />
                    <div className="metric-info">
                        <span>SIMULATION ACCURACY</span>
                        <strong>{telemetry.simulationAccuracy}</strong>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Intelligence
