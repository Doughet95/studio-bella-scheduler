import { z } from 'zod'

export const bookingSchema = z.object({
  service_id: z.string().uuid('Selecione um serviço'),
  professional_id: z.string().uuid('Selecione um profissional'),
  scheduled_at: z.string().datetime('Data/hora inválida'),
  client_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  client_email: z.string().email('E-mail inválido'),
  client_phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  notes: z.string().max(500, 'Máximo de 500 caracteres').optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>

export const appointmentUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  internal_notes: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
})

export type AppointmentUpdateData = z.infer<typeof appointmentUpdateSchema>

export const clientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['sobrancelha', 'cilios', 'combo', 'outros']),
  duration_minutes: z.number().int().min(15).max(480),
  price: z.number().min(0),
  active: z.boolean().default(true),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export const availabilitySchema = z.object({
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  active: z.boolean().default(true),
})

export type AvailabilityFormData = z.infer<typeof availabilitySchema>
