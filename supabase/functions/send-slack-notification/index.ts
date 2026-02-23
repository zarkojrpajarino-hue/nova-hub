/**
 * SEND SLACK NOTIFICATION EDGE FUNCTION
 *
 * Envía notificaciones a Slack webhooks
 * Se llama desde triggers o manualmente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { checkRateLimit, createRateLimitResponse, RateLimitPresets } from '../_shared/rate-limiter-persistent.ts';

interface SlackMessage {
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

interface RequestBody {
  project_id: string;
  notification_type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  try {
    // CORS headers
      if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    // Parse request
    const { project_id, notification_type, message, metadata = {} }: RequestBody = await req.json();

    // Initialize Supabase client
        const { user, serviceClient: supabaseClient } = await validateAuth(req);

    const rateLimitResult = await checkRateLimit(user.id, 'send-slack-notification', RateLimitPresets.AI_GENERATION);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, getCorsHeaders(origin));
    }

    // Get active webhooks for this project and notification type
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from('slack_webhooks')
      .select('id, webhook_url, notification_types')
      .eq('enabled', true)
      .or(`project_id.eq.${project_id},project_id.is.null`)
      .contains('notification_types', [notification_type]);

    if (webhookError) {
      throw webhookError;
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active webhooks found',
          sent: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
          status: 200,
        }
      );
    }

    // Format Slack message
    const slackMessage: SlackMessage = {
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
      ],
    };

    // Add metadata as context if present
    if (Object.keys(metadata).length > 0) {
      slackMessage.blocks!.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_${new Date().toLocaleString('es-ES')}_`,
          },
        ],
      });
    }

    // Send to each webhook
    let sentCount = 0;
    const errors: string[] = [];

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });

        if (response.ok) {
          sentCount++;

          // Update last_used_at
          await supabaseClient
            .from('slack_webhooks')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', webhook.id);
        } else {
          const errorText = await response.text();
          errors.push(`Webhook ${webhook.id}: ${response.status} - ${errorText}`);
        }
      } catch (error) {
            if (error instanceof Response) return error;
errors.push(`Webhook ${webhook.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: webhooks.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 200,
      }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error sending Slack notification:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
        status: 500,
      }
    );
  }
});
