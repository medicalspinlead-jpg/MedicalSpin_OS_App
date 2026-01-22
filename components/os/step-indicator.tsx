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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Ordem de Serviço {osNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
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

      {/* Steps */}
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
