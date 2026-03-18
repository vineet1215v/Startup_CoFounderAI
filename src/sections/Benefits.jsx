import { motion } from 'framer-motion'
import { Rocket, Zap, Shield, TrendingUp, BarChart3, Users } from 'lucide-react'
import './Benefits.css'

const benefits = [
    {
        icon: <Rocket />,
        title: 'Technical Agent',
        description: 'Engineers system architecture and self-assembling product blueprints in real-time.'
    },
    {
        icon: <Users />,
        title: 'Marketing Agent',
        description: 'Generates brand identity, demand strategies, and interactive customer journeys.'
    },
    {
        icon: <Zap />,
        title: 'Product Agent',
        description: 'Builds roadmaps and future previews across safe, balanced, and aggressive timelines.'
    },
    {
        icon: <Shield />,
        title: 'Finance Agent',
        description: 'Visualizes capital flow through 3D Runway Tunnels and budget risk simulations.'
    },
    {
        icon: <BarChart3 />,
        title: 'Operations Agent',
        description: 'Orchestrates 3D Kanban spaces with internal agent task-bidding mechanisms.'
    },
    {
        icon: <TrendingUp />,
        title: 'X-Ray Reasoning',
        description: 'Toggleable layers revealing surface, strategic, technical, and evidence logic.'
    }
]

const Benefits = () => {
    return (
        <section id="benefits" className="benefits">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <span className="badge glass">The Boardroom</span>
                    <h2>Meet Your Five <span className="gradient-text">AI Co-Founders</span></h2>
                    <p>A specialized team of agents that think, debate, and build your vision in parallel.</p>
                </motion.div>

                <div className="benefits-grid">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.7, rotateX: 30, y: 30 }}
                            whileInView={{
                                opacity: 1, scale: 1, rotateX: 0, y: 0,
                                transition: {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 30,
                                    delay: 0.1
                                }
                            }}
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                y: {
                                    duration: 4 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            viewport={{ once: false, amount: 0.2 }}
                            whileHover={{ y: -8, scale: 1.05, borderColor: 'var(--accent-color)' }}
                            className="benefit-card glass"
                        >
                            <div className="icon-container">{benefit.icon}</div>
                            <h3>{benefit.title}</h3>
                            <p>{benefit.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Benefits
