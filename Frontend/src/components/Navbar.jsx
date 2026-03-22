import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from './Button'
import './Navbar.css'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="navbar glass">
            <div className="container navbar-content">
                {/* Logo */}
                <Link to="/" className="logo">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="logo-text"
                    >
                        <span className="logo-icon">🧠</span>
                        <span className="logo-name">CoFounder AI</span>
                    </motion.div>
                </Link>

                {/* Desktop Navigation */}
                <div className="nav-center">
                    <Link to="/">Home</Link>
                </div>

                {/* CTA Buttons */}
                <div className="nav-right">
                    <Link to="/login">
                        <Button variant="secondary" size="sm">
                            Login
                        </Button>
                    </Link>
                    <Link to="/register">
                        <Button size="sm" className="btn-purple">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <motion.button
                    className="menu-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    whileTap={{ scale: 0.95 }}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </motion.button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    className="mobile-menu glass"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="secondary" size="sm" className="btn-full">
                            Login
                        </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                        <Button size="sm" className="btn-purple btn-full">
                            Get Started
                        </Button>
                    </Link>
                </motion.div>
            )}
        </nav>
    )
}

export default Navbar
