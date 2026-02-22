/**
 * GOOGLE ANALYTICS SYNC
 *
 * Extrae métricas automáticamente de Google Analytics 4 para startups existentes.
 * Reemplaza input manual con datos reales.
 *
 * Features:
 * - OAuth 2.0 flow con Google
 * - Extrae: traffic, conversions, top sources, bounce rate, etc.
 * - Guarda en proyecto para análisis automático
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logAICall } from '../_shared/aiLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GAMetrics {
  // Traffic
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageviews: number;
  avgSessionDuration: number; // seconds
  bounceRate: number; // percentage

  // Conversions
  conversions: number;
  conversionRate: number; // percentage
  goalCompletions: Record<string, number>;

  // Top sources
  topSources: Array<{
    source: string;
    users: number;
    conversions: number;
    revenue?: number;
  }>;

  // Top pages
  topPages: Array<{
    page: string;
    pageviews: number;
    avgTimeOnPage: number;
    exitRate: number;
  }>;

  // Demographics
  topCountries: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;

  // Trends
  userGrowth: number; // percentage change vs previous period
  revenueGrowth?: number;

  // Period
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface GARequest {
  projectId: string;
  // Option 1: Use saved access token
  accessToken?: string;
  // Option 2: Exchange auth code for token (first time)
  authCode?: string;
  // GA4 property ID
  propertyId?: string;
  // Date range
  startDate?: string; // YYYY-MM-DD, default: 30 days ago
  endDate?: string; // YYYY-MM-DD, default: today
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    const body: GARequest = await req.json();
    const { projectId, accessToken, authCode, propertyId, startDate, endDate } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing projectId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Syncing Google Analytics for project:', projectId);

    let token = accessToken;

    // If auth code provided, exchange for access token
    if (authCode && !token) {
      token = await exchangeCodeForToken(authCode);
    }

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No access token or auth code provided',
          authUrl: getGoogleOAuthUrl(),
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no property ID, fetch user's GA4 properties
    let gaPropertyId = propertyId;
    if (!gaPropertyId) {
      const properties = await fetchGA4Properties(token);
      if (properties.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No GA4 properties found. Make sure you have Google Analytics 4 set up.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Use first property by default (or let user choose)
      gaPropertyId = properties[0].id;
      console.log(`Using GA4 property: ${properties[0].name} (${gaPropertyId})`);
    }

    // Fetch metrics from GA4 API
    const metrics = await fetchGA4Metrics(token, gaPropertyId, startDate, endDate);

    // Save to project metadata
    await supabaseClient
      .from('projects')
      .update({
        metadata: {
          google_analytics: {
            propertyId: gaPropertyId,
            lastSync: new Date().toISOString(),
            metrics,
          },
        },
      })
      .eq('id', projectId);

    const executionTimeMs = Date.now() - startTime;

    // Log the sync
    await logAICall({
      supabaseClient,
      projectId,
      userId: undefined,
      functionName: 'google-analytics-sync',
      inputData: { propertyId: gaPropertyId, dateRange: metrics.dateRange },
      outputData: metrics,
      success: true,
      executionTimeMs,
    });

    console.log(`✅ GA metrics synced in ${executionTimeMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        propertyId: gaPropertyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error syncing Google Analytics:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync Google Analytics',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate Google OAuth URL for user authorization
 */
function getGoogleOAuthUrl(): string {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
  const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3000/auth/google/callback';

  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId || '');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return url.toString();
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3000/auth/google/callback';

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch user's GA4 properties
 */
async function fetchGA4Properties(accessToken: string): Promise<Array<{ id: string; name: string }>> {
  // List accounts
  const accountsResponse = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!accountsResponse.ok) {
    throw new Error('Failed to fetch GA4 accounts');
  }

  const accountsData = await accountsResponse.json();
  const properties: Array<{ id: string; name: string }> = [];

  // Extract properties from accounts
  for (const account of accountsData.accountSummaries || []) {
    for (const propertySummary of account.propertySummaries || []) {
      properties.push({
        id: propertySummary.property.split('/')[1], // Extract ID from "properties/123456"
        name: propertySummary.displayName,
      });
    }
  }

  return properties;
}

/**
 * Fetch metrics from GA4 Data API
 */
async function fetchGA4Metrics(
  accessToken: string,
  propertyId: string,
  startDate?: string,
  endDate?: string
): Promise<GAMetrics> {
  const start = startDate || getDateNDaysAgo(30);
  const end = endDate || getDateNDaysAgo(0);

  // GA4 Data API request
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'conversions' },
        ],
        dimensions: [],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GA4 API error: ${error}`);
  }

  const data = await response.json();

  // Parse metrics
  const row = data.rows?.[0]?.metricValues || [];

  // Fetch top sources
  const sourcesResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: 'activeUsers' }, { name: 'conversions' }],
        dimensions: [{ name: 'sessionSource' }],
        limit: 10,
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
    }
  );

  const sourcesData = await sourcesResponse.json();

  const topSources =
    sourcesData.rows?.map((r: any) => ({
      source: r.dimensionValues[0].value,
      users: parseInt(r.metricValues[0].value),
      conversions: parseInt(r.metricValues[1].value),
    })) || [];

  // Fetch top pages
  const pagesResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
        dimensions: [{ name: 'pagePath' }],
        limit: 10,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
    }
  );

  const pagesData = await pagesResponse.json();

  const topPages =
    pagesData.rows?.map((r: any) => ({
      page: r.dimensionValues[0].value,
      pageviews: parseInt(r.metricValues[0].value),
      avgTimeOnPage: parseFloat(r.metricValues[1].value),
      exitRate: 0, // Would need additional query
    })) || [];

  // Fetch top countries
  const countriesResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: 'activeUsers' }],
        dimensions: [{ name: 'country' }],
        limit: 10,
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
    }
  );

  const countriesData = await countriesResponse.json();
  const totalUsersForPercentage = parseInt(row[0]?.value || '0');

  const topCountries =
    countriesData.rows?.map((r: any) => {
      const users = parseInt(r.metricValues[0].value);
      return {
        country: r.dimensionValues[0].value,
        users,
        percentage: totalUsersForPercentage > 0 ? (users / totalUsersForPercentage) * 100 : 0,
      };
    }) || [];

  const metrics: GAMetrics = {
    totalUsers: parseInt(row[0]?.value || '0'),
    activeUsers: parseInt(row[1]?.value || '0'),
    newUsers: parseInt(row[2]?.value || '0'),
    sessions: parseInt(row[3]?.value || '0'),
    pageviews: parseInt(row[4]?.value || '0'),
    avgSessionDuration: parseFloat(row[5]?.value || '0'),
    bounceRate: parseFloat(row[6]?.value || '0') * 100,
    conversions: parseInt(row[7]?.value || '0'),
    conversionRate:
      parseInt(row[3]?.value || '0') > 0
        ? (parseInt(row[7]?.value || '0') / parseInt(row[3]?.value || '1')) * 100
        : 0,
    goalCompletions: {},
    topSources,
    topPages,
    topCountries,
    userGrowth: 0, // Would need previous period comparison
    dateRange: {
      startDate: start,
      endDate: end,
    },
  };

  return metrics;
}

/**
 * Helper: Get date N days ago in YYYY-MM-DD format
 */
function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}
