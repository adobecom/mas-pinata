# AEM CF Search filter schema — why title search is client-side

**Issue:** #365 — extend fragment search to match on `jcr:title` and the `title` content field.
**Endpoint investigated:** `POST /adobe/sites/cf/fragments/search` (AEM Content Fragments Search REST API).

## What the filter can express

The `filter` object accepts only these properties, AND-combined:

`created`, `modified`, `modifiedOrCreated`, `published`, `modelIds`, `modelTags`,
`fullText`, `path`, `onlyDirectChildren`, `status`, `locale`, `tags`.

There is **no** `properties`, `fields`, or `any` clause, and **no** per-property
`CONTAINS` / `LIKE` operator. You cannot ask the server "filter where some field
contains this substring."

## What `fullText` can (and cannot) do

`fullText.queryMode` is an enum: `EXACT_WORDS`, `EXACT_PHRASE`, `ALL_TERMS`,
`EDGES`, `AS_IS`. Every mode is word/term-level — there is no leading-wildcard
substring mode (no `*shop*`). `fullText` also indexes only the `jcr:title` and
`jcr:description` **metadata**, not content-field values. So a mid-token query
like `shop` inside `Photoshop`, or a term that lives only in a content field,
cannot be matched server-side.

## Decision

Extending `searchFragment()`'s filter (plan Branch A/B) is **infeasible** against
this endpoint. Recall is therefore done **client-side**: `searchFragment()` sends
an empty `fullText` (a locale-folder browse) for the widest recall, and
`mas-repository.js` narrows in memory via `#skipQuery` / `#queryHaystack`, which
substring-matches a lowercase haystack covering `item.title` (jcr:title),
`description`, `path`, and every string content-field value (including `title`).

## Evidence

Schema captured in the sibling screenshots:
- `01-initial.png` — search endpoint loaded in the API reference.
- `02-filter-anchor.png` — the `filter` object's full property list.
- `03-querymode-deeplink.png` — the `fullText.queryMode` enum.
- `04-fulltext-expanded.png` — `fullText` scope (jcr:title + jcr:description only).
- `05-complete-filter-schema.png` — complete filter schema, no per-field CONTAINS.
