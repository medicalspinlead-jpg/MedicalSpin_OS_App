"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, X, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Verificar se já está instalado (modo standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) {
      console.log("[v0] PWA: App já está instalado (modo standalone)")
      return
    }

    // Verificar localStorage
    const hasDismissed = localStorage.getItem("pwa-install-dismissed")
    if (hasDismissed) {
      console.log("[v0] PWA: Usuário já dispensou o banner")
      return
    }

    // Capturar evento beforeinstallprompt (Chrome, Edge, etc)
    const handler = (e: BeforeInstallPromptEvent) => {
      console.log("[v0] PWA: Evento beforeinstallprompt capturado!")
      e.preventDefault()
      setDeferredPrompt(e)
      // Mostrar banner após capturar o evento
      setTimeout(() => {
        setShowBanner(true)
      }, 1000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Para iOS ou navegadores que não suportam beforeinstallprompt
    // Mostrar banner após 2 segundos se não recebeu o evento
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        console.log("[v0] PWA: Mostrando banner sem evento (iOS ou navegador não suportado)")
        setShowBanner(true)
      }
    }, 2000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      // iOS não suporta instalação automática
      return
    }

    if (!deferredPrompt) {
      console.log("[v0] PWA: Sem deferredPrompt disponível")
      // Tentar abrir o menu do navegador para instalação manual
      alert(
        "Para instalar o app:\n\n• Chrome/Edge: Clique nos 3 pontos (⋮) > 'Instalar aplicativo'\n• Firefox: Clique no ícone de casa na barra de endereço\n• Safari: Use o botão compartilhar > 'Adicionar à Tela de Início'",
      )
      return
    }

    setIsInstalling(true)

    try {
      console.log("[v0] PWA: Iniciando prompt de instalação...")
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("[v0] PWA: Resultado da instalação:", outcome)

      if (outcome === "accepted") {
        setShowBanner(false)
        localStorage.setItem("pwa-install-dismissed", "true")
      }
    } catch (error) {
      console.error("[v0] PWA: Erro ao instalar:", error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  const handleLater = () => {
    setShowBanner(false)
    // Remove o flag de visitado para aparecer novamente
    localStorage.removeItem("pwa-install-dismissed")
  }

  // Não mostrar se já está instalado
  if (isStandalone) return null

  if (!showBanner) return null

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm" onClick={handleLater} />

      {/* Banner centralizado */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Smartphone className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Medical Spin OS</h2>
                <p className="text-blue-100 text-sm">Sistema de Ordens de Serviço</p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Instalar aplicativo</h3>
            <p className="text-muted-foreground mb-6">
              Instale o app para ter acesso rápido na tela inicial do seu dispositivo.
            </p>

            {/* Benefícios */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Acesso rápido pela tela inicial</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Funciona mesmo sem internet</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Experiência de app nativo</span>
              </div>
            </div>

            {/* Instruções para iOS */}
            {isIOS && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Como instalar no iPhone/iPad:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>
                    Toque no botão <strong>Compartilhar</strong> <Share className="h-3 w-3 inline" />
                  </li>
                  <li>
                    Role e toque em <strong>"Adicionar à Tela de Início"</strong>
                  </li>
                  <li>
                    Toque em <strong>"Adicionar"</strong>
                  </li>
                </ol>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-3">
              {!isIOS && (
                <Button onClick={handleInstall} className="w-full h-12 text-base font-semibold" disabled={isInstalling}>
                  {isInstalling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Instalando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Instalar agora
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" onClick={handleLater} className="w-full">
                {isIOS ? "Fechar" : "Talvez mais tarde"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
