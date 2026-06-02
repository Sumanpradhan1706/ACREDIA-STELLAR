import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { describe, expect, it, vi } from 'vitest';
import { verifyAdminAuthorizationTransaction } from '../src/lib/adminAuthorizationVerification';

const walletAddress = Keypair.random().publicKey();
const otherWalletAddress = Keypair.random().publicKey();
const contractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const otherContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const transactionHash = 'a'.repeat(64);

function fakeServer(transaction: unknown) {
  return {
    getTransaction: vi.fn(async () => transaction),
    simulateTransaction: vi.fn(),
  } as any;
}

function authEvent(wallet = walletAddress, contract = contractId) {
  return {
    contractId: contract,
    topics: ['iss_auth'],
    data: wallet,
  };
}

function successTransaction(event = authEvent()) {
  return {
    status: 'SUCCESS',
    events: {
      contractEventsXdr: [[event]],
    },
  };
}

describe('admin authorization transaction verification', () => {
  it('accepts a successful authorize_issuer transaction for the submitted wallet and contract', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer(successTransaction()),
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toEqual({
      ok: true,
      walletAddress,
      transactionHash,
      contractId,
    });
  });

  it('rejects invalid wallet addresses before fetching Stellar RPC', async () => {
    const server = fakeServer(successTransaction());

    const result = await verifyAdminAuthorizationTransaction('not-a-wallet', transactionHash, {
      contractId,
      server,
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'invalid-wallet', status: 400 });
    expect(server.getTransaction).not.toHaveBeenCalled();
  });

  it('rejects invalid transaction hash formats before fetching Stellar RPC', async () => {
    const server = fakeServer(successTransaction());

    const result = await verifyAdminAuthorizationTransaction(walletAddress, 'not-a-hash', {
      contractId,
      server,
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'invalid-transaction-hash', status: 400 });
    expect(server.getTransaction).not.toHaveBeenCalled();
  });

  it('returns a wrong-network state when the transaction is not found on configured RPC', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer({ status: 'NOT_FOUND' }),
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'wrong-network', status: 409 });
  });

  it('rejects failed authorization transactions', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer({ status: 'FAILED' }),
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'failed', status: 422 });
  });

  it('rejects successful transactions that authorized a different wallet', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer(successTransaction(authEvent(otherWalletAddress))),
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'wrong-wallet', status: 422 });
  });

  it('rejects successful authorization events from a different contract', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer(successTransaction(authEvent(walletAddress, otherContractId))),
      isAuthorizedIssuerOnChain: vi.fn(async () => true),
    });

    expect(result).toMatchObject({ ok: false, code: 'wrong-contract', status: 422 });
  });

  it('rejects transactions when the current contract state does not authorize the wallet', async () => {
    const result = await verifyAdminAuthorizationTransaction(walletAddress, transactionHash, {
      contractId,
      server: fakeServer(successTransaction()),
      isAuthorizedIssuerOnChain: vi.fn(async () => false),
    });

    expect(result).toMatchObject({ ok: false, code: 'not-authorized', status: 422 });
  });
});
