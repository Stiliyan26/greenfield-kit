# Example: a project's verify-<app> skill

A finished skill for a web app named `orders`. Each section holds real
commands and selectors from that repo. Copy the shape, not the commands.

```markdown
---
name: verify-orders
description: Drives the orders web app in a real browser: launch, doctor, drive a feature file's Driving section, save evidence, stop. Use to prove that a feature works, or to record a journey clip.
---

# Verify orders

## Launch
`PORT=4310 DATABASE_URL=$TEST_DATABASE_URL npm run dev > temp/verification/<run>/server.log 2>&1 &`
Save the PID to `temp/verification/<run>/server.pid`. Ready when
`curl -fs http://127.0.0.1:4310/health` prints `ok`.

## Doctor
`scripts/doctor.sh 4310`: the PID is alive, `/health` is `ok`, the port
belongs to that PID, and `staff@example.test` can sign in.

## Drive
One feature: `npx playwright test e2e/drive.spec.ts --grep "<slug>"`.
All features: drop `--grep`. Selectors: `getByRole('button', { name: 'Cancel order' })`,
`getByTestId('order-row')`, route `/orders/:id`.

## Record
Add `--video=on`. The clip lands in `temp/verification/<run>/clips/<test>.webm`.

## Evidence
`temp/verification/<run>/`: one PNG per step, the `orders` row after the
action (`scripts/row.sh <order id>`), and the sent-mail log.

## Stop
`kill $(cat temp/verification/<run>/server.pid)`. Keep the evidence folder.

## Features
`docs/plans/orders/features/*.md`. A drive that covers the list but not
the detail page is incomplete when the file lists both. An empty Driving
section is `not drivable yet`.

## Helpers
`scripts/doctor.sh` and `scripts/row.sh`, both executable:
(the body of each script follows here)
```
