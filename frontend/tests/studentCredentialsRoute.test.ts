import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuthenticatedRequest,
  mockHasServiceRoleEnv,
  mockGetServiceRoleClient,
  mockCreateUserScopedServerClient,
} = vi.hoisted(() => ({
  mockRequireAuthenticatedRequest: vi.fn(),
  mockHasServiceRoleEnv: vi.fn(),
  mockGetServiceRoleClient: vi.fn(),
  mockCreateUserScopedServerClient: vi.fn(),
}));

vi.mock('../src/lib/serverAuth', () => ({
  requireAuthenticatedRequest: mockRequireAuthenticatedRequest,
  hasServiceRoleEnv: mockHasServiceRoleEnv,
  getServiceRoleClient: mockGetServiceRoleClient,
  createUserScopedServerClient: mockCreateUserScopedServerClient,
}));

import { GET } from '../src/app/api/student/credentials/route';

function requestWithToken() {
  return new NextRequest('http://localhost:3000/api/student/credentials', {
    headers: { authorization: 'Bearer test-token' },
  });
}

describe('student credentials route', () => {
  const mockStudentMaybeSingle = vi.fn();
  const mockStudentInsertMaybeSingle = vi.fn();
  const mockCredentialsOrder = vi.fn();
  const mockAdminGetUserById = vi.fn();

  const supabaseMock = {
    auth: {
      admin: {
        getUserById: mockAdminGetUserById,
      },
    },
    from: vi.fn((table: string) => {
      if (table === 'students') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockStudentMaybeSingle,
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: mockStudentInsertMaybeSingle,
            })),
          })),
        };
      }

      if (table === 'credentials') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockCredentialsOrder,
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedRequest.mockResolvedValue({ ok: true, userId: 'user-123' });
    mockHasServiceRoleEnv.mockReturnValue(true);
    mockGetServiceRoleClient.mockReturnValue(supabaseMock);
  });

  it('returns credentials for the authenticated student', async () => {
    mockStudentMaybeSingle.mockResolvedValue({
      data: { id: 'student-1', wallet_address: 'GWALLET' },
      error: null,
    });

    mockCredentialsOrder
      .mockResolvedValueOnce({
        data: [
          {
            id: 'cred-1',
            token_id: '1',
            ipfs_hash: 'cid-1',
            blockchain_hash: 'hash-1',
            metadata: {},
            issued_at: '2026-06-01T00:00:00Z',
            revoked: false,
            institution: [{ name: 'Acredia' }],
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'cred-2',
            token_id: '2',
            ipfs_hash: 'cid-2',
            blockchain_hash: 'hash-2',
            metadata: {},
            issued_at: '2026-06-02T00:00:00Z',
            revoked: false,
            institution: [{ name: 'Acredia' }],
          },
        ],
        error: null,
      });

    const response = await GET(requestWithToken());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.credentials).toHaveLength(2);
  });

  it('auto-creates a missing student row', async () => {
    mockStudentMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockAdminGetUserById.mockResolvedValue({
      data: { user: { email: 'student@example.com', user_metadata: { name: 'Student' } } },
      error: null,
    });
    mockStudentInsertMaybeSingle.mockResolvedValue({
      data: { id: 'student-2', wallet_address: null },
      error: null,
    });
    mockCredentialsOrder
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const response = await GET(requestWithToken());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  it('returns a conflict when an orphaned row blocks creation', async () => {
    mockStudentMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockAdminGetUserById.mockResolvedValue({
      data: { user: { email: 'student@example.com', user_metadata: { name: 'Student' } } },
      error: null,
    });
    mockStudentInsertMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await GET(requestWithToken());
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.success).toBe(false);
  });

  it('returns a conflict when an email collision blocks creation', async () => {
    mockStudentMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockAdminGetUserById.mockResolvedValue({
      data: { user: { email: 'student@example.com', user_metadata: { name: 'Student' } } },
      error: null,
    });
    mockStudentInsertMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'email already exists' },
    });

    const response = await GET(requestWithToken());
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.success).toBe(false);
  });
});
