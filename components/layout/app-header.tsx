"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, FileText, Users, History, Moon, Sun, LogOut, User, Menu, BookOpen } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/components/auth-provider"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { usuario, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (pathname === "/login" || pathname === "/setup") {
    return null
  }

  if (!usuario) {
    return null
  }

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/os/rascunhos", label: "Rascunhos", icon: FileText },
    { href: "/historico", label: "Histórico", icon: History },
  ]

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <img src="/favicon.png" alt="logo" className="h-5 w-5 md:h-6 md:w-6 text-primary" />           
            <div>
              <h1 className="text-base md:text-xl font-semibold text-foreground">Medical Spin OS</h1>
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
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{usuario.nome}</span>
                    <span className="text-xs text-muted-foreground">{usuario.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/documentacao">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentação API
                  </Link>
                </DropdownMenuItem>
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
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{usuario.nome}</span>
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
                    <Button
                      asChild
                      variant={pathname === "/documentacao" ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/documentacao">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Documentação API
                      </Link>
                    </Button>
                  </nav>

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
  )
}
