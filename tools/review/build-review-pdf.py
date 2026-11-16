#!/usr/bin/env python3
"""
Builds the page-by-page UCI review PDF for customer markup.
One screen per page, printable on letter paper, with a notes area on each page.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'JennyWiley_UCI_v0.2_Review.pdf')

REV = 'UCI v0.2.0'
DATE = 'November 16, 2026'
PROJECT = 'Jenny Wiley Conference Center'
SUB = 'Touch Panel Interface Review'
DEMO = 'https://claude.ai/artifact/1Lgdzbas5V4si9KfnBo4o7'
REPO = 'github.com/tnackGravity/Testing'

W, H = letter
M = 42.0                      # page margin
CW = W - 2 * M                # content width

INK = (0.09, 0.13, 0.11)
MUTED = (0.42, 0.46, 0.43)
RULE = (0.80, 0.82, 0.80)
GOLD = (0.78, 0.60, 0.15)
GREEN = (0.10, 0.27, 0.18)
BOXBG = (0.97, 0.97, 0.955)

# (image, section, title, when, what, notes)
SCREENS = [
    ('lock', 'Starting up', 'PIN lock',
     'Shown when the system is off, if the PIN lockout is turned on.',
     'Keeps the room from being started by anyone who walks in. The PIN is set in the control program; '
     'the panel sends the digits for checking. This whole feature can be switched off on the System page.',
     'Confirm whether a PIN is wanted at all, and what it should be. "Contact the front desk" is '
     'placeholder wording.'),
    ('start', 'Starting up', 'Start page - one room',
     'First screen when the system is off and the room is on its own.',
     'The two presets from the specification, plus a way into the manual controls. The panel on the right '
     'shows which rooms are combined right now and which room this panel is in.',
     'Confirm the two preset names and the one-line descriptions under them. These are the words most '
     'guests will read.'),
    ('warm', 'Starting up', 'Starting up',
     'Covers the screen while the projector warms up.',
     'Counts down so nobody taps the screen repeatedly wondering whether it worked. Demo shows 10 seconds; '
     'the real time comes from the projector.',
     'Confirm the wording. Audio Only startup uses the same screen with a shorter count.'),
    ('av', 'Preset 1', 'Audio-Video Conference - one room',
     'After starting Preset 1.',
     'Everything a presenter needs on one screen: pick which wall plate to show, blank the screen, change '
     'the lights. The green dot shows where a laptop is actually plugged in. Projector and screen status '
     'is on the right.',
     'Confirm the wall plate names. These should match whatever gets engraved or labeled on the plates '
     'themselves.'),
    ('conf', 'Preset 2', 'Audio Only Conference - one room',
     'After starting Preset 2.',
     'Same shape as Preset 1, but the projector stays off and the sources are the 3.5 mm audio jacks. '
     'Wired microphones come up on the XLR plates and appear in the mixer.',
     'Shade control was removed from this page at your direction. The specification still lists it under '
     'Preset 2, so this is a recorded deviation.'),
    ('video', 'Manual controls', 'Video routing - one room',
     'Advanced tab, during a session.',
     'Any source to the projector, one column per projector in the group. The dot shows which plates have '
     'something plugged in.',
     ''),
    ('audio', 'Manual controls', 'Audio mixer - one room',
     'Advanced tab, during a session.',
     'Program audio source across the top, then eight channels: four wireless (2 handheld, 2 lavalier) and '
     'four wired XLR inputs. Levels return to their defaults the next time a preset is recalled, as the '
     'specification requires.',
     'Confirm the microphone names. "Handheld 1" and "Lavalier 1" are assumptions.'),
    ('lighting', 'Manual controls', 'Lighting - one room',
     'Advanced tab, during a session.',
     'Room scenes on top, then each zone with preset levels and fine adjustment. The blue banner appears '
     'whenever the wall switches are disabled, so staff are not left wondering why the switch does nothing.',
     'Zone names and counts are assumptions. Real zones and scene numbers need to come from the lighting '
     'provider.'),
    ('displays', 'Manual controls', 'Projectors and screens',
     'Advanced tab, during a session.',
     'Direct control of projector power, screen up and down, and picture blank, for when someone wants to '
     'override the automatic behavior.',
     ''),
    ('layout', 'Manual controls', 'Room layout',
     'Advanced tab, during a session.',
     'The four ways the two partitions can be set. A solid line is a closed wall; a dashed line is an open '
     'one. Whichever is chosen here changes how all three panels behave.',
     'Confirm the layout names. These appear on every panel.'),
    ('layout-confirm', 'Manual controls', 'Room layout - confirmation',
     'After tapping a different layout.',
     'Changing the layout affects other rooms and other panels, so it asks first and reminds staff to '
     'check the partitions.',
     ''),
    ('system', 'Manual controls', 'System',
     'Advanced tab, during a session.',
     'The few settings staff may need: how long an empty room waits before shutting down, and whether the '
     'PIN lock is used. Status on the right is for troubleshooting.',
     'Confirm the 30 minute default for automatic shutdown.'),
    ('manual', 'Manual controls', 'Manual controls entry',
     'After choosing "Manual controls" on the start page.',
     'Starts the audio path without touching lights, projector or screen, and opens straight into the '
     'tabs. For staff setting a room up by hand.',
     ''),
    ('occ', 'Shutting down', 'Empty room warning',
     'After the room has been vacant for the set time.',
     'Warns before shutting down so a quiet meeting is not cut off. One tap keeps the system on.',
     'Confirm the 30 second warning length.'),
    ('shutdown-confirm', 'Shutting down', 'Shutdown confirmation',
     'After tapping Shut down.',
     'Lists what is about to happen, so nobody shuts down a room mid-meeting by accident.',
     ''),
    ('cool', 'Shutting down', 'Shutting down',
     'While the projector cools.',
     'Counts down through the cool-down. Afterwards the panel returns to the PIN lock, if it is in use.',
     ''),
    ('start-all', 'Combined rooms', 'Start page - all three combined',
     'System off, partitions open.',
     'The same start page, but the header and the map now show all three rooms. Any of the three panels '
     'starts the whole space.',
     ''),
    ('av-all', 'Combined rooms', 'Audio-Video Conference - all three combined',
     'Preset 1 with the rooms combined.',
     'Now six wall plates are offered, labeled by room, and one choice goes to all three projectors. The '
     'right side lists every display in the group.',
     'Confirm that one source to all three projectors is the right default when combined.'),
    ('video-all', 'Combined rooms', 'Video routing - all three combined',
     'Advanced tab with the rooms combined.',
     'For the case where the rooms are combined but each projector should show something different.',
     ''),
    ('audio-all', 'Combined rooms', 'Audio mixer - all three combined',
     'Advanced tab with the rooms combined.',
     'All 24 channels, grouped by room. The strip area scrolls sideways; Iroquois is shown here with '
     'Shawnee and Cherokee to the right.',
     'Twenty-four strips is a lot for a 7 inch panel. Tell us if you would rather pick a room first, or '
     'show only the microphones that are switched on.'),
    ('lighting-all', 'Combined rooms', 'Lighting - all three combined',
     'Advanced tab with the rooms combined.',
     'One column per room, so lights can still be set room by room while the space is combined.',
     ''),
    ('displays-all', 'Combined rooms', 'Projectors and screens - all three combined',
     'Advanced tab with the rooms combined.',
     'All three projectors and screens on one page.',
     ''),
]

QUESTIONS = [
    ('Lighting zones', 'Two zones per room are assumed: "Front Row" and "Task Lighting", with four scenes '
     '(Full, Presentation, Dim, Off). What are the real nLight zones, their names, and the scene numbers?'),
    ('Backup switch', 'The specification describes one switch at the rack that starts all rooms, divided, '
     'in Preset 1. Drawing AV-601 shows three toggles, one per room. Which is correct?'),
    ('Combining a running room', 'When a room joins a group that is already running, should it adopt the '
     'running preset? The interface currently does this. The specification does not say.'),
    ('PIN lockout', 'Is a PIN wanted when the system is off, and if so, what should it be?'),
    ('Microphone names', 'Channels are labeled Handheld 1-2, Lavalier 1-2 and Front/Side XLR 1-2. Should '
     'these match labels on the microphones themselves?'),
    ('Wall plate names', 'Sources are named Front Wall Plate, Side Wall Plate and Floor Box. These should '
     'match the engraving on the plates.'),
    ('Colors and logo', 'The palette is an interpretation of the Kentucky State Parks look, not official '
     'brand values, and no Parks logo is used. Supply approved colors and artwork if they are required.'),
    ('Shade control', 'Removed at your direction in v0.2.0. The specification lists it under 2.0.B and '
     'Preset 2, so confirm this deviation with the engineer or owner.'),
]


def set_fill(c, rgb):
    c.setFillColorRGB(*rgb)


def set_stroke(c, rgb):
    c.setStrokeColorRGB(*rgb)


def header(c, page_no, total, section=None):
    """Running header and footer on every interior page."""
    y = H - M
    set_fill(c, GREEN)
    c.setFont('Times-Bold', 11)
    c.drawString(M, y - 8, 'Jenny Wiley')
    c.setFont('Helvetica', 7.5)
    set_fill(c, MUTED)
    c.drawString(M + 63, y - 8, 'CONFERENCE CENTER')
    c.setFont('Helvetica', 8)
    right = '%s   |   %s' % (SUB, REV)
    c.drawRightString(W - M, y - 8, right)
    set_stroke(c, RULE)
    c.setLineWidth(0.6)
    c.line(M, y - 16, W - M, y - 16)
    # footer
    set_fill(c, MUTED)
    c.setFont('Helvetica', 7.5)
    c.drawString(M, M - 14, '%s  -  %s' % (PROJECT, DATE))
    c.drawRightString(W - M, M - 14, 'Page %d of %d' % (page_no, total))
    if section:
        c.setFont('Helvetica', 7.5)
        c.drawCentredString(W / 2, M - 14, section)


def wrap(text, font, size, width):
    """Greedy word wrap, returns list of lines."""
    words = text.split()
    lines, cur = [], ''
    for wd in words:
        trial = (cur + ' ' + wd).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def para(c, text, x, y, width, font='Helvetica', size=9.2, leading=12.2, rgb=INK):
    set_fill(c, rgb)
    c.setFont(font, size)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def checkbox(c, x, y, label, size=9):
    set_stroke(c, (0.35, 0.38, 0.36))
    c.setLineWidth(0.9)
    c.rect(x, y - 1, size, size, stroke=1, fill=0)
    set_fill(c, INK)
    c.setFont('Helvetica', 8.6)
    c.drawString(x + size + 5, y + 1.2, label)
    return x + size + 9 + c.stringWidth(label, 'Helvetica', 8.6)


def cover(c, total):
    # top band
    set_fill(c, GREEN)
    c.rect(0, H - 196, W, 196, stroke=0, fill=1)
    # ridge motif
    set_fill(c, (0.08, 0.21, 0.14))
    p = c.beginPath()
    p.moveTo(0, H - 196)
    pts = [(0, 52), (70, 30), (130, 44), (210, 16), (270, 40), (350, 10), (420, 38), (500, 18),
           (560, 44), (612, 26)]
    p.moveTo(0, H - 196)
    for px, py in pts:
        p.lineTo(px, H - 196 + py)
    p.lineTo(W, H - 196)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    set_fill(c, GOLD)
    c.setFont('Helvetica-Bold', 8.5)
    c.drawString(M, H - 62, 'F O R   R E V I E W')
    c.setFillColorRGB(1, 1, 1)
    c.setFont('Times-Bold', 27)
    c.drawString(M, H - 92, PROJECT)
    c.setFont('Times-Roman', 19)
    c.drawString(M, H - 117, 'Touch Panel Interface')
    c.setFont('Helvetica', 10)
    set_fill(c, (0.72, 0.78, 0.72))
    c.drawString(M, H - 142, '%s   -   %s' % (REV, DATE))

    y = H - 232
    set_fill(c, INK)
    c.setFont('Helvetica-Bold', 12)
    c.drawString(M, y, 'How to use this document')
    y -= 18
    y = para(c, 'Every screen of the proposed touch panel interface is on its own page, in the order a '
                'user meets it. Print this, mark it up by hand, and send it back. Notes can also be '
                'written in a PDF reader.', M, y, CW, size=9.6, leading=13)
    y -= 6
    for t in ['Circle anything on the screenshot that should change, and write the change in the notes '
              'area below it.',
              'Tick "Looks right" if a page needs no change, so we know it was reviewed.',
              'Wording matters more than layout at this stage. The words on the buttons are what guests '
              'and staff will read.',
              'The last page lists open questions that need an answer before the control program is '
              'written.']:
        set_fill(c, GOLD)
        c.setFont('Helvetica-Bold', 9.6)
        c.drawString(M + 4, y, '-')
        y = para(c, t, M + 14, y, CW - 14, size=9.6, leading=13)
        y -= 2

    # boxes
    y -= 10
    box_h = 86
    bw = (CW - 14) / 2
    for i, (title, body) in enumerate([
        ('Try it yourself', 'A working demo runs in any web browser, with a simulated control system '
         'behind it, so every button does what the finished system will do. Rotate a phone sideways.'),
        ('Where the files live', 'The interface and its documentation, including the join map and a '
         'line-by-line trace of specification section 3.2, are in the project repository.')
    ]):
        x = M + i * (bw + 14)
        set_fill(c, BOXBG)
        set_stroke(c, RULE)
        c.setLineWidth(0.7)
        c.rect(x, y - box_h, bw, box_h, stroke=1, fill=1)
        set_fill(c, GREEN)
        c.setFont('Helvetica-Bold', 9.5)
        c.drawString(x + 12, y - 18, title)
        para(c, body, x + 12, y - 32, bw - 24, size=8.4, leading=11, rgb=(0.3, 0.33, 0.31))
        set_fill(c, (0.25, 0.35, 0.45))
        c.setFont('Helvetica', 7.6)
        c.drawString(x + 12, y - box_h + 12, DEMO if i == 0 else REPO)
    y -= box_h + 24

    # contents
    set_fill(c, INK)
    c.setFont('Helvetica-Bold', 12)
    c.drawString(M, y, 'Contents')
    y -= 16
    set_stroke(c, RULE)
    c.line(M, y + 6, W - M, y + 6)

    # build rows, then flow them into two columns
    rows, last = [], None
    for i, s in enumerate(SCREENS):
        if s[1] != last:
            last = s[1]
            rows.append(('h', last.upper(), ''))
        rows.append(('i', s[2], str(i + 2)))
    rows.append(('h', 'ANSWERS NEEDED', ''))
    rows.append(('i', 'Open questions', str(len(SCREENS) + 2)))

    half = (len(rows) + 1) // 2
    if rows[half - 1][0] == 'h':      # never end a column on a heading
        half -= 1
    colw = (CW - 26) / 2
    for col, chunk in enumerate((rows[:half], rows[half:])):
        x = M + col * (colw + 26)
        cy = y
        for kind, label, num in chunk:
            if kind == 'h':
                cy -= 3
                set_fill(c, GOLD)
                c.setFont('Helvetica-Bold', 8)
                c.drawString(x, cy, label)
                cy -= 12
            else:
                set_fill(c, INK)
                c.setFont('Helvetica', 9)
                c.drawString(x + 14, cy, label)
                set_fill(c, MUTED)
                c.setFont('Helvetica', 8.5)
                c.drawRightString(x + colw, cy, num)
                cy -= 12.4

    set_fill(c, MUTED)
    c.setFont('Helvetica', 7.5)
    c.drawString(M, M - 14, 'Prepared by Gravity Technology Solutions')
    c.drawRightString(W - M, M - 14, 'Page 1 of %d' % total)
    c.showPage()


def screen_page(c, s, page_no, total):
    img, section, title, when, what, note = s
    header(c, page_no, total, section)
    y = H - M - 34

    # title row
    set_fill(c, GOLD)
    c.setFont('Helvetica-Bold', 8)
    c.drawString(M, y, section.upper())
    y -= 17
    set_fill(c, INK)
    c.setFont('Times-Bold', 17)
    c.drawString(M, y, title)
    # screen number chip
    set_fill(c, BOXBG)
    set_stroke(c, RULE)
    c.rect(W - M - 54, y - 4, 54, 20, stroke=1, fill=1)
    set_fill(c, MUTED)
    c.setFont('Helvetica', 7.2)
    c.drawCentredString(W - M - 27, y + 6.5, 'SCREEN %d of %d' % (page_no - 1, len(SCREENS)))
    y -= 16

    set_fill(c, MUTED)
    c.setFont('Helvetica-Oblique', 8.8)
    c.drawString(M, y, when)
    y -= 15
    y = para(c, what, M, y, CW, size=9.2, leading=12.2)

    if note:
        y -= 7
        nh = 13 + 11.6 * len(wrap(note, 'Helvetica', 8.6, CW - 76))
        set_fill(c, (0.99, 0.965, 0.90))
        set_stroke(c, (0.88, 0.80, 0.55))
        c.setLineWidth(0.7)
        c.rect(M, y - nh + 10, CW, nh, stroke=1, fill=1)
        set_fill(c, (0.55, 0.42, 0.08))
        c.setFont('Helvetica-Bold', 7.6)
        c.drawString(M + 10, y - 1, 'TO CONFIRM')
        para(c, note, M + 66, y - 1, CW - 76, size=8.6, leading=11.6, rgb=(0.35, 0.29, 0.10))
        y -= nh + 4

    # screenshot
    iw = CW
    ih = iw * 800.0 / 1280.0
    y -= ih + 6
    set_stroke(c, (0.55, 0.58, 0.55))
    c.setLineWidth(0.8)
    c.drawImage(ImageReader(os.path.join(SHOTS, img + '.png')), M, y, iw, ih,
                preserveAspectRatio=False, mask=None)
    c.rect(M, y, iw, ih, stroke=1, fill=0)

    # notes area
    y -= 12
    bottom = M + 6
    set_fill(c, (0.995, 0.995, 0.99))
    set_stroke(c, (0.62, 0.65, 0.62))
    c.setLineWidth(0.9)
    c.rect(M, bottom, CW, y - bottom, stroke=1, fill=1)

    ty = y - 15
    set_fill(c, GREEN)
    c.setFont('Helvetica-Bold', 8.4)
    c.drawString(M + 10, ty, 'NOTES AND CHANGES')
    x = M + 150
    x = checkbox(c, x, ty - 1, 'Looks right')
    checkbox(c, x + 16, ty - 1, 'Change requested')

    # ruled lines
    set_stroke(c, RULE)
    c.setLineWidth(0.5)
    ly = ty - 20
    while ly > bottom + 12:
        c.line(M + 10, ly, W - M - 10, ly)
        ly -= 17
    c.showPage()


QBLOCK_GAP = 9


def qblock_h(body):
    return 30 + 12 * len(wrap(body, 'Helvetica', 9, CW - 96)) + 22


def questions_pages(c, first_page, total, count_only=False):
    """Lays out the open-questions blocks, breaking to a new page as needed.
    Returns the number of pages used."""
    page_no = first_page
    pages = 1
    bottom = M + 24
    y = None

    def new_page(first):
        nonlocal y
        if not count_only:
            header(c, page_no, total, 'Open questions')
        y = H - M - 34
        if not count_only:
            set_fill(c, GOLD)
            c.setFont('Helvetica-Bold', 8)
            c.drawString(M, y, 'BEFORE THE CONTROL PROGRAM IS WRITTEN' if first
                         else 'OPEN QUESTIONS, CONTINUED')
        y -= 18
        if first:
            if not count_only:
                set_fill(c, INK)
                c.setFont('Times-Bold', 17)
                c.drawString(M, y, 'Open questions')
            y -= 18
            txt = ('These were decided one way or another so a working interface could be built. Each one '
                   'is isolated, so changing any of them is a small edit. Answers here, or on the pages '
                   'above, become the next revision.')
            if count_only:
                y -= 12.2 * len(wrap(txt, 'Helvetica', 9.2, CW))
            else:
                y = para(c, txt, M, y, CW, size=9.2, leading=12.2, rgb=MUTED)
        y -= 12

    new_page(True)
    for i, (title, body) in enumerate(QUESTIONS):
        bh = qblock_h(body)
        if y - bh < bottom:
            if not count_only:
                c.showPage()
            page_no += 1
            pages += 1
            new_page(False)
        if not count_only:
            set_stroke(c, RULE)
            c.setLineWidth(0.7)
            set_fill(c, (0.995, 0.995, 0.99))
            c.rect(M, y - bh, CW, bh, stroke=1, fill=1)
            set_fill(c, GREEN)
            c.setFont('Helvetica-Bold', 9.6)
            c.drawString(M + 12, y - 16, '%d.  %s' % (i + 1, title))
            yy = y - 30
            set_fill(c, (0.3, 0.33, 0.31))
            c.setFont('Helvetica', 9)
            for ln in wrap(body, 'Helvetica', 9, CW - 96):
                c.drawString(M + 26, yy, ln)
                yy -= 12
            set_fill(c, MUTED)
            c.setFont('Helvetica-Bold', 7.4)
            c.drawString(M + 26, yy - 7, 'ANSWER')
            set_stroke(c, (0.72, 0.74, 0.72))
            c.setLineWidth(0.5)
            c.line(M + 68, yy - 8, W - M - 14, yy - 8)
        y -= bh + QBLOCK_GAP

    # fill whatever is left with a free-form comments area
    note_y = max(y - 4, M + 8)
    if y - bottom > 90:
        if not count_only:
            top = y
            floor = bottom + 16
            set_fill(c, (0.995, 0.995, 0.99))
            set_stroke(c, (0.62, 0.65, 0.62))
            c.setLineWidth(0.9)
            c.rect(M, floor, CW, top - floor, stroke=1, fill=1)
            set_fill(c, GREEN)
            c.setFont('Helvetica-Bold', 8.4)
            c.drawString(M + 10, top - 15, 'ANYTHING ELSE')
            set_fill(c, MUTED)
            c.setFont('Helvetica-Oblique', 8.2)
            c.drawString(M + 108, top - 15,
                         'Features that are missing, wording to change, how staff expect to use the rooms')
            set_stroke(c, RULE)
            c.setLineWidth(0.5)
            ly = top - 34
            while ly > floor + 12:
                c.line(M + 10, ly, W - M - 10, ly)
                ly -= 17
        note_y = bottom - 2

    if not count_only:
        set_fill(c, MUTED)
        c.setFont('Helvetica-Oblique', 8.4)
        c.drawString(M, note_y,
                     'Return marked-up pages to Gravity Technology Solutions. '
                     'Join numbers are not final until the control program begins.')
        c.showPage()
    return pages


def main():
    probe = canvas.Canvas('/dev/null', pagesize=letter)
    qpages = questions_pages(probe, len(SCREENS) + 2, 0, count_only=True)
    total = len(SCREENS) + 1 + qpages

    c = canvas.Canvas(OUT, pagesize=letter)
    c.setTitle('%s - Touch Panel Interface Review (%s)' % (PROJECT, REV))
    c.setAuthor('Gravity Technology Solutions')
    c.setSubject('Page-by-page UCI review for customer markup')
    cover(c, total)
    for i, s in enumerate(SCREENS):
        screen_page(c, s, i + 2, total)
    questions_pages(c, len(SCREENS) + 2, total)
    c.save()
    print('Wrote', OUT, os.path.getsize(OUT) // 1024, 'KB,', total, 'pages')


if __name__ == '__main__':
    main()
