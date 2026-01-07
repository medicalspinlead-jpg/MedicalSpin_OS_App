"use client"

import { useEffect } from "react"

export function RegisterServiceWorker() {
  useEffect(() => {
    console.log("[v0] Service Worker: Verificando suporte")

    if ("serviceWorker" in navigator) {
      console.log("[v0] Service Worker: Suporte detectado")

      window.addEventListener("load", () => {
        console.log("[v0] Service Worker: Tentando registrar")

        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("[v0] Service Worker: Registrado com sucesso", registration.scope)
          })
          .catch((error) => {
            console.error("[v0] Service Worker: Falha ao registrar", error)
          })
      })
    } else {
      console.log("[v0] Service Worker: Não suportado neste navegador")
    }
  }, [])

  return null
}
