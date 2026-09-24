# Lists and paging

Keep the list's current response format. In the database query, first limit to
what the user may see, then filter, search and sort, then page. Never load
everything and cut it in memory.

## Numbered pages

- `page` and `pageSize` have limits. The project's defaults are in `project.md`.
- Sort in a fixed order, with a unique field last (like `id`), so ties don't
  jump between pages.
- Return the items plus the existing page and total fields.

## "Load more" lists

- Use only when the requirement asks for it.
- The cursor holds the sort values of the last item, not a page number in
  disguise.
- Say clearly when there's nothing more.
- Think about rows added or deleted while the user scrolls.

## Counts per filter

- Count only what the user may see. Say whether the current filters change the
  counts.
- Totals must never reveal hidden records.

## Test

- First and last page, an invalid page size, ties in the sort, changing
  filters, no results, and records the user may not see.
- If you suggest a database index, match it to the real filter and sort.
