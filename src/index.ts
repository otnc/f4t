/**
 * f4t - formatter for timestamps.
 *
 * A tiny time string parser/formatter that converts between human-friendly time
 * strings (`2w3d18h40m3s2ms`) and milliseconds.
 *
 * Supports the same unit vocabulary used by Discord ProBot and similar bots:
 *   w = weeks, d = days, h = hours, m = minutes, s = seconds, ms = milliseconds
 *
 * @packageDocumentation
 */

/**
 * Supported time unit identifiers, ordered from the largest to the smallest.
 */
export type TimeUnit = 'w' | 'd' | 'h' | 'm' | 's' | 'ms';

/**
 * Options for {@link encode}.
 *
 * Either an array of units to exclude from the output, or an object with an
 * `exclude` property. The `ms` unit can never be excluded.
 */
export type EncodeOptions = TimeUnit[] | { exclude?: TimeUnit[] };

const TIME_UNITS: Record<TimeUnit, number> = {
  w: 7 * 24 * 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
  ms: 1,
};

/** Units from largest to smallest, used by {@link encode}. */
const ORDERED_UNITS: readonly TimeUnit[] = ['w', 'd', 'h', 'm', 's', 'ms'];

/** Matches a single `<number><unit>` token at the start of a string. */
const TOKEN_RE = /^(\d+)(ms|s|m|h|d|w)/;

/**
 * Normalize the {@link EncodeOptions} into a set of excluded units.
 */
function normalizeExclude(options: EncodeOptions | undefined): Set<TimeUnit> {
  if (options === undefined) return new Set();

  const list: unknown = Array.isArray(options) ? options : options.exclude;
  if (!Array.isArray(list)) {
    throw new TypeError('encode: formatOption must be an array or { exclude: array }.');
  }

  const set = new Set<TimeUnit>();
  for (const unit of list) {
    if (typeof unit === 'string' && unit in TIME_UNITS) {
      set.add(unit as TimeUnit);
    }
  }
  return set;
}

/**
 * Parse a time string into milliseconds.
 *
 * A time string is a sequence of `<number><unit>` tokens such as `2w3d18h40m3s2ms`.
 * A leading `-` makes the whole value negative, e.g. `-2w3d` => `-(2w + 3d)`.
 *
 * - Throws `TypeError` for invalid input (non-string, empty, unknown units,
 *   leftover characters, dangling `-`, etc.).
 * - `0ms` (or any combination summing to `0`) returns `0` (never `-0`).
 * - Surrounding whitespace is trimmed.
 *
 * @example
 * decode('2w3d18h40m3s2ms'); // 1536003002
 * decode('-1h30m');          // -5400000
 * decode('0ms');             // 0
 */
export function decode(timeString: string): number {
  if (typeof timeString !== 'string') {
    throw new TypeError(`decode: expected a string, got ${typeof timeString}.`);
  }

  const str = timeString.trim();
  if (str.length === 0) {
    throw new TypeError('decode: time string must not be empty.');
  }

  const isNegative = str.charCodeAt(0) === 45; // '-'
  const body = isNegative ? str.slice(1) : str;
  if (body.length === 0) {
    throw new TypeError('decode: time string must contain at least one token.');
  }

  let total = 0;
  let index = 0;

  while (index < body.length) {
    const match = body.slice(index).match(TOKEN_RE);
    if (!match) {
      throw new TypeError(`decode: invalid token at position ${index} of "${timeString}".`);
    }

    const value = Number(match[1]);
    const unit = match[2] as TimeUnit;
    total += value * TIME_UNITS[unit];
    index += match[0].length;
  }

  // Avoid returning -0.
  if (total === 0) return 0;
  return isNegative ? -total : total;
}

/**
 * Format a number of milliseconds into a compact time string.
 *
 * - Negative values are prefixed with `-`, e.g. `-5400000` => `-1h30m`.
 * - `0` (and `-0`) encode to `'0ms'`.
 * - Throws `TypeError` for non-finite or non-number input.
 * - `formatOption` restricts which units may appear in the output. Units listed
 *   there are skipped and their value rolls down into smaller units. The `ms`
 *   unit can never be excluded, guaranteeing no precision is silently lost at
 *   the sub-second level.
 *
 * @example
 * encode(1536003002);              // '2w3d18h40m3s2ms'
 * encode(-5400000);                // '-1h30m'
 * encode(0);                       // '0ms'
 * encode(1536003002, ['w']);       // '17d18h40m3s2ms'
 * encode(1536003002, ['w', 's']);  // '17d18h40m3002ms'
 * encode(1536003002, { exclude: ['w'] }); // '17d18h40m3s2ms'
 */
export function encode(milliseconds: number, formatOption?: EncodeOptions): string {
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) {
    throw new TypeError(
      `encode: expected a finite number, got ${typeof milliseconds} (${String(milliseconds)}).`,
    );
  }

  const exclude = normalizeExclude(formatOption);

  const isNegative = milliseconds < 0;
  let remaining = Math.abs(milliseconds);
  let result = '';

  for (const unit of ORDERED_UNITS) {
    if (unit !== 'ms' && exclude.has(unit)) continue;

    const unitValue = TIME_UNITS[unit];
    const count = Math.floor(remaining / unitValue);
    if (count > 0) {
      result += `${count}${unit}`;
      remaining -= count * unitValue;
    }
  }

  if (result === '') result = '0ms';
  return isNegative ? `-${result}` : result;
}
