/**
 * DEPLOY TO VERCEL
 *
 * Auto-deploys AI-generated website to Vercel:
 * - Takes HTML content
 * - Creates Vercel project
 * - Deploys to production
 * - Returns live URL
 *
 * Requirements:
 * - VERCEL_TOKEN environment variable (get from vercel.com/account/tokens)
 * - VERCEL_TEAM_ID (optional, if using team account)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

    const { project_id: _project_id, html_content, project_name } = await req.json();

    if (!html_content || !project_name) {
      throw new Error('html_content and project_name are required');
    }

    const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN');
    const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID');

    if (!VERCEL_TOKEN) {
      throw new Error('VERCEL_TOKEN not configured');
    }

    console.log('Deploying to Vercel:', project_name);

    // 1. Create deployment files
    const files = [
      {
        file: 'index.html',
        data: html_content,
      },
    ];

    // 2. Deploy to Vercel
    const deploymentPayload = {
      name: project_name,
      files: files.map((f) => ({
        file: f.file,
        data: btoa(f.data), // Base64 encode
      })),
      projectSettings: {
        framework: null,
      },
      target: 'production',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    };

    if (VERCEL_TEAM_ID) {
      headers['X-Vercel-Team-Id'] = VERCEL_TEAM_ID;
    }

    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers,
      body: JSON.stringify(deploymentPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Vercel API error:', errorData);
      throw new Error(`Vercel deployment failed: ${response.status} - ${errorData}`);
    }

    const deployment = await response.json();

    // 3. Get deployment URL
    const deploymentUrl = `https://${deployment.url}`;
    const productionUrl = deployment.alias?.[0] ? `https://${deployment.alias[0]}` : deploymentUrl;

    console.log('Deployed successfully:', productionUrl);

    return new Response(
      JSON.stringify({
        success: true,
        url: productionUrl,
        deployment_url: deploymentUrl,
        deployment_id: deployment.id,
        project_name: deployment.name,
        ready_state: deployment.readyState,
        message: '🚀 Website deployed successfully to Vercel',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deploying to Vercel:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Make sure VERCEL_TOKEN is configured in Supabase secrets',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
