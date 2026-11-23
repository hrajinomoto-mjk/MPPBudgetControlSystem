import { Language } from './translations';
import {
  ID_TO_EN_EXACT,
  ID_TO_EN_PATTERNS,
  EN_TO_ID_EXACT,
  EN_TO_ID_PATTERNS,
} from './enterprisePhraseBank';

/**
 * Full-Enterprise Bidirectional DOM Localization Engine (ID <-> EN)
 * - Normalizes multiline JSX whitespace for exact phrase matching
 * - Tracks original React-rendered text + last applied translation per Text node & attribute
 * - Safely detects when React mutates a dynamic Text node so stale translations never overwrite live data
 * - Supports lossless repeated rotation (ID -> EN -> ID -> EN) across all 37+ components and modals
 */

interface TrackedTranslation {
  orig: string;
  translated: string;
  targetLang: Language;
}

const textTracker = new WeakMap<Text, TrackedTranslation>();
const attrTracker = new WeakMap<Element, Map<string, TrackedTranslation>>();

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG']);
const TRACKED_ATTRS = ['placeholder', 'title', 'aria-label'] as const;

let activeSyncDepth = 0;

export function isSyncingDomTranslations(): boolean {
  return activeSyncDepth > 0;
}

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest('[data-no-translate="true"]')) return true;
  return false;
}

function applyWithWhitespacePreserved(raw: string, replacement: string): string {
  const leadingMatch = raw.match(/^\s*/);
  const trailingMatch = raw.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : '';
  const trailing = trailingMatch ? trailingMatch[0] : '';
  return `${leading}${replacement}${trailing}`;
}

export function translatePhraseToEnglish(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const normalized = trimmed.replace(/\s+/g, ' ');

  // 1. Exact phrase match (handles multiline JSX strings via normalized whitespace)
  const exact = ID_TO_EN_EXACT[normalized];
  if (exact) {
    return applyWithWhitespacePreserved(raw, exact);
  }

  // 2. Pattern-based enterprise replacements
  let result = normalized;
  for (const [regex, replacement] of ID_TO_EN_PATTERNS) {
    regex.lastIndex = 0;
    result = result.replace(regex, replacement);
  }

  if (result !== normalized) {
    return applyWithWhitespacePreserved(raw, result);
  }

  return raw;
}

export function translatePhraseToIndonesian(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const normalized = trimmed.replace(/\s+/g, ' ');

  // 1. Exact EN -> ID match for hardcoded English headings/buttons
  const exact = EN_TO_ID_EXACT[normalized];
  if (exact) {
    return applyWithWhitespacePreserved(raw, exact);
  }

  // 2. Pattern-based EN -> ID replacements
  let result = normalized;
  for (const [regex, replacement] of EN_TO_ID_PATTERNS) {
    regex.lastIndex = 0;
    result = result.replace(regex, replacement);
  }

  if (result !== normalized) {
    return applyWithWhitespacePreserved(raw, result);
  }

  return raw;
}

function translateForLang(source: string, lang: Language): string {
  return lang === 'en' ? translatePhraseToEnglish(source) : translatePhraseToIndonesian(source);
}

export function syncDomTranslations(root: Node, lang: Language): void {
  if (typeof document === 'undefined' || !root) return;

  activeSyncDepth += 1;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const currentVal = textNode.nodeValue || '';
      const entry = textTracker.get(textNode);

      // Determine true React-owned source string:
      // If entry exists and currentVal matches what WE last wrote, the true React source is entry.orig.
      // Otherwise, React rendered fresh dynamic text into this node, so currentVal IS the new source!
      const sourceText = entry && currentVal === entry.translated ? entry.orig : currentVal;

      const translated = translateForLang(sourceText, lang);

      if (translated !== sourceText) {
        textTracker.set(textNode, {
          orig: sourceText,
          translated,
          targetLang: lang,
        });
        if (textNode.nodeValue !== translated) {
          textNode.nodeValue = translated;
        }
      } else {
        // Target language matches original React source text -> restore if we previously translated it
        if (entry) {
          textTracker.delete(textNode);
        }
        if (textNode.nodeValue !== sourceText) {
          textNode.nodeValue = sourceText;
        }
      }
    }

    // Sync interactive attributes (placeholder, title, aria-label)
    if (root instanceof Element || root instanceof Document) {
      const container = root instanceof Document ? root.body : root;
      if (!container) return;

      const elements = container.querySelectorAll('[placeholder], [title], [aria-label]');
      elements.forEach((el) => {
        if (shouldSkipElement(el)) return;

        for (const attr of TRACKED_ATTRS) {
          const currentAttrVal = el.getAttribute(attr);
          if (!currentAttrVal) continue;

          let elMap = attrTracker.get(el);
          const entry = elMap?.get(attr);

          const sourceVal = entry && currentAttrVal === entry.translated ? entry.orig : currentAttrVal;
          const translated = translateForLang(sourceVal, lang);

          if (translated !== sourceVal) {
            if (!elMap) {
              elMap = new Map();
              attrTracker.set(el, elMap);
            }
            elMap.set(attr, {
              orig: sourceVal,
              translated,
              targetLang: lang,
            });
            if (el.getAttribute(attr) !== translated) {
              el.setAttribute(attr, translated);
            }
          } else {
            if (elMap?.has(attr)) {
              elMap.delete(attr);
            }
            if (el.getAttribute(attr) !== sourceVal) {
              el.setAttribute(attr, sourceVal);
            }
          }
        }
      });
    }
  } finally {
    activeSyncDepth = Math.max(0, activeSyncDepth - 1);
  }
}
