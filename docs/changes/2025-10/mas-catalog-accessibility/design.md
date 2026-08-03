# Design: M@S Catalog Accessibility Fixes

**Jira:** [MWPW-182575](https://jira.corp.adobe.com/browse/MWPW-182575)  
**Status:** Done (resolved 2025-12-13)  
**Team:** Loot Loaders  
**Fix Version:** M@S Catalog US  
**WCAG criteria:** 4.1.2 Name, Role, Value  

---

## Problem

The M@S Catalog page (`/products/catalog.html`) had three categories of accessibility violations detected via axe/Deque audit:

### 1. `aria-required-children` violations
Certain elements used ARIA roles that mandate specific child roles, but those children were absent. This causes screen readers to misinterpret the widget structure.

**Rule:** [aria-required-children (axe 4.10)](https://dequeuniversity.com/rules/axe/4.10/aria-required-children?application=AxeChrome)

### 2. `aria-required-parent` violations
Certain ARIA-role elements were not wrapped in the required parent roles. Orphaned role elements break the semantic tree.

**Rule:** [aria-required-parent (axe 4.10)](https://dequeuniversity.com/rules/axe/4.10/aria-required-parent?application=AxeChrome)

### 3. Missing `aria-label` on Resources section links
The "Special Offers" link in the Resources section opened in a new tab but lacked an `aria-label` to communicate the destination and behaviour to screen reader users.

**Expected pattern (per Milo convention):**
```html
<a id="item-link"
   href="https://www.adobe.com/products/special-offers.html"
   target="_blank"
   data-level="0"
   aria-label="Open the Special Offers page in a new tab">
```

---

## Solution

All three issues were addressed in **[adobecom/milo PR #5233](https://github.com/adobecom/milo/pull/5233)**:

1. Corrected ARIA role hierarchies in the catalog filter/collection components so required child roles are present.
2. Ensured ARIA-role elements are contained within their required parent roles.
3. Added `aria-label` attributes to external links in the Resources section following the established Milo pattern.

### Out of scope (follow-up)
Category filter links for screen readers are tracked separately in [MWPW-185157](https://jira.corp.adobe.com/browse/MWPW-185157).

---

## Affected components

| Component | Issue type |
|-----------|-----------|
| Catalog filters / collections | `aria-required-children`, `aria-required-parent` |
| Resources section sidenav | Missing `aria-label` on external links |

---

## Testing

- Axe DevTools / AxeChrome 4.10 audit on `https://www.stage.adobe.com/products/catalog.html`
- Screen reader smoke test (NVDA/VoiceOver) on filter widgets and Resources links
- Regression: existing filter, search, and card interactions remain unaffected
