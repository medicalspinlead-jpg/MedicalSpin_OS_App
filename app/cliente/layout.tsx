"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Inbox, PlusCircle, Moon, Sun, LogOut, User, Menu, Building2, MessageCircle, Mail, Bell, Settings } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { useState, useEffect, useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { usuario, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifWhatsapp, setNotifWhatsapp] = useState(false)
  const [notifEmail, setNotifEmail] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  // Carregar preferencias de notificacao do banco
  useEffect(() => {
    async function loadNotif() {
      try {
        const res = await fetch("/api/cliente/notificacoes")
        if (res.ok) {
          const data = await res.json()
          // Se ambas as opcoes estao desabilitadas, assume primeira vez e habilita as duas por padrao
          if (!data.notifEmail && !data.notifWhatsapp) {
            setNotifEmail(true)
            setNotifWhatsapp(true)
            await fetch("/api/cliente/notificacoes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notifEmail: true, notifWhatsapp: true }),
            })
          } else {
            setNotifEmail(data.notifEmail)
            setNotifWhatsapp(data.notifWhatsapp)
          }
        }
      } catch {
        // silenciar erro - manter defaults
      }
    }
    loadNotif()
  }, [])

  // Persistir alteracao no banco
  const salvarNotificacoes = useCallback(async (email: boolean, whatsapp: boolean) => {
    setNotifLoading(true)
    try {
      await fetch("/api/cliente/notificacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifEmail: email, notifWhatsapp: whatsapp }),
      })
    } catch {
      // silenciar erro
    } finally {
      setNotifLoading(false)
    }
  }, [])

  const handleNotifWhatsapp = useCallback((checked: boolean) => {
    setNotifWhatsapp(checked)
    salvarNotificacoes(notifEmail, checked)
  }, [notifEmail, salvarNotificacoes])

  const handleNotifEmail = useCallback((checked: boolean) => {
    setNotifEmail(checked)
    salvarNotificacoes(checked, notifWhatsapp)
  }, [notifWhatsapp, salvarNotificacoes])

  if (!usuario) return null

  const navItems = [
    { href: "/cliente", label: "Minhas Solicitações", icon: Inbox },
    { href: "/cliente/nova-solicitacao", label: "Nova OS", icon: PlusCircle },
    { href: "/cliente/perfil", label: "Meus Dados", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/cliente" className="flex items-center gap-2 hover:opacity-80">
              <img src="/favicon.png" alt="logo" className="h-5 w-5 md:h-6 md:w-6" />
              <div>
                <h1 className="text-base md:text-xl font-semibold text-foreground">Medical Spin</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Portal do Cliente</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={pathname === item.href ? "bg-accent" : ""}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="ml-2"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    {usuario.nome.split(" ")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span>{usuario.nome}</span>
                        <Badge variant="secondary">
                          <Building2 className="h-3 w-3 mr-1" />
                          Cliente
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{usuario.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                    <Bell className="h-3 w-3" />
                    Notificações de status
                  </DropdownMenuLabel>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between gap-3 py-1">
                      <Label htmlFor="notif-whatsapp-desktop" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        WhatsApp
                      </Label>
                      <Switch
                        id="notif-whatsapp-desktop"
                        checked={notifWhatsapp}
                        onCheckedChange={handleNotifWhatsapp}
                        disabled={notifLoading}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1">
                      <Label htmlFor="notif-email-desktop" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <Mail className="h-4 w-4 text-blue-600" />
                        E-mail
                      </Label>
                      <Switch
                        id="notif-email-desktop"
                        checked={notifEmail}
                        onCheckedChange={handleNotifEmail}
                        disabled={notifLoading}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-6">
                    {/* User Info */}
                    <div className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{usuario.nome}</span>
                            <Badge variant="secondary">Cliente</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{usuario.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-2">
                      {navItems.map((item) => (
                        <Button
                          key={item.href}
                          asChild
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className="justify-start"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Link>
                        </Button>
                      ))}
                    </nav>

                    {/* Notificacoes */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-1.5 mb-3 px-3">
                        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Notificações de status</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <Label htmlFor="notif-whatsapp-mobile" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          WhatsApp
                        </Label>
                        <Switch
                          id="notif-whatsapp-mobile"
                          checked={notifWhatsapp}
                          onCheckedChange={handleNotifWhatsapp}
                          disabled={notifLoading}
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <Label htmlFor="notif-email-mobile" className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                          <Mail className="h-4 w-4 text-blue-600" />
                          E-mail
                        </Label>
                        <Switch
                          id="notif-email-mobile"
                          checked={notifEmail}
                          onCheckedChange={handleNotifEmail}
                          disabled={notifLoading}
                        />
                      </div>
                    </div>

                    {/* Logout */}
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 mt-auto"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        logout()
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
