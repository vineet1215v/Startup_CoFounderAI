import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch } from '../config/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('token')
            const storedUser = localStorage.getItem('user')

            if (!token) {
                setLoading(false)
                return
            }

            if (storedUser) {
                setUser(JSON.parse(storedUser))
            }

            try {
                const response = await apiFetch('/api/auth/me')
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.message || 'Session expired')
                }

                setUser(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
            } catch (error) {
                console.error(error)
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        restoreSession()
    }, [])

    const login = async (email, password) => {
        try {
            const response = await apiFetch('/api/auth/login', {
                method: 'POST',
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
            const response = await apiFetch('/api/auth/register', {
                method: 'POST',
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
