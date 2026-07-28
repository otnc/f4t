import { decode, encode } from '../src/index';

describe('decode', () => {
  it('parses a single unit', () => {
    expect(decode('1s')).toBe(1000);
    expect(decode('1ms')).toBe(1);
    expect(decode('1m')).toBe(60_000);
    expect(decode('1h')).toBe(3_600_000);
    expect(decode('1d')).toBe(86_400_000);
    expect(decode('1w')).toBe(604_800_000);
  });

  it('parses combined units', () => {
    expect(decode('2w3d18h40m3s2ms')).toBe(1_536_003_002);
  });

  it('returns 0 for zero', () => {
    expect(decode('0ms')).toBe(0);
    expect(decode('0s0ms')).toBe(0);
  });

  it('parses negative time strings', () => {
    expect(decode('-1h30m')).toBe(-5_400_000);
    expect(decode('-2w3d')).toBe(-(2 * 604_800_000 + 3 * 86_400_000));
  });

  it('does not return -0', () => {
    expect(Object.is(decode('-0ms'), -0)).toBe(false);
    expect(decode('-0ms')).toBe(0);
  });

  it('trims surrounding whitespace', () => {
    expect(decode('  1s  ')).toBe(1000);
    expect(decode('\t1s\n')).toBe(1000);
  });

  it.each([['abc'], [''], ['   '], ['1'], ['1y'], ['1s2'], ['2w3'], ['-'], ['--1s'], ['1s-2s']])(
    'throws TypeError for invalid input %p',
    (input) => {
      expect(() => decode(input)).toThrow(TypeError);
    },
  );

  it('throws TypeError for non-string input', () => {
    expect(() => decode(123 as unknown as string)).toThrow(TypeError);
    expect(() => decode(null as unknown as string)).toThrow(TypeError);
    expect(() => decode(undefined as unknown as string)).toThrow(TypeError);
  });
});

describe('encode', () => {
  it('encodes milliseconds into a compact string', () => {
    expect(encode(1_536_003_002)).toBe('2w3d18h40m3s2ms');
  });

  it('encodes single units', () => {
    expect(encode(1000)).toBe('1s');
    expect(encode(1)).toBe('1ms');
    expect(encode(60_000)).toBe('1m');
  });

  it('returns 0ms for zero', () => {
    expect(encode(0)).toBe('0ms');
    expect(encode(-0)).toBe('0ms');
  });

  it('encodes negative values with a leading minus', () => {
    expect(encode(-5_400_000)).toBe('-1h30m');
    expect(encode(-1)).toBe('-1ms');
  });

  it.each([NaN, Infinity, -Infinity])('throws TypeError for non-finite input %p', (input) => {
    expect(() => encode(input)).toThrow(TypeError);
  });

  it('throws TypeError for non-number input', () => {
    expect(() => encode('1000' as unknown as number)).toThrow(TypeError);
  });

  it('restricts units via array formatOption', () => {
    expect(encode(1_536_003_002, ['w'])).toBe('17d18h40m3s2ms');
    expect(encode(1_536_003_002, ['w', 's'])).toBe('17d18h40m3002ms');
  });

  it('restricts units via object options', () => {
    expect(encode(1_536_003_002, { exclude: ['w'] })).toBe('17d18h40m3s2ms');
    expect(encode(1_536_003_002, { exclude: ['w', 's'] })).toBe('17d18h40m3002ms');
  });

  it('cannot exclude ms', () => {
    expect(encode(1_536_003_002, ['ms'])).toBe('2w3d18h40m3s2ms');
    expect(encode(1_536_003_002, { exclude: ['ms'] })).toBe('2w3d18h40m3s2ms');
  });

  it('ignores unknown units in formatOption', () => {
    expect(encode(1_536_003_002, ['w', 'x' as never])).toBe('17d18h40m3s2ms');
  });

  it('throws on a malformed formatOption', () => {
    expect(() => encode(1000, {} as never)).toThrow(TypeError);
    expect(() => encode(1000, 'w' as never)).toThrow(TypeError);
  });

  it('is the inverse of decode', () => {
    const cases = [0, 1, 1000, 60_000, 1_536_003_002, 9_999_999_999];
    for (const c of cases) {
      expect(decode(encode(c))).toBe(c);
      // -0 normalizes to 0 in both directions; skip it for the negative round-trip.
      if (Object.is(c, 0)) continue;
      expect(decode(encode(-c))).toBe(-c);
    }
  });
});
