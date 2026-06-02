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

import { POST } from '../src/app/api/student/wallet/route';

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/student/wallet', {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('student wallet link route', () => {
  const validWallet = `G${'A'.repeat(54)}`;
  const mockStudentLookup = vi.fn();
  const mockWalletLookup = vi.fn();
  const mockUpdateMaybeSingle = vi.fn();

  const supabaseMock = {
    from: vi.fn((table: string) => {
      if (table === 'students') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string) => ({
              maybeSingle: column === 'auth_user_id' ? mockStudentLookup : mockWalletLookup,
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                maybeSingle: mockUpdateMaybeSingle,
              })),
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

  it('links a wallet for the authenticated student', async () => {
    mockStudentLookup.mockResolvedValue({
      data: { id: 'student-1', wallet_address: null },
      error: null,
    });
    mockWalletLookup.mockResolvedValue({ data: null, error: null });
    mockUpdateMaybeSingle.mockResolvedValue({
      data: { id: 'student-1', wallet_address: validWallet },
      error: null,
    });

    const response = await POST(request({ walletAddress: validWallet }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  it('blocks wallet collisions', async () => {
    mockStudentLookup.mockResolvedValue({
      data: { id: 'student-1', wallet_address: null },
      error: null,
    });
    mockWalletLookup.mockResolvedValue({
      data: { id: 'student-2', auth_user_id: 'user-999', wallet_address: validWallet },
      error: null,
    });

    const response = await POST(request({ walletAddress: validWallet }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.success).toBe(false);
  });

  it('returns not found when the student row is missing', async () => {
    mockStudentLookup.mockResolvedValue({ data: null, error: null });

    const response = await POST(request({ walletAddress: validWallet }));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.success).toBe(false);
  });

  it('rejects invalid wallet addresses', async () => {
    const response = await POST(request({ walletAddress: 'BAD' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
  });
});
