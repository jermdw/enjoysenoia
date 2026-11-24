"""Generate the Christmas in Senoia yard signs Stephanie Reeder (DDA) asked for
on 2026-11-23, to print Wednesday 11/25 for Thursday.

Same object as the PorchFest 2026 yard signs (porchfest repo,
`scripts/generate_signage.py`): 24 x 18in landscape, white stock, Oswald Bold
caps set as large as the sign allows, one short centered rule as the accent.
The helpers below are lifted from there (that repo is separate, so they can't
be imported). What changes is the palette: Christmas red for type and evergreen
for rules and arrows, from `src/christmas/christmas.css`, in place of
PorchFest's royal blue and flag red. The PorchFest dove is gone, and nothing
replaces it in the corner. Most of these are parking signs, and a festival mark
on a tow warning just adds noise.

1. **Santa** -- SANTA over a long arrow, double-sided: a right-pointing face
   and a left-pointing face, so whichever way a driver comes from, the arrow
   points at the same physical spot. A QR code to the map sits at the arrow's
   tail. Pass `--map-url`; without it the QR is a dashed placeholder.
2. **Lot Closed** -- LOT CLOSED / rule / WEDNESDAY & THURSDAY.
3. **Post Office Patrons Only** -- type-only.
4. **Merchant Parking** -- MERCHANT PARKING BY PERMIT ONLY / rule /
   VIOLATORS WILL BE TOWED.
5. **Shuttle Stop** -- type-only. One file; print 8.
6. **TenCate Employee Parking Only** -- type-only.

    python3 -m venv .venv && .venv/bin/pip install pymupdf pillow fonttools segno
    .venv/bin/python scripts/generate_christmas_signage.py [--map-url URL] [--outdir DIR]

Fonts come from the repo's own `@fontsource/oswald`, so `npm install` first.
Print tool only; nothing in the site build reads this file.
"""

import argparse
import io
import os

import pymupdf
from fontTools.ttLib import TTFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- palette ---
RED = (0x8B / 255, 0x1E / 255, 0x23 / 255)     # --xmas-red
GREEN = (0x1F / 255, 0x3D / 255, 0x2B / 255)   # --xmas-green

# ------------------------------------------------------------- geometry -----
W, H = 24 * 72, 18 * 72        # 1728 x 1296 pt
LEAD = 1.06
# Live area, same margins as the PorchFest signs. Their bottom margin made room
# for the dove; with no dove the band is centered on the sheet.
BAND = (130, 110, W - 130, H - 110)
BAND_W = BAND[2] - BAND[0]
BAND_H = BAND[3] - BAND[1]


# ---------------------------------------------------------------- fonts -----
def _oswald(weight, cache_dir):
    """Convert the repo's Oswald .woff to a .ttf PyMuPDF can embed. Walks up
    from the repo so it also works in a git worktree with no node_modules."""
    out = os.path.join(cache_dir, f'Oswald-{weight}.ttf')
    if os.path.exists(out):
        return out
    root = REPO
    while True:
        cand = os.path.join(root, 'node_modules', '@fontsource', 'oswald', 'files',
                            f'oswald-latin-{weight}-normal.woff')
        if os.path.exists(cand):
            f = TTFont(cand)
            f.flavor = None
            f.save(out)
            return out
        parent = os.path.dirname(root)
        if parent == root:
            raise SystemExit('Oswald not found; run `npm install` first.')
        root = parent


# Converted fonts are cached outside the repo so nothing new needs ignoring.
FONT_DIR = os.path.expanduser('~/.cache/enjoysenoia-signage')
os.makedirs(FONT_DIR, exist_ok=True)
BOLD_TTF = _oswald(700, FONT_DIR)
MED_TTF = _oswald(500, FONT_DIR)
bold = pymupdf.Font(fontfile=BOLD_TTF)
med = pymupdf.Font(fontfile=MED_TTF)


def _cap_ratio(ttf):
    """Cap height / em. Everything here is caps, so blocks are measured and
    centered on the cap line, not the ascender box (which looks top-heavy)."""
    f = TTFont(ttf)
    cap = getattr(f['OS/2'], 'sCapHeight', 0) or round(0.73 * f['head'].unitsPerEm)
    return cap / f['head'].unitsPerEm


CAP = _cap_ratio(BOLD_TTF)


# ------------------------------------------------------------ type layout ---
def partitions(words, n):
    if n == 1:
        yield [words]
        return
    for i in range(1, len(words) - n + 2):
        for rest in partitions(words[i:], n - 1):
            yield [words[:i]] + rest


def _unit_h(n):
    return LEAD * (n - 1) + CAP


def best_layout(text, max_w, max_h, max_size, max_lines=3):
    """Largest size that fits `text` in max_w x max_h, over every way of
    breaking it into 1..max_lines lines."""
    words = text.upper().split()
    best = None
    for n in range(1, min(max_lines, len(words)) + 1):
        for part in partitions(words, n):
            lines = [' '.join(p) for p in part]
            unit = max(bold.text_length(ln, fontsize=1) for ln in lines)
            size = min(max_size, max_w / unit, max_h / _unit_h(n))
            if best is None or size > best[0] + 0.5 or (
                    abs(size - best[0]) <= 0.5 and unit < best[2]):
                best = (size, lines, unit)
    return best[0], best[1]


def fit_lines(lines, max_w, max_h, max_size):
    """Largest size for line breaks chosen by hand, where best_layout's pick
    (biggest type) splits a phrase in the wrong place."""
    lines = [ln.upper() for ln in lines]
    unit = max(bold.text_length(ln, fontsize=1) for ln in lines)
    return min(max_size, max_w / unit, max_h / _unit_h(len(lines))), lines


def block_height(size, lines):
    return size * _unit_h(len(lines))


def draw_lines(page, lines, size, y_top, color, cx=W / 2):
    y = y_top + size * CAP
    for ln in lines:
        w = bold.text_length(ln, fontsize=size)
        page.insert_text((cx - w / 2, y), ln, fontname='OswB', fontsize=size,
                         color=color)
        y += size * LEAD


def draw_tracked(page, text, size, cx, y_top, color, tracking=0.13):
    """Letter-spaced Oswald Medium caps (PyMuPDF has no tracking)."""
    widths = [med.text_length(ch, fontsize=size) for ch in text]
    extra = tracking * size
    x = cx - (sum(widths) + extra * (len(text) - 1)) / 2
    for ch, w in zip(text, widths):
        page.insert_text((x, y_top + size * CAP), ch, fontname='OswM',
                         fontsize=size, color=color)
        x += w + extra


def draw_rule(page, cx, y, width, color, thickness=14):
    shape = page.new_shape()
    shape.draw_rect(pymupdf.Rect(cx - width / 2, y, cx + width / 2, y + thickness))
    shape.finish(fill=color, color=None)
    shape.commit()


def draw_arrow(page, box, direction, color):
    """Long horizontal block arrow filling box=(x0,y0,x1,y1). Shaft is 40% of
    the height so it carries the same weight as the Oswald Bold above it."""
    x0, y0, x1, y1 = box
    cy = (y0 + y1) / 2
    head = min(0.55 * (x1 - x0), 0.62 * (y1 - y0))
    sh = 0.40 * (y1 - y0) / 2
    if direction == 'right':
        pts = [(x1, cy), (x1 - head, y0), (x1 - head, cy - sh), (x0, cy - sh),
               (x0, cy + sh), (x1 - head, cy + sh), (x1 - head, y1)]
    else:
        pts = [(x0, cy), (x0 + head, y0), (x0 + head, cy - sh), (x1, cy - sh),
               (x1, cy + sh), (x0 + head, cy + sh), (x0 + head, y1)]
    shape = page.new_shape()
    shape.draw_polyline([pymupdf.Point(*p) for p in pts])
    shape.finish(fill=color, color=None, closePath=True)
    shape.commit()


def band_top(group_h):
    return BAND[1] + (BAND_H - group_h) / 2


def new_page(doc):
    page = doc.new_page(width=W, height=H)
    page.insert_font(fontname='OswB', fontfile=BOLD_TTF)
    page.insert_font(fontname='OswM', fontfile=MED_TTF)
    return page


# ------------------------------------------------------------------ signs ---
def type_only(text, max_lines=3):
    """Stacked caps filling the live band, like PorchFest's VIP PARKING ONLY."""
    def build(doc):
        page = new_page(doc)
        size, lines = best_layout(text, BAND_W, BAND_H, 520, max_lines)
        draw_lines(page, lines, size, band_top(block_height(size, lines)), RED)
    return build


def headline_and_note(head, note, head_lines=2, head_h=640):
    """HEADLINE / evergreen rule / smaller second line, like PorchFest's
    VIP MANAGEMENT ONLY with a qualifier underneath."""
    def build(doc):
        page = new_page(doc)
        g1, rule_th, g2 = 64, 14, 64
        if isinstance(head, (list, tuple)):
            h_size, h_lines = fit_lines(head, BAND_W, head_h, 520)
        else:
            h_size, h_lines = best_layout(head, BAND_W, head_h, 520, head_lines)
        hh = block_height(h_size, h_lines)
        n_size, n_lines = best_layout(note, BAND_W, BAND_H - hh - g1 - rule_th - g2,
                                      min(200, h_size * 0.6), 1)
        nh = block_height(n_size, n_lines)
        top = band_top(hh + g1 + rule_th + g2 + nh)
        draw_lines(page, h_lines, h_size, top, RED)
        y = top + hh + g1
        draw_rule(page, W / 2, y, 620, GREEN, rule_th)
        draw_lines(page, n_lines, n_size, y + rule_th + g2, GREEN)
    return build


def _qr(page, rect, url):
    """QR in `rect`, or a dashed placeholder box until the map URL is known."""
    if url:
        import segno
        buf = io.BytesIO()
        # Error correction H: yard signs get rained on, scuffed and staked
        # crooked. Border 0, because the white stock is the quiet zone.
        segno.make(url, error='h').save(buf, kind='png', scale=20, border=0,
                                        dark='#1f3d2b')
        page.insert_image(rect, stream=buf.getvalue())
        return
    shape = page.new_shape()
    shape.draw_rect(rect)
    shape.finish(color=GREEN, width=6, dashes='[24 16] 0')
    shape.commit()
    for i, word in enumerate(('QR CODE', 'TO MAP', 'GOES HERE')):
        s = 40
        w = med.text_length(word, fontsize=s)
        page.insert_text((rect.x0 + (rect.width - w) / 2,
                          rect.y0 + rect.height / 2 - 60 + i * 60 + s * CAP / 2),
                         word, fontname='OswM', fontsize=s, color=GREEN)


def sign_santa(direction, map_url):
    """SANTA over a long arrow, QR code to the map at the arrow's tail.

    The arrow runs the width of the word so its head lands under the end
    letter it points past (the final A on the right-pointing face, the S on
    the left). The QR sits in the corner on the tail side, under the word, so
    it never competes with where the arrow is pointing. 4.25in square: big
    enough to scan from a few steps back, the distance people stand from a
    yard sign.
    """
    def build(doc):
        page = new_page(doc)
        qr = 4.25 * 72
        label_s = 54
        g1, g2 = 70, 40
        arrow_h = 250
        word_h = BAND_H - g1 - max(arrow_h, qr + g2 + label_s * CAP)
        size, lines = best_layout('SANTA', BAND_W, word_h, 900, 1)
        th = block_height(size, lines)
        ww = bold.text_length(lines[0], fontsize=size)
        x0, x1 = (W - ww) / 2, (W + ww) / 2

        row_h = qr + g2 + label_s * CAP
        top = band_top(th + g1 + row_h)
        draw_lines(page, lines, size, top, RED)

        row_y = top + th + g1
        qr_gap = 70
        if direction == 'right':
            qr_rect = pymupdf.Rect(x0, row_y, x0 + qr, row_y + qr)
            ax0, ax1 = x0 + qr + qr_gap, x1
        else:
            qr_rect = pymupdf.Rect(x1 - qr, row_y, x1, row_y + qr)
            ax0, ax1 = x0, x1 - qr - qr_gap
        ay = row_y + qr / 2 - arrow_h / 2
        draw_arrow(page, (ax0, ay, ax1, ay + arrow_h), direction, GREEN)
        _qr(page, qr_rect, map_url)
        draw_tracked(page, 'SCAN FOR MAP', label_s * 0.74, qr_rect.x0 + qr / 2,
                     row_y + qr + g2, GREEN, tracking=0.1)
    return build


# ----------------------------------------------------------------- banner ---
GOLD = (0xC9 / 255, 0xA2 / 255, 0x4A / 255)    # --xmas-gold
CREAM = (0xFB / 255, 0xF6 / 255, 0xEC / 255)   # --xmas-cream
BANNER_W, BANNER_H = 96 * 72, 48 * 72           # 8 x 4 ft
BANNER_SAFE = 3 * 72                             # hems + grommets
ROUNDEL = os.path.join(REPO, 'scripts', 'assets', 'bmw-roundel.pdf')

# Dates, times and links from the listings (data/site/events.json,
# data/event_overrides.json) and christkindlmarket.org/senoia, 2026-11-23.
# The Light Up and Tour of Homes pages are `listed: false`, which only keeps
# them off the list pages; their own URLs still load.
BANNER_EVENTS = [
    ('CHRISTKINDL MARKET', 'NOV 27 – DEC 24',
     ['WED–THU 3–9 PM', 'FRI–SUN 11 AM–9 PM'],
     'https://www.christkindlmarket.org/senoia'),
    ('LIGHT UP SENOIA', 'SATURDAY, DEC 5',
     ["SANTA'S WORKSHOP 4 PM", 'PARADE 6:30 PM'],
     'https://www.enjoysenoia.com/events/light-up-senoia-parade'),
    ('TOUR OF HOMES', 'SUNDAY, DEC 13',
     ['CANDLELIGHT TOUR', '3–8 PM'],
     'https://www.enjoysenoia.com/events/2026-senoia-candlelight-tour-of-homes'),
]


def _merriweather_black():
    out = os.path.join(FONT_DIR, 'Merriweather-900.ttf')
    if not os.path.exists(out):
        root = REPO
        while True:
            cand = os.path.join(root, 'node_modules', '@fontsource', 'merriweather',
                                'files', 'merriweather-latin-900-normal.woff')
            if os.path.exists(cand):
                f = TTFont(cand)
                f.flavor = None
                f.save(out)
                break
            parent = os.path.dirname(root)
            if parent == root:
                raise SystemExit('Merriweather not found; run `npm install` first.')
            root = parent
    return out


def _qr_tile(page, rect, url):
    """Cream tile with an evergreen QR inside it. On the green ground the tile
    is the quiet zone a scanner needs (about 4 modules each side)."""
    import segno
    q = segno.make(url, error='q')
    shape = page.new_shape()
    shape.draw_rect(rect, radius=0.04)
    shape.finish(fill=CREAM, color=None)
    shape.commit()
    n = q.symbol_size(border=0)[0]
    pad = rect.width * 4 / (n + 8)
    buf = io.BytesIO()
    q.save(buf, kind='png', scale=24, border=0, dark='#1f3d2b', light='#fbf6ec')
    page.insert_image(pymupdf.Rect(rect.x0 + pad, rect.y0 + pad,
                                   rect.x1 - pad, rect.y1 - pad),
                      stream=buf.getvalue())


def build_banner(path):
    """4 x 8ft vinyl for the bottom of Main Street.

    CHRISTMAS IN SENOIA / PRESENTED BY [roundel] BMW of South Atlanta, then
    three columns, one per event: name, date, times, and a QR code to that
    event's page. Ground is the site's evergreen with cream type and gold
    rules, the micro-site hero's colors, so the banner and the site it points
    to look like one thing. Title is Merriweather Black, the site's display
    face; everything else is Oswald for legibility from a car.

    The roundel is the vector mark from the PorchFest VIP banner, with the
    dealer name in live type beside it rather than their low-res web lockup.

    QR tiles are 14in: a phone reads a code from roughly ten times its width,
    so this scans from the sidewalk, not from the road. Drivers get the dates;
    the codes are for people walking by.
    """
    doc = pymupdf.open()
    page = doc.new_page(width=BANNER_W, height=BANNER_H)
    page.insert_font(fontname='OswB', fontfile=BOLD_TTF)
    page.insert_font(fontname='OswM', fontfile=MED_TTF)
    black_ttf = _merriweather_black()
    page.insert_font(fontname='MerB', fontfile=black_ttf)
    black = pymupdf.Font(fontfile=black_ttf)

    shape = page.new_shape()
    shape.draw_rect(page.rect)
    shape.finish(fill=GREEN, color=None)
    shape.commit()

    left, right = BANNER_SAFE, BANNER_W - BANNER_SAFE
    cx = BANNER_W / 2
    y = BANNER_SAFE

    # --- title ---
    title = 'Christmas in Senoia'
    t_size = min(560, (right - left) * 0.86 / black.text_length(title, fontsize=1))
    t_cap = t_size * 0.74
    tw = black.text_length(title, fontsize=t_size)
    page.insert_text((cx - tw / 2, y + t_cap), title, fontname='MerB',
                     fontsize=t_size, color=CREAM)
    y += t_cap + 120

    # --- presented by [roundel] BMW of South Atlanta, one line ---
    roundel = pymupdf.open(ROUNDEL)
    rd = roundel[0].rect
    mark_h = 260
    mark_w = mark_h * rd.width / rd.height
    pb = 'PRESENTED BY'
    pb_size = 96
    pb_track = 0.13 * pb_size
    pb_w = sum(med.text_length(c, fontsize=pb_size) for c in pb) + pb_track * (len(pb) - 1)
    name = 'BMW of South Atlanta'
    n_size = mark_h * 0.5 / CAP
    n_w = bold.text_length(name, fontsize=n_size)
    g = 60
    row_w = pb_w + g + mark_w + g * 0.6 + n_w
    x = cx - row_w / 2
    mid = y + mark_h / 2
    draw_tracked(page, pb, pb_size, x + pb_w / 2, mid - pb_size * CAP / 2, GOLD)
    x += pb_w + g
    page.show_pdf_page(pymupdf.Rect(x, y, x + mark_w, y + mark_h), roundel, 0)
    x += mark_w + g * 0.6
    page.insert_text((x, mid + n_size * CAP / 2), name, fontname='OswB',
                     fontsize=n_size, color=CREAM)
    y += mark_h + 110

    draw_rule(page, cx, y, right - left, GOLD, 12)
    y += 12 + 120

    # --- three event columns ---
    col_w = (right - left) / 3
    qr = 14 * 72
    name_size = min(best_layout(e[0], col_w - 300, 300, 230, 1)[0]
                    for e in BANNER_EVENTS)
    date_size, time_size = 190, 140
    for i, (ev_name, date, times, url) in enumerate(BANNER_EVENTS):
        ccx = left + col_w * (i + 0.5)
        cy = y
        draw_lines(page, [ev_name], name_size, cy, CREAM, ccx)
        cy += name_size * CAP + 70
        draw_lines(page, [date], date_size, cy, GOLD, ccx)
        cy += date_size * CAP + 56
        for t in times:
            draw_tracked(page, t, time_size, ccx, cy, CREAM, tracking=0.06)
            cy += time_size * CAP + 56
        if i:
            # Thin gold divider between columns, full column height.
            x0 = left + col_w * i
            sh = page.new_shape()
            sh.draw_line((x0, y), (x0, BANNER_H - BANNER_SAFE))
            sh.finish(color=GOLD, width=5)
            sh.commit()
    qr_top = BANNER_H - BANNER_SAFE - qr
    for i, (_, _, _, url) in enumerate(BANNER_EVENTS):
        ccx = left + col_w * (i + 0.5)
        _qr_tile(page, pymupdf.Rect(ccx - qr / 2, qr_top, ccx + qr / 2, qr_top + qr), url)

    doc.save(path, deflate=True)
    doc.close()


# ------------------------------------------------------------------ proof ---
def proof_sheet(pdfs, png_out, cols=2, cw=576, ch=432):
    rows = (len(pdfs) + cols - 1) // cols
    sheet = pymupdf.open()
    sp = sheet.new_page(width=cols * cw, height=rows * ch)
    shape = sp.new_shape()
    shape.draw_rect(sp.rect)
    shape.finish(fill=(0.88, 0.88, 0.88), color=None)
    shape.commit()
    for i, f in enumerate(pdfs):
        r, c = divmod(i, cols)
        cell = pymupdf.Rect(c * cw + 8, r * ch + 8, (c + 1) * cw - 8, (r + 1) * ch - 8)
        # The PDFs carry no white fill (same as the PorchFest batch); the
        # proof supplies the stock.
        shape = sp.new_shape()
        shape.draw_rect(cell)
        shape.finish(fill=(1, 1, 1), color=None)
        shape.commit()
        src = pymupdf.open(f)
        sp.show_pdf_page(cell, src, 0)
        src.close()
    sp.get_pixmap(dpi=110).save(png_out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--outdir',
                    default=os.path.expanduser('~/Downloads/Christmas_Signage_2026'))
    # "The one with the shuttles on it" (Stephanie, 2026-11-23): the market's
    # Senoia page carries the parking map of lots 1-8, the lots the eight
    # shuttle stops serve. No standalone URL for the map image is stable
    # (it's a Wix CDN asset), so the code points at the page.
    ap.add_argument('--map-url', default='https://www.christkindlmarket.org/senoia',
                    help='Where the Santa sign QR code points.')
    args = ap.parse_args()
    os.makedirs(args.outdir, exist_ok=True)

    made = []

    def emit(name, build):
        doc = pymupdf.open()
        build(doc)
        path = os.path.join(args.outdir, name + '.pdf')
        doc.save(path, deflate=True)
        doc.close()
        made.append(path)

    emit('01a Santa - front (arrow right)', sign_santa('right', args.map_url))
    emit('01b Santa - back (arrow left)', sign_santa('left', args.map_url))
    emit('02 Lot Closed Wednesday & Thursday',
         headline_and_note('LOT CLOSED', 'WEDNESDAY & THURSDAY', head_lines=1))
    emit('03 Post Office Patrons Only', type_only('POST OFFICE PATRONS ONLY'))
    emit('04 Merchant Parking by Permit Only',
         headline_and_note(['MERCHANT PARKING', 'BY PERMIT ONLY'],
                           'VIOLATORS WILL BE TOWED', head_h=720))
    emit('05 Shuttle Stop (print 8)', type_only('SHUTTLE STOP', max_lines=2))
    emit('06 TenCate Employee Parking Only',
         type_only('TENCATE EMPLOYEE PARKING ONLY', max_lines=3))

    proof_sheet(made, os.path.join(args.outdir, '_proof.png'))

    banner = os.path.join(args.outdir, '07 Christmas in Senoia Banner 96x48.pdf')
    build_banner(banner)
    bdoc = pymupdf.open(banner)
    bdoc[0].get_pixmap(dpi=12).save(os.path.join(args.outdir, '_proof_banner.png'))
    bdoc.close()
    made.append(banner)

    for p in made:
        print('wrote', p)


if __name__ == '__main__':
    main()
