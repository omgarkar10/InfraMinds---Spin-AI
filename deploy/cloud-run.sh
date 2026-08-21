#!/usr/bin/env bash
# Deploy SPIN agents as independent Cloud Run microservices (A2A topology)
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT}"
REGION="${GOOGLE_CLOUD_LOCATION:-asia-south1}"
IMAGE="gcr.io/${PROJECT}/spin-agent"

gcloud builds submit --tag "${IMAGE}" -f deploy/Dockerfile.agent .

for SERVICE in intake parsing geospatial policy; do
  gcloud run deploy "spin-${SERVICE}" \
    --image "${IMAGE}" \
    --region "${REGION}" \
    --set-env-vars "AGENT_SERVICE=${SERVICE},GOOGLE_CLOUD_PROJECT=${PROJECT}" \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1
done

gcloud run deploy spin-api \
  --source . \
  --dockerfile deploy/Dockerfile.api \
  --region "${REGION}" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT},SPIN_USE_REMOTE_AGENTS=true" \
  --allow-unauthenticated

echo "Deploy complete. Set agent card URLs in .env from Cloud Run service URLs."
