import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

export const registerClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  has_allergies: z.enum(['yes', 'no']),
  allergy_details: z.string().optional(),
  has_extensions_before: z.enum(['yes', 'no']),
  had_reaction: z.enum(['yes', 'no']).optional(),
  plan_type: z.enum(['avulso', 'mensal']),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
}).refine((data) => {
  if (data.has_allergies === 'yes' && (!data.allergy_details || data.allergy_details.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Por favor, detalhe suas alergias',
  path: ['allergy_details'],
}).refine((data) => {
  if (data.has_extensions_before === 'yes' && !data.had_reaction) {
    return false;
  }
  return true;
}, {
  message: 'Informe se teve alguma reação alérgica',
  path: ['had_reaction'],
})

export const registerAdminSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido'),
  master_password: z.literal('920019000', {
    errorMap: () => ({ message: 'Senha mestre incorreta ou ausente' })
  }),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterClientFormData = z.infer<typeof registerClientSchema>
export type RegisterAdminFormData = z.infer<typeof registerAdminSchema>
