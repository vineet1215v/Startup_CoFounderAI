import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Button from './Button'
import './Navbar.css'

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [visible, setVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            // Set background opacity state
            setScrolled(currentScrollY > 20)

            // Hide/Show logic
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down - hide
                setVisible(false)
            } else {
                // Scrolling up - show
                setVisible(true)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false)
    }, [location])

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact', href: '/contact' },
    ]

    return (
        <motion.nav
            initial={{ y: 0 }}
            animate={{ y: visible ? 0 : -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`navbar ${scrolled ? 'navbar-scrolled glass' : ''}`}
        >
            <div className="container nav-content">
                <Link to="/" className="logo-container">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }}>
                            <rect x="4" y="4" width="6" height="6" rx="1" fill="white" />
                            <rect x="14" y="4" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
                            <rect x="4" y="14" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
                            <path d="M14 14H20V20H14V14Z" fill="white" />
                        </svg>
                    </div>
                    <span className="logo-text">CoFounder AI</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links desktop-only">
                    {navLinks.map((link) => (
                        <Link key={link.name} to={link.href} className={`nav-link ${location.pathname === link.href ? 'active' : ''}`}>
                            {link.name}
                        </Link>
                    ))}
                    <Link to="/login">
                        <Button variant="primary" size="sm" className="btn-purple">Login/Register</Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="mobile-only menu-btn" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mobile-nav glass mobile-only"
                    >
                        {navLinks.map((link) => (
                            <Link key={link.name} to={link.href} className="nav-link">
                                {link.name}
                            </Link>
                        ))}
                        <div className="mobile-actions">
                            <Link to="/login">
                                <Button className="full-width btn-purple">Login/Register</Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

export default Navbar
