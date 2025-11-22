import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  email: string;
  password: string;
  fullName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, fullName }: CreateAdminRequest = await req.json();

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    console.log('=== VERIFICANDO SE BANCO ESTÁ VAZIO ===');

    // SEGURANÇA: Verificar se o banco está vazio
    const { data: existingUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Já existem usuários no sistema. Esta função só pode ser usada para criar o primeiro admin em um banco limpo.');
    }

    console.log('✓ Banco vazio confirmado');
    console.log('=== CRIANDO PRIMEIRO ADMIN ===');

    // Criar usuário
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    });

    if (createError) throw createError;

    console.log(`✓ Usuário criado: ${newUser.user.id} (${email})`);

    // Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name: fullName || email,
        notifications_enabled: true
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Falha ao criar perfil do usuário');
    }

    console.log('✓ Perfil criado');

    // Atribuir roles (admin + user)
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert([
        { user_id: newUser.user.id, role: 'admin' },
        { user_id: newUser.user.id, role: 'user' }
      ]);

    if (rolesError) {
      console.error('Erro ao atribuir roles:', rolesError);
      await supabaseAdmin.from('profiles').delete().eq('id', newUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Falha ao atribuir roles ao usuário');
    }

    console.log('✓ Roles atribuídas (admin, user)');
    console.log('=== PRIMEIRO ADMIN CRIADO COM SUCESSO ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Primeiro administrador criado com sucesso',
        user: {
          id: newUser.user.id,
          email,
          roles: ['admin', 'user']
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-first-admin:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao criar primeiro administrador',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
