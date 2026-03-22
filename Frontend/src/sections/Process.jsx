import { motion } from 'framer-motion'
import './Process.css'

const steps = [
    {
        number: 'Step 1',
        title: 'Founder Chamber',
        description: 'A cosmic neural constellation forms your luminous AI core and five orbiting agents.',
        tags: ['Neural Core', 'Agent Assembly', 'Spatial Init', 'Vision Sync']
    },
    {
        number: 'Step 2',
        title: 'AI Boardroom',
        description: 'Enter the spatial boardroom featuring holographic agents and real-time debate maps.',
        code: 'if (agent_consensus > 0.85):\n  trigger(strategic_blueprint)\nelse:\n  initiate(debate_mode)'
    },
    {
        number: 'Step 3',
        title: 'Execution Command',
        description: 'Parallel energy streams visualize real-time building with self-assembling blueprints.',
        visual: 'Energy Stream'
    },
    // {
    //     number: 'Step 4',
    //     title: 'Startup Digital Twin',
    //     description: 'A rotating 3D twin visualizes your team, product, customer journey, and revenue flows.',
    //     update: 'Simulation Active'
    // }
]

const Process = () => {
    return (
        <section id="process" className="process">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <span className="badge glass">Operational Flow</span>
                    <h2>From Idea to <span className="gradient-text">Real-Time Execution</span></h2>
                    <p>Experience a living, reasoning AI co-founder that builds alongside you in immersive 3D.</p>
                </motion.div>

                <div className="steps-grid">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50, rotate: i % 2 === 0 ? -5 : 5, scale: 0.9 }}
                            whileInView={{
                                opacity: 1,
                                x: 0,
                                rotate: 0,
                                scale: 1,
                                transition: { duration: 0.8, delay: 0.1, ease: "easeOut" }
                            }}
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                y: {
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            viewport={{ once: false, amount: 0.3 }}
                            className="step-card glass"
                        >
                            <div className="step-number">{step.number}</div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>

                            <div className="step-visual">
                                {step.tags && (
                                    <div className="step-tags">
                                        {step.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                                    </div>
                                )}
                                {step.code && (
                                    <pre className="step-code">
                                        <code>{step.code}</code>
                                    </pre>
                                )}
                                {step.visual && (
                                    <div className="step-integration">
                                        <div className="circle">Our Solution</div>
                                        <div className="line"></div>
                                        <div className="circle">Your Stack</div>
                                    </div>
                                )}
                                {step.update && (
                                    <div className="step-update">
                                        <div className="update-pill">{step.update}</div>
                                        <div className="update-status">Update available..</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Process
