"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
}

interface AuthContextType {
  usuario: Usuario | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  logout: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const publicPaths = ["/login", "/setup"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    async function checkAuth() {
      if (isPublicPath) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!response.ok) {
          setUsuario(null)
          router.replace("/login")
          return
        }

        const data = await response.json()
        setUsuario(data.usuario)
      } catch {
        setUsuario(null)
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUsuario(null)
    router.replace("/login")
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
