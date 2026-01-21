"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: "admin" | "tecnico" | string
}

interface Configuracao {
  id: string
  emailHabilitado: boolean
}

interface AuthContextType {
  usuario: Usuario | null
  loading: boolean
  logout: () => Promise<void>
  config: Configuracao | null
  setEmailHabilitado: (habilitado: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  logout: async () => {},
  config: null,
  setEmailHabilitado: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const publicPaths = ["/login", "/setup"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Configuracao | null>(null)
  const pathname = usePathname()
  const hasChecked = useRef(false)
  const isRedirecting = useRef(false)

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    async function checkAuth() {
      if (isPublicPath) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setUsuario(data.usuario)

          // Buscar configurações
          try {
            const configRes = await fetch("/api/config", { credentials: "include" })
            if (configRes.ok) {
              const configData = await configRes.json()
              setConfig(configData)
            }
          } catch {
            console.error("Erro ao buscar configurações")
          }
        } else {
          setUsuario(null)
        }
      } catch (error) {
        setUsuario(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading && !usuario && !isPublicPath && !isRedirecting.current) {
      isRedirecting.current = true
      window.location.href = "/login"
    }
  }, [loading, usuario, isPublicPath])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUsuario(null)
      window.location.href = "/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }, [])

  const setEmailHabilitado = useCallback(async (habilitado: boolean) => {
    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailHabilitado: habilitado }),
      })

      if (response.ok) {
        const configData = await response.json()
        setConfig(configData)
      }
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error)
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

  return (
    <AuthContext.Provider value={{ usuario, loading, logout, config, setEmailHabilitado }}>
      {children}
    </AuthContext.Provider>
  )
}
