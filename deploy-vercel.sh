#!/bin/bash

# Vercel Deployment Script for X Auto Poster

echo "🚀 Starting Vercel deployment for X Auto Poster..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if .vercel directory exists
if [ ! -d ".vercel" ]; then
    echo "📁 Initializing Vercel project..."
    vercel
fi

# Set environment variables
echo "🔧 Setting up environment variables..."
echo "Please set the following environment variables in Vercel dashboard:"
echo ""
echo "X_API_KEY=your_api_key_here"
echo "X_API_SECRET=your_api_secret_here"
echo "X_ACCESS_TOKEN=your_access_token_here"
echo "X_ACCESS_TOKEN_SECRET=your_access_token_secret_here"
echo "X_BEARER_TOKEN=your_bearer_token_here"
echo "CRON_SECRET=your_cron_secret_here"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "📊 Check your Vercel dashboard for deployment status"
echo "⏰ Cron jobs will run every 2 hours automatically"
echo "🔗 API endpoint: https://your-domain.vercel.app/api/x-auto-poster"
