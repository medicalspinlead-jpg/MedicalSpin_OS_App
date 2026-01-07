"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getOrdemServico, saveOrdemServico, finalizarOrdemServico, type OrdemServico } from "@/lib/storage"
import { OSStepIndicator } from "@/components/os/step-indicator"
import { Step1DadosEmpresa } from "@/components/os/steps/step1-empresa"
import { Step2DadosEquipamento } from "@/components/os/steps/step2-equipamento"
import { Step3MotivoEventos } from "@/components/os/steps/step3-motivo"
import { Step4Intervencao } from "@/components/os/steps/step4-intervencao"
import { Step5Pecas } from "@/components/os/steps/step5-pecas"
import { Step6MaoObra } from "@/components/os/steps/step6-mao-obra"
import { Step7Pendencias } from "@/components/os/steps/step7-pendencias"
import { Step8EstadoEquipamento } from "@/components/os/steps/step8-estado"
import { Step9Finalizacao } from "@/components/os/steps/step9-finalizacao"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OSEtapaPage() {
  const params = useParams()
  const id = params.id as string
  const step = params.step as string

  return <OSEtapaPageClient id={id} step={step} />
}

function OSEtapaPageClient({ id, step }: { id: string; step: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [os, setOs] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const currentStep = Number.parseInt(step)
  const stepDataRef = useRef<any>(null)

  useEffect(() => {
    async function loadOS() {
      setLoading(true)
      try {
        const osData = await getOrdemServico(id)
        if (!osData) {
          toast({
            title: "Erro",
            description: "Ordem de Serviço não encontrada",
            variant: "destructive",
          })
          router.push("/")
          return
        }
        setOs(osData)
      } catch (error) {
        console.error("Erro ao carregar OS:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar Ordem de Serviço",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadOS()
  }, [id])

  const handleSave = async (data: Partial<OrdemServico>, goToNext = false) => {
    if (!os) return

    const updatedOS = {
      ...os,
      ...data,
      currentStep: goToNext ? currentStep + 1 : currentStep,
    }

    try {
      await saveOrdemServico(updatedOS)
      setOs(updatedOS)

      toast({
        title: "Salvo",
        description: "Rascunho salvo com sucesso!",
      })

      if (goToNext && currentStep < 9) {
        router.push(`/os/${id}/etapa/${currentStep + 1}`)
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar dados",
        variant: "destructive",
      })
    }
  }

  const handleSaveDraft = async () => {
    if (!stepDataRef.current) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o rascunho. Por favor, tente novamente.",
        variant: "destructive",
      })
      return
    }

    const currentData = stepDataRef.current.getCurrentData()

    if (!os) return

    const updatedOS = {
      ...os,
      ...currentData,
      currentStep: currentStep,
    }

    try {
      await saveOrdemServico(updatedOS)

      toast({
        title: "Rascunho salvo!",
        description: "Seu progresso foi salvo com sucesso.",
      })

      router.push("/os/rascunhos")
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar rascunho",
        variant: "destructive",
      })
    }
  }

  const handleFinalizar = async (data: Partial<OrdemServico>) => {
    if (!os) return

    const updatedOS = {
      ...os,
      ...data,
    }

    try {
      await saveOrdemServico(updatedOS)
      await finalizarOrdemServico(id)

      toast({
        title: "Sucesso!",
        description: "Ordem de Serviço finalizada com sucesso!",
      })

      router.push(`/os/${id}/visualizar`)
    } catch (error) {
      console.error("Erro ao finalizar:", error)
      toast({
        title: "Erro",
        description: "Erro ao finalizar OS",
        variant: "destructive",
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      router.push(`/os/${id}/etapa/${currentStep - 1}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!os) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <OSStepIndicator currentStep={currentStep} osNumber={os.numero} />

        <div className="mt-6">
          {currentStep === 1 && <Step1DadosEmpresa os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 2 && <Step2DadosEquipamento os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 3 && <Step3MotivoEventos os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 4 && <Step4Intervencao os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 5 && <Step5Pecas os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 6 && <Step6MaoObra os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 7 && <Step7Pendencias os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 8 && <Step8EstadoEquipamento os={os} onSave={handleSave} ref={stepDataRef} />}
          {currentStep === 9 && (
            <Step9Finalizacao
              os={os}
              onSave={handleSave}
              onFinalizar={handleFinalizar}
              onSaveDraft={handleSaveDraft}
              ref={stepDataRef}
            />
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious} className="bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < 9 && (
            <Button variant="outline" onClick={handleSaveDraft} className="bg-transparent">
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
