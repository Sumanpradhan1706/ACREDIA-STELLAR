import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sqlDir = join(process.cwd(), 'sql');

function readSql(name: string) {
  return readFileSync(join(sqlDir, name), 'utf8');
}

describe('database migration policy model', () => {
  it('keeps the base schema free of permissive public policies', () => {
    const schema = readSql('database_schema.sql');

    expect(schema).not.toMatch(/CREATE POLICY\s+"Anyone can insert institutions"/i);
    expect(schema).not.toMatch(/CREATE POLICY\s+"Anyone can insert students"/i);
    expect(schema).not.toMatch(/CREATE POLICY\s+"Anyone can view verification logs"/i);
    expect(schema).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(schema).not.toMatch(/WITH\s+CHECK\s*\(\s*true\s*\)/i);
  });

  it('keeps signup mirror triggers in the canonical schema path', () => {
    const schema = readSql('database_schema.sql');

    expect(schema).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');
    expect(schema).toContain('CREATE OR REPLACE FUNCTION public.handle_new_student_user()');
    expect(schema).toContain('CREATE OR REPLACE FUNCTION public.handle_new_institution_user()');
    expect(schema).toContain('CREATE TRIGGER on_auth_user_created_student');
    expect(schema).toContain('CREATE TRIGGER on_auth_user_created_institution');
    expect(schema).toContain('SECURITY DEFINER SET search_path = public');
  });

  it('defines the production RLS policy set in the secure migration', () => {
    const secure = readSql('secure_rls_migration.sql');

    expect(secure).toContain('DROP POLICY IF EXISTS "Public can view credentials for verification"');
    expect(secure).toContain('DROP POLICY IF EXISTS "Public can count institutions"');
    expect(secure).toContain('CREATE POLICY "Institutions can insert own data"');
    expect(secure).toContain('CREATE POLICY "Admin can view all credentials"');
  });

  it('marks legacy repair scripts as superseded instead of reopening policies', () => {
    const legacyFiles = [
      'FIX_DATABASE_RLS.sql',
      'STUDENT_DASHBOARD_FIX.sql',
      'add_profiles_table.sql',
      'enable_admin_stats.sql',
      'enable_public_verification.sql',
    ];

    for (const file of legacyFiles) {
      const sql = readSql(file);
      expect(sql).toContain('SUPERSEDED MIGRATION');
      expect(sql).toContain('secure_rls_migration.sql');
      expect(sql).not.toMatch(/CREATE POLICY/i);
    }
  });
});
