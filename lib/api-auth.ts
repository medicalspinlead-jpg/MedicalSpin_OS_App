import { NextResponse } from "next/server"

const SETUP_KEY = process.env.setupKey

export function validateApiKey(request: Request): { valid: boolean; response?: NextResponse } {
  const apiKey = request.headers.get("x-api-key")

  if (!apiKey || apiKey !== SETUP_KEY) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Acesso não autorizado", message: "Chave de API inválida ou não fornecida. Use o header 'x-api-key'" },
        { status: 401 },
      ),
    }
  }

  return { valid: true }
}

export const API_KEY = SETUP_KEY
