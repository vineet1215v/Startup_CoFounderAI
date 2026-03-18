import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import './FAQ.css'

const faqs = [
    {
        question: 'Can I interrupt agents during a boardroom debate?',
        answer: 'Absolutely. Use the curved 3D console (text or voice) to trigger a visual ripple that recalibrates agent reasoning instantly.'
    },
    {
        question: 'How does the Knowledge Vault handle my data?',
        answer: 'The Knowledge Vault is a separate 3D environment with industry-standard encryption, drag-and-drop uploads, and AI-highlighted citation threads.'
    },
    {
        question: 'What is the "X-ray Reasoning" view?',
        answer: 'It is a toggleable spatial overlay that reveals the surface, strategic, technical, and evidence logic behind every agent decision.'
    },
    {
        question: 'How long does it take for the OS to initialize?',
        answer: 'The cosmic neural constellation forms your core in seconds, allowing you to enter the Founder Chamber immediately with a basic agent team.'
    }
]

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: "easeOut" }
            }}
            animate={{
                y: [0, -5, 0],
            }}
            transition={{
                y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            }}
            viewport={{ once: false, amount: 0.5 }}
            className={`faq-item glass ${isOpen ? 'open' : ''}`}
        >
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <span>{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="faq-answer"
                    >
                        <p>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

const FAQ = () => {
    return (
        <section id="faq" className="faq">
            <div className="container small">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <span className="badge glass">FAQ</span>
                    <h2>We’ve Got the <span className="gradient-text">Answers You’re Looking For</span></h2>
                </motion.div>

                <div className="faq-list">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} {...faq} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQ
