import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar se o usuário é admin
    const { data: adminCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      throw new Error('Acesso negado: apenas administradores podem gerenciar roles');
    }

    const { userId, rolesToAdd = [], rolesToRemove = [] } = await req.json();

    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    // Prevenir que admin remova sua própria role de admin
    if (userId === user.id && rolesToRemove.includes('admin')) {
      throw new Error('Você não pode remover sua própria role de admin');
    }

    // Remover roles especificadas
    if (rolesToRemove.length > 0) {
      const { error: removeError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .in('role', rolesToRemove);

      if (removeError) {
        console.error('Erro ao remover roles:', removeError);
        throw new Error(`Erro ao remover roles: ${removeError.message}`);
      }
    }

    // Adicionar roles especificadas
    if (rolesToAdd.length > 0) {
      const rolesToInsert = rolesToAdd.map(role => ({
        user_id: userId,
        role: role
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .upsert(rolesToInsert, { 
          onConflict: 'user_id,role',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Erro ao adicionar roles:', insertError);
        throw new Error(`Erro ao adicionar roles: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Roles atualizadas com sucesso',
        rolesToAdd,
        rolesToRemove
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na edge function admin-manage-user-roles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
