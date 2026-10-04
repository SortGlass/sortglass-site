# SortGlass website review — October 4, 2026

## Scope and status

Reviewed `https://sortglass.com/`, its privacy page, public DNS/TLS/HTTP responses, and the complete tracked website source at baseline `8f49fa9` in `SortGlass/sortglass-site`. This is a static marketing/support site, separate from the iOS repository and its private CloudKit services.

The changes accompanying this report are **prepared locally, not published**. Public observations below describe the pre-change live site. No load test, denial-of-service simulation, exploit, account change, DNS change, or Apple submission was performed. No claim of comprehensive penetration testing, WCAG certification, legal compliance, or immunity from lawsuits is made.

## Public security findings

| Area | Evidence and assessment |
| --- | --- |
| HTTPS | Apex HTTPS returns 200 with a valid publicly trusted certificate; HTTP redirects to HTTPS. HTTPS `www` redirects to the apex. Observed certificate expires December 21, 2026; hosting renewal still needs to keep working. |
| Hosting / DDoS | DNS points to GitHub Pages; responses identify GitHub and its caching network. Protection is provider-managed. Pages has usage/rate limits and no promise of uninterrupted service during an attack. No owner-configured WAF/rate-limit policy was verified. |
| Database / RLS | No database, tables, authentication, server endpoints, forms, fetch/XHR calls, or browser persistence in the inspected site. **RLS is not applicable to this website.** This does not attest to the separate app's CloudKit access controls. |
| Executable dependencies | Site JavaScript is local and dependency-free. No third-party JavaScript, analytics SDK, or input/query-to-HTML injection path found. Dynamic markup uses developer-controlled constants. |
| Secrets | No obvious private keys, API credentials, or passwords found in current source; tracked-file history names reveal no database or credential configuration. This is not a forensic guarantee that no secret was ever committed. |
| Response headers | Live homepage/privacy responses lack CSP, HSTS, anti-framing, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers. These are hardening gaps, not evidence of an exploited site. |
| CORS | Public static content is served with `Access-Control-Allow-Origin: *`. That is not, by itself, exposure of private user records on this site. |
| Domain control | Expected `_github-pages-challenge-sortglass.sortglass.com` TXT lookup returned no answer. This does not prove account verification is absent; confirm the exact record/account in GitHub Settings. One random subdomain lookup did not resolve; this is not an exhaustive subdomain audit. |
| DNSSEC | A parent DS record and its signature were observed. Full end-to-end DNSSEC validation and registrar controls were not audited. |

### Prepared browser-side hardening

- Content Security Policy on each HTML page. Homepage scripts are same-origin plus a hash for its fixed structured-data block; no inline executable JavaScript or `unsafe-eval`. Images permit same-origin and Apple's existing badge host; media and manifest are same-origin. Unlisted resource types are denied. Forms, embedded objects, and base-URL overrides are denied.
- Inline styles remain permitted for existing styles and dynamic demo transforms. This is a deliberate compatibility exception, not a claim of the strongest possible CSP.
- Explicit no-referrer policy avoids sending page referrers to linked/external resources. It does **not** conceal IP addresses from those providers.
- Reveal effects activate only after successful script setup; a blocked script no longer leaves text hidden.

HTML meta policies do not supply transport protection, MIME-sniffing headers, Permissions Policy, or anti-framing. In particular, `frame-ancestors` is not effective in a meta CSP. Stronger response-header configuration needs a hosting/edge service that supports it; do not add ineffective header-like HTML and claim protection.

## Accessibility issues addressed

- Reproduced on the live site: inactive tour tabs were excluded from Tab order but lacked arrow-key navigation. Arrow keys, Home and End now select/focus screens; tab/panel relationships have unique IDs.
- Inactive desktop screen groups could expose visually invisible controls to the accessibility tree because child visibility overrode parent visibility. Inactive groups/views now use `inert` and accessibility state.
- Demo completion now disables covered controls and moves focus to Start Over when appropriate. A Previous button supplies a non-dragging route; canceled pointers no longer commit an action.
- Corrected the CSS rule that made hidden demo buttons remain displayed in Watch mode.
- White text on the original button/badge blue was about 3.31:1 (hover 2.73:1). Prepared colors are about 5.02:1 (hover 4.74:1). Removed the low-contrast dimming of off-center tour copy.
- Corrected skipped homepage heading levels; wrapped small-screen screen selectors; limited decorative gesture-hint movement to 3.6 seconds.
- Video button labels follow real playback state; newly enabling Reduce Motion stops prior user-started playback until explicitly started again.
- Added an accessibility information/contact page without an unsupported full-conformance claim.

## Public claims and privacy

The live homepage's “Nothing” collected, “Data Not Collected,” “never uploaded to a server,” “Undo Anything,” and absolute safety wording overstate practices or capabilities. Prepared copy distinguishes developer collection from Apple services, support email, hosting, and user-directed sharing, and avoids guaranteeing reversal or deletion safety.

The homepage requests App Store badge images from Apple's service. Prepared privacy wording discloses that request; a no-referrer policy does not eliminate the disclosure. No cookie-consent banner or accessibility overlay was added as a substitute for accurate practices and accessible controls.

Owner/legal review is still needed for applicable markets, privacy retention practices, support procedures, consumer/subscription representations, photo/screenshot/icon licensing, and any international business disclosures. Apple's linked Standard EULA is app licensing, not bespoke website terms. No new legal agreement has been invented or accepted on the owner's behalf. Check policy language against the **shipped** app whenever currently pending iOS sync features are released.

## Validation and remaining checks

Completed local checks:

- `node --check script.js` and `git diff --check`: pass.
- `node --test tests/website.test.cjs`: **18 passed, 0 failed, 0 skipped**, using jsdom 26.1.0 and axe-core 4.10.3 installed outside the website. This includes 10 selected non-layout axe rules across homepage, privacy, and accessibility pages. No production dependency was added.
- Reproduced the live keyboard-tab defect, then verified local ArrowRight and End select the formerly unreachable screens. Verified Watch mode hides the demo buttons and inactive desktop content disappears from the accessibility tree.
- At a confirmed 320px homepage viewport, checked the wrapping screen selector visually, verified document width equals viewport width, and found no out-of-viewport text/link/control bounds in the DOM check.
- At a confirmed 1280×720 viewport, found and fixed overlap between demo buttons and the tour tab bar. Measured the corrected controls ending at 606px and tab bar starting at 622px: a 16px gap. Shorter windows have an inline-tour fallback in source.
- Local homepage and policy pages loaded under their content policies with no captured console errors/warnings in these checks. Static tests verify referenced local files, fragments, unique IDs, and the structured-data CSP hash.

Limitations: subsequent viewport overrides were not consistently reflected by the browser, so narrow policy-page and short-window fallback rendering are **not** recorded as passed. An automated rapid desktop demo traversal also scrolled to the next tour chapter; completion focus/restart passed deterministic DOM tests but need a final manual native-browser check. No actual VoiceOver session, comprehensive contrast scan, 200% text-resize test, or end-to-end screen-reader certification was completed. DOM tests and an accessibility tree are not equivalent to testing with real assistive technology or a complete WCAG assessment.

Before publication / in the next account-access session:

1. Review the copy changes; approve publication explicitly. The live site remains unchanged until deployment.
2. Sign into GitHub to verify domain ownership, Enforce HTTPS, least-privilege collaborators, and 2FA/passkeys/recovery. Verify equivalent registrar/email protections and domain auto-renewal. GitHub settings were inaccessible while signed out.
3. Decide whether provider-managed Pages protection is sufficient or a configurable edge/hosting service is warranted. Any change needs a reviewed DNS plan that preserves email, DNSSEC, certificates, and reversibility. Do not enable blanket bot challenges that block assistive technology or search indexing without testing.
4. If changing hosting, configure and test response CSP with `frame-ancestors`, MIME-sniffing protection, a suitable Permissions Policy, and HSTS only after verifying HTTPS for every affected host. Do not blindly enable HSTS preload or `includeSubDomains`.
5. Perform VoiceOver (Safari/iPhone), keyboard-only, text-resize, forced-colors, video/text-alternative, and cross-browser checks. Record issues and fixes over time. Confirm that the accessibility mailbox reaches someone who handles requests.
6. Have a qualified lawyer review jurisdiction-specific obligations and the actual published claims. Technical fixes reduce risk; they cannot prevent anyone from filing a lawsuit.

## Primary references

- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub CDN/DDoS protection description](https://github.blog/news-insights/product-news/github-pages-custom-domains-https/) and [current Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [limits of automated accessibility evaluation](https://www.w3.org/WAI/test-evaluate/tools/selecting/)
- [DOJ guidance for business web accessibility](https://www.ada.gov/resources/web-guidance/). Government-specific Title II rules are not presented as this private website's deadlines.
- [CSP specification: frame-ancestors](https://www.w3.org/TR/CSP3/#directive-frame-ancestors)
- [PostgreSQL row-level security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), relevant only if a database is introduced later.
