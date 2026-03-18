import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import {
    Users,
    Lock,
    Cpu,
    MessageSquare,
    Zap,
    Mic,
    Send,
    MoreHorizontal
} from 'lucide-react'
import './Boardroom.css'

/* ================= BOARDROOM ================= */

const Boardroom = () => {
    const [messages, setMessages] = useState([])
    const [activeAgentId, setActiveAgentId] = useState(null)
    const [speakingAgentId, setSpeakingAgentId] = useState(null)
    const [isDebating, setIsDebating] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const logScrollRef = useRef(null)
    const spokenMessageIdsRef = useRef(new Set())
    const voicesRef = useRef([])
    const speakingTimeoutRef = useRef(null)
    const speechQueueRef = useRef([])
    const speechActiveRef = useRef(false)
    const fallbackRevealTimerRef = useRef(null)

    const agents = [
        { id: 1, name: 'Tech', role: 'CTO', color: '#3b82f6' },
        { id: 2, name: 'Growth', role: 'COO', color: '#10b981' },
        { id: 3, name: 'Strategy', role: 'CFO', color: '#8b5cf6' },
        { id: 4, name: 'Product', role: 'CPO', color: '#06b6d4' },
        { id: 5, name: 'Marketing', role: 'CMO', color: '#ec4899' },
    ]

    /* ---------- WEBSOCKET REFS (IMPORTANT) ---------- */
    const wsRef = useRef(null)
    const reconnectTimerRef = useRef(null)
    const connectingRef = useRef(false)

    /* ================= BROWSER TTS ================= */
    const getVoiceForAgent = (agentName) => {
        const voices = voicesRef.current
        if (!voices || voices.length === 0) return null
        const englishVoices = voices.filter(v => v.lang?.toLowerCase().startsWith('en'))
        const pool = englishVoices.length > 0 ? englishVoices : voices
        const indexMap = {
            Core: 0,
            Tech: 1,
            Growth: 2,
            Strategy: 3,
            Product: 4,
            Marketing: 5,
        }
        const targetIndex = indexMap[agentName] ?? 0
        return pool[targetIndex % pool.length] || null
    }

    const resolveVisualAgentId = (agent) => {
        const serverId = Number(agent?.agent_id)
        if (serverId === 99) return null
        if ([1, 2, 3, 4, 5].includes(serverId)) return serverId
        const byName = {
            tech: 1,
            growth: 2,
            strategy: 3,
            product: 4,
            marketing: 5,
        }
        return byName[(agent?.agent_name || '').toLowerCase()] || null
    }

    const beginSpeakingAnimation = (agentId, ms = 2400) => {
        if (!agentId) return
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current)
        setSpeakingAgentId(agentId)
        setActiveAgentId(agentId)
        speakingTimeoutRef.current = setTimeout(() => {
            setSpeakingAgentId(null)
        }, ms)
    }

    const endSpeakingAnimation = () => {
        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current)
            speakingTimeoutRef.current = null
        }
        setSpeakingAgentId(null)
        setActiveAgentId(null)
    }

    const setMessageDisplay = (messageId, nextDisplayText, isTyping = true) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id !== messageId) return msg
            return {
                ...msg,
                displayText: nextDisplayText,
                isTyping
            }
        }))
    }

    const clearFallbackRevealTimer = () => {
        if (fallbackRevealTimerRef.current) {
            clearInterval(fallbackRevealTimerRef.current)
            fallbackRevealTimerRef.current = null
        }
    }

    const processSpeechQueue = () => {
        if (speechActiveRef.current) return
        const next = speechQueueRef.current.shift()
        if (!next) return
        speechActiveRef.current = true

        const visualAgentId = resolveVisualAgentId(next.agent)
        const text = next.text || ''
        const estimatedMs = Math.max(1300, text.length * 35)
        const finish = () => {
            clearFallbackRevealTimer()
            setMessageDisplay(next.id, text, false)
            endSpeakingAnimation()
            speechActiveRef.current = false
            processSpeechQueue()
        }

        beginSpeakingAnimation(visualAgentId, estimatedMs + 400)
        setMessageDisplay(next.id, '', true)

        const synth = window.speechSynthesis
        if (!synth) {
            let index = 0
            fallbackRevealTimerRef.current = setInterval(() => {
                index = Math.min(text.length, index + 1)
                setMessageDisplay(next.id, text.slice(0, index), index < text.length)
                if (index >= text.length) finish()
            }, 30)
            return
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = getVoiceForAgent(next.agent?.agent_name || next.agent?.name)
        utterance.rate = 1
        utterance.pitch = 1
        utterance.volume = 1

        let boundarySeen = false
        const charsPerTick = Math.max(1, Math.ceil(text.length / (estimatedMs / 30)))
        utterance.onstart = () => {
            clearFallbackRevealTimer()
            let fallbackIndex = 0
            fallbackRevealTimerRef.current = setInterval(() => {
                if (boundarySeen) return
                fallbackIndex = Math.min(text.length, fallbackIndex + charsPerTick)
                setMessageDisplay(next.id, text.slice(0, fallbackIndex), fallbackIndex < text.length)
            }, 30)
        }
        utterance.onboundary = (event) => {
            if (typeof event.charIndex !== 'number') return
            boundarySeen = true
            const safeIndex = Math.max(0, Math.min(text.length, event.charIndex + 1))
            setMessageDisplay(next.id, text.slice(0, safeIndex), safeIndex < text.length)
        }
        utterance.onend = finish
        utterance.onerror = finish

        synth.speak(utterance)
    }

    const enqueueSpeech = (agentMessage) => {
        if (!agentMessage?.id || spokenMessageIdsRef.current.has(agentMessage.id)) return
        spokenMessageIdsRef.current.add(agentMessage.id)
        speechQueueRef.current.push(agentMessage)
        processSpeechQueue()
    }

    useEffect(() => {
        const synth = window.speechSynthesis
        if (!synth) return

        const loadVoices = () => {
            voicesRef.current = synth.getVoices() || []
        }

        loadVoices()
        synth.onvoiceschanged = loadVoices

        return () => {
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current)
            clearFallbackRevealTimer()
            speechQueueRef.current = []
            speechActiveRef.current = false
            synth.cancel()
            synth.onvoiceschanged = null
        }
    }, [])

    /* ================= SAFE JSON ================= */

    const jsonSafeParse = (data) => {
        try { return JSON.parse(data) }
        catch { return null }
    }

    /* ================= WEBSOCKET CONNECTION ================= */

    useEffect(() => {
        let isMounted = true

        const connect = () => {
            // Prevent duplicate connections (React StrictMode fix)
            if (connectingRef.current) return
            connectingRef.current = true

            console.log("🔌 Connecting to AI Brain...")

            // Using 127.0.0.1 to avoid potential IPv6/DNS lookup delays on Windows
            const socket = new WebSocket('ws://127.0.0.1:8080/ws/boardroom')
            wsRef.current = socket

            socket.onopen = () => {
                console.log("✅ Connected to AI Brain")
                connectingRef.current = false
            }

            socket.onmessage = (event) => {
                const message = jsonSafeParse(event.data)
                if (!message) return

                const streamableTypes = ['AGENT_ANALYSIS', 'STATUS_UPDATE', 'CONSENSUS_SIGNAL', 'RISK_ALERT']
                if (streamableTypes.includes(message.type)) {
                    const data = message.data || message.payload
                    if (!data) return

                    const messageId = Date.now() + Math.random()
                    const agentMessage = {
                        type: 'agent',
                        agent: data,
                        text: data.content,
                        id: messageId,
                        isTyping: true,
                        displayText: ''
                    }
                    setMessages(prev => [...prev, agentMessage])
                    enqueueSpeech(agentMessage)
                }
            }

            socket.onclose = () => {
                console.warn("🔁 AI Brain disconnected. Reconnecting...")
                connectingRef.current = false

                if (!isMounted) return
                reconnectTimerRef.current = setTimeout(connect, 3000)
            }

            socket.onerror = (err) => {
                console.error("⚠️ WebSocket Error:", err)
            }
        }

        connect()

        /* ---------- CLEANUP (STRICT MODE SAFE) ---------- */
        return () => {
            isMounted = false
            endSpeakingAnimation()
            clearFallbackRevealTimer()
            speechQueueRef.current = []
            speechActiveRef.current = false
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close()
            }
        }
    }, [])

    /* ================= SEND MESSAGE ================= */

    const handleSend = async (e) => {
        e.preventDefault()

        const socket = wsRef.current
        if (!inputValue.trim() || !socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("🚫 AI Brain not ready for transmission.")
            return
        }

        setIsDebating(true)
        const prompt = inputValue
        const userMsg = { type: 'user', text: prompt, id: Date.now() }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')

        try {
            socket.send(JSON.stringify({
                type: "PROPOSE_IDEA",
                payload: prompt
            }))
        } catch (err) {
            console.error("❌ Failed to send prompt:", err)
        }

        setTimeout(() => setIsDebating(false), 2000)
    }

    /* ================= AUTO SCROLL ================= */

    useEffect(() => {
        const scrollToBottom = () => {
            if (logScrollRef.current) {
                logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight
            }
        }

        scrollToBottom()

        // If an agent is speaking (typing), keep it pinned to bottom
        let scrollInterval
        if (speakingAgentId) {
            scrollInterval = setInterval(scrollToBottom, 50)
        }

        return () => {
            if (scrollInterval) clearInterval(scrollInterval)
        }
    }, [messages, speakingAgentId])

    return (
        <div className="boardroom-main-layout">
            <div className="boardroom-stage">
                <div className="boardroom-360-container">
                    <div className="central-table">
                        <div className="table-top">
                            <div className="table-reflection"></div>
                            <div className="central-power-core">
                                <div className="core-glow"></div>
                            </div>
                        </div>

                        {agents.map((agent, i) => (
                            <div key={agent.id} className={`agent-seating agent-pos-${i + 1}`}>
                                <motion.div
                                    className={`agent-human-profile ${speakingAgentId === agent.id ? 'active' : ''} ${activeAgentId === agent.id ? 'focused' : ''}`}
                                    animate={speakingAgentId === agent.id ? {
                                        y: -8,
                                        rotateX: -90,
                                        scale: 1.15,
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                                    } : {
                                        y: 0,
                                        rotateX: -90,
                                        scale: 1
                                    }}
                                    transition={{ type: 'spring', stiffness: 100 }}
                                >
                                    <div className="humanoid-agent">
                                        <div className="humanoid-head">
                                            <div className={`eye-glow ${speakingAgentId === agent.id ? 'speaking' : ''}`}></div>
                                        </div>
                                        <div className="humanoid-torso">
                                            <div className="core-glow-inner" style={{ background: agent.color }}></div>
                                            {speakingAgentId === agent.id && (
                                                <>
                                                    <motion.div
                                                        className="speaking-flash"
                                                        style={{ background: agent.color }}
                                                        animate={{
                                                            scale: [1, 2.5, 1],
                                                            opacity: [0, 0.4, 0],
                                                            filter: ["blur(5px)", "blur(15px)", "blur(5px)"]
                                                        }}
                                                        transition={{ duration: 0.4, repeat: Infinity }}
                                                    />
                                                    <motion.div
                                                        className="speaking-holo-ring"
                                                        style={{ borderColor: agent.color, x: "-50%", y: "-50%" }}
                                                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="agent-label-spatial glass">
                                        <span>{agent.name}</span>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <aside className="reasoning-log-panel glass">
                <div className="log-header">
                    <div className="header-left">
                        <MoreHorizontal size={14} className="header-icon" />
                        <span className="header-title">X-RAY REASONING LOG</span>
                    </div>
                    <div className={`live-pill ${wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected'}`}>
                        <div className="live-dot"></div>
                        <span>{wsRef.current?.readyState === WebSocket.OPEN ? 'NEURAL SYNC' : 'OFFLINE'}</span>
                    </div>
                </div>

                <div className="log-content-area" ref={logScrollRef}>
                    {messages.length === 0 ? (
                        <div className="empty-log-state">
                            <Lock size={32} className="lock-icon" />
                            <p>Awaiting founder vision to initialize debate.</p>
                        </div>
                    ) : (
                        <div className="log-message-stream">
                            <AnimatePresence mode='popLayout'>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`log-entry ${msg.type}`}
                                    >
                                        {msg.type === 'agent' && (
                                            <div className="agent-meta">
                                                <span className="agent-tag" style={{ borderLeft: `3px solid ${msg.agent.color}` }}>
                                                    {msg.agent.agent_name.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="entry-text">
                                            {msg.type === 'agent'
                                                ? (msg.displayText ?? msg.text)
                                                : msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <div className="log-footer-input">
                    <form className="log-input-box glass" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type a vision..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button type="submit" className="send-btn-circular">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    )
}

export default Boardroom


