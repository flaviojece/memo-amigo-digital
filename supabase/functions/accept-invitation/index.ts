import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  invitation_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[AcceptInvitation] Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invitation_id } = await req.json() as AcceptInvitationRequest;

    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: 'invitation_id is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AcceptInvitation] User ${user.id} accepting invitation ${invitation_id}`);

    // Use service role client for operations that need to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get and validate invitation (without auto-join)
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('guardian_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      console.error('[AcceptInvitation] Invitation not found:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado ou já foi processado' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      console.error('[AcceptInvitation] Invitation expired');
      return new Response(
        JSON.stringify({ error: 'Este convite expirou' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify user matches invited email or is already the guardian
    if (invitation.invited_email !== user.email && invitation.guardian_id !== user.id) {
      console.error('[AcceptInvitation] User email mismatch');
      return new Response(
        JSON.stringify({ error: 'Este convite não foi enviado para você' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AcceptInvitation] Invitation validated, updating status...');

    // 4. Update invitation status to accepted
    const { error: updateError } = await supabaseAdmin
      .from('guardian_invitations')
      .update({
        status: 'accepted',
        guardian_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('[AcceptInvitation] Error updating invitation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar convite' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AcceptInvitation] Invitation updated, checking for existing relationship...');

    // 5. Check if relationship already exists
    const { data: existingRelationship } = await supabaseAdmin
      .from('guardian_relationships')
      .select('id')
      .eq('patient_id', invitation.patient_id)
      .eq('guardian_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!existingRelationship) {
      console.log('[AcceptInvitation] Creating new guardian relationship...');

      // 6. Create guardian relationship
      const { error: relationshipError } = await supabaseAdmin
        .from('guardian_relationships')
        .insert({
          patient_id: invitation.patient_id,
          guardian_id: user.id,
          access_level: invitation.access_level,
          relationship_type: invitation.relationship_type,
          status: 'active',
        });

      if (relationshipError) {
        console.error('[AcceptInvitation] Error creating relationship:', relationshipError);
        
        // If it's a duplicate key error, it's not critical
        if (relationshipError.code !== '23505') {
          return new Response(
            JSON.stringify({ error: 'Erro ao criar relacionamento' }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('[AcceptInvitation] Relationship created successfully');
    } else {
      console.log('[AcceptInvitation] Relationship already exists, skipping creation');
    }

    // 7. Add angel role if user doesn't have it
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'angel')
      .maybeSingle();

    if (!existingRole) {
      console.log('[AcceptInvitation] Adding angel role to user...');
      
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'angel',
        });

      if (roleError) {
        console.error('[AcceptInvitation] Error adding angel role:', roleError);
        // Non-critical, continue
      } else {
        console.log('[AcceptInvitation] Angel role added successfully');
      }
    }

    // Fetch patient name separately
    const { data: patientProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', invitation.patient_id)
      .maybeSingle();

    const patientName = patientProfile?.full_name || 'este paciente';
    
    console.log('[AcceptInvitation] Success! User is now guardian of', patientName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Convite aceito! Você agora é cuidador de ${patientName}.`,
        patient_name: patientName
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[AcceptInvitation] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro inesperado ao aceitar convite' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
