import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { nome, email, senha, cnpj } = await request.json()

    if (!nome || !email || !senha || !cnpj) {
      return NextResponse.json(
        { error: "Nome, email, senha e CNPJ sao obrigatorios" },
        { status: 400 }
      )
    }

    // Verificar se email ja existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado no sistema" },
        { status: 409 }
      )
    }

    // Normalizar CNPJ - remover caracteres especiais
    const cnpjNormalizado = cnpj.replace(/[^\d]/g, "")

    // Buscar cliente pelo CNPJ
    const cliente = await prisma.cliente.findFirst({
      where: {
        cnpj: {
          contains: cnpjNormalizado,
        },
      },
    })

    if (!cliente) {
      // Tentar buscar com CNPJ formatado tambem
      const clienteFormatado = await prisma.cliente.findFirst({
        where: {
          cnpj: {
            contains: cnpj,
          },
        },
      })

      if (!clienteFormatado) {
        return NextResponse.json(
          { error: "CNPJ nao encontrado no sistema. Entre em contato com a Medical Spin para que sua empresa seja cadastrada antes de criar uma conta." },
          { status: 404 }
        )
      }

      // Encontrou com CNPJ formatado
      const senhaHash = hashPassword(senha)
      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email: email.toLowerCase(),
          senha: senhaHash,
          cargo: "cliente",
          clienteId: clienteFormatado.id,
        },
      })

      const token = await createSession(usuario.id)
      const cookieStore = await cookies()
      const isHttps = request.url.startsWith("https")

      cookieStore.set("session_token", token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      })

      return NextResponse.json({
        success: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cargo: usuario.cargo,
          clienteId: clienteFormatado.id,
        },
        empresa: clienteFormatado.razaoSocial,
      })
    }

    // Encontrou com CNPJ normalizado
    const senhaHash = hashPassword(senha)
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: senhaHash,
        cargo: "cliente",
        clienteId: cliente.id,
      },
    })

    const token = await createSession(usuario.id)
    const cookieStore = await cookies()
    const isHttps = request.url.startsWith("https")

    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        clienteId: cliente.id,
      },
      empresa: cliente.razaoSocial,
    })
  } catch (error) {
    console.error("Erro ao registrar usuario:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
