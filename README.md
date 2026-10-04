# sortglass-site
Official website for SortGlass

This is a static GitHub Pages site: plain HTML, CSS, JavaScript, and media. It has no website database, accounts, or application server. Keep development in this repository; inspect Git status and preserve unrelated changes. Make tested checkpoints before publication.

## Local checks

```sh
node --check script.js
git diff --check
```

The focused DOM tests use development-only packages; the website itself has no runtime dependencies. With Node and npm installed:

```sh
audit_deps=$(mktemp -d)
npm install --prefix "$audit_deps" --no-save jsdom@26.1.0 axe-core@4.10.3
NODE_PATH="$audit_deps/node_modules" node --test tests/website.test.cjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765` for manual keyboard, motion, responsive-layout, and assistive-technology checks. DOM/axe tests do not assess full WCAG conformance. Keep test libraries, generated output, and credentials out of the published source.

The homepage's structured-data block has a CSP hash. If you change that block, update the hash and rerun tests. Meta CSP cannot provide `frame-ancestors`, HSTS, or other response-only security headers. See [the security/accessibility review](SECURITY_ACCESSIBILITY_REVIEW.md) for hosting/account checks and limits of this audit.

## Publishing

Do not push deployment changes or modify DNS without the owner's explicit approval. The current site deploys from `main`; merging/pushing there can publish immediately. Review privacy and accessibility copy against actual shipped behavior before release. Once published, verify HTTPS, live content, video/image loading, navigation, and the browser console again. Use Git checkpoints for recovery rather than duplicate project folders.
