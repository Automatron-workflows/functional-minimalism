// Rendered-output measurements. This is a transparent heuristic, not the
// harness audit and not an accessibility certification.
export function measureDocument(root, { width, facts = [] } = {}) {
  const doc = root?.nodeType === 9 ? root : root?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const scope = root?.nodeType === 1 ? root : doc.body;
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
  const actionPattern = /^(pay|review|approve|confirm|continue|save|start|add|create|send|book|buy|subscribe|download|open|apply|submit|preview|share|keep|hold|try)\b/i;
  const actionControls = controls.filter(control => actionPattern.test(accessibleName(control))).length;
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
    }))
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
