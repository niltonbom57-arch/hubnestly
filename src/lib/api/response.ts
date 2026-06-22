import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types/api'

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function err(message: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function unauthorized(): NextResponse<ApiResponse<never>> {
  return err('Não autorizado', 401)
}

export function forbidden(): NextResponse<ApiResponse<never>> {
  return err('Acesso negado', 403)
}

export function notFound(resource = 'Recurso'): NextResponse<ApiResponse<never>> {
  return err(`${resource} não encontrado`, 404)
}

export function serverError(message = 'Erro interno do servidor'): NextResponse<ApiResponse<never>> {
  return err(message, 500)
}
