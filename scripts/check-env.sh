#!/bin/bash
# Deployment pre-flight check for House of Mornii Shopify Storefront

set -e

echo "Checking environment configuration..."

# Check if we is a production build
if [ "$NODE_ENV" = "production" ]; then
  echo "Running in production mode - validating Shopify credentials..."

  # Check for required environment variables
  if [ -z "$VITE_SHOPIFY_STORE_DOMAIN" ]; then
    echo "❌ Production deployment blocked: VITE_SHOPIFY_STORE_DOMAIN is not set"
    exit 1
  fi

  if [ -z "$VITE_SHOPIFY_STOREFRONT_TOKEN" ]; then
    echo "❌ Production deployment blocked: VITE_SHOPIFY_STOREFRONT_TOKEN is not set"
    exit 1
  fi

  # Check for placeholder values in domain
  if [[ "$VITE_SHOPIFY_STORE_DOMAIN" == *"CHANGE_ME"* ]] || \
     [[ "$VITE_SHOPIFY_STORE_DOMAIN" == *"your-store"* ]]; then
    echo "❌ Production deployment blocked: Placeholder domain detected"
    echo "   Domain: $VITE_SHOPIFY_STORE_DOMAIN"
    exit 1
  fi

  # Check for placeholder values in token (basic check)
  if [[ "$VITE_SHOPIFY_STOREFRONT_TOKEN" == *"your-token"* ]] || \
     [[ "$VITE_SHOPIFY_STOREFRONT_TOKEN" == *"CHANGE_ME"* ]]; then
    echo "❌ Production deployment blocked: Placeholder token detected"
    exit 1
  fi

  echo "✅ Shopify credentials validated successfully"
  echo "   Domain: $VITE_SHOPIFY_STORE_DOMAIN"
else
  echo "⚠️  Non-production build - skipping credential validation"
fi

echo "✅ Environment validation passed"
exit 0
