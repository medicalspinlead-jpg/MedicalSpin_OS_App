// API para criar usuário inicial (use apenas uma vez)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { nome, email, senha, cargo, setupKey } = await request.json()

    // Chave de segurança para evitar criação não autorizada
    if (setupKey !== "medicalspin2026") {
      return NextResponse.json({ error: "Chave de setup inválida" }, { status: 403 })
    }

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
    }

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: hashPassword(senha),
        cargo: cargo || "admin",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Usuário criado com sucesso",
        usuario,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
