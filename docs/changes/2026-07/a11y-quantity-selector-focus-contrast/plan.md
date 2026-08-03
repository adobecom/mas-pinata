# Plan: Quantity Selector Focus Indicator Non-text Contrast Fix

**Jira:** [MWPW-194234](https://jira.corp.adobe.com/browse/MWPW-194234)  
**Spec:** `docs/changes/2026-07/a11y-quantity-selector-focus-contrast/design.md`

---

## Tasks

### 1. Design sign-off
- [ ] Share `design.md` with Cosmocats design lead for token/color confirmation.
- [ ] Confirm whether outline or fill approach is preferred.

### 2. Locate affected CSS
- [ ] Find `.item.highlighted` and `.item.selected` rules in `web-components/` (quantity
  selector component).
- [ ] Check if OST (`ost/`) shares the same stylesheet or has its own copy.

### 3. Implement fix
- [ ] Update the CSS to use the approved focus indicator style (outline or fill) that
  achieves >= 3:1 contrast ratio.
- [ ] Ensure all three states are covered: `highlighted`, `selected`,
  `highlighted.selected`.

### 4. Verify visually
- [ ] Open `https://www.adobe.com/acrobat.html` (or a local preview) on the Business tab.
- [ ] Expand the "Number of licenses" quantity selector.
- [ ] Navigate options with keyboard and confirm the focus indicator is clearly visible.
- [ ] Run Deque Color Contrast Analyzer to confirm >= 3:1 ratio.

### 5. Automated test
- [ ] Add or update a Playwright / axe-core accessibility test that covers WCAG 1.4.11 for
  the quantity selector component.

### 6. PR and review
- [ ] Open a PR against `main` in `adobecom/mas-pinata`.
- [ ] Link Jira ticket MWPW-194234 in the PR description.
- [ ] Request review from Cosmocats engineering + accessibility reviewer.

---

## Estimated effort

| Task | Estimate |
|---|---|
| Design sign-off | 1-2 days (async) |
| Locate + implement CSS fix | 2-4 hours |
| Visual verification | 1 hour |
| Automated test | 2-4 hours |
| PR review cycle | 1-2 days |

**Total:** ~3-5 business days end-to-end.

---

## Risks

| Risk | Mitigation |
|---|---|
| Shared stylesheet affects other components | Scope fix to the quantity selector's own shadow DOM / scoped CSS |
| Design token not yet in Spectrum | Use explicit hex value with a TODO comment to migrate to token when available |
| OST uses a different build path | Verify both `web-components/` and `ost/` independently |
