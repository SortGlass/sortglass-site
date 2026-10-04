'use strict';

// DOM regression checks, not a browser accessibility audit. jsdom cannot test
// layout, responsive clipping, contrast, native inert/focus enforcement, media
// decoding, or assistive-technology behavior. Run those checks in a real browser.
// Supply jsdom 26 and axe-core 4 through NODE_PATH; no site dependencies required:
// NODE_PATH=/path/to/node_modules node --test tests/website.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM, VirtualConsole } = require('jsdom');
const axe = require('axe-core');

const root = path.resolve(__dirname, '..');
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const script = read('script.js');
const css = read('styles.css');
const pages = ['index.html', 'privacy.html', 'accessibility.html'];

function fixture(t, { page = 'index.html', reduced = false, boot = true, styles = false } = {}) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', (error) => errors.push(error.message));
  // Outside-only execution and no ResourceLoader: tests never request network assets.
  const dom = new JSDOM(read(page), {
    url: `https://sortglass.com/${page}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: console,
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  const { document } = window;
  if (styles && page === 'index.html') {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
  }

  const listeners = [];
  const media = {
    matches: reduced,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener(type, callback) { if (type === 'change') listeners.push(callback); },
  };
  window.matchMedia = () => media;
  const setReduced = (value) => {
    media.matches = value;
    for (const callback of listeners) callback({ matches: value });
  };

  // Model only an on-screen phone. This deliberately does not claim CSS layout
  // or native media playback validation.
  Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() { return this.parentElement; },
  });
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const top = this.matches('[data-chapter]') ? 2000 : 0;
    return { x: 0, y: top, top, left: 0, right: 320, bottom: top + 600, width: 320, height: 600 };
  };
  const playing = new WeakSet();
  Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get() { return !playing.has(this); },
  });
  window.HTMLMediaElement.prototype.play = function () {
    playing.add(this);
    this.dispatchEvent(new window.Event('play'));
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {
    playing.delete(this);
    this.dispatchEvent(new window.Event('pause'));
  };

  const realSetTimeout = window.setTimeout.bind(window);
  const queue = [];
  window.setTimeout = (callback) => { queue.push(callback); return queue.length; };
  const flush = () => {
    let count = 0;
    while (queue.length) {
      assert.ok(++count < 100, 'timer callbacks should settle');
      queue.shift()();
    }
  };
  if (boot && page === 'index.html') window.eval(script);
  const key = (target, key) => {
    const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };
  const chapter = (name) => {
    // Avoid following the hash in jsdom; the production click listener still runs.
    const link = document.querySelector(`.tabbar [data-tab="${name}"]`);
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.click();
  };
  const organize = () => {
    chapter('organize');
    const group = document.querySelector('[data-stage-phone] .screen-group[data-group="organize"]');
    const controls = document.querySelector('[data-stage-controls] [data-group="organize"]');
    return { group, controls, demo: group.querySelector('.demo'), card: group.querySelector('.current'), buttons: controls.querySelector('.demo-buttons') };
  };
  return { window, document, errors, setReduced, flush, key, chapter, organize, restoreTimers() { flush(); window.setTimeout = realSetTimeout; } };
}

function assertUnavailable(element, unavailable) {
  assert.equal(element.inert, unavailable, 'inert property matches active state');
  assert.equal(element.getAttribute('aria-hidden'), String(unavailable));
}

test('successful initialization constructs both tour layouts with unique IDs', (t) => {
  const { document, errors } = fixture(t);
  assert.equal(document.querySelectorAll('.screen-group').length, 10);
  assert.equal(document.querySelectorAll('[role="tablist"]').length, 6);
  const ids = Array.from(document.querySelectorAll('[id]'), (el) => el.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(document.documentElement.className, 'js');
  assert.deepEqual(errors, []);
});

test('every screen tab and panel have reciprocal accessible associations', (t) => {
  const { document } = fixture(t);
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    assert.ok(panel, `${tab.id} references an existing panel`);
    assert.equal(panel.getAttribute('role'), 'tabpanel');
    assert.equal(panel.getAttribute('aria-labelledby'), tab.id);
    assert.equal(panel.tabIndex, 0);
  }
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    assert.ok(list.getAttribute('aria-label'));
    assert.equal(list.querySelectorAll('[aria-selected="true"]').length, 1);
    assert.equal(Array.from(list.children).filter((tab) => tab.tabIndex === 0).length, 1);
  }
});

test('ArrowLeft/Right wrap and Home/End select, focus, and rove every screen selector', (t) => {
  const { document, key } = fixture(t);
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    let current = tabs[0];
    current.focus();
    const moves = [['ArrowLeft', tabs.length - 1], ['ArrowRight', 0], ['End', tabs.length - 1], ['Home', 0], ['ArrowRight', 1]];
    for (const [name, next] of moves) {
      const event = key(current, name);
      current = tabs[next];
      assert.equal(event.defaultPrevented, true);
      assert.equal(document.activeElement, current);
      for (const tab of tabs) {
        assert.equal(tab.tabIndex, tab === current ? 0 : -1);
        assert.equal(tab.getAttribute('aria-selected'), String(tab === current));
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        assertUnavailable(panel, tab !== current);
      }
    }
    assert.equal(key(current, 'x').defaultPrevented, false);
  }
});

test('inactive desktop chapter screens and controls are inert and aria-hidden', (t) => {
  const { document, chapter } = fixture(t);
  for (const name of ['organize', 'library', 'albums', 'more', 'browse']) {
    chapter(name);
    for (const group of document.querySelectorAll('[data-stage-phone] .screen-group, [data-stage-controls] .controls-set')) {
      assertUnavailable(group, group.dataset.group !== name);
      assert.equal(group.classList.contains('active'), group.dataset.group === name);
    }
    assert.equal(document.querySelectorAll('.tabbar [aria-current="true"]').length, 1);
    assert.equal(document.querySelector('.tabbar [aria-current="true"]').dataset.tab, name);
  }
});

test('Watch hides demo action buttons, and Try It restores them', (t) => {
  const { window, document, organize } = fixture(t, { styles: true });
  organize();
  for (const controls of document.querySelectorAll('.controls-set[data-group="organize"]')) {
    const buttons = controls.querySelector('.demo-buttons');
    controls.querySelector('[role="tab"][data-view="watch"]').click();
    assert.equal(buttons.hidden, true);
    assert.equal(window.getComputedStyle(buttons).display, 'none', 'author flex styling must not override hidden');
    controls.querySelector('[role="tab"][data-view="try"]').click();
    assert.equal(buttons.hidden, false);
    assert.equal(window.getComputedStyle(buttons).display, 'flex');
  }
});

for (const [direction, end] of [['trash', { clientX: 150, clientY: 80 }], ['favorite', { clientX: 150, clientY: 550 }], ['next', { clientX: 0, clientY: 350 }]]) {
  test(`pointercancel after a ${direction} drag does not perform the action`, (t) => {
    const { window, organize, flush } = fixture(t);
    const { demo, card } = organize();
    const pointer = (type, coordinates) => {
      const event = new window.Event(type, { bubbles: true });
      Object.assign(event, { pointerType: 'touch', pointerId: 1, button: 0, ...coordinates });
      card.dispatchEvent(event);
    };
    pointer('pointerdown', { clientX: 150, clientY: 350 });
    pointer('pointermove', end);
    assert.notEqual(card.style.transform, '');
    pointer('pointercancel', end);
    pointer('pointerup', end);
    flush();
    assert.equal(card.style.transform, '');
    assert.match(demo.querySelector('[data-count]').textContent, /1 \/ 7/);
    assert.equal(demo.querySelector('[data-badge]').textContent, '0');
    assert.equal(demo.querySelector('[data-heart]').classList.contains('on'), false);
    assert.equal(demo.querySelector('[data-act="undo"]').disabled, true);
    assert.equal(demo.querySelector('[data-caption]').textContent, 'ADD TO ALBUM');
  });
}

test('Previous is unavailable at the first photo and navigates back after Next', (t) => {
  const { organize, flush } = fixture(t);
  const { demo, buttons } = organize();
  const previous = buttons.querySelector('.b-prev');
  assert.equal(previous.disabled, true);
  buttons.querySelector('.b-next').click();
  flush();
  assert.match(demo.querySelector('[data-count]').textContent, /2 \/ 7/);
  assert.equal(previous.disabled, false);
  previous.click();
  flush();
  assert.match(demo.querySelector('[data-count]').textContent, /1 \/ 7/);
  assert.equal(previous.disabled, true);
});

for (const origin of ['photo keyboard', 'external action button']) {
  test(`completion moves focus from ${origin} to Start Over and resets safely`, (t) => {
    const { document, organize, flush, key } = fixture(t);
    const { demo, card, buttons } = organize();
    const completion = demo.querySelector('.demo-done');
    const restart = completion.querySelector('button');
    assertUnavailable(completion, true);
    const next = buttons.querySelector('.b-next');
    for (let i = 0; i < 7; i++) {
      if (origin === 'photo keyboard') { card.focus(); key(card, 'ArrowRight'); }
      else { next.focus(); next.click(); }
      flush();
    }
    assert.equal(demo.classList.contains('finished'), true);
    assertUnavailable(completion, false);
    assert.equal(document.activeElement, restart);
    for (const section of demo.querySelectorAll('.demo-header, .demo-stage, .demo-dock')) assertUnavailable(section, true);
    for (const button of buttons.querySelectorAll('button')) assert.equal(button.disabled, true);
    assert.match(demo.querySelector('[data-summary]').textContent, /7 reviewed/);
    restart.click();
    flush();
    assert.equal(demo.classList.contains('finished'), false);
    assert.equal(document.activeElement, card);
    assertUnavailable(completion, true);
    for (const section of demo.querySelectorAll('.demo-header, .demo-stage, .demo-dock')) assertUnavailable(section, false);
    assert.equal(next.disabled, false);
    assert.equal(buttons.querySelector('.b-prev').disabled, true);
    assert.equal(demo.querySelector('[data-act="undo"]').disabled, true);
    assert.match(demo.querySelector('[data-count]').textContent, /1 \/ 7/);
  });
}

test('Reduce Motion starts videos paused, permits explicit play, and revokes it on a new preference change', (t) => {
  const { document, setReduced } = fixture(t, { reduced: true });
  const phone = document.querySelector('.phone-hero');
  const video = phone.querySelector('video');
  const toggle = phone.querySelector('[data-media-toggle]');
  assert.ok(Array.from(document.querySelectorAll('video')).every((video) => video.paused));
  assert.equal(toggle.getAttribute('aria-label'), 'Play video');
  toggle.click();
  assert.equal(video.paused, false);
  assert.equal(phone.dataset.userPlay, '1');
  assert.equal(toggle.getAttribute('aria-label'), 'Pause video');
  setReduced(false);
  setReduced(true);
  for (const item of document.querySelectorAll('[data-phone]')) {
    assert.equal(item.classList.contains('is-paused'), true);
    assert.equal(item.dataset.userPlay, undefined);
  }
  assert.ok(Array.from(document.querySelectorAll('video')).every((video) => video.paused));
  assert.equal(toggle.getAttribute('aria-label'), 'Play video');
});

test('manual pause survives scroll synchronization and hidden documents pause video', (t) => {
  const { window, document } = fixture(t);
  const phone = document.querySelector('.phone-hero');
  const video = phone.querySelector('video');
  assert.equal(video.paused, false);
  phone.querySelector('[data-media-toggle]').click();
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(video.paused, true);
  phone.querySelector('[data-media-toggle]').click();
  assert.equal(video.paused, false);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(video.paused, true);
});

test('without JavaScript or after setup failure, marketing copy remains visible', (t) => {
  const { window, document } = fixture(t, { boot: false, styles: true });
  const visibleCopy = () => {
    assert.equal(document.documentElement.className, 'no-js');
    for (const element of document.querySelectorAll('[data-reveal], .hero-in')) {
      const style = window.getComputedStyle(element);
      assert.notEqual(style.opacity, '0');
      assert.notEqual(style.visibility, 'hidden');
      assert.notEqual(style.display, 'none');
    }
  };
  visibleCopy();
  window.matchMedia = () => { throw new Error('deliberate setup failure'); };
  assert.throws(() => window.eval(script), /deliberate setup failure/);
  visibleCopy();
  assert.match(script, /classList\.replace\('no-js', 'js'\);\s*update\(\);\s*\}\)\(\);\s*$/, 'reveal enhancement is enabled only at the end of setup');
});

test('page titles are distinct and each page has language, landmarks, and image alternatives', (t) => {
  const titles = [];
  for (const page of pages) {
    const { document } = fixture(t, { page, boot: false });
    assert.equal(document.documentElement.lang, 'en', page);
    assert.equal(document.querySelectorAll('title').length, 1, page);
    assert.ok(document.title.trim().length > 10, page);
    titles.push(document.title);
    assert.equal(document.querySelectorAll('main').length, 1, page);
    assert.equal(document.querySelectorAll('h1').length, 1, page);
    assert.equal(document.querySelectorAll('meta[name="viewport"]').length, 1, page);
    assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, page);
    for (const image of document.querySelectorAll('img')) assert.equal(image.hasAttribute('alt'), true, `${page}: ${image.src}`);
  }
  assert.equal(new Set(titles).size, pages.length);
});

test('all static and generated local links, image/video assets, and SVG references exist', (t) => {
  for (const page of pages) {
    const { document } = fixture(t, { page });
    for (const element of document.querySelectorAll('[href], [src], [poster]')) {
      for (const attr of ['href', 'src', 'poster']) {
        const value = element.getAttribute(attr);
        if (!value) continue;
        const url = new URL(value, `https://sortglass.com/${page}`);
        if (url.origin !== 'https://sortglass.com') continue;
        const localPath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
        assert.ok(existsSync(path.join(root, localPath)), `${page}: missing ${value}`);
        if (url.hash && localPath.endsWith('.html')) {
          const targetDocument = localPath === page ? document : new JSDOM(read(localPath)).window.document;
          assert.ok(targetDocument.getElementById(decodeURIComponent(url.hash.slice(1))), `${page}: missing fragment ${value}`);
        }
      }
    }
  }
});

test('CSP hashes match structured data and pages contain no executable inline scripts or handlers', (t) => {
  for (const page of pages) {
    const { document } = fixture(t, { page, boot: false });
    const policies = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    assert.equal(policies.length, 1, page);
    const policy = policies[0].content;
    assert.match(policy, /default-src 'none'/);
    assert.match(policy, /base-uri 'none'/);
    assert.match(policy, /object-src 'none'/);
    const hashes = [];
    for (const element of document.querySelectorAll('script:not([src])')) {
      assert.equal(element.type, 'application/ld+json', `${page}: executable inline script`);
      assert.doesNotThrow(() => JSON.parse(element.textContent));
      const hash = createHash('sha256').update(element.textContent).digest('base64');
      assert.ok(policy.includes(`'sha256-${hash}'`), `${page}: structured data hash mismatch`);
      hashes.push(hash);
    }
    assert.equal((policy.match(/'sha256-/g) || []).length, hashes.length, `${page}: stale CSP hash`);
    for (const element of document.querySelectorAll('*')) {
      for (const attr of element.attributes) {
        assert.equal(/^on/i.test(attr.name), false, `${page}: inline event handler ${attr.name}`);
        if (['href', 'src'].includes(attr.name)) assert.equal(/^\s*javascript:/i.test(attr.value), false, `${page}: executable URL`);
      }
    }
  }
});

test('focused axe checks pass for names, ARIA syntax/relationships, titles, and language', async (t) => {
  // Explicitly omit color-contrast/layout checks: jsdom has no rendered layout.
  // A pass here does not establish WCAG conformance or full accessibility.
  const rules = ['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr', 'aria-valid-attr-value', 'button-name', 'image-alt', 'document-title', 'html-has-lang', 'html-lang-valid', 'duplicate-id-aria'];
  for (const page of pages) {
    const context = fixture(t, { page });
    context.restoreTimers();
    context.window.eval(axe.source);
    const result = await context.window.axe.run(context.document, { runOnly: { type: 'rule', values: rules } });
    assert.equal(result.violations.length, 0, `${page}: ${JSON.stringify(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })))}`);
  }
});
