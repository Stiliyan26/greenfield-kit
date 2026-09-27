# Lens: Tests

You check that the tests prove the change works.

## Project rules

Read `.agents/review/roles.md` → Tests, for where permission tests live.

## Check

1. **Would it fail?** For each changed test, ask: would it still pass if the
   code under test returned nothing, or the wrong thing? Then it checks
   nothing.
2. **Covered.** New behavior, especially on the server, has a test at the
   level where it can break (unit, API or end to end).
3. **Permissions.** Each access rule the change touches has an allow and a
   deny test.
4. **Mocks.** The test doesn't mock the very thing it claims to test.
5. **Edges.** The edge cases the change handles are tested, not only the
   happy path.
6. **Ran.** `tools.txt` shows the tests ran on this code. If it doesn't, say
   so.

Name the missing test by what it proves: "Employee cannot download another
person's invoice".
