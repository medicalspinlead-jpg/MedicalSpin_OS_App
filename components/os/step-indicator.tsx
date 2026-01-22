import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

export function OSStepIndicator({ currentStep, osNumber, osId }: { currentStep: number; osNumber: string; osId: string }) {
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

      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
          <div
            style={{ width: `${(currentStep / 9) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
          />
        </div>
      </div>

      {/* Mobile Steps - Horizontal scrollable */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.number
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
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                  isCompleted && "bg-green-600 text-white",
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
          const isCompleted = currentStep > step.number
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
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isCompleted && "bg-green-600 text-white hover:bg-green-700",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground hover:bg-muted/80 hover:ring-2 hover:ring-primary/30",
                  isCurrent && "hover:ring-primary/40",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center leading-tight transition-colors",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground",
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
