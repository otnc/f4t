<div align="center">

# f4t

**f**ormatter for **t**imestamps

A tiny time string parser/formatter for the `w d h m s ms` vocabulary.

[![npm version](https://img.shields.io/npm/v/f4t.svg)](https://www.npmjs.com/package/f4t)
[![license](https://img.shields.io/npm/l/f4t.svg)](https://github.com/otnc/f4t#license)

</div>

`f4t` converts between human-friendly time strings (`2w3d18h40m3s2ms`) and milliseconds.

- **Zero dependencies** — single file, no runtime deps
- **Dual ESM / CommonJS** — `import` or `require`, both work
- **Node.js >= 18**
- **Negative durations** — `-1h30m` ⇄ `-5400000`
- **Strict types** — invalid input throws `TypeError`, never silently returns `NaN`

## Install

```bash
npm install f4t
```

## Quick start

```js
import { decode, encode } from 'f4t';
// const { decode, encode } = require('f4t'); // CommonJS

decode('2w3d18h40m3s2ms'); // 1536003002
encode(1536003002); // '2w3d18h40m3s2ms'

decode('-1h30m'); // -5400000
encode(-5400000); // '-1h30m'

decode('0ms'); // 0
encode(0); // '0ms'
```

## Units

| Symbol | Unit        | Milliseconds |
| ------ | ----------- | ------------ |
| `w`    | week        | 604,800,000  |
| `d`    | day         | 86,400,000   |
| `h`    | hour        | 3,600,000    |
| `m`    | minute      | 60,000       |
| `s`    | second      | 1,000        |
| `ms`   | millisecond | 1            |

## API

### `decode(timeString): number`

Parse a time string into milliseconds.

A time string is a sequence of `<number><unit>` tokens, e.g. `2w3d18h40m3s2ms`.
A single leading `-` makes the whole value negative: `-2w3d` → `-(2w + 3d)`.

| Behaviour                                                                     |                          |
| ----------------------------------------------------------------------------- | ------------------------ |
| Invalid input (non-string, empty, unknown unit, leftover chars, dangling `-`) | throws `TypeError`       |
| A combination that sums to zero                                               | returns `0` (never `-0`) |
| Surrounding whitespace                                                        | trimmed                  |

```js
decode('1s'); // 1000
decode('2w3d18h40m3s2ms'); // 1536003002
decode('-1h30m'); // -5400000
decode('  1s  '); // 1000
decode('1y'); // throws TypeError
```

### `encode(milliseconds, formatOption?): string`

Format a number of milliseconds into a compact time string.

| Behaviour                      |                                             |
| ------------------------------ | ------------------------------------------- |
| Negative values                | prefixed with `-` (`-5400000` → `'-1h30m'`) |
| `0` and `-0`                   | both encode to `'0ms'`                      |
| Non-finite or non-number input | throws `TypeError`                          |

`formatOption` restricts which units may appear in the output. Listed units are
skipped and their value rolls down into smaller units. **`ms` can never be
excluded**, so sub-second precision is never silently lost.

It accepts either:

- an array of units to exclude: `['w']`
- or an object: `{ exclude: ['w'] }`

```js
encode(1536003002); // '2w3d18h40m3s2ms'
encode(1536003002, ['w']); // '17d18h40m3s2ms'
encode(1536003002, ['w', 's']); // '17d18h40m3002ms'
encode(1536003002, { exclude: ['w'] }); // '17d18h40m3s2ms'
encode(1536003002, ['ms']); // '2w3d18h40m3s2ms' (ms cannot be excluded)
encode(-5400000); // '-1h30m'
encode(0); // '0ms'
```

## Development

```bash
npm run build        # tsup -> dist (ESM + CJS + d.ts)
npm test             # jest
npm run test:coverage
npm run lint         # eslint
npm run format       # prettier
npm run typecheck    # tsc --noEmit
```

## License

[ISC](./LICENSE) © otoneko.
