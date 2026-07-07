import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { bookingSchema } from '@/lib/validations'
import { formatCurrency, formatDuration, getInitials, getStatusLabel } from '@/lib/utils'

// ── Validation tests ──────────────────────────────────────────

describe('loginSchema', () => {
  it('validates a correct email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: 'senha123' })
    expect(result.success).toBe(true)
  })

  it('fails with invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'senha123' })
    expect(result.success).toBe(false)
  })

  it('fails with short password', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', password: '123' })
    expect(result.success).toBe(false)
  })
})

describe('bookingSchema', () => {
  const validBooking = {
    service_id: '550e8400-e29b-41d4-a716-446655440000',
    professional_id: '550e8400-e29b-41d4-a716-446655440001',
    scheduled_at: new Date().toISOString(),
    client_name: 'Ana Silva',
    client_email: 'ana@email.com',
    client_phone: '(71) 99999-9999',
  }

  it('validates a complete booking', () => {
    const result = bookingSchema.safeParse(validBooking)
    expect(result.success).toBe(true)
  })

  it('fails with invalid UUID for service_id', () => {
    const result = bookingSchema.safeParse({ ...validBooking, service_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('fails with invalid email', () => {
    const result = bookingSchema.safeParse({ ...validBooking, client_email: 'not-email' })
    expect(result.success).toBe(false)
  })
})

// ── Utility function tests ────────────────────────────────────

describe('formatCurrency', () => {
  it('formats BRL correctly', () => {
    expect(formatCurrency(150)).toMatch(/R\$\s?150/)
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s?0/)
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45 min')
  })

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min')
  })
})

describe('getInitials', () => {
  it('returns two initials from full name', () => {
    expect(getInitials('Ana Paula')).toBe('AP')
  })

  it('returns one initial for single name', () => {
    expect(getInitials('Ana')).toBe('A')
  })
})

describe('getStatusLabel', () => {
  it('returns correct label for pending', () => {
    expect(getStatusLabel('pending')).toBe('Pendente')
  })

  it('returns correct label for completed', () => {
    expect(getStatusLabel('completed')).toBe('Concluído')
  })
})
