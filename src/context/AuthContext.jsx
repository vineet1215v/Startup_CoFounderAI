import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing session (e.g., in localStorage)
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
                localStorage.setItem('token', data.token)
                return { success: true }
            } else {
                return { success: false, message: data.message }
            }
        } catch (err) {
            console.error(err)
            return { success: false, message: 'Server connection failed' }
        }
    }

    const signup = async (name, email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })
            const data = await response.json()
            if (response.ok) {
                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
                localStorage.setItem('token', data.token)
                return { success: true }
            } else {
                return { success: false, message: data.message }
            }
        } catch (err) {
            console.error(err)
            return { success: false, message: 'Server connection failed' }
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
