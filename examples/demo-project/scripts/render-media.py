#!/usr/bin/env python3
"""Renders the demo screenshots (SVG mockups) to .patchnotes/media/*.png.

macOS only: uses Quick Look (qlmanage) for rendering and sips for cropping.
The PNGs are committed, so this only needs to run when a mockup changes.
"""
import os
import subprocess
import tempfile

W, H = 1200, 750
FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif'
OUT = os.path.join(os.path.dirname(__file__), '..', '.patchnotes', 'media')


def text(x, y, s, size=15, fill='#0f172a', weight='normal', anchor='start'):
    s = s.replace('&', '&amp;').replace('<', '&lt;')
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{s}</text>'


def rect(x, y, w, h, fill, rx=0, stroke=None):
    s = f' stroke="{stroke}"' if stroke else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{s}/>'


def chrome(active, title, nav=('Dashboard', 'Invoices', 'Customers', 'Payments', 'Settings'), modern=False):
    """App frame: top bar, sidebar navigation and page title."""
    parts = [rect(0, 0, W, H, '#f8fafc')]
    if modern:
        parts += [rect(0, 0, 220, H, '#0f172a'), text(24, 40, 'Acme Billing', 18, '#fff', 'bold')]
        for i, item in enumerate(nav):
            y = 90 + i * 44
            if item == active:
                parts.append(rect(12, y - 26, 196, 38, '#1e293b', 8))
            parts.append(text(32, y, item, 15, '#fff' if item == active else '#94a3b8'))
        parts += [text(260, 64, title, 26, '#0f172a', 'bold')]
        return parts, 260
    parts += [rect(0, 0, W, 56, '#1e3a8a'), text(24, 36, 'Acme Billing', 19, '#fff', 'bold')]
    for i, item in enumerate(nav):
        x = 200 + i * 110
        parts.append(text(x, 35, item, 14, '#fff' if item == active else '#bfdbfe', 'bold' if item == active else 'normal'))
    parts.append(text(40, 112, title, 26, '#0f172a', 'bold'))
    return parts, 40


INVOICES = [
    ('INV-2026-0412', 'Müller GmbH', '2026-11-02', '1.240,00 €', 'Paid'),
    ('INV-2026-0413', 'Nordwind AG', '2026-11-04', '980,50 €', 'Open'),
    ('INV-2026-0414', 'Bäckerei Sommer', '2026-11-05', '312,90 €', 'Overdue'),
    ('INV-2026-0415', 'Lindqvist & Co', '2026-11-08', '4.500,00 €', 'Open'),
    ('INV-2026-0416', 'Kranich Logistik', '2026-11-10', '2.019,75 €', 'Paid'),
    ('INV-2026-0417', 'Studio Fjord', '2026-11-12', '760,00 €', 'Draft'),
]
STATUS_COLORS = {'Paid': ('#dcfce7', '#166534'), 'Open': ('#e0f2fe', '#075985'), 'Overdue': ('#fee2e2', '#991b1b'), 'Draft': ('#f1f5f9', '#475569')}


def invoice_table(x, y, w, checkbox=False):
    parts = [rect(x, y, w, 50 + len(INVOICES) * 52, '#fff', 10, '#e2e8f0')]
    cols = [0, 170, 410, 560, 720] if not checkbox else [40, 210, 450, 600, 760]
    heads = ['Number', 'Customer', 'Date', 'Amount', 'Status']
    for c, h in zip(cols, heads):
        parts.append(text(x + 20 + c, y + 31, h.upper(), 12, '#64748b', 'bold'))
    for i, row in enumerate(INVOICES):
        ry = y + 50 + i * 52
        parts.append(rect(x, ry, w, 1, '#e2e8f0'))
        if checkbox:
            parts.append(rect(x + 20, ry + 17, 18, 18, '#4f46e5' if i in (1, 3) else '#fff', 4, '#94a3b8'))
        for j, (c, value) in enumerate(zip(cols, row)):
            if j == 4:
                bg, fg = STATUS_COLORS[value]
                parts += [rect(x + 20 + c, ry + 14, 78, 26, bg, 13), text(x + 59 + c, ry + 32, value, 13, fg, 'bold', 'middle')]
            else:
                parts.append(text(x + 20 + c, ry + 32, value, 15, '#0f172a' if j else '#4f46e5'))
    return parts


def button(x, y, w, label, primary=True):
    return [rect(x, y, w, 40, '#4f46e5' if primary else '#fff', 8, None if primary else '#cbd5e1'),
            text(x + w / 2, y + 26, label, 15, '#fff' if primary else '#0f172a', 'bold', 'middle')]


def invoices_before():
    parts, x = chrome('Invoices', 'Invoices')
    return parts + button(980, 84, 180, '+ New invoice') + invoice_table(x, 150, 1120)


def invoices_after():
    parts, x = chrome('Invoices', 'Invoices')
    parts += button(780, 84, 180, 'Export as CSV', False) + button(980, 84, 180, '+ New invoice')
    parts += invoice_table(x, 150, 1120)
    # open export menu
    parts += [rect(780, 130, 260, 150, '#fff', 10, '#cbd5e1'),
              text(800, 160, 'Export 6 invoices', 13, '#64748b', 'bold'),
              rect(792, 172, 236, 36, '#eef2ff', 6), text(808, 196, 'Current filter (CSV)', 15),
              text(808, 236, 'All invoices this year (CSV)', 15), text(808, 266, 'Separator: semicolon', 13, '#64748b')]
    return parts


def reminders():
    parts, x = chrome('Settings', 'Payment reminders')
    parts += [rect(x, 150, 1120, 540, '#fff', 10, '#e2e8f0'), text(x + 30, 195, 'Remind customers automatically when an invoice is overdue.', 16, '#475569')]
    steps = [('1st reminder', '3 days after due date', 'Friendly'), ('2nd reminder', '10 days after due date', 'Firm'), ('Final notice', '21 days after due date', 'Formal, with late fee')]
    for i, (name, when, tone) in enumerate(steps):
        y = 240 + i * 120
        parts += [rect(x + 30, y, 1060, 96, '#f8fafc', 8, '#e2e8f0'), text(x + 56, y + 40, name, 18, '#0f172a', 'bold'),
                  text(x + 56, y + 70, when, 15, '#475569'), text(x + 520, y + 55, f'Tone: {tone}', 15, '#475569'),
                  rect(x + 1000, y + 34, 52, 28, '#4f46e5', 14), f'<circle cx="{x + 1038}" cy="{y + 48}" r="11" fill="#fff"/>']
    return parts + button(x + 930, 620, 160, 'Save')


def pdf(name_line, broken):
    parts = [rect(0, 0, W, H, '#cbd5e1'), rect(330, 30, 540, 720, '#fff')]
    parts += [text(370, 90, 'Acme Billing', 22, '#1e3a8a', 'bold'), text(370, 116, 'Invoice INV-2026-0412', 14, '#64748b'),
              text(370, 180, 'Bill to', 12, '#64748b', 'bold'), text(370, 204, name_line, 17),
              text(370, 228, 'Königstraße 12' if not broken else 'K?nigstra?e 12', 15), text(370, 250, '70173 Stuttgart', 15)]
    rows = [('Consulting, November', '960,00 €'), ('Travel expenses', '280,00 €')]
    for i, (item, amount) in enumerate(rows):
        y = 320 + i * 40
        parts += [rect(370, y - 26, 460, 1, '#e2e8f0'), text(370, y, item, 15), text(830, y, amount, 15, anchor='end')]
    parts += [rect(370, 380, 460, 2, '#0f172a'), text(370, 410, 'Total', 17, weight='bold'), text(830, 410, '1.240,00 €', 17, weight='bold', anchor='end')]
    if broken:
        parts += [rect(352, 186, 240, 72, 'none', 6, '#ef4444')]
    return parts


def portal():
    parts = [rect(0, 0, W, H, '#f1f5f9'), rect(0, 0, W, 64, '#fff'), text(40, 40, 'Müller GmbH · Customer portal', 19, '#0f172a', 'bold')]
    parts += [text(40, 120, 'Your invoices', 26, '#0f172a', 'bold')]
    cards = [('Open', '2.220,50 €', '#075985'), ('Overdue', '312,90 €', '#991b1b'), ('Paid this year', '18.430,00 €', '#166534')]
    for i, (label, value, color) in enumerate(cards):
        x = 40 + i * 380
        parts += [rect(x, 150, 360, 120, '#fff', 12, '#e2e8f0'), text(x + 24, 192, label, 15, '#64748b'), text(x + 24, 240, value, 32, color, 'bold')]
    parts += invoice_table(40, 300, 1120)[:1 + 5 + 3 * 5]
    return parts + button(980, 92, 180, 'Pay open invoices')


def navigation(modern):
    title = 'Dashboard'
    parts, x = chrome('Dashboard', title, modern=modern)
    top = 110 if modern else 150
    width = W - x - 40
    for i, (label, value) in enumerate([('Revenue (Nov)', '48.210 €'), ('Open invoices', '23'), ('Overdue', '4')]):
        cw = (width - 40) / 3
        cx = x + i * (cw + 20)
        parts += [rect(cx, top, cw, 110, '#fff', 12, '#e2e8f0'), text(cx + 24, top + 42, label, 15, '#64748b'), text(cx + 24, top + 86, value, 30, '#0f172a', 'bold')]
    parts += [rect(x, top + 140, width, 300, '#fff', 12, '#e2e8f0'), text(x + 24, top + 180, 'Revenue, last 12 months', 16, '#0f172a', 'bold')]
    for i, h in enumerate([90, 120, 100, 150, 140, 170, 160, 190, 210, 180, 230, 250]):
        bw = (width - 60) / 12
        parts.append(rect(x + 30 + i * bw, top + 420 - h, bw - 12, h, '#6366f1', 4))
    return parts


SCREENS = {
    'invoices-before': invoices_before,
    'invoices-after': invoices_after,
    'reminders': reminders,
    'pdf-before': lambda: pdf('M?ller GmbH', True),
    'pdf-after': lambda: pdf('Müller GmbH', False),
    'portal': portal,
    'navigation-before': lambda: navigation(False),
    'navigation-after': lambda: navigation(True),
    'bulk-archive': lambda: chrome('Invoices', 'Invoices')[0] + button(40, 84, 200, 'Archive 2 selected') + invoice_table(40, 150, 1120, checkbox=True),
}


def render(name, parts):
    # Quick Look renders a square thumbnail; center the 1200x750 screen and center-crop afterwards.
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}"><g transform="translate(0,{(W - H) // 2})">{"".join(parts)}</g></svg>'
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, f'{name}.svg')
        with open(src, 'w') as f:
            f.write(svg)
        subprocess.run(['qlmanage', '-t', '-s', str(W), '-o', tmp, src], check=True, capture_output=True)
        subprocess.run(['sips', '-c', str(H), str(W), f'{src}.png', '--out', os.path.join(OUT, f'{name}.png')], check=True, capture_output=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, build in SCREENS.items():
        render(name, build())
        print(f'rendered {name}.png')
