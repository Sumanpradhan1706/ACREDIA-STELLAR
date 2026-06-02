-- One-time admin migration: safely repair orphaned student rows.
-- Run with a privileged admin/service role connection after reviewing the previews.

BEGIN;

-- Preview orphaned student rows (missing auth_user_id).
SELECT
    s.id,
    s.email,
    s.name,
    s.created_at
FROM public.students AS s
WHERE s.auth_user_id IS NULL
ORDER BY s.created_at ASC;

-- Preview candidate auth users for orphaned rows.
SELECT
    s.id AS student_id,
    s.email AS student_email,
    u.id AS auth_user_id,
    p.role AS profile_role
FROM public.students AS s
JOIN auth.users AS u ON lower(s.email) = lower(u.email)
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE s.auth_user_id IS NULL
ORDER BY s.created_at ASC;

-- Only link orphaned rows when there is no existing student bound to the auth user.
UPDATE public.students AS s
SET auth_user_id = u.id
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE s.auth_user_id IS NULL
  AND lower(s.email) = lower(u.email)
  AND (p.role IS NULL OR p.role = 'student')
  AND NOT EXISTS (
      SELECT 1
      FROM public.students AS s2
      WHERE s2.auth_user_id = u.id
        AND s2.id <> s.id
  );

-- Review any rows still orphaned after the update.
SELECT
    s.id,
    s.email,
    s.name,
    s.created_at
FROM public.students AS s
WHERE s.auth_user_id IS NULL
ORDER BY s.created_at ASC;

COMMIT;
