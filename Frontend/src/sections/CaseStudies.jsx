import { motion } from 'framer-motion'
import './CaseStudies.css'

const cases = [
    {
        company: 'Simulation: Rapid Pivot',
        challenge: 'Product-market fit stalled during initial prototype phase.',
        solution: 'Debate Map identified resource misalignment; Technical agent re-coded core in 48h.',
        impact: ['Consensus Reached', '48h Pivot Speed', '98% Signal Logic'],
        quote: '"The spatial X-ray view revealed why we were failing before we spent a dime."'
    },
    {
        company: 'Simulation: Global Scale',
        challenge: 'Scaling demand without increasing burn rate.',
        solution: 'Marketing agent deployed parallel future previews to optimize demand generation.',
        impact: ['15% Market Captured', 'Zero Burn Increase', '3D Roadmap Validated'],
        quote: '"We visualized our global expansion in the Runway Tunnel before execution."'
    }
]

const CaseStudies = () => {
    return (
        <section id="cases" className="case-studies">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <span className="badge glass">Simulation Logs</span>
                    <h2>From Idea to <br /><span className="gradient-text">Validated Outcomes</span></h2>
                </motion.div>

                <div className="cases-grid">
                    {cases.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, scale: 0.8 }}
                            whileInView={{
                                opacity: 1, y: 0, scale: 1,
                                transition: { duration: 0.8, ease: "easeOut" }
                            }}
                            animate={{
                                y: [0, -12, 0],
                            }}
                            transition={{
                                y: {
                                    duration: 5 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            viewport={{ once: false, amount: 0.1 }}
                            className="case-card glass"
                        >
                            <div className="case-header">
                                <h3>{item.company}</h3>
                                <p className="challenge">{item.challenge}</p>
                            </div>
                            <div className="case-body">
                                <p className="solution"><strong>Solution:</strong> {item.solution}</p>
                                <div className="impact-grid">
                                    {item.impact.map((stat, j) => (
                                        <div key={j} className="stat-pill">{stat}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="case-footer">
                                <p className="quote">{item.quote}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default CaseStudies
