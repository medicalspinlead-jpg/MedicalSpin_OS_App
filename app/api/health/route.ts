// API de health check para verificar conexão com o banco
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const checks = {
    server: true,
    database: false,
    databaseUrl: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
    error: null as string | null,
  }

  try {
    // Tenta fazer uma query simples no banco
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    checks.error = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("[v0] Health check - Erro de conexão com banco:", checks.error)
  }

  const status = checks.database ? 200 : 503

  return NextResponse.json(checks, { status })
}
