import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Solicitar Serviço - Medical Spin",
  description: "Solicite um serviço técnico para seu equipamento médico.",
}

export default function SolicitarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
