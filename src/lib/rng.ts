/**
 * Deterministic seeded RNG. The whole demo must look identical on every
 * reload and on every machine, so seed data is generated from a fixed seed
 * (never Math.random()). Each stream is seeded by a string key so a given
 * resident+domain always produces the same 90-day series.
 */

/** Hash a string to a 32-bit int seed (xfnv1a). */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG — small, fast, good enough for seed data. */
export class Rng {
  private state: number

  constructor(seed: string | number) {
    this.state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0
  }

  /** float in [0, 1) */
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** int in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  /** standard-normal sample (Box–Muller), mean 0 sd 1 */
  gaussian(): number {
    let u = 0
    let v = 0
    while (u === 0) u = this.next()
    while (v === 0) v = this.next()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  /** normal sample with given mean / sd */
  normal(mean: number, sd: number): number {
    return mean + this.gaussian() * sd
  }

  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }
}
