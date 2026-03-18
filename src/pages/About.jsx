import { motion } from 'framer-motion'

const About = () => {
    return (
        <div className="about-page container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-header"
            >
                <span className="badge-new glass">About Us</span>
                <h1>We're Building the Future of <span className="gradient-text">AI Automation</span></h1>
                <p>Our mission is to empower startups by providing intelligent, multi-agent co-founders that can think, debate, and build along-side human founders.</p>
            </motion.div>

            <div className="about-grid">
                <div className="about-card glass">
                    <h3>Our Vision</h3>
                    <p>A world where every entrepreneur has access to top-tier AI co-founders, leveling the playing field for innovation.</p>
                </div>
                <div className="about-card glass">
                    <h3>Our Tech</h3>
                    <p>We leverage cutting-edge LLMs and multi-agent systems to create digital entities that are more than just chatbots.</p>
                </div>
            </div>
        </div>
    )
}

export default About
