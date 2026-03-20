import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

// Remover usuario de um departamento (apenas admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; usuarioId: string }> }
) {
  try {
    const { id, usuarioId } = await params
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
    }
    
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    await prisma.usuarioDepartamento.deleteMany({
      where: { departamentoId: id, usuarioId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover usuario do departamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
