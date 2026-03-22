import { motion } from 'framer-motion'
import Button from '../components/Button'
import './Footer.css'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="cta-section glass"
                >
                    <h2>Ready to Step Into the <span className="gradient-text">Founder Chamber?</span></h2>
                    <p>Join the future of building where AI doesn't just assist—it co-founds.</p>
                    <Button size="lg" className="btn-purple">Start Your Startup OS</Button>
                </motion.div>

                <div className="footer-bottom">
                    <div className="footer-info">
                        <a href="/" className="logo-container">
                            <div className="logo-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }}>
                                    <rect x="4" y="4" width="6" height="6" rx="1" fill="white" />
                                    <rect x="14" y="4" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
                                    <rect x="4" y="14" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
                                    <path d="M14 14H20V20H14V14Z" fill="white" />
                                </svg>
                            </div>
                            <span className="logo-text">CoFounder AI</span>
                        </a>
                        <p>© 2026 Agentic OS. The Living AI Co-Founder.</p>
                    </div>
                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="#">Careers</a>
                        </div>
                        <div className="link-group">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">Security</a>
                        </div>
                        <div className="link-group">
                            <h4>Support</h4>
                            <a href="#">Contact</a>
                            <a href="#">Help Center</a>
                            <a href="#">Privacy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
