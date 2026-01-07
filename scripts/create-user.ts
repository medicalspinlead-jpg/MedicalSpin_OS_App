// Script para criar usuários no banco de dados
// Execute com: npx ts-node scripts/create-user.ts

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Função de hash simples (mesma do lib/auth.ts)
function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`
}

async function createUser() {
  // Configurações do usuário a ser criado
  const usuarios = [
    {
      nome: "Administrador",
      email: "admin@medicalspin.com",
      senha: "admin123",
      cargo: "admin",
    },
    {
      nome: "Técnico 1",
      email: "tecnico1@medicalspin.com",
      senha: "tecnico123",
      cargo: "tecnico",
    },
  ]

  for (const user of usuarios) {
    try {
      const existing = await prisma.usuario.findUnique({
        where: { email: user.email },
      })

      if (existing) {
        console.log(`Usuário ${user.email} já existe, pulando...`)
        continue
      }

      const usuario = await prisma.usuario.create({
        data: {
          nome: user.nome,
          email: user.email,
          senha: hashPassword(user.senha),
          cargo: user.cargo,
        },
      })

      console.log(`Usuário criado: ${usuario.nome} (${usuario.email})`)
    } catch (error) {
      console.error(`Erro ao criar usuário ${user.email}:`, error)
    }
  }

  await prisma.$disconnect()
}

createUser()
