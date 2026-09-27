# Lists and paging (for reviewers)

Any list that can search, filter, sort, or grow.

## Order in the query

1. Who may see which rows (`roles.md`)
2. Filters, search, sort
3. Page

Never load everything and filter or slice it in the handler or the UI.

## Styles

| Style | When | Response |
| --- | --- | --- |
| Cursor | load more, infinite scroll | `{ items, nextCursor }` |
| Numbered pages | the UI shows page numbers and a total | `items, page, pageSize, total, totalPages` |

- Sizes: <default> default, <max> max.
- Sort ends with a unique field so ties don't move between pages.
- Reuse <the shared pagination helper>; don't add a second response shape.
