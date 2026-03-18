import { useState } from 'react'
import { motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/Button'
import { useNavigate } from 'react-router-dom'

const Register = () => {
    const { signup } = useAuth()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await signup(name, email, password)
        if (result.success) {
            navigate('/dashboard')
        } else {
            setError(result.message || 'Registration failed')
        }
        setLoading(false)
    }

    const handleSuccess = (credentialResponse) => {
        console.log('Register Success:', credentialResponse)
        // Mock success for now
        localStorage.setItem('user', JSON.stringify({ name: 'Google User', email: 'user@gmail.com' }))
        navigate('/dashboard')
        window.location.reload()
    }

    return (
        <div className="auth-page container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="auth-card glass"
            >
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join the future of agentic startups</p>

                {error && <div className="error-message glass">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" className="full-width btn-purple" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register'}
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
                    Already have an account? <a href="/login">Login</a>
                </p>
            </motion.div>
        </div>
    )
}

export default Register
