# Supabase SQL Setup

Run only the canonical setup scripts below for a fresh Supabase project:

1. `database_schema.sql`
2. `secure_rls_migration.sql`

`database_schema.sql` creates the base tables, indexes, triggers, and enables RLS. `secure_rls_migration.sql` installs the production RLS policy set and may be re-run to replace older policies.

The other SQL files in this directory are superseded repair scripts kept for legacy deployments only. Do not run them during a fresh setup:

- `FIX_DATABASE_RLS.sql`
- `STUDENT_DASHBOARD_FIX.sql`
- `add_profiles_table.sql`
- `enable_admin_stats.sql`
- `enable_public_verification.sql`

After running the two canonical scripts, test the app with student, institution, admin, and public verification flows.

Admin profiles should be promoted only by a trusted server-side/service-role process. Do not rely on client signup metadata for admin access.
