#!/bin/bash

# X Auto Poster Deployment Script

echo "🚀 Starting X Auto Poster deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if config.env exists
if [ ! -f "config.env" ]; then
    echo "❌ config.env file not found. Please copy env.example to config.env and configure it."
    exit 1
fi

# Create logs directory
mkdir -p logs

# Build and start the container
echo "📦 Building Docker image..."
docker-compose build

echo "🚀 Starting X Auto Poster service..."
docker-compose up -d

echo "✅ X Auto Poster deployed successfully!"
echo "📊 Check logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
echo "🔄 Restart with: docker-compose restart"
