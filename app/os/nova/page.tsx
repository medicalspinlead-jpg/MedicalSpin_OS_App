"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createNovaOS, saveOrdemServico } from "@/lib/storage"

export default function NovaOSPage() {
  const router = useRouter()
  const [error, setError] = useState<string>("")
  const isCreating = useRef(false)

  useEffect(() => {
    if (isCreating.current) return

    async function criarOS() {
      isCreating.current = true
      try {
        const novaOS = createNovaOS()
        const { id, ...osData } = novaOS
        const osCriada = await saveOrdemServico(osData as any)

        if (osCriada && osCriada.id) {
          router.push(`/os/${osCriada.id}/etapa/1`)
        } else {
          setError("Erro ao criar OS: ID não retornado")
          isCreating.current = false
        }
      } catch (err) {
        console.error("Erro ao criar OS:", err)
        setError("Erro ao criar nova Ordem de Serviço")
        isCreating.current = false
      }
    }

    criarOS()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => router.push("/")} className="mt-4 text-primary underline">
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Criando nova Ordem de Serviço...</p>
      </div>
    </div>
  )
}
