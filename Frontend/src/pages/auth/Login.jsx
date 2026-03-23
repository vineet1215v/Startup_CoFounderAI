import { useState } from 'react'
import { motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)
        if (result.success) {
            navigate('/dashboard')
        } else {
            setError(result.message || 'Login failed')
        }
        setLoading(false)
    }

    const handleSuccess = () => {
        setError('Google login is not connected to the backend yet. Use email and password for now.')
    }

    return (
        <div className="auth-page container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card glass"
            >
                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Login to your CoFounder AI account</p>

                {error && <div className="error-message glass">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="full-width btn-purple" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <div className="oauth-container">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log('Login Failed')}
                        useOneTap
                    />
                </div>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default Login
