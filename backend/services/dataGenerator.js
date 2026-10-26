// Deterministic PRNG: the same seed always gives the same market (reproducible research).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller: two uniform randoms -> one standard normal random.
function makeNormal(random) {
  return () => {
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

// Geometric Brownian Motion: S(t+1) = S(t) * exp((mu - sigma^2/2)dt + sigma*sqrt(dt)*Z)
function generateGBM({ days, startPrice, drift, vol, seed }) {
  const normal = makeNormal(mulberry32(seed));
  const dt = 1 / 252;
  const prices = [];
  let price = startPrice;
  const date = new Date(Date.UTC(2020, 0, 1));

  while (prices.length < days) {
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) {
      // trading day only (skip weekends)
      prices.push({
        date: date.toISOString().slice(0, 10),
        close: Math.round(price * 100) / 100,
      });
      const z = normal();
      price *= Math.exp((drift - 0.5 * vol * vol) * dt + vol * Math.sqrt(dt) * z);
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return prices;
}

module.exports = { generateGBM };