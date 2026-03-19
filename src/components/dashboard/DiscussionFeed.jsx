import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import './DiscussionFeed.css'

const DiscussionFeed = ({ messages = [] }) => {
    const [displayedMessages, setDisplayedMessages] = useState([])
    const feedEndRef = useRef(null)

    useEffect(() => {
        setDisplayedMessages(messages)
    }, [messages])

    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [displayedMessages])

    const getAgentColor = (agent) => {
        const colors = {
            'Technical Agent': '#3b82f6',
            'Marketing Agent': '#10b981',
            'Finance Agent': '#f59e0b',
            'Product Agent': '#ec4899',
            'Operations Agent': '#a78bfa',
            'Core Agent': '#8b5cf6',
            'Founder': '#34d399'
        }
        return colors[agent] || '#8b5cf6'
    }

    const getAgentIcon = (agent) => {
        const icons = {
            'Technical Agent': '⚙️',
            'Marketing Agent': '📊',
            'Finance Agent': '💰',
            'Product Agent': '🎯',
            'Operations Agent': '⚡',
            'Core Agent': '🧠',
            'Founder': '👤'
        }
        return icons[agent] || '💬'
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    }

    const messageVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    }

    return (
        <div className="discussion-feed">
            <motion.div
                className="feed-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {displayedMessages.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="empty-icon">💭</div>
                        <p>No messages yet. Start a conversation to begin.</p>
                    </motion.div>
                ) : (
                    displayedMessages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            className={`message-bubble ${msg.type} ${msg.agent === 'Founder' ? 'founder-msg' : 'agent-msg'}`}
                            variants={messageVariants}
                        >
                            <div className="message-avatar" style={{ backgroundColor: getAgentColor(msg.agent) }}>
                                {getAgentIcon(msg.agent)}
                            </div>

                            <div className="message-content">
                                <div className="message-header">
                                    <h4 className="sender-name">{msg.agent}</h4>
                                    {msg.type === 'research' && <span className="badge research-badge">🔍 Researching</span>}
                                    {msg.type === 'analysis' && <span className="badge analysis-badge">📈 Analysis</span>}
                                    {msg.type === 'introduction' && <span className="badge intro-badge">✨ Init</span>}
                                </div>

                                <p className="message-text">{msg.message}</p>

                                <div className="message-footer">
                                    <span className="timestamp">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.isThinking && <span className="thinking-indicator">Thinking...</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
                <div ref={feedEndRef} />
            </motion.div>
        </div>
    )
}

export default DiscussionFeed
