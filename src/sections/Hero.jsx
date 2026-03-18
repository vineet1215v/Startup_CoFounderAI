import { motion } from 'framer-motion'
import Button from '../components/Button'
import ParticleBackground from '../components/ParticleBackground'
import './Hero.css'

const Hero = () => {
    const agents = [1, 2, 3, 4] // Represent 4 seated agents

    return (
        <section className="hero">
            <div className="central-glow"></div>
            <div className="rotating-ring"></div>
            <ParticleBackground />

            <div className="container hero-content">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hero-text"
                >
                    <div className="badge-new glass">
                        <span className="badge-accent">New</span>
                        <div style={{ display: 'inline-flex', marginLeft: '0.25rem' }}>
                            {"Automated Lead Generation".split("").map((char, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: 0.4 + (i * 0.03),
                                        ease: "easeOut"
                                    }}
                                    style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                    <h1>
                        Multi-Agent Startup<br />
                        <span className="highlight">Co-Founder</span>
                    </h1>
                    <p className="hero-description">
                        A Living AI That Thinks, Debates, and Builds.
                    </p>
                    <div className="hero-cta">
                        <Button size="lg" className="btn-purple">
                            Get in touch <span className="arrow">↗</span>
                        </Button>
                        <Button variant="secondary" size="lg">
                            View services
                        </Button>
                    </div>
                </motion.div>

                {/* 360° AI Boardroom Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                    className="hero-visual"
                >
                    <div className="boardroom-scene">
                        <div className="boardroom-table">
                            <div className="table-surface">
                                <div className="table-reflection"></div>
                                <div className="table-grid"></div>
                            </div>

                            {/* Central Holographic Globe */}
                            <div className="central-hologram">
                                <div className="hologram-globe">
                                    <div className="map-layer"></div>
                                    <div className="data-rings">
                                        <div className="ring r1"></div>
                                        <div className="ring r2"></div>
                                        <div className="ring r3"></div>
                                    </div>
                                    <div className="hologram-glow"></div>
                                </div>
                            </div>

                            {/* Seated Agents */}
                            {agents.map((_, i) => (
                                <div key={i} className={`agent-seat seat-${i + 1}`}>
                                    <div className="chair-3d">
                                        <div className="chair-back"></div>
                                        <div className="chair-seat"></div>
                                        <div className="chair-base"></div>
                                    </div>
                                    <div className="ai-human">
                                        <div className="human-silhouette">
                                            <div className="head-glow"></div>
                                        </div>
                                        <div className="agent-display glass">
                                            <div className="display-content"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Nebula Glows */}
                    <div className="nebula purple-nebula"></div>
                    <div className="nebula blue-nebula"></div>
                </motion.div>

                <div className="hero-bottom-badge">
                    <Button variant="secondary" size="sm" className="glass-pill">
                        <span className="arrow">›</span> Use For Free <span className="arrow">↗</span>
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default Hero
