export class ABTest {
  constructor(name, variants = { A: 0.5, B: 0.5 }) {
    this.name = name;
    this.variants = variants;
  }
  getVariant(userId) {
    const hash = userId.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const random = Math.abs(hash % 100) / 100;
    let sum = 0;
    for (const [variant, weight] of Object.entries(this.variants)) {
      sum += weight;
      if (random <= sum) return variant;
    }
    return Object.keys(this.variants)[0];
  }
}
