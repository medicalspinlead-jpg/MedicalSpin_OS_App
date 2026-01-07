"use client"

import type React from "react"

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
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    if (checked) return

    async function checkAuth() {
      // Se é uma rota pública, não precisa verificar auth
      if (publicPaths.includes(pathname)) {
        setLoading(false)
        setChecked(true)
        return
      }

      try {
        const response = await fetch("/api/auth/me")

        if (response.ok) {
          const data = await response.json()
          setUsuario(data.usuario)
        } else {
          setUsuario(null)
        }
      } catch (error) {
        setUsuario(null)
      } finally {
        setLoading(false)
        setChecked(true)
      }
    }

    checkAuth()
  }, [checked, pathname])

  useEffect(() => {
    if (checked && !loading && !usuario && !isPublicPath) {
      window.location.href = "/login"
    }
  }, [checked, loading, usuario, isPublicPath])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUsuario(null)
      window.location.href = "/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100" />
      </div>
    )
  }

  if (!usuario && !isPublicPath) {
    return null
  }

  return <AuthContext.Provider value={{ usuario, loading, logout }}>{children}</AuthContext.Provider>
}
