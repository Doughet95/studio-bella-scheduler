import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { accountType, password } = body

    if (!accountType || !password) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios' }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    if (accountType === 'single') {
      const { name, email } = body
      if (!name || !email) return NextResponse.json({ error: 'Nome e email obrigatórios' }, { status: 400 })

      // Create Family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{ type: 'single' }])
        .select()
        .single()
      
      if (familyError) throw familyError

      // Create User
      const { error: userError } = await supabase
        .from('app_users')
        .insert([{
          name,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          family_id: family.id
        }])
        .select()
        .single()
        
      if (userError) throw userError

      return NextResponse.json({ success: true, message: 'Conta criada com sucesso!' })
    } 
    
    if (accountType === 'couple') {
      const { name1, email1, name2, email2 } = body
      if (!name1 || !email1 || !name2 || !email2) {
        return NextResponse.json({ error: 'Dados dos dois parceiros são obrigatórios' }, { status: 400 })
      }

      // Hack for data migration: if douglas or tairine is registering, assign them to the FIRST family (which we created in SQL)
      let familyId;
      const lowerEmail1 = email1.toLowerCase()
      const lowerEmail2 = email2.toLowerCase()
      
      if (lowerEmail1 === 'douglas.smart20@gmail.com' || lowerEmail1 === 'doughet36@gmail.com' || lowerEmail2 === 'douglas.smart20@gmail.com' || lowerEmail2 === 'doughet36@gmail.com') {
        const { data: families } = await supabase.from('families').select('id').order('created_at', { ascending: true }).limit(1)
        if (families && families.length > 0) {
          familyId = families[0].id
        }
      }

      if (!familyId) {
        // Create new Family
        const { data: family, error: familyError } = await supabase
          .from('families')
          .insert([{ type: 'couple' }])
          .select()
          .single()
        if (familyError) throw familyError
        familyId = family.id
      }

      // Create User 1
      const { error: user1Error } = await supabase
        .from('app_users')
        .insert([{
          name: name1,
          email: lowerEmail1,
          password_hash: passwordHash,
          family_id: familyId
        }])
      if (user1Error) throw user1Error

      // Create User 2
      const { error: user2Error } = await supabase
        .from('app_users')
        .insert([{
          name: name2,
          email: lowerEmail2,
          password_hash: passwordHash,
          family_id: familyId
        }])
      if (user2Error) throw user2Error

      return NextResponse.json({ success: true, message: 'Conta de casal criada com sucesso!' })
    }

    return NextResponse.json({ error: 'Tipo de conta inválido' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Register error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao criar conta' }, { status: 500 })
  }
}
