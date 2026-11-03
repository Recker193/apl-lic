import { generateOpaqueToken, hashToken } from './tokens';

describe('tokens', () => {
  it('generates unique opaque tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).toHaveLength(64);
    expect(a).not.toEqual(b);
  });

  it('hashes tokens with sha256 hex', () => {
    const token = 'abc';
    const hashed = hashToken(token);
    expect(hashed).toHaveLength(64);
    expect(hashed).toEqual(hashToken('abc'));
    expect(hashed).not.toEqual(hashToken('abd'));
  });
});
