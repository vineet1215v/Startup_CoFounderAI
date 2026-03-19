import { motion } from 'framer-motion'
import './AgentStatus.css'

const AgentStatus = ({ status = {} }) => {
    const agents = [
        { name: 'Technical', key: 'technical', icon: '⚙️' },
        { name: 'Marketing', key: 'marketing', icon: '📊' },
        { name: 'Finance', key: 'finance', icon: '💰' },
        { name: 'Product', key: 'product', icon: '🎯' },
        { name: 'Operations', key: 'operations', icon: '⚡' }
    ]

    return (
        <div className="agent-status">
            <h4 className="status-label">Team Status</h4>
            <div className="status-grid">
                {agents.map((agent) => {
                    const agentData = status[agent.key] || { participation: 0, confidence: 0 }
                    return (
                        <motion.div
                            key={agent.key}
                            className="agent-stat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="stat-header">
                                <span className="agent-icon">{agent.icon}</span>
                                <span className="agent-name">{agent.name}</span>
                            </div>
                            <div className="stat-bars">
                                <div className="stat-item">
                                    <span className="stat-label">P</span>
                                    <motion.div
                                        className="stat-bar"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${agentData.participation * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                    ></motion.div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">C</span>
                                    <motion.div
                                        className="stat-bar confidence"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${agentData.confidence * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                                    ></motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default AgentStatus
