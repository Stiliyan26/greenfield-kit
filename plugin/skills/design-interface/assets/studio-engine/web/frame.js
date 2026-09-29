// Studio frame script. Every candidate page loads it in <head>:
//   <script src="/_studio/frame.js"></script>
// It applies the chosen world's tokens and fonts, reports the page height to the
// studio, and handles comment picking and pins. Candidates only use var(--…).
(() => {
  const params = new URLSearchParams(location.search)
  const root = document.documentElement
  const inStudio = window.parent !== window
  const tokenStyle = document.createElement("style")
  const fontLink = document.createElement("link")
  const chromeStyle = document.createElement("style")
  let base = null
  let worldId = params.get("world")
  let theme = params.get("theme") === "dark" ? "dark" : "light"
  let liveTokens = null
  let commentMode = false
  let pins = []
  let hoverBox = null
  let pinLayer = null

  tokenStyle.id = "studio-tokens"
  fontLink.rel = "stylesheet"
  chromeStyle.textContent = `
    .__studio-hover{position:absolute;pointer-events:none;z-index:2147483646;outline:2px solid #2563eb;outline-offset:1px;background:#2563eb14;border-radius:2px}
    .__studio-pins{position:absolute;inset:0 auto auto 0;width:0;height:0;z-index:2147483647}
    .__studio-pin{position:absolute;min-width:22px;height:22px;padding:0 6px;border-radius:11px 11px 11px 2px;border:2px solid #fff;background:#111827;color:#fff;font:600 11px/18px system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 4px #0006;transform:translate(-4px,-18px)}
    .__studio-pin[data-kind=like]{background:#15803d}.__studio-pin[data-kind=reject]{background:#b91c1c}
    .__studio-pin[data-status=done]{opacity:.45}
    .__studio-pin.__studio-focus{outline:3px solid #2563eb;outline-offset:2px}
    html.__studio-picking, html.__studio-picking *{cursor:crosshair!important}`
  document.head.append(tokenStyle, fontLink, chromeStyle)

  const post = (message) => { if (inStudio) window.parent.postMessage(message, location.origin) }
  const stack = (value) => (value.includes(",") ? value : `${value}, system-ui, sans-serif`)

  function apply() {
    if (!base) return
    // Live tokens from the studio replace the saved ones, so tuning and resets show at once.
    const tokens = { ...(liveTokens ?? base.tokens) }
    const fonts = base.fonts || {}
    tokens["font-display"] = stack(fonts.display || "system-ui")
    tokens["font-body"] = stack(fonts.body || "system-ui")
    tokenStyle.textContent = `:root{color-scheme:${theme};${Object.entries(tokens).map(([name, value]) => `--${name}:${value}`).join(";")}}`
    root.dataset.studioWorld = worldId
    root.dataset.theme = theme
    root.classList.toggle("dark", theme === "dark")
    // Inline, so a screen's own `color-scheme` can't hold it on light.
    root.style.colorScheme = theme
    const href = fonts.google ? `https://fonts.googleapis.com/css2?${fonts.google}&display=swap` : ""
    if (fontLink.getAttribute("href") !== href) {
      if (href) fontLink.href = href
      else fontLink.removeAttribute("href")
    }
  }

  async function markReady() {
    if (fontLink.getAttribute("href") && !fontLink.sheet) {
      await new Promise((resolve) => {
        fontLink.addEventListener("load", resolve, { once: true })
        fontLink.addEventListener("error", resolve, { once: true })
        setTimeout(resolve, 4000)
      })
    }
    await document.fonts.ready
    root.dataset.studioReady = "true"
    post({ type: "ready" })
    reportHeight()
    placePins()
  }

  function reportHeight() { post({ type: "height", height: Math.ceil(root.scrollHeight) }) }

  // --- comment picking --------------------------------------------------

  function selectorFor(element) {
    const unique = (selector) => document.querySelectorAll(selector).length === 1
    const quote = (value) => value.replace(/["\\]/g, "\\$&")
    if (element.id && unique(`#${CSS.escape(element.id)}`)) return `#${CSS.escape(element.id)}`
    const path = []
    for (let node = element; node && node !== document.body && node.nodeType === 1; node = node.parentElement) {
      const data = [...node.attributes].find((attribute) => attribute.name.startsWith("data-") && attribute.value && attribute.value.length < 60)
      const siblings = [...node.parentElement.children].filter((child) => child.localName === node.localName)
      const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ""
      path.unshift(data ? `${node.localName}[${data.name}="${quote(data.value)}"]` : `${node.localName}${nth}`)
      if (node.id && unique(`#${CSS.escape(node.id)}`)) { path[0] = `#${CSS.escape(node.id)}`; break }
      const candidate = path.join(" > ")
      if (data && unique(candidate)) return candidate
    }
    const full = path.join(" > ")
    if (path[0]?.startsWith("#") && unique(full)) return full
    if (unique(`body > ${full}`)) return `body > ${full}`
    // Fall back to a strict position path, which is always unique.
    const strict = []
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      strict.unshift(`${node.localName}:nth-child(${[...node.parentElement.children].indexOf(node) + 1})`)
    }
    return `body > ${strict.join(" > ")}`
  }

  function pageRect(element) {
    const rect = element.getBoundingClientRect()
    return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height }
  }

  function showHover(element) {
    if (!hoverBox) { hoverBox = document.createElement("div"); hoverBox.className = "__studio-hover"; document.body.append(hoverBox) }
    const rect = pageRect(element)
    Object.assign(hoverBox.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px`, display: "block" })
  }

  function setCommentMode(on) {
    commentMode = on
    root.classList.toggle("__studio-picking", on)
    if (!on && hoverBox) hoverBox.style.display = "none"
  }

  document.addEventListener("mouseover", (event) => {
    if (commentMode && !event.target.closest(".__studio-pins")) showHover(event.target)
  })
  document.addEventListener("click", (event) => {
    if (!commentMode || event.target.closest(".__studio-pins")) return
    event.preventDefault()
    event.stopPropagation()
    const element = event.target
    const snippet = (element.innerText || element.getAttribute("aria-label") || element.localName).trim().replace(/\s+/g, " ").slice(0, 100)
    const rect = element.getBoundingClientRect()
    post({ type: "pick", selector: selectorFor(element), snippet, rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height } })
    setCommentMode(false)
  }, true)
  document.addEventListener("keydown", (event) => {
    if (commentMode && event.key === "Escape") { setCommentMode(false); post({ type: "pick-cancel" }) }
  })

  // --- pins ---------------------------------------------------------------

  function placePins() {
    if (!document.body) return
    if (!pinLayer) { pinLayer = document.createElement("div"); pinLayer.className = "__studio-pins"; document.body.append(pinLayer) }
    pinLayer.replaceChildren()
    const missing = []
    for (const pin of pins) {
      let target = null
      try { target = document.querySelector(pin.selector) } catch { target = null }
      if (!target) { missing.push(pin.id); continue }
      const rect = pageRect(target)
      const button = document.createElement("button")
      button.type = "button"
      button.className = "__studio-pin"
      button.textContent = String(pin.number)
      button.dataset.kind = pin.kind
      button.dataset.status = pin.status
      button.dataset.id = pin.id
      button.title = pin.text
      button.style.left = `${rect.x + rect.width - 8}px`
      button.style.top = `${rect.y + 4}px`
      button.addEventListener("click", (event) => { event.stopPropagation(); post({ type: "pin-click", id: pin.id }) })
      pinLayer.append(button)
    }
    post({ type: "pins-missing", ids: missing })
  }

  function focusPin(id) {
    const pin = pins.find((item) => item.id === id)
    const target = pin && document.querySelector(pin.selector)
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" })
    pinLayer?.querySelectorAll(".__studio-pin").forEach((button) => button.classList.toggle("__studio-focus", button.dataset.id === id))
    const rect = target?.getBoundingClientRect()
    if (rect) post({ type: "pin-focused", id, y: rect.top + scrollY })
  }

  // --- messages from the studio ---------------------------------------------

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return
    const message = event.data || {}
    if (message.type === "tokens" && message.world === worldId) { liveTokens = message.tokens; theme = message.theme || theme; apply() }
    if (message.type === "comment-mode") setCommentMode(Boolean(message.on))
    if (message.type === "pins") { pins = message.pins || []; placePins() }
    if (message.type === "focus-pin") focusPin(message.id)
  })

  document.addEventListener("DOMContentLoaded", () => {
    new ResizeObserver(() => { reportHeight(); placePins() }).observe(document.body)
  })

  const query = new URLSearchParams()
  if (worldId) query.set("world", worldId)
  if (params.get("tuned") === "0") query.set("tuned", "0")
  if (theme === "dark") query.set("theme", "dark")
  fetch(`/api/tokens?${query}`)
    .then((response) => response.json().then((value) => {
      if (!response.ok) throw new Error(value.error || `tokens answered ${response.status}`)
      return value
    }))
    .then((value) => {
      base = value
      worldId = value.world
      theme = value.theme || theme
      apply()
      return markReady()
    })
    .catch((error) => {
      console.error("Studio frame could not load tokens:", error)
      root.dataset.studioReady = "error"
      post({ type: "ready", error: String(error) })
    })
})()
