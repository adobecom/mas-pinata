# Plan: M@S Catalog Accessibility Fixes

**Jira:** [MWPW-182575](https://jira.corp.adobe.com/browse/MWPW-182575)  
**Design doc:** [design.md](./design.md)

---

## Deliverables

| # | Task | Status |
|---|------|--------|
| 1 | Fix `aria-required-children` violations in catalog filter/collection components | Done |
| 2 | Fix `aria-required-parent` violations in catalog filter/collection components | Done |
| 3 | Add `aria-label` to Resources section external links | Done |
| 4 | PR merged to `adobecom/milo` ([#5233](https://github.com/adobecom/milo/pull/5233)) | Done |
| 5 | Follow-up: category filter links for screen readers | Tracked in [MWPW-185157](https://jira.corp.adobe.com/browse/MWPW-185157) |

---

## Timeline

| Milestone | Date |
|-----------|------|
| Issue filed | 2025-10-21 |
| PR opened | 2025-12-10 |
| Resolved / Done | 2025-12-13 |

---

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| ARIA role changes break existing JS behaviour | PR includes regression test pass on catalog page interactions |
| Category filter links remain inaccessible | Tracked in follow-up MWPW-185157 |
