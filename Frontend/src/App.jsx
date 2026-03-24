import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './sections/Footer'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import { useLocation } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

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

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#cbd5e1', background: '#07111f' }}>Loading dashboard...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
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
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={  <Dashboard />} />
                        </Routes>
                    </Layout>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}

export default App

import ErrorBoundary from './components/common/ErrorBoundary.jsx'
