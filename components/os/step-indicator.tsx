import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { OrdemServico } from "@/lib/storage"

const STEPS = [
  { number: 1, name: "Dados da Empresa" },
  { number: 2, name: "Dados do Equipamento" },
  { number: 3, name: "Motivo e Eventos" },
  { number: 4, name: "Tipo de Intervenção" },
  { number: 5, name: "Peças" },
  { number: 6, name: "Mão de Obra" },
  { number: 7, name: "Pendências" },
  { number: 8, name: "Estado do Equipamento" },
  { number: 9, name: "Local e Assinaturas" },
]

// Funcao para verificar se uma etapa esta completa - TODOS os campos devem estar preenchidos
export function isStepComplete(stepNumber: number, os: OrdemServico): boolean {
  switch (stepNumber) {
    case 1:
      // Etapa 1: Dados da Empresa - TODOS os campos
      return !!(
        os.empresa?.razaoSocial?.trim() &&
        os.empresa?.nomeFantasia?.trim() &&
        os.empresa?.cnpj?.trim() &&
        os.empresa?.cidade?.trim() &&
        os.empresa?.uf?.trim() &&
        os.empresa?.telefone?.trim() &&
        os.empresa?.email?.trim() &&
        os.empresa?.responsavel?.trim()
      )
    case 2:
      // Etapa 2: Equipamento - cliente e equipamento selecionados
      return !!(os.cliente?.id && os.equipamento?.id)
    case 3:
      // Etapa 3: Motivo - TODOS os campos (motivacao E eventos)
      return !!(
        os.motivo?.motivacaoServico?.trim() &&
        os.motivo?.eventosRelevantes?.trim()
      )
    case 4:
      // Etapa 4: Intervencao - TODOS os campos (tipo E descricao)
      return !!(
        os.intervencao?.tipo?.trim() &&
        os.intervencao?.descricaoServicos?.trim()
      )
    case 5:
      // Etapa 5: Pecas - opcional, considera completa se o usuario ja passou por ela
      return os.currentStep > 5 || os.pecas?.length > 0
    case 6:
      // Etapa 6: Mao de Obra - pelo menos um dia de trabalho adicionado
      return os.maoDeObra?.length > 0
    case 7:
      // Etapa 7: Pendencias - TODOS os campos (medicalSpin E cliente)
      return !!(
        os.pendencias?.medicalSpin?.trim() &&
        os.pendencias?.cliente?.trim()
      )
    case 8:
      // Etapa 8: Estado do Equipamento - TODOS os campos (inicial E final)
      return !!(
        os.estadoEquipamento?.estadoInicial?.trim() &&
        os.estadoEquipamento?.estadoFinal?.trim()
      )
    case 9:
      // Etapa 9: Finalizacao - TODOS os campos
      return !!(
        os.finalizacao?.cidade?.trim() &&
        os.finalizacao?.uf?.trim() &&
        os.finalizacao?.nomeEngenheiro?.trim() &&
        os.finalizacao?.cftEngenheiro?.trim() &&
        os.finalizacao?.responsavel?.trim()
      )
    default:
      return false
  }
}

// Verifica se todas as etapas de 1 a 8 estao completas
export function areSteps1to8Complete(os: OrdemServico): boolean {
  for (let i = 1; i <= 8; i++) {
    if (!isStepComplete(i, os)) {
      return false
    }
  }
  return true
}

// Calcula quantas etapas estao completas
function countCompletedSteps(os: OrdemServico): number {
  let count = 0
  for (let i = 1; i <= 9; i++) {
    if (isStepComplete(i, os)) {
      count++
    }
  }
  return count
}

export function OSStepIndicator({ 
  currentStep, 
  osNumber, 
  osId, 
  os 
}: { 
  currentStep: number
  osNumber: string
  osId: string
  os: OrdemServico
}) {
  const completedCount = countCompletedSteps(os)
  
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate">
            OS {osNumber}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Etapa {currentStep} de 9: {STEPS[currentStep - 1].name}
          </p>
        </div>
      </div>

      {/* Progress Bar - agora baseado em etapas completas */}
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
          <div
            style={{ width: `${(completedCount / 9) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600 transition-all duration-500"
          />
        </div>
      </div>

      {/* Mobile Steps - Horizontal scrollable */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {STEPS.map((step) => {
          const isCompleted = isStepComplete(step.number, os)
          const isCurrent = currentStep === step.number

          return (
            <Link
              key={step.number}
              href={`/os/${osId}/etapa/${step.number}`}
              className="shrink-0"
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all cursor-pointer",
                  isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                  isCurrent && isCompleted && "bg-green-600 text-white ring-2 ring-green-400/40",
                  isCompleted && !isCurrent && "bg-green-600 text-white",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : step.number}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Desktop Steps */}
      <div className="hidden md:flex items-center justify-between gap-2">
        {STEPS.map((step) => {
          const isCompleted = isStepComplete(step.number, os)
          const isCurrent = currentStep === step.number

          return (
            <Link
              key={step.number}
              href={`/os/${osId}/etapa/${step.number}`}
              className="flex flex-col items-center flex-1 group"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer",
                  isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isCurrent && isCompleted && "bg-green-600 text-white ring-4 ring-green-400/40",
                  isCompleted && !isCurrent && "bg-green-600 text-white hover:bg-green-700",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80 hover:ring-2 hover:ring-primary/30",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center leading-tight transition-colors",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground",
                  isCompleted && !isCurrent && "text-green-600",
                )}
              >
                {step.name.split(" ").slice(0, 2).join(" ")}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
