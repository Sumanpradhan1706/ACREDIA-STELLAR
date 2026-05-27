import { describe, it, expect } from 'vitest';
import { ensureValidTokenId, getSorobanTransactionResult } from '../src/lib/contracts';

describe('Soroban contract helper functions', () => {
  it('parses u64 return values from Soroban simulation results', () => {
    const simResult = {
      result: {
        retval: 'AAAABQAAAAAAAAAB',
      },
    };

    const parsed = getSorobanTransactionResult(simResult);
    expect(parsed).toBe(1n);
  });

  it('rejects invalid token IDs before signing', () => {
    expect(() => ensureValidTokenId('pending')).toThrow('Invalid token ID');
    expect(() => ensureValidTokenId('0')).toThrow('Invalid token ID');
    expect(() => ensureValidTokenId('-1')).toThrow('Invalid token ID');
    expect(() => ensureValidTokenId('1.5')).toThrow('Invalid token ID');
  });

  it('accepts valid numeric token IDs', () => {
    expect(ensureValidTokenId('1')).toBe('1');
    expect(ensureValidTokenId(2)).toBe('2');
    expect(ensureValidTokenId(3n)).toBe('3');
  });
});
