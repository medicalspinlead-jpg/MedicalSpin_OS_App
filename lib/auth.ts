import { prisma } from "./prisma"
import { cookies } from "next/headers"

// Função para hash de senha simples (em produção use bcrypt)
export function hashPassword(password: string): string {
  // Hash simples para demonstração - em produção use bcrypt
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}

// Gerar token de sessão
export function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// Criar sessão
export async function createSession(usuarioId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  await prisma.sessao.create({
    data: {
      usuarioId,
      token,
      expiresAt,
    },
  })

  return token
}

// Validar sessão
export async function validateSession(token: string) {
  const sessao = await prisma.sessao.findUnique({
    where: { token },
  })

  if (!sessao) return null
  if (new Date() > sessao.expiresAt) {
    await prisma.sessao.delete({ where: { id: sessao.id } })
    return null
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sessao.usuarioId },
    select: { id: true, nome: true, email: true, cargo: true, ativo: true },
  })

  if (!usuario || !usuario.ativo) return null

  return usuario
}

// Obter usuário atual
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session_token")?.value

  if (!token) return null

  return validateSession(token)
}

// Logout
export async function deleteSession(token: string) {
  await prisma.sessao.deleteMany({
    where: { token },
  })
}
