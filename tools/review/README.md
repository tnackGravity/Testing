# Review PDF

Regenerates `docs/JennyWiley_UCI_v<rev>_Review.pdf`: one page per screen with a
notes area, for the customer to print and mark up.

```
node tools/review/capture-screens.js     # screenshots every screen into shots/
python3 tools/review/build-review-pdf.py # lays out the PDF
```

`capture-screens.js` needs Playwright and a Chrome binary; paths are at the top of
the file. `build-review-pdf.py` needs reportlab.

When the interface changes, update `SCREENS` in `build-review-pdf.py` (the page
order, descriptions and "to confirm" notes) and `QUESTIONS` (the open items), then
bump `REV` and `DATE`.
