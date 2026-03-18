import { motion } from 'framer-motion'
import Button from '../components/Button'

const Contact = () => {
    return (
        <div className="contact-page container">
            <div className="section-header">
                <span className="badge-new glass">Contact</span>
                <h1>Get in Touch with <span className="gradient-text">CoFounder AI</span></h1>
                <p>Ready to automate? Have questions? Our team is here to help.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="contact-form glass"
            >
                <div className="form-group">
                    <label>Name</label>
                    <input type="text" placeholder="John Doe" />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" placeholder="john@example.com" />
                </div>
                <div className="form-group">
                    <label>Message</label>
                    <textarea placeholder="How can we help you?" rows="5"></textarea>
                </div>
                <Button className="full-width btn-purple">Send Message</Button>
            </motion.div>
        </div>
    )
}

export default Contact
