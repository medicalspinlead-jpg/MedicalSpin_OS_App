// API para criar usuário inicial (use apenas uma vez)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    console.log("[v0] Setup: Iniciando...")
    console.log("[v0] Setup: DATABASE_URL existe:", !!process.env.DATABASE_URL)

    const { nome, email, senha, cargo, setupKey } = await request.json()
    console.log("[v0] Setup: Dados recebidos - nome:", nome, "email:", email)

    // Chave de segurança para evitar criação não autorizada
    if (setupKey !== "medicalspin2024") {
      return NextResponse.json({ error: "Chave de setup inválida" }, { status: 403 })
    }

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Setup: Verificando se usuário existe...")
    const existingUser = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })
    console.log("[v0] Setup: Usuário existente:", !!existingUser)

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
    }

    console.log("[v0] Setup: Criando usuário...")
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
    console.log("[v0] Setup: Usuário criado com ID:", usuario.id)

    return NextResponse.json(
      {
        success: true,
        message: "Usuário criado com sucesso",
        usuario,
      },
      { status: 201 },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    const errorStack = error instanceof Error ? error.stack : ""
    console.error("[v0] Setup ERRO:", errorMessage)
    console.error("[v0] Setup ERRO Stack:", errorStack)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
