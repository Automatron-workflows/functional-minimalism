// A transparent craft heuristic for the prompt lab. It rewards restraint,
// clear action, hierarchy, cohesion, whitespace, responsive integrity, facts
// and contrast. It is not a beauty model, a usability study or the CLI audit.

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const fraction = (value, target, ceiling) => 1 - clamp((value - target) / (ceiling - target));

export function craftScore({ desktop, mobile } = {}) {
  if (!desktop || !mobile) return { score: null, breakdown: [], penalties: [], note: 'No measurements' };
  const words = Number.isFinite(desktop.words) ? desktop.words : 0;
  const paragraphWords = Number.isFinite(desktop.paragraphWords) ? desktop.paragraphWords : 0;
  const facts = Array.isArray(desktop.facts) ? desktop.facts : [];
  const factRatio = facts.length ? facts.filter(fact => fact.visible).length / facts.length : 1;
  const components = {
    text: fraction(words, 120, 240),
    paragraph: fraction(paragraphWords, 24, 80),
    action: desktop.filledActions === 1 && desktop.primaryVisible && !desktop.disabledPrimary ? 1 : desktop.primaryVisible ? 0.5 : 0,
    hierarchy: 0.7 * clamp((desktop.fontRatio ?? 0) / 3) + 0.3 * (desktop.headings >= 2 && desktop.headings <= 5 ? 1 : desktop.headings === 1 ? 0.6 : 0.35),
    cohesion: (
      (desktop.uniqueColors <= 9 ? 1 : desktop.uniqueColors <= 14 ? 0.6 : 0.3) +
      ((desktop.fontFamilies ?? 1) <= 2 ? 1 : desktop.fontFamilies === 3 ? 0.7 : 0.4) +
      ((desktop.typeSizes ?? 1) <= 7 ? 1 : desktop.typeSizes <= 10 ? 0.7 : 0.4) +
      ((desktop.uniqueRadii ?? 0) <= 3 ? 1 : desktop.uniqueRadii <= 5 ? 0.7 : 0.4) +
      ((desktop.shadowCount ?? 0) <= 2 ? 1 : desktop.shadowCount <= 4 ? 0.6 : 0.3)
    ) / 5,
    whitespace: desktop.coverage >= 0.12 && desktop.coverage <= 0.45 ? 1 : desktop.coverage >= 0.08 && desktop.coverage <= 0.55 ? 0.7 : 0.3,
    responsive: (!mobile.overflowX ? 1 : 0.4) * (mobile.clipped === 0 ? 1 : 0.7) * ((mobile.bodyFont ?? 14) >= 13 ? 1 : 0.6),
    facts: factRatio,
    contrast: (desktop.lowContrast ?? 0) === 0 ? 1 : desktop.lowContrast <= 2 ? 0.7 : desktop.lowContrast <= 5 ? 0.4 : 0.2
  };
  const weights = {
    text: 15,
    paragraph: 5,
    action: 20,
    hierarchy: 15,
    cohesion: 15,
    whitespace: 10,
    responsive: 10,
    facts: 5,
    contrast: 5
  };
  const penalties = [];
  if (words > 200) penalties.push({ code: 'text-heavy', points: 5 });
  if (desktop.overflowX) penalties.push({ code: 'desktop-overflow', points: 10 });
  if (mobile.overflowX) penalties.push({ code: 'mobile-overflow', points: 10 });
  if (desktop.disabledPrimary) penalties.push({ code: 'disabled-primary', points: 5 });
  if (facts.length && factRatio < 1) penalties.push({ code: 'missing-facts', points: 10 });
  const amount = facts.find(fact => fact.id === 'amount');
  if (amount?.repeats > 2) penalties.push({ code: 'repeated-amount', points: 5 });
  const points = Object.fromEntries(Object.entries(components).map(([key, value]) => [key, Number((value * weights[key]).toFixed(1))]));
  const score = Math.max(0, Math.min(100, Number((Object.values(points).reduce((sum, value) => sum + value, 0) - penalties.reduce((sum, item) => sum + item.points, 0)).toFixed(1))));
  return {
    score,
    breakdown: Object.keys(weights).map(key => ({ key, label: key, value: Number(components[key].toFixed(3)), weight: weights[key], points: points[key] })),
    penalties,
    note: 'Craft heuristic, not a beauty model or usability study.'
  };
}

export function average(values) {
  const numbers = values.filter(value => Number.isFinite(value));
  return numbers.length ? Number((numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(1)) : null;
}
