import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './sections/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'

// Import all page styles
import './pages/Pages.css'

const Layout = ({ children }) => {
    const location = useLocation()
    const isDashboard = location.pathname === '/dashboard'

    return (
        <div className="app">
            {!isDashboard && <Navbar />}
            <main>
                {children}
            </main>
            {!isDashboard && <Footer />}
        </div>
    )
}

function App() {
    // Replace with actual Google Client ID from project settings
    const googleClientId = "720967441762-p4h69es8aukqhputie44qhpepgtid1d4.apps.googleusercontent.com"

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                        </Routes>
                    </Layout>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}

export default App
