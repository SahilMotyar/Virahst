# Contributing to Virasat

Thank you for helping! Virasat gets better with every picture, correction and idea.

The easiest ways to help don't need any code:

- [Suggest an item](https://github.com/SahilMotyar/Virahst/issues/new?template=suggest-item.yml)
- [Report a mistake](https://github.com/SahilMotyar/Virahst/issues/new?template=report-mistake.yml)

## Images: the rules

Please read these before sending or adding any picture.

1. **Only send images you are allowed to share.** That means:
   - a photo or scan **you took yourself**, or
   - an image that is **public domain** or **openly licensed** (for example CC0, CC BY or
     CC BY-SA — Wikimedia Commons is a good place to look).

   Don't send pictures copied from shops, auction sites, Pinterest or other people's
   collections unless their license says you may.
2. **Always include the source link and the license.** Every image needs: where it came from
   (a link), who made it, and its license. These go in the item's `source` fields in
   [`src/data/items.ts`](src/data/items.ts) and in [CREDITS.md](CREDITS.md).
3. **Format:** WebP, **at most 1600px wide**.
4. **File name = the item's slug.** For an item with `slug: "parle-gluco-1947"`, the file is
   `public/items/parle-gluco-1947.webp`.

After adding an image, run:

```bash
npm run thumbs
```

This makes the small version the canvas uses (`public/items/thumb/<slug>.webp`).

## Adding or changing an item

See "How to add an item" in the [README](README.md). In short: one entry in
`src/data/items.ts` with its `source` fields, the image in `public/items/`, then
`npm run thumbs`.

Please keep the text simple and true. If you're not sure about a year or a fact, say so in
your pull request rather than guessing.

## Before you open a pull request

Run both of these and make sure they pass:

```bash
npm run lint
npm run build
```

Keep each pull request to one idea (one new item, one fix, one feature). It makes them
much quicker to review.

## Code notes

- Site name, copy and contact details live in [`src/config.ts`](src/config.ts) — don't
  hard-code them in components.
- For orange text or icons use `text-accent-ink`, never `text-accent` (too light to read).
- Buttons and links people tap should be at least 44px tall.

## License

By contributing code, you agree it is released under the [MIT License](LICENSE). Images
keep their own licenses, which is why the source and license for each one matter so much.
