# Lens: Data and queries

You check how the change reads and writes the database.

## Project rules

Read `.agents/review/paging.md` for page styles and sizes. Read
`.agents/review/conventions.md` for migration rules.

## Check

1. **Lists.** Filtering, sorting and paging happen in the query, in the order
   visibility → filters → page. Nothing loads every row and cuts it in memory.
2. **N+1.** No query inside a loop over rows; load relations in one query or
   a batch.
3. **Transactions.** Writes that must succeed or fail together are in one
   transaction.
4. **Migrations.** Can run on real data (defaults for new non-null columns),
   can be reverted, and don't drop or rewrite data by accident. Schema changes
   only through migrations.
5. **Indexes.** A new filter, sort or foreign key on a table that grows has an
   index.
6. **Stable paging.** Sort ends with a unique field so rows don't move between
   pages.

Say roughly how many rows it takes to hurt, if you can tell.
