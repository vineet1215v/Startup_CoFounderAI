import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Server, Activity, Disc, Zap, Code } from 'lucide-react'

const ExecutionCenter = () => {
    const [streams, setStreams] = useState([])

    useEffect(() => {
        const fetchStreams = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/telemetry/streams')
                const data = await res.json()
                setStreams(data)
            } catch (err) {
                console.error("Execution streams fetch failed:", err)
            }
        }
        fetchStreams()
        const interval = setInterval(fetchStreams, 5000)
        return () => clearInterval(interval)
    }, [])

    const getIcon = (agent) => {
        switch (agent) {
            case 'CTO': return Server
            case 'CMO': return Activity
            case 'CPO': return Zap
            case 'CFO': return Disc
            default: return Code
        }
    }

    return (
        <div className="execution-center">
            <div className="execution-header">
                <h3>Parallel Execution Command Hub</h3>
                <div className="active-streams-badge">{streams.length} Parallel Streams Active</div>
            </div>

            <div className="streams-list">
                {streams.map((stream, i) => {
                    const Icon = getIcon(stream.agent)
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="stream-card glass"
                        >
                            <div className="stream-track">
                                <div className="stream-info">
                                    <div className="stream-icon" style={{ backgroundColor: `${stream.color}22`, color: stream.color }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="stream-name-group">
                                        <h4>{stream.name}</h4>
                                        <span style={{ color: stream.color }}>Managed by {stream.agent}</span>
                                    </div>
                                </div>
                                <div className="stream-progress">
                                    <div className="progress-top">
                                        <span>Assembling...</span>
                                        <span>{stream.progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <motion.div
                                            className="progress-fill"
                                            style={{ backgroundColor: stream.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stream.progress}%` }}
                                            transition={{ duration: 1 }}
                                        ></motion.div>
                                    </div>
                                </div>
                            </div>
                            <div className="stream-visualization">
                                <div className="pulse-circle" style={{ borderColor: `${stream.color}55` }}></div>
                                <div className="neural-thread" style={{ background: `linear-gradient(to right, ${stream.color}22, ${stream.color})` }}></div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="execution-blueprint glass">
                <div className="blueprint-header">
                    <Code size={16} />
                    <span>Real-Time Self-Assembling Blueprint</span>
                </div>
                <div className="blueprint-visual">
                    <div className="grid-overlay"></div>
                    <div className="assembling-blocks">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="block glass"
                                animate={{
                                    opacity: [0.1, 0.4, 0.1],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                            ></motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExecutionCenter
