# Design: Quantity Selector Focus Indicator Non-text Contrast Fix

**Jira:** [MWPW-194234](https://jira.corp.adobe.com/browse/MWPW-194234)  
**WCAG criterion:** 1.4.11 Non-text Contrast (Level AA)  
**Severity:** Major / Severity 2 Accessibility  
**Labels:** `A11y_Audit_2026`, `Product=Adobe_com`, `WCAG_1.4.11-Non-text_Contrast`

---

## Problem

On `https://www.adobe.com/acrobat.html` (Compare Acrobat plans, Business tab), the
**quantity selector dropdown** (used by "Number of licenses" fields on Merch Cards) renders
option items with a highlighted/selected state whose focus indicator does not meet the
minimum 3:1 contrast ratio required by WCAG 1.4.11.

| Token | Value |
|---|---|
| Focus indicator color | `#E8E8E8` |
| Adjacent background | `#FFFFFF` |
| Measured contrast ratio | **1.22:1** |
| Required minimum | **3:1** |

The failing element is:

```html
<div role="option" class="item highlighted selected" id="qs-item-2" aria-selected="true">3</div>
```

This element is part of the **Milo Mini Comp Chart Merch Card** quantity selector (OST
component), rendered inside `web-components/` (the `mas-commerce-service` / quantity-selector
web component).

### User impact

Users with limited vision or no color perception cannot reliably identify keyboard focus
position when navigating the quantity selector options.

---

## Root cause

The `.item.highlighted` and `.item.selected` CSS rules use `#E8E8E8` as the background
highlight color against a white (`#FFFFFF`) container. This gives a contrast ratio of
~1.22:1, far below the 3:1 AA threshold for non-text UI components.

Authoring/content does not control this color — it is hard-coded in the component's CSS.
An engineering change to the component styles is required.

---

## Design decision

Replace the highlight background with a color that:

1. Achieves >= 3:1 contrast against `#FFFFFF` (the outer container background).
2. Remains visually consistent with the existing Spectrum / MAS design tokens.
3. Does not break the legibility of the option text (dark text on light background).

### Recommended token / value

Use the Spectrum `--spectrum-gray-200` token (`#E1E1E1`) -> still fails.  
Use `--spectrum-gray-300` (`#CACACA`) -> contrast vs `#FFFFFF` approx **1.68:1** -> still fails.  
Use `--spectrum-gray-400` (`#B3B3B3`) -> contrast vs `#FFFFFF` approx **2.32:1** -> still fails.  
Use `--spectrum-blue-100` / `#E8F4FD` -> still too light.

**Recommended: `#767676`** (Spectrum `--spectrum-gray-700`) as a **border/outline** focus
indicator rather than a fill, OR use a **solid fill** of `#D7E3F5` (custom) paired with a
`2px solid #1473E6` (Spectrum `--spectrum-blue-600`) border.

The simplest compliant approach:

```css
.item.highlighted,
.item.selected {
  background-color: #D7E3F5;   /* 1.42:1 vs white - border carries the contrast */
  outline: 2px solid #1473E6;  /* #1473E6 vs #FFFFFF = 4.54:1 PASS */
  outline-offset: -2px;
}
```

`#1473E6` vs `#FFFFFF` = **4.54:1**, exceeding the 3:1 minimum.

> **Design sign-off needed** from the Cosmocats design lead to confirm the exact token
> before implementation.

---

## Scope

| Area | In scope |
|---|---|
| `web-components/` quantity selector CSS | Yes |
| OST quantity selector (if shared) | Yes |
| Other `.item.highlighted` / `.item.selected` usages in the same component | Yes |
| Other Merch Card variants using the same selector | Yes - verify all |
| Acrobat page content / authoring | No |

---

## Acceptance criteria

1. When keyboard focus lands on an option inside the expanded quantity selector, the focus
   indicator has a contrast ratio of **>= 3:1** against its adjacent background color,
   verified with the Deque Color Contrast Analyzer (Chrome on Windows).
2. The fix applies to all three states: **highlighted**, **selected**, and
   **highlighted + selected**.
3. No regression in the visual appearance of the quantity selector in non-focus states.
4. Automated axe-core / Playwright accessibility scan passes for WCAG 1.4.11 on the
   affected component.

---

## References

- [Deque University - Focus Indicator Contrast](https://dequeuniversity.com/class/visual-design/contrast/focus-indicator)
- [W3C WCAG 2.2 - 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
- Related: [MWPW-189923](https://jira.corp.adobe.com/browse/MWPW-189923) (similar hover/selected contrast issue)
