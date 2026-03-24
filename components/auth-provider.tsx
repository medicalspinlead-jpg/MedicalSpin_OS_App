"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

interface UsuarioDepartamento {
  id: string
  nome: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string | null
  cargo: "admin" | "tecnico" | "cliente" | string
  clienteId?: string | null
  departamentos?: UsuarioDepartamento[]
  notifEmail?: boolean
  notifWhatsapp?: boolean
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
  updateNotificacoes: (notifEmail: boolean, notifWhatsapp: boolean) => Promise<void>
  updatePerfil: (email: string, telefone: string) => Promise<boolean>
  refreshUsuario: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  logout: async () => {},
  config: null,
  setEmailHabilitado: async () => {},
  updateNotificacoes: async () => {},
  updatePerfil: async () => false,
  refreshUsuario: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const publicPaths = ["/login", "/setup", "/solicitar", "/registro"]

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

  // Usar regex para match exato: /cliente ou /cliente/... mas NAO /clientes
  const isClientePath = pathname === "/cliente" || pathname.startsWith("/cliente/")

  useEffect(() => {
    if (loading || isRedirecting.current) return

    // Nao autenticado e em rota protegida
    if (!usuario && !isPublicPath) {
      isRedirecting.current = true
      window.location.href = "/login"
      return
    }

    // Cliente tentando acessar rotas de tecnico
    if (usuario && usuario.cargo === "cliente" && !isClientePath && !isPublicPath) {
      isRedirecting.current = true
      window.location.href = "/cliente"
      return
    }

    // Tecnico/admin tentando acessar rotas de cliente
    if (usuario && usuario.cargo !== "cliente" && isClientePath) {
      isRedirecting.current = true
      window.location.href = "/"
      return
    }
  }, [loading, usuario, isPublicPath, isClientePath, pathname])

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

  const updateNotificacoes = useCallback(async (notifEmail: boolean, notifWhatsapp: boolean) => {
    if (!usuario) return
    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notifEmail, notifWhatsapp }),
      })

      if (response.ok) {
        setUsuario((prev) => prev ? { ...prev, notifEmail, notifWhatsapp } : null)
      }
    } catch (error) {
      console.error("Erro ao atualizar notificações:", error)
    }
  }, [usuario])

  const updatePerfil = useCallback(async (email: string, telefone: string): Promise<boolean> => {
    if (!usuario) return false
    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, telefone }),
      })

      if (response.ok) {
        setUsuario((prev) => prev ? { ...prev, email, telefone } : null)
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      return false
    }
  }, [usuario])

  const refreshUsuario = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setUsuario(data.usuario)
      }
    } catch (error) {
      console.error("Erro ao atualizar usuario:", error)
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
    <AuthContext.Provider value={{ usuario, loading, logout, config, setEmailHabilitado, updateNotificacoes, updatePerfil, refreshUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}
