#!/bin/bash

# ============================================
# NOVA HUB - DEPLOYMENT SCRIPT
# Deploys Edge Functions and configures secrets
# ============================================

set -e  # Exit on error

echo "🚀 NOVA HUB DEPLOYMENT"
echo "======================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Login with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated with Supabase"
echo ""

# Deploy Edge Functions
echo "📦 Deploying Edge Functions..."
echo ""

echo "  1/2 Deploying send-slack-notification..."
supabase functions deploy send-slack-notification
echo "  ✅ send-slack-notification deployed"
echo ""

echo "  2/2 Deploying extract-business-info..."
supabase functions deploy extract-business-info
echo "  ✅ extract-business-info deployed"
echo ""

# Check for ANTHROPIC_API_KEY
echo "🔑 Checking secrets..."
echo ""

if supabase secrets list 2>/dev/null | grep -q "ANTHROPIC_API_KEY"; then
    echo "  ✅ ANTHROPIC_API_KEY already configured"
else
    echo "  ⚠️  ANTHROPIC_API_KEY not found"
    echo ""
    echo "  To configure it:"
    echo "  1. Get your key from https://console.anthropic.com/"
    echo "  2. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo ""
fi

echo ""
echo "✨ DEPLOYMENT COMPLETE!"
echo ""
echo "Next steps:"
echo "  1. Configure ANTHROPIC_API_KEY if not done (see above)"
echo "  2. Run: npm run dev"
echo "  3. Test Integrations and AI Onboarding"
echo ""
echo "🎉 Your app is ready!"
