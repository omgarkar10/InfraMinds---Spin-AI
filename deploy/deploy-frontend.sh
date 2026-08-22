#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# SPIN — Deploy frontend to Google Cloud Run
#
# Usage:
#   export GOOGLE_CLOUD_PROJECT=your-gcp-project
#   export VITE_API_URL=https://spin-api-xxxx-as.a.run.app
#   export VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
#   bash deploy/deploy-frontend.sh
# ─────────────────────────────────────────────────────────
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT}"
REGION="${GOOGLE_CLOUD_LOCATION:-asia-south1}"
SERVICE="spin-frontend"
IMAGE="gcr.io/${PROJECT}/${SERVICE}"

# Build args: Vite bakes these into the JS bundle at build time
VITE_API_URL="${VITE_API_URL:-}"
VITE_MAPS_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}"

echo "▶ Building Docker image: ${IMAGE}"
gcloud builds submit \
  --tag "${IMAGE}" \
  --file deploy/Dockerfile.frontend \
  --build-arg "VITE_API_URL=${VITE_API_URL}" \
  --build-arg "VITE_GOOGLE_MAPS_API_KEY=${VITE_MAPS_KEY}" \
  .

echo "▶ Deploying to Cloud Run: ${SERVICE} (${REGION})"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5

echo ""
echo "✓ Frontend deployed."
echo "  URL: $(gcloud run services describe ${SERVICE} --region ${REGION} --format='value(status.url)')"
