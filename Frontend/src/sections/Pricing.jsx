import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import Button from '../components/Button'
import './Pricing.css'

const plans = [
    {
        name: 'Single Agent',
        price: { monthly: 99, annual: 79 },
        description: 'Access the Core OS and one dedicated specialist agent.',
        features: [
            'Immersive Founder Chamber',
            'One specialized AI Agent',
            '3D Knowledge Vault entry',
            'Voice-first console access',
            'Standard simulation speed'
        ]
    },
    {
        name: 'Full Boardroom',
        price: { monthly: 249, annual: 199 },
        description: 'The complete five-agent experience with real-time debate maps.',
        popular: true,
        features: [
            'All Five Specialized Agents',
            '3D Boardroom & Debate Map',
            'X-Ray Reasoning Layers',
            'Parallel Future Previews',
            'Priority Simulation Compute'
        ]
    },
    {
        name: 'Command Center',
        price: { monthly: 599, annual: 449 },
        description: 'Unlimited scale with Digital Twin and Execution Streams.',
        features: [
            'Real-time Execution Streams',
            'Startup Digital Twin generation',
            'Advanced Risk Thermometer',
            'Unlimited Knowledge Vaulting',
            '24/7 Agent Task-Bidding'
        ]
    }
]

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(false)

    return (
        <section id="pricing" className="pricing">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <span className="badge glass">Operational Access</span>
                    <h2>Step Into Your <span className="gradient-text">Founder Chamber</span></h2>
                    <p>Choose the simulation fidelity that matches your startup's trajectory.</p>

                    <div className="pricing-toggle">
                        <span className={!isAnnual ? 'active' : ''}>Monthly</span>
                        <div className="toggle-bg" onClick={() => setIsAnnual(!isAnnual)}>
                            <motion.div
                                animate={{ x: isAnnual ? 32 : 4 }}
                                className="toggle-thumb"
                            />
                        </div>
                        <span className={isAnnual ? 'active' : ''}>Annually</span>
                    </div>
                </motion.div>

                <div className="pricing-grid">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 60, scale: 0.85 }}
                            whileInView={{
                                opacity: 1, y: 0, scale: 1,
                                transition: {
                                    type: "spring",
                                    bounce: 0.4,
                                    duration: 1,
                                    delay: 0.1
                                }
                            }}
                            animate={{
                                y: [0, -15, 0],
                            }}
                            transition={{
                                y: {
                                    duration: 6 + i,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            viewport={{ once: false, amount: 0.1 }}
                            className={`pricing-card glass ${plan.popular ? 'popular' : ''}`}
                        >
                            {plan.popular && <div className="popular-badge">Most Popular</div>}
                            <h3>{plan.name}</h3>
                            <div className="price">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={isAnnual ? 'annual' : 'monthly'}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="amount"
                                    >
                                        ${isAnnual ? plan.price.annual : plan.price.monthly}
                                    </motion.span>
                                </AnimatePresence>
                                <span className="period">/month</span>
                            </div>
                            <p className="description">{plan.description}</p>

                            <ul className="features-list">
                                {plan.features.map((feature, j) => (
                                    <li key={j}>
                                        <Check size={16} className="check-icon" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button variant={plan.popular ? 'primary' : 'secondary'} className="full-width">
                                Choose this plan
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Pricing
