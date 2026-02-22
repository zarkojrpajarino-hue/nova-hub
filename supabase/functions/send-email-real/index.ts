/**
 * SEND EMAIL REAL - Resend Integration
 *
 * Actually SENDS emails (not just generates them) using Resend API.
 *
 * Features:
 * - Sends real emails via Resend
 * - Tracks status in sent_emails table
 * - Updates lead_conversations for context
 * - Handles errors and retries
 *
 * Requirements:
 * - RESEND_API_KEY environment variable
 * - company_assets.sender_email configured
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const {
      project_id,
      execution_id, // Optional: link to ai_task_execution
      lead_id, // Optional: link to lead
      to_email,
      to_name,
      subject,
      body_html,
      body_text,
    } = await req.json();

    if (!project_id || !to_email || !subject || !body_html) {
      throw new Error('project_id, to_email, subject, and body_html are required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get sender email from company_assets
    const { data: assets } = await supabaseClient
      .from('company_assets')
      .select('sender_email, sender_name, resend_api_key')
      .eq('project_id', project_id)
      .single();

    const senderEmail = assets?.sender_email || Deno.env.get('DEFAULT_SENDER_EMAIL') || 'onboarding@resend.dev';
    const senderName = assets?.sender_name || 'Nova Hub';
    const resendApiKey = assets?.resend_api_key || Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('Sending email from:', senderEmail, 'to:', to_email);

    // 2. Initialize Resend
    const resend = new Resend(resendApiKey);

    // 3. Create sent_email record (pending)
    const { data: sentEmailRecord } = await supabaseClient
      .from('sent_emails')
      .insert({
        execution_id,
        lead_id,
        project_id,
        from_email: senderEmail,
        from_name: senderName,
        to_email,
        subject,
        body_html,
        body_text,
        status: 'pending',
      })
      .select()
      .single();

    if (!sentEmailRecord) {
      throw new Error('Failed to create sent_email record');
    }

    // 4. Send email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
        to: to_name ? `${to_name} <${to_email}>` : to_email,
        subject: subject,
        html: body_html,
        text: body_text || stripHtml(body_html),
      });

      if (error) {
        console.error('Resend error:', error);

        // Update status to failed
        await supabaseClient
          .from('sent_emails')
          .update({
            status: 'failed',
            error_message: error.message || JSON.stringify(error),
          })
          .eq('id', sentEmailRecord.id);

        throw new Error(`Resend API error: ${error.message}`);
      }

      // 5. Update status to sent
      await supabaseClient
        .from('sent_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          external_id: data?.id,
        })
        .eq('id', sentEmailRecord.id);

      // 6. Save to lead_conversations if lead_id provided
      if (lead_id) {
        await supabaseClient.from('lead_conversations').insert({
          lead_id,
          project_id,
          conversation_type: 'email',
          subject,
          content: body_text || stripHtml(body_html),
          conversation_date: new Date().toISOString(),
          outcome: 'sent',
          next_action: 'wait_for_response',
        });
      }

      console.log('Email sent successfully:', data?.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ Email sent successfully',
          sent_email_id: sentEmailRecord.id,
          external_id: data?.id,
          status: 'sent',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (sendError: any) {
      // Update status to failed
      await supabaseClient
        .from('sent_emails')
        .update({
          status: 'failed',
          error_message: sendError.message,
        })
        .eq('id', sentEmailRecord.id);

      throw sendError;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Make sure RESEND_API_KEY is configured and sender_email is set in company_assets',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
