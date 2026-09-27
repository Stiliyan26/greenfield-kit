# Candidate finding

Every specialist returns findings in this shape, and nothing else. The judge
reads them.

```markdown
### <plain-language title>

- where: path/to/file.ts:88
- rule: <rules file> → <section>, or `write-code` → <section>, or general
- trigger: <the input or steps that make it happen, and the code path it takes>
- impact: <who notices what>
- fix: <one line>
- confidence: said | found the line | ran it
- new: yes | already there

<optional: smallest Wrong / Right snippets>
```

- One finding per problem. Two symptoms of one cause are one finding.
- `trigger` is required. "This could be null" without the call chain that gets
  there is not a finding.
- `new: already there` when the problem is in lines this diff didn't change.
- Nothing found: reply `No findings.` and list what you couldn't check.
