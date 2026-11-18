// Rendered-output measurements. This is a transparent heuristic, not the
// harness audit and not an accessibility certification.
function parseColor(value) {
  const match = String(value ?? '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
}
function normalizeColor(color) { return `${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)}`; }
function luminance(color) {
  const channel = value => { const c = value / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}
function contrastRatio(foreground, background) {
  const fg = foreground.a < 1
    ? { r: foreground.r * foreground.a + background.r * (1 - foreground.a), g: foreground.g * foreground.a + background.g * (1 - foreground.a), b: foreground.b * foreground.a + background.b * (1 - foreground.a) }
    : foreground;
  const lighter = Math.max(luminance(fg), luminance(background));
  const darker = Math.min(luminance(fg), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}
function backgroundOf(element, win) {
  for (let node = element; node; node = node.parentElement) {
    const color = parseColor(win.getComputedStyle(node).backgroundColor);
    if (color && color.a > 0) return color;
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}
export function measureDocument(root, { width, facts = [] } = {}) {
  const doc = root?.nodeType === 9 ? root : root?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const scope = root?.nodeType === 1 ? root : doc.body;
  const viewportHeight = width === 390 ? 844 : 800;
  const visible = el => {
    if (!el || el.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
    const rect = el.getBoundingClientRect();
    const style = win.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const accessibleName = el => {
    const labelled = el.getAttribute('aria-labelledby');
    if (labelled) return labelled.split(/\s+/).map(id => doc.getElementById(id)?.textContent ?? '').join(' ').trim();
    return (el.getAttribute('aria-label') || [...(el.labels ?? [])].map(label => label.textContent).join(' ') || el.textContent || el.getAttribute('alt') || '').replace(/\s+/g, ' ').trim();
  };
  const controls = [...scope.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,summary,[role="button"]')].filter(visible);
  let text = '';
  const walker = doc.createTreeWalker(scope, win.NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || !visible(parent) || parent.closest('script,style,svg')) continue;
    text += ` ${node.textContent} `;
  }
  text = text.replace(/\s+/g, ' ').trim();
  const paragraphWords = [...scope.querySelectorAll('p')].filter(visible)
    .reduce((total, element) => total + (element.innerText.trim().match(/\S+/g) || []).length, 0);
  const clipped = controls.filter(control => {
    const rect = control.getBoundingClientRect();
    if (rect.left < -1 || rect.right > width + 1) return true;
    for (let parent = control.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
      const style = win.getComputedStyle(parent);
      const box = parent.getBoundingClientRect();
      if (['hidden', 'clip'].includes(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) return true;
      if (['hidden', 'clip'].includes(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) return true;
    }
    return false;
  }).length;
  const actionPattern = /^(pay|review|approve|confirm|continue|save|start|add|create|send|book|buy|subscribe|download|open|apply|submit|preview|share|keep|hold|try|cancel|back)\b/i;
  const actionControls = controls.filter(control => actionPattern.test(accessibleName(control))).length;
  const textElements = [...scope.querySelectorAll('body *')].filter(element => visible(element) && [...element.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()));
  const styles = new Map(textElements.map(element => [element, win.getComputedStyle(element)]));
  const typeSizes = [...new Set(textElements.map(element => Math.round(Number.parseFloat(styles.get(element).fontSize))).filter(Boolean))].sort((a, b) => a - b);
  const fontFamilies = [...new Set(textElements.map(element => styles.get(element).fontFamily.split(',')[0].replace(/["']/g, '').trim()).filter(Boolean))];
  const colors = new Set();
  const radii = new Set();
  let coverageArea = 0;
  let lowContrast = 0;
  for (const element of textElements) {
    const style = styles.get(element);
    const foreground = parseColor(style.color);
    const background = backgroundOf(element, win);
    if (foreground) colors.add(normalizeColor(foreground));
    colors.add(normalizeColor(background));
    if (foreground && contrastRatio(foreground, background) < 4.5) lowContrast += 1;
    const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
    if (radius > 0) radii.add(Math.round(radius));
    const rect = element.getBoundingClientRect();
    coverageArea += Math.max(0, Math.min(rect.width + Math.max(0, rect.left), width) - Math.max(0, rect.left))
      * Math.max(0, Math.min(rect.height + Math.max(0, rect.top), viewportHeight) - Math.max(0, rect.top));
  }
  const bodyBackground = backgroundOf(doc.body, win);
  const filledActions = controls.filter(control => {
    const background = parseColor(styles.get(control)?.backgroundColor ?? win.getComputedStyle(control).backgroundColor);
    return background && background.a > 0 && normalizeColor(background) !== normalizeColor(bodyBackground) && actionPattern.test(accessibleName(control));
  });
  const primaryVisible = filledActions.some(control => {
    const rect = control.getBoundingClientRect();
    return rect.top >= -1 && rect.top < viewportHeight && rect.left >= -1 && rect.left < width && rect.width > 0 && rect.height > 0;
  });
  const disabledPrimary = filledActions.filter(control => control.disabled || control.getAttribute('aria-disabled') === 'true').length;
  const bodyFont = Number.parseFloat(win.getComputedStyle(doc.body).fontSize) || 14;
  const maxFont = typeSizes.length ? Math.max(...typeSizes) : bodyFont;
  const shadowCount = [...scope.querySelectorAll('*')].filter(element => visible(element) && win.getComputedStyle(element).boxShadow !== 'none').length;
  return {
    width,
    words: (text.match(/\S+/g) || []).length,
    paragraphWords,
    controls: controls.length,
    unnamed: controls.filter(control => !accessibleName(control)).length,
    clipped,
    actionControls,
    headings: [...scope.querySelectorAll('h1,h2,h3')].filter(visible).length,
    overflowX: doc.documentElement.scrollWidth > width + 1,
    facts: facts.map(fact => ({
      id: fact.id,
      label: fact.label,
      visible: new RegExp(fact.pattern, 'i').test(text)
    })),
    typeSizes: typeSizes.length,
    fontFamilies: fontFamilies.length,
    uniqueColors: colors.size,
    uniqueRadii: radii.size,
    maxFont,
    bodyFont,
    fontRatio: bodyFont ? Number((maxFont / bodyFont).toFixed(2)) : 0,
    coverage: Number(Math.min(1, coverageArea / (width * viewportHeight)).toFixed(3)),
    lowContrast,
    filledActions: filledActions.length,
    primaryVisible,
    disabledPrimary,
    shadowCount,
    headingList: [...scope.querySelectorAll('h1,h2,h3')].filter(visible).map(element => element.textContent.trim()).filter(Boolean)
  };
}

export function measureSummary(before, after) {
  const rows = [
    ['Visible words', 'words'],
    ['Paragraph words', 'paragraphWords'],
    ['Controls', 'controls'],
    ['Unnamed controls', 'unnamed'],
    ['Clipped controls', 'clipped'],
    ['Action-labelled controls', 'actionControls'],
    ['Headings', 'headings']
  ];
  return rows.map(([label, key]) => ({ label, before: before?.[key] ?? null, after: after?.[key] ?? null }));
}
