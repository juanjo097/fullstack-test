import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService, userService, type User, type Permission } from '../services'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = authService.getToken()
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      setToken(storedToken)
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    const loadUser = async () => {
      if (!storedToken) {
        setIsLoading(false)
        return
      }
      try {
        const me = await userService.getMe()
        localStorage.setItem('user', JSON.stringify(me))
        setUser(me)
      } catch (error) {
        console.error('Failed to refresh user session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadUser()
  }, [])

  const login = (newToken: string, newUser: User) => {
    authService.setToken(newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    authService.logout()
    authService.removeToken()
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const me = await userService.getMe()
    localStorage.setItem('user', JSON.stringify(me))
    setUser(me)
  }

  const hasPermission = (permission: Permission) =>
    user?.role?.permissions?.includes(permission) ?? false

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser,
        hasPermission,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
