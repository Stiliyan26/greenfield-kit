// Mounts one variant's screen. The built page says which one on <body>:
//   <body data-variant="opus" data-screen="orders">
// Every screen module default-exports a React component that takes no props and
// reads what it shows from src/data.ts.
import { StrictMode, type ComponentType } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"

const screens = import.meta.glob<{ default: ComponentType }>("./variants/*/screens/*.tsx")
const { variant, screen } = document.body.dataset
const load = screens[`./variants/${variant}/screens/${screen}.tsx`]

if (!load) {
  document.body.textContent = `No screen module: src/variants/${variant}/screens/${screen}.tsx`
} else {
  load().then((module) => {
    const Screen = module.default
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <Screen />
      </StrictMode>,
    )
  })
}
