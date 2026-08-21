# SPIN Rollback Plan

Safety net procedures for undoing catastrophic changes to the ADK pipeline or frontend.

### Reverting ADK Agent Microservices (Cloud Run)
If the `RemoteA2aAgent` distributed pipeline fails in production:
1. Revert to local monolithic pipeline by unsetting the environment variable:
   `export SPIN_USE_REMOTE_AGENTS=false`
2. Restart the orchestrator API. This falls back to `SPIN_Local_Pipeline`.

### Reverting BigQuery Schema Changes
1. If a new metadata field breaks the `Geospatial_Correlation_Agent`, revert the ADK prompt in `agent.py` to the previous commit.
2. The BigQuery tables are append-only. Run the `scripts/cleanup_bad_inserts.sql` (if available) targeting the specific corrupted `grievance_id` batch.

### Frontend Revert
1. `git revert <bad-commit-hash>`
2. Re-run `npm run build` and push to Firebase Hosting.
