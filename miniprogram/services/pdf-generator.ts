const pako = require('./pako-deflate.js')

const SCALE = 2
const PAGE_W = 595 * SCALE
const PAGE_H = 842 * SCALE
const MARGIN_X = 42 * SCALE
const MARGIN_Y = 52 * SCALE
const CARD_PAD = 16 * SCALE
const CARD_RADIUS = 7 * SCALE
const CARD_INNER_W = PAGE_W - MARGIN_X * 2 - CARD_PAD * 2

const FONTS = {
  title: `bold ${22 * SCALE}px sans-serif`,
  subtitle: `${13 * SCALE}px sans-serif`,
  date: `${10 * SCALE}px sans-serif`,
  section: `bold ${14 * SCALE}px sans-serif`,
  entryTitle: `bold ${13 * SCALE}px sans-serif`,
  body: `${11 * SCALE}px sans-serif`,
  small: `${9 * SCALE}px sans-serif`,
} as const

const COLORS = {
  bg: '#FFFFFF',
  text: '#1a1a2e',
  secondary: '#6b7280',
  divider: '#e0e2e7',
  cardBg: '#fafbfc',
  cardBorder: '#e2e4e9',
} as const

export interface PdfEntry {
  title: string
  account: string
  password: string
  note?: string
}

export interface PdfSection {
  categoryLabel: string
  entries: PdfEntry[]
}

// ---------- text helpers ----------

function setFont(ctx: CanvasRenderingContext2D, font: string) {
  ctx.font = font
}

function lh(font: string): number {
  const m = font.match(/(\d+)px/)
  return Math.round((m ? parseInt(m[1], 10) : 12) * 1.55)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, font: string, maxW: number): string[] {
  setFont(ctx, font)
  const out: string[] = []
  let cur = ''
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW && cur.length > 0) {
      out.push(cur)
      cur = ch
    } else {
      cur += ch
    }
  }
  if (cur) out.push(cur)
  return out.length ? out : ['']
}

// ---------- round-rect ----------

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ---------- entry height ----------

function entryHeight(ctx: CanvasRenderingContext2D, entry: PdfEntry): number {
  let h = CARD_PAD
  h += wrap(ctx, entry.title, FONTS.entryTitle, CARD_INNER_W).length * lh(FONTS.entryTitle)
  h += 6
  h += lh(FONTS.body) // account
  h += 3
  h += lh(FONTS.body) // password
  if (entry.note) {
    h += 3
    h += wrap(ctx, entry.note, FONTS.small, CARD_INNER_W).length * lh(FONTS.small)
  }
  h += CARD_PAD
  return Math.ceil(h)
}

// ---------- draw a single page ----------

function drawPage(
  ctx: CanvasRenderingContext2D,
  sections: PdfSection[],
  startSec: number,
  startEnt: number,
  totalCount: number,
  pageIndex: number,
  totalPages: number,
): { nextSec: number; nextEnt: number; hasMore: boolean } {
  // clear
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  let y = MARGIN_Y
  const BODY_BTM = PAGE_H - 52 * SCALE

  // --- header (first page only) ---
  if (pageIndex === 0) {
    ctx.fillStyle = COLORS.text
    setFont(ctx, FONTS.title)
    ctx.textAlign = 'center'
    const tlh = lh(FONTS.title)
    ctx.fillText('密麻麻', PAGE_W / 2, y + tlh - 4)
    y += tlh + 4

    setFont(ctx, FONTS.subtitle)
    ctx.fillStyle = COLORS.secondary
    ctx.fillText('密码备份档案', PAGE_W / 2, y + lh(FONTS.subtitle) - 3)
    y += lh(FONTS.subtitle) + 6

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ds = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`
    setFont(ctx, FONTS.date)
    ctx.fillStyle = COLORS.secondary
    ctx.fillText(ds, PAGE_W / 2, y + lh(FONTS.date) - 3)
    y += lh(FONTS.date) + 14

    // divider
    ctx.strokeStyle = COLORS.divider
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(MARGIN_X, y)
    ctx.lineTo(PAGE_W - MARGIN_X, y)
    ctx.stroke()
    y += 16 * SCALE
  }

  let si = startSec
  let ei = startEnt

  for (; si < sections.length; si++) {
    const sec = sections[si]

    // Only draw section header when starting a new category on this page
    if (ei === 0) {
      const secH = lh(FONTS.section) + 10
      if (y + secH > BODY_BTM) {
        return { nextSec: si, nextEnt: ei, hasMore: true }
      }

      ctx.fillStyle = COLORS.text
      setFont(ctx, FONTS.section)
      ctx.textAlign = 'left'
      ctx.fillText(`▸ ${sec.categoryLabel}`, MARGIN_X, y + lh(FONTS.section))
      setFont(ctx, FONTS.date)
      ctx.fillStyle = COLORS.secondary
      ctx.textAlign = 'right'
      ctx.fillText(`共 ${sec.entries.length} 条`, PAGE_W - MARGIN_X, y + lh(FONTS.section))
      y += secH
    }

    for (; ei < sec.entries.length; ei++) {
      const ent = sec.entries[ei]
      const eh = entryHeight(ctx, ent)

      if (y + eh > BODY_BTM) {
        return { nextSec: si, nextEnt: ei, hasMore: true }
      }

      drawEntryCard(ctx, ent, y, eh)
      y += eh + 9 * SCALE
    }
    ei = 0
  }

  // --- footer (every page) ---
  ctx.strokeStyle = COLORS.divider
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(MARGIN_X, BODY_BTM)
  ctx.lineTo(PAGE_W - MARGIN_X, BODY_BTM)
  ctx.stroke()

  setFont(ctx, FONTS.date)
  ctx.fillStyle = COLORS.secondary
  ctx.textAlign = 'left'
  ctx.fillText(`密麻麻 · 共 ${totalCount} 条记录`, MARGIN_X, BODY_BTM + 26 * SCALE)
  ctx.textAlign = 'right'
  ctx.fillText(`${pageIndex + 1} / ${totalPages}`, PAGE_W - MARGIN_X, BODY_BTM + 26 * SCALE)

  return { nextSec: si, nextEnt: 0, hasMore: false }
}

// ---------- draw one entry card ----------

function drawEntryCard(ctx: CanvasRenderingContext2D, entry: PdfEntry, top: number, cardH: number) {
  // card bg and border
  ctx.fillStyle = COLORS.cardBg
  ctx.strokeStyle = COLORS.cardBorder
  ctx.lineWidth = 0.4
  roundRect(ctx, MARGIN_X, top, PAGE_W - MARGIN_X * 2, cardH, CARD_RADIUS)
  ctx.fill()
  ctx.stroke()

  let cy = top + CARD_PAD
  const LABEL_W = 44 * SCALE
  const GAP = 14 * SCALE
  const valX = MARGIN_X + CARD_PAD + LABEL_W + GAP

  // title
  ctx.fillStyle = COLORS.text
  setFont(ctx, FONTS.entryTitle)
  ctx.textAlign = 'left'
  const tLines = wrap(ctx, entry.title, FONTS.entryTitle, CARD_INNER_W)
  for (const line of tLines) {
    ctx.fillText(line, MARGIN_X + CARD_PAD, cy + lh(FONTS.entryTitle) - 3)
    cy += lh(FONTS.entryTitle)
  }
  cy += 6

  // account
  setFont(ctx, FONTS.body)
  ctx.fillStyle = COLORS.secondary
  ctx.fillText('账号', MARGIN_X + CARD_PAD, cy + lh(FONTS.body) - 3)
  ctx.fillStyle = COLORS.text
  ctx.fillText(entry.account, valX, cy + lh(FONTS.body) - 3)
  cy += lh(FONTS.body) + 3

  // password
  setFont(ctx, FONTS.body)
  ctx.fillStyle = COLORS.secondary
  ctx.fillText('密码', MARGIN_X + CARD_PAD, cy + lh(FONTS.body) - 3)
  ctx.fillStyle = COLORS.text
  ctx.fillText(entry.password, valX, cy + lh(FONTS.body) - 3)
  cy += lh(FONTS.body) + 3

  // note (if present)
  if (entry.note) {
    setFont(ctx, FONTS.small)
    ctx.fillStyle = COLORS.secondary
    ctx.fillText('备注', MARGIN_X + CARD_PAD, cy + lh(FONTS.small) - 3)
    ctx.fillStyle = COLORS.text
    const nLines = wrap(ctx, entry.note, FONTS.small, CARD_INNER_W - LABEL_W - GAP)
    ctx.fillText(nLines[0], valX, cy + lh(FONTS.small) - 3)
    cy += lh(FONTS.small)
    for (let i = 1; i < nLines.length; i++) {
      ctx.fillText(nLines[i], valX, cy + lh(FONTS.small) - 3)
      cy += lh(FONTS.small)
    }
  }
}

// ---------- canvas to compressed rgb ----------

function canvasToFlateRgb(canvas: WechatMiniprogram.OffscreenCanvas): Uint8Array {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2d context')
  const img = ctx.getImageData(0, 0, PAGE_W, PAGE_H)
  const src = img.data
  const total = PAGE_W * PAGE_H
  const raw = new Uint8Array(total * 3)
  for (let i = 0; i < total; i++) {
    raw[i * 3] = src[i * 4]
    raw[i * 3 + 1] = src[i * 4 + 1]
    raw[i * 3 + 2] = src[i * 4 + 2]
  }
  return pako.deflate(raw)
}

// ---------- PDF builder ----------

function strToUtf8(s: string): Uint8Array {
  const bytes: number[] = []
  for (let i = 0; i < s.length; i++) {
    const cp = s.charCodeAt(i)
    if (cp < 0x80) {
      bytes.push(cp)
    } else if (cp < 0x800) {
      bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
    } else if (cp < 0xd800 || cp >= 0xe000) {
      bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    } else {
      i++
      const lo = s.charCodeAt(i)
      const u = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00)
      bytes.push(0xf0 | (u >> 18), 0x80 | ((u >> 12) & 0x3f), 0x80 | ((u >> 6) & 0x3f), 0x80 | (u & 0x3f))
    }
  }
  return new Uint8Array(bytes)
}

function buildPdf(pagePixels: Uint8Array[]): ArrayBuffer {
  const parts: Uint8Array[] = []

  function w(s: string) { parts.push(strToUtf8(s)) }
  function b(buf: Uint8Array) { parts.push(buf) }

  let num = 1
  const catNum = num++
  const pagesNum = num++
  const pageNums: number[] = []
  const imgNums: number[] = []

  for (let i = 0; i < pagePixels.length; i++) {
    pageNums.push(num++)
    imgNums.push(num++)
  }

  w('%PDF-1.4\n%\x80\x80\x80\x80\n')

  const offsets: number[] = []
  function mark() { offsets.push(parts.reduce((s, p) => s + p.length, 0)) }

  mark(); w(`${catNum} 0 obj\n<< /Type /Catalog /Pages ${pagesNum} 0 R >>\nendobj\n`)
  mark()
  w(`${pagesNum} 0 obj\n<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pagePixels.length} >>\nendobj\n`)

  for (let i = 0; i < pagePixels.length; i++) {
    const compressed = pagePixels[i]
    const imgN = imgNums[i]
    const pageN = pageNums[i]
    const contentN = num++

    mark()
    w(`${imgN} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${PAGE_W} /Height ${PAGE_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`)
    b(compressed)
    w('\nendstream\nendobj\n')

    const cs = `q ${PAGE_W} 0 0 ${PAGE_H} 0 0 cm /Im0 Do Q`
    const csb = strToUtf8(cs)
    mark()
    w(`${contentN} 0 obj\n<< /Length ${csb.length} >>\nstream\n`)
    b(csb)
    w('\nendstream\nendobj\n')

    mark()
    w(`${pageN} 0 obj\n<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentN} 0 R /Resources << /XObject << /Im0 ${imgN} 0 R >> >> >>\nendobj\n`)
  }

  const xrefOff = parts.reduce((s, p) => s + p.length, 0)
  w(`xref\n0 ${num}\n0000000000 65535 f \n`)
  for (const o of offsets) {
    w(`${String(o).padStart(10, '0')} 00000 n \n`)
  }
  w(`trailer\n<< /Size ${num} /Root ${catNum} 0 R >>\nstartxref\n${xrefOff}\n%%EOF`)

  const total = parts.reduce((s, p) => s + p.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { result.set(p, pos); pos += p.length }
  return result.buffer
}

// ---------- public API ----------

export async function generateBackupPdf(sections: PdfSection[]): Promise<string> {
  const totalCount = sections.reduce((s, sec) => s + sec.entries.length, 0)

  // plan pages
  const planCanvas = wx.createOffscreenCanvas({ type: '2d', width: PAGE_W, height: PAGE_H })
  const planCtx = planCanvas.getContext('2d')
  if (!planCtx) throw new Error('Failed to get 2d context')

  let si = 0; let ei = 0
  const plans: Array<{ s: number; e: number }> = []
  while (si < sections.length) {
    plans.push({ s: si, e: ei })
    const r = drawPage(planCtx, sections, si, ei, totalCount, plans.length, 999)
    si = r.nextSec; ei = r.nextEnt
    if (!r.hasMore) break
  }

  const totalPages = plans.length

  // render each page
  const pagePixels: Uint8Array[] = []
  for (let i = 0; i < plans.length; i++) {
    const p = plans[i]
    const c = wx.createOffscreenCanvas({ type: '2d', width: PAGE_W, height: PAGE_H })
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('Failed to get page context')
    drawPage(ctx, sections, p.s, p.e, totalCount, i, totalPages)
    pagePixels.push(canvasToFlateRgb(c))
  }

  // build PDF
  const pdfBuf = buildPdf(pagePixels)
  const path = `${wx.env.USER_DATA_PATH}/mimama-plain-${Date.now()}.pdf`
  const fs = wx.getFileSystemManager()
  fs.writeFileSync(path, pdfBuf)
  return path
}
