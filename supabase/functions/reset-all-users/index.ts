import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetUsersRequest {
  newAdminEmail?: string;
  newAdminPassword?: string;
  newAdminFullName?: string;
  deleteAllOnly?: boolean;
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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar se é admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      throw new Error('Apenas administradores podem executar esta ação');
    }

    const { newAdminEmail, newAdminPassword, newAdminFullName, deleteAllOnly }: ResetUsersRequest = await req.json();

    if (!deleteAllOnly && (!newAdminEmail || !newAdminPassword)) {
      throw new Error('Email e senha são obrigatórios (a menos que deleteAllOnly seja true)');
    }

    console.log('=== INICIANDO RESET COMPLETO DO BANCO ===');

    // PASSO 1: Buscar todos os usuários
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;

    console.log(`Total de usuários a deletar: ${users.length}`);

    // PASSO 2: Deletar TODOS os usuários
    for (const existingUser of users) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error(`Erro ao deletar usuário ${existingUser.email}:`, deleteError);
      } else {
        console.log(`✓ Usuário ${existingUser.email} deletado`);
      }
    }

    console.log('=== TODOS OS USUÁRIOS DELETADOS ===');

    // Se deleteAllOnly é true, retorna aqui sem criar novo admin
    if (deleteAllOnly) {
      console.log('=== MODO DELETE ALL ONLY - NÃO CRIANDO NOVO ADMIN ===');
      return new Response(
        JSON.stringify({
          success: true,
          message: `Todos os ${users.length} usuários foram deletados. Banco limpo.`,
          usersDeleted: users.length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // PASSO 3: Criar novo usuário admin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newAdminEmail,
      password: newAdminPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: newAdminFullName || newAdminEmail
      }
    });

    if (createError) throw createError;

    console.log(`✓ Novo usuário criado: ${newUser.user.id} (${newAdminEmail})`);

    // PASSO 4: Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: newAdminEmail,
        full_name: newAdminFullName || newAdminEmail,
        notifications_enabled: true
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Deletar usuário se perfil falhar
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Falha ao criar perfil do usuário');
    }

    console.log('✓ Perfil criado');

    // PASSO 5: Atribuir roles (admin + user)
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert([
        { user_id: newUser.user.id, role: 'admin' },
        { user_id: newUser.user.id, role: 'user' }
      ]);

    if (rolesError) {
      console.error('Erro ao atribuir roles:', rolesError);
      // Deletar usuário e perfil se roles falharem
      await supabaseAdmin.from('profiles').delete().eq('id', newUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error('Falha ao atribuir roles ao usuário');
    }

    console.log('✓ Roles atribuídas (admin, user)');
    console.log('=== RESET COMPLETO FINALIZADO COM SUCESSO ===');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Banco de dados resetado com sucesso',
        user: {
          id: newUser.user.id,
          email: newAdminEmail,
          roles: ['admin', 'user']
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in reset-all-users:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao resetar banco de dados',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
