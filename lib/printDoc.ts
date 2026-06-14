// Print a single document node as a clean A4 page in a dedicated window.
// Renders the exact same HTML the user sees on screen (vector text, real
// Thai + Material Symbols fonts) so the saved PDF matches the on-screen design.
export function printDocNode(node: HTMLElement | null, filename: string) {
  if (!node) return
  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) {
    // Pop-up blocked: fall back to the standard print dialog.
    window.print()
    return
  }
  const origin = window.location.origin
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${filename}</title>
<base href="${origin}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;}
html,body{margin:0;padding:0;background:#fff;font-family:'IBM Plex Sans Thai','IBM Plex Sans',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.material-symbols-rounded{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;font-feature-settings:'liga';font-variant-ligatures:normal;line-height:1;}
#doc>*{max-width:none !important;width:100% !important;margin:0 !important;border:none !important;border-radius:0 !important;box-shadow:none !important;}
@page{size:A4;margin:0;}
</style></head><body><div id="doc">${node.outerHTML}</div></body></html>`
  win.document.open()
  win.document.write(html)
  win.document.close()

  const triggerPrint = () => {
    const docWithFonts = win.document as Document & { fonts?: { ready: Promise<unknown> } }
    const ready = docWithFonts.fonts?.ready ?? Promise.resolve()
    ready.then(() => setTimeout(() => { win.focus(); win.print() }, 300))
  }
  win.onafterprint = () => win.close()
  if (win.document.readyState === 'complete') triggerPrint()
  else win.onload = triggerPrint
}
