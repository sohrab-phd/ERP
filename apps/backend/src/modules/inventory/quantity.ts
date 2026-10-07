import { BusinessRejection } from '@navard/shared-kernel';

const SCALE = 10n ** 18n;
const LIMIT = 10n ** 38n;

function reject(): never {
  throw new BusinessRejection({
    family: 'GUARD_INVARIANT',
    message: 'Inventory kg quantity is invalid or exceeds storage capacity',
  });
}

/** Exact storage arithmetic; measurement and permitted sign are owner policies. */
export class Kg {
  readonly #scaled: bigint;

  private constructor(scaled: bigint) {
    if (scaled <= -LIMIT || scaled >= LIMIT) reject();
    this.#scaled = scaled;
    Object.freeze(this);
  }

  static parse(value: string): Kg {
    if (typeof value !== 'string' || value.length > 40) reject();
    const match = /^-?(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,18})?$/u.exec(value);
    // A JavaScript $ anchor can precede a final newline; require the entire input.
    if (match === null || match[0] !== value) reject();
    const negative = value.startsWith('-');
    const unsigned = negative ? value.slice(1) : value;
    const [whole, fractional = ''] = unsigned.split('.');
    const scaled = BigInt(whole!) * SCALE + BigInt(fractional.padEnd(18, '0'));
    if (negative && scaled === 0n) reject();
    return new Kg(negative ? -scaled : scaled);
  }

  static zero(): Kg {
    return new Kg(0n);
  }

  private require(other: Kg): bigint {
    if (!(other instanceof Kg) || !(#scaled in other)) reject();
    return other.#scaled;
  }

  add(other: Kg): Kg {
    return new Kg(this.#scaled + this.require(other));
  }

  subtract(other: Kg): Kg {
    return new Kg(this.#scaled - this.require(other));
  }

  compare(other: Kg): -1 | 0 | 1 {
    const right = this.require(other);
    return this.#scaled < right ? -1 : this.#scaled > right ? 1 : 0;
  }

  toString(): string {
    const negative = this.#scaled < 0n;
    const magnitude = negative ? -this.#scaled : this.#scaled;
    const whole = magnitude / SCALE;
    const fraction = (magnitude % SCALE).toString().padStart(18, '0').replace(/0+$/u, '');
    return `${negative ? '-' : ''}${whole.toString()}${fraction ? '.' + fraction : ''}`;
  }
}
