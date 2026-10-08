/* SortGlass Website V2: homepage demos.
   Everything here works on sample photos inside the page. Nothing
   touches the visitor's photo library, and nothing is stored or sent.
   Behavior follows the app: swiping down favorites and stays on the
   photo; a rating or an album moves on to the next photo; Trash is
   only a queue. */
(function () {
  'use strict';

  if (typeof Element.prototype.animate !== 'function') return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(pointer: fine)');

  var PHOTOS = {
    bridge:   { alt: 'The Golden Gate Bridge under a pink and violet sky', date: 'Jun 30, 2016 at 8:25 PM', cam: 'NIKON D7100', lens: '11–16 mm f/2.8 at 13 mm', exp: 'ƒ/3.2 · 1/100 s · ISO 125' },
    hibiscus: { alt: 'A red hibiscus flower against a dark background', date: 'Jul 27, 2019 at 7:46 PM', cam: 'NIKON D7100', lens: '18–140 mm f/3.5–5.6 at 140 mm', exp: 'ƒ/5.6 · 1/125 s · ISO 100' },
    milkyway: { alt: 'The Milky Way above a dark ridge', date: 'Aug 8, 2015 at 9:00 PM', cam: 'NIKON D7100', lens: '11–16 mm f/2.8 at 11 mm', exp: 'ƒ/2.8 · 30 s · ISO 1000' },
    ocean:    { alt: 'An orange sunset over dark ocean waves', date: 'Jun 19, 2019 at 8:27 PM', cam: 'NIKON D7100', lens: '18–140 mm f/3.5–5.6 at 140 mm', exp: 'ƒ/5.6 · 1/500 s · ISO 100' },
    canyon:   { alt: 'Red sandstone cliffs against a teal sky', date: 'Aug 8, 2015 at 6:31 PM', cam: 'NIKON D7100', lens: '11–16 mm f/2.8 at 16 mm', exp: 'ƒ/5 · 1/200 s · ISO 100' },
    dusk:     { alt: 'A plant silhouetted against a dusk sky', date: 'Jul 7, 2016 at 8:05 PM', cam: 'NIKON D7100', lens: '35 mm f/1.8', exp: 'ƒ/1.8 · 1/3200 s · ISO 100' },
    redsun:   { alt: 'A red sun behind the silhouette of a rose', date: 'Sep 11, 2020 at 6:14 PM', cam: 'NIKON D7100', lens: '18–140 mm f/3.5–5.6 at 140 mm', exp: 'ƒ/10 · 1/320 s · ISO 360' },
    rose:     { alt: 'A close-up of a mauve rose', date: 'Jun 13, 2018 at 1:52 PM', cam: 'NIKON D7100', lens: '35 mm f/1.8', exp: 'ƒ/5 · 1/500 s · ISO 100' },
    fern:     { alt: 'A fern frond lit against a dark forest floor', date: 'Mar 13, 2026 at 12:23 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2 · 1/320 s · ISO 64' },
    // Additional owner-supplied samples. Technical values come from each file's
    // EXIF; published derivatives contain no embedded metadata or GPS.
    'x100-redwoods': { alt: 'Looking up a redwood trunk into sunlit branches', date: 'Mar 14, 2026 at 12:05 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/11 · 1.7 s · ISO 160', file: 'x100-redwoods-360.webp', width: 360, height: 540, background: { file: 'x100-redwoods-bg-1600.webp', srcset: 'assets/photos/x100-redwoods-bg-1600.webp 1600w, assets/photos/x100-redwoods-bg-2400.webp 2400w', width: 1600, height: 2400 } },
    'x100-orange-cockpit': { alt: 'Orange seats and steering wheel inside a carbon-fiber sports car', date: 'Aug 14, 2026 at 3:44 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/5 · 1/38 s · ISO 125', file: 'x100-orange-cockpit-724.webp', width: 724, height: 1086 },
    'x100-classic-interior': { alt: 'A classic car with a red leather interior and polished steering wheel', date: 'Aug 14, 2026 at 3:33 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/3.6 · 1/110 s · ISO 125', file: 'x100-classic-interior-800.webp', width: 800, height: 533 },
    'x100-alpine-rain': { alt: 'Alpine-style storefronts beside a rain-soaked village street', date: 'Oct 12, 2025 at 1:26 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2.8 · 1/125 s · ISO 64', file: 'x100-alpine-rain-360.webp', width: 360, height: 450, background: { file: 'x100-alpine-rain-bg-1200.webp', srcset: 'assets/photos/x100-alpine-rain-bg-1200.webp 1200w, assets/photos/x100-alpine-rain-bg-1586.webp 1586w', width: 1200, height: 1500 } },
    'x100-autumn-river': { alt: 'A rocky river framed by golden autumn trees', date: 'Oct 12, 2025 at 12:10 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2 · 1/160 s · ISO 64', file: 'x100-autumn-river-724.webp', width: 724, height: 1086 },
    'x100-peach-rose': { alt: 'A peach-colored rose with water droplets on its petals', date: 'Oct 10, 2025 at 10:45 AM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/4 · 1/340 s · ISO 500', file: 'x100-peach-rose-360.webp', width: 360, height: 450, background: { file: 'x100-peach-rose-bg-1600.webp', srcset: 'assets/photos/x100-peach-rose-bg-1600.webp 1600w, assets/photos/x100-peach-rose-bg-2400.webp 2400w', width: 1600, height: 2000 } },
    'x100-neon-waterfront': { alt: 'People walking past glowing neon signs on a waterfront at night', date: 'Oct 11, 2025 at 7:09 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2 · 1/20 s · ISO 640', file: 'x100-neon-waterfront-800.webp', width: 800, height: 533, background: { file: 'x100-neon-waterfront-bg-1600.webp', srcset: 'assets/photos/x100-neon-waterfront-bg-1600.webp 1600w, assets/photos/x100-neon-waterfront-bg-3200.webp 3200w', width: 1600, height: 1067 } },
    'x100-foggy-coast': { alt: 'Fog drifting over a rugged coast and offshore rocks', date: 'Mar 14, 2026 at 3:42 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/7.1 · 1/56 s · ISO 64', file: 'x100-foggy-coast-540.webp', width: 540, height: 360 },
    'x100-pink-sports-car': { alt: 'A pink sports car parked on grass at a car gathering', date: 'Aug 15, 2025 at 12:28 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/10 · 1/320 s · ISO 1000', file: 'x100-pink-sports-car-800.webp', width: 800, height: 1000, background: { file: 'x100-pink-sports-car-bg-1200.webp', srcset: 'assets/photos/x100-pink-sports-car-bg-1200.webp 1200w, assets/photos/x100-pink-sports-car-bg-1586.webp 1586w', width: 1200, height: 1500 } },
    'x100-sunset-street': { alt: 'A quiet residential street beneath a soft pink sunset', date: 'Aug 1, 2026 at 8:18 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/5 · 1/17 s · ISO 125', file: 'x100-sunset-street-800.webp', width: 800, height: 1121, background: { file: 'x100-sunset-street-bg-1200.webp', srcset: 'assets/photos/x100-sunset-street-bg-1200.webp 1200w, assets/photos/x100-sunset-street-bg-2000.webp 2000w', width: 1200, height: 1680 } },
    'x100-city-lights': { alt: 'Golden windows and street lights across a city at dusk', date: 'Oct 10, 2025 at 6:55 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/4 · 5 s · ISO 64', file: 'x100-city-lights-800.webp', width: 800, height: 1000, background: { file: 'x100-city-lights-bg-1200.webp', srcset: 'assets/photos/x100-city-lights-bg-1200.webp 1200w, assets/photos/x100-city-lights-bg-2000.webp 2000w', width: 1200, height: 1500 } },
    'x100-city-reflections': { alt: 'City towers at dusk seen through reflected glass', date: 'Oct 10, 2025 at 6:44 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/4.5 · 1/5 s · ISO 250', background: { file: 'x100-city-reflections-bg-1200.webp', srcset: 'assets/photos/x100-city-reflections-bg-1200.webp 1200w, assets/photos/x100-city-reflections-bg-2172.webp 2172w', width: 1200, height: 800 } },
    'x100-ocean-sunset': { alt: 'The setting sun above rolling ocean waves', date: 'Sep 20, 2025 at 7:00 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/8 · 1/320 s · ISO 640', background: { file: 'x100-ocean-sunset-bg-1600.webp', srcset: 'assets/photos/x100-ocean-sunset-bg-1600.webp 1600w, assets/photos/x100-ocean-sunset-bg-2400.webp 2400w', width: 1600, height: 2133 } },
    'x100-neon-garage': { alt: 'A vintage car outside a garage illuminated by green neon', date: 'Apr 16, 2025 at 8:17 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2 · 0.43 s · ISO 64', background: { file: 'x100-neon-garage-bg-1086.webp', width: 1086, height: 724 } },
    'x100-cherry-blossoms': { alt: 'Pale pink cherry blossoms against a blue sky', date: 'Apr 5, 2025 at 3:51 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/11 · 1/4000 s · ISO 5000', background: { file: 'x100-cherry-blossoms-bg-1200.webp', srcset: 'assets/photos/x100-cherry-blossoms-bg-1200.webp 1200w, assets/photos/x100-cherry-blossoms-bg-1585.webp 1585w', width: 1200, height: 1501 } },
    'x100-shadow': { alt: 'A photographer’s shadow holding a camera against a sunlit wall', date: 'Mar 6, 2025 at 4:32 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/16 · 1/56 s · ISO 125', background: { file: 'x100-shadow-bg-1200.webp', srcset: 'assets/photos/x100-shadow-bg-1200.webp 1200w, assets/photos/x100-shadow-bg-1448.webp 1448w', width: 1200, height: 1800 } },
    'x100-magenta-pier': { alt: 'Silhouettes on a pier beneath a magenta sunset', date: 'Mar 15, 2025 at 7:02 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/8 · 1/800 s · ISO 250', background: { file: 'x100-magenta-pier-bg-1600.webp', srcset: 'assets/photos/x100-magenta-pier-bg-1600.webp 1600w, assets/photos/x100-magenta-pier-bg-2400.webp 2400w', width: 1600, height: 2000 } }
  };

  var SPRING = 'cubic-bezier(0.34, 1.3, 0.5, 1)';
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_IN = 'cubic-bezier(0.55, 0, 0.75, 0.2)';

  function src(id, w) { return 'assets/photos/' + id + '-' + w + '.webp'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- Organize: the recreated tab ---------------- */
  function Organize(root, order, options) {
    var self = this;
    this.root = root;
    this.order = order;
    this.options = options || {};
    this.interactive = !!this.options.interactive;
    this.index = 0;
    this.pos = 12;
    this.queued = 0;
    this.state = {};
    order.forEach(function (id) { self.state[id] = { fav: false, rating: 0, albums: {}, trashed: false }; });
    this.undoStack = [];
    this.redoStack = [];
    this.busy = false;

    var q = function (sel) { return root.querySelector(sel); };
    this.card = q('[data-card]');
    this.img = this.card.querySelector('img');
    this.photo = q('[data-photo]');
    this.date = q('[data-date]');
    this.posEl = q('[data-pos]');
    this.badge = q('[data-badge]');
    this.heart = q('[data-act="favorite"]');
    this.caption = q('[data-caption]');
    this.rating = q('[data-rating]');
    this.stars = root.querySelectorAll('[data-star]');
    this.setRatingChip = q('[data-act="setrating"]');
    this.chips = root.querySelectorAll('[data-album]');
    this.noteEl = q('[data-note]');
    this.info = q('[data-info]');
    this.infoBtn = q('[data-act="info"]');
    this.undoBtn = q('[data-act="undo"]');
    this.redoBtn = q('[data-act="redo"]');
    this.live = root.parentNode.querySelector('[data-live]');
    this.demoActions = (root.closest('section') || root).querySelectorAll('[data-demo-action]');
    this.rating.inert = true;

    if (this.interactive) this.bind();
    this.render();
  }

  Organize.prototype.current = function () { return this.order[this.index]; };

  Organize.prototype.setBusy = function (busy) {
    this.busy = busy;
    this.root.setAttribute('aria-busy', String(busy));
    var unavailable = busy || this.root.classList.contains('is-empty');
    this.demoActions.forEach(function (button) {
      if (button.getAttribute('data-demo-action') !== 'exit') button.disabled = unavailable;
    });
  };

  Organize.prototype.navigate = function (dir, frames) {
    if (this.busy || this.root.classList.contains('is-empty')) return Promise.resolve();
    var self = this;
    this.setBusy(true);
    return this.go(dir, frames || [{ transform: 'none', opacity: 1 },
      { transform: dir > 0 ? 'translateX(-30%)' : 'translateX(30%)', opacity: 0 }], 260)
      .finally(function () { self.setBusy(false); });
  };

  Organize.prototype.render = function () {
    var id = this.current();
    var p = PHOTOS[id];
    var st = this.state[id];
    this.img.src = src(id, 800);
    this.img.srcset = src(id, 800) + ' 800w, ' + src(id, 1200) + ' 1200w';
    if (this.photo.hasAttribute('tabindex')) this.photo.setAttribute('aria-label', 'Sample photo: ' + p.alt);
    this.date.textContent = p.date;
    this.posEl.textContent = String(this.pos + this.index);
    this.heart.setAttribute('aria-pressed', String(st.fav));
    this.heart.setAttribute('aria-label', st.fav ? 'Unfavorite' : 'Favorite');
    this.setBusy(this.busy);
    this.demoActions.forEach(function (button) {
      var action = button.getAttribute('data-demo-action');
      if (action !== 'favorite') return;
      var label = st.fav ? 'Unfavorite' : 'Favorite';
      button.setAttribute('aria-pressed', String(st.fav));
      button.setAttribute('aria-label', label + ' sample photo');
      button.childNodes.forEach(function (node) {
        if (node.nodeType === 3 && node.nodeValue.trim()) node.nodeValue = label;
      });
    }, this);
    this.badge.hidden = this.queued === 0;
    this.badge.textContent = String(this.queued);
    this.root.querySelector('[data-act="trash-view"]').setAttribute('aria-label', 'Trash, ' + this.queued + ' queued');
    for (var s = 0; s < this.stars.length; s++) {
      this.stars[s].classList.toggle('is-on', s < st.rating);
      this.stars[s].setAttribute('aria-pressed', String(s < st.rating && s === st.rating - 1));
    }
    for (var c = 0; c < this.chips.length; c++) {
      var member = !!st.albums[this.chips[c].getAttribute('data-album')];
      this.chips[c].classList.toggle('is-member', member);
      this.chips[c].setAttribute('aria-pressed', String(member));
    }
    var title = document.createElement('b');
    title.textContent = p.cam;
    var lens = document.createElement('span');
    lens.textContent = p.lens;
    var exp = document.createElement('span');
    exp.textContent = ' · ' + p.exp;
    this.info.replaceChildren(title, lens, exp);
    if (this.undoBtn) this.undoBtn.disabled = this.undoStack.length === 0;
    if (this.redoBtn) this.redoBtn.disabled = this.redoStack.length === 0;
  };

  Organize.prototype.say = function (text) { if (this.live) this.live.textContent = text; };

  Organize.prototype.setCaption = function (text, kind) {
    var c = this.caption;
    c.textContent = text;
    c.classList.toggle('is-trash', kind === 'trash');
    c.classList.toggle('is-fav', kind === 'fav');
    clearTimeout(this.captionTimer);
    if (text !== 'Add to Album' && !kind) {
      var self = this;
      this.captionTimer = setTimeout(function () { self.setCaption('Add to Album'); }, 1600);
    }
  };

  Organize.prototype.note = function (text) {
    var n = this.noteEl;
    n.textContent = text;
    n.classList.add('is-on');
    clearTimeout(this.noteTimer);
    this.noteTimer = setTimeout(function () { n.classList.remove('is-on'); }, 2600);
    this.say(text);
  };

  Organize.prototype.motion = function (frames, duration, easing) {
    if (reduce.matches) {
      frames = frames.map(function (f) { return { opacity: f.opacity === undefined ? 1 : f.opacity }; });
      duration = Math.min(duration, 200);
      easing = 'linear';
    }
    var a = this.card.animate(frames, { duration: duration, easing: easing, fill: 'forwards' });
    return a.finished ? a.finished.catch(function () {}) : wait(duration);
  };

  Organize.prototype.nextIndex = function (dir) {
    var n = this.order.length;
    for (var step = 1; step <= n; step++) {
      var i = (this.index + dir * step + n * n) % n;
      if (!this.state[this.order[i]].trashed) return i;
    }
    return -1;
  };

  // Move to another photo. `from` is the transform the card leaves with.
  Organize.prototype.go = function (dir, exitFrames, exitMs) {
    var self = this;
    var next = this.nextIndex(dir);
    var leave = exitFrames ? this.motion(exitFrames, exitMs || 380, EASE_IN) : Promise.resolve();
    return leave.then(function () {
      if (next === -1) {
        self.root.classList.add('is-empty');
        self.card.style.opacity = '0';
        return;
      }
      self.index = next;
      self.render();
      var enter = dir > 0 ? 'translateX(18%) scale(0.96)' : 'translateX(-18%) scale(0.96)';
      if (exitFrames && exitFrames[1].transform && exitFrames[1].transform.indexOf('translateY') === 0) enter = 'scale(0.9)';
      return (self.img.decode ? self.img.decode().catch(function () {}) : Promise.resolve()).then(function () {
        return self.motion([{ transform: enter, opacity: 0 }, { transform: 'none', opacity: 1 }], 480, SPRING);
      });
    });
  };

  Organize.prototype.push = function (entry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  };

  Organize.prototype.trash = function (fromDrag) {
    if (this.busy || this.root.classList.contains('is-empty')) return Promise.resolve();
    var id = this.current();
    if (this.state[id].fav) {
      this.setCaption('Add to Album');
      this.note('Favorites are protected. Unfavorite this photo before adding it to Trash.');
      return fromDrag
        ? this.motion([{ transform: fromDrag }, { transform: 'none' }], 420, SPRING)
        : Promise.resolve();
    }
    this.setBusy(true);
    var self = this;
    this.state[id].trashed = true;
    this.queued += 1;
    this.push({ type: 'trash', id: id, index: this.index });
    this.setCaption('Add to Album');
    this.say('Queued for Trash. Nothing is deleted until you review and confirm.');
    var start = fromDrag || 'none';
    return this.go(1, [{ transform: start, opacity: 1 }, { transform: 'translateY(-125%) rotate(-5deg)', opacity: 0 }], 360)
      .finally(function () { self.setBusy(false); self.render(); });
  };

  Organize.prototype.favorite = function () {
    if (this.busy || this.root.classList.contains('is-empty')) return;
    var id = this.current();
    var st = this.state[id];
    st.fav = !st.fav;
    this.push({ type: 'fav', id: id, index: this.index, value: st.fav });
    this.render();
    var h = this.heart;
    h.classList.add('is-pulse');
    setTimeout(function () { h.classList.remove('is-pulse'); }, 260);
    this.say(st.fav ? 'Added to Favorites.' : 'Removed from Favorites.');
  };

  Organize.prototype.toggleRating = function (open) {
    var on = open === undefined ? !this.root.classList.contains('is-rating') : open;
    this.root.classList.toggle('is-rating', on);
    this.setRatingChip.setAttribute('aria-pressed', String(on));
    this.rating.inert = !on;
  };

  Organize.prototype.rate = function (n) {
    if (this.busy || this.root.classList.contains('is-empty')) return Promise.resolve();
    var id = this.current();
    var st = this.state[id];
    var value = st.rating === n ? 0 : n;
    this.push({ type: 'rate', id: id, index: this.index, from: st.rating, to: value });
    st.rating = value;
    this.render();
    this.setCaption(value ? 'Rated' : 'Unrated');
    this.say(value ? 'Rated ' + value + (value === 1 ? ' star.' : ' stars.') + ' Next photo.' : 'Rating removed.');
    if (!value) return Promise.resolve();
    var self = this;
    this.setBusy(true);
    return wait(380).then(function () {
      return self.go(1, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%) scale(0.94)', opacity: 0 }], 300);
    }).finally(function () { self.setBusy(false); });
  };

  Organize.prototype.album = function (name) {
    if (this.busy || this.root.classList.contains('is-empty')) return Promise.resolve();
    var id = this.current();
    var st = this.state[id];
    if (st.albums[name]) {
      delete st.albums[name];
      this.push({ type: 'album', id: id, index: this.index, name: name, added: false });
      this.render();
      this.setCaption('Add to Album');
      this.say('Removed from ' + name + '.');
      return Promise.resolve();
    }
    st.albums[name] = true;
    this.push({ type: 'album', id: id, index: this.index, name: name, added: true });
    this.render();
    this.setCaption('Added to ' + name);
    this.say('Added to ' + name + '. Next photo.');
    var self = this;
    this.setBusy(true);
    return wait(420).then(function () {
      return self.go(1, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%) scale(0.94)', opacity: 0 }], 300);
    }).finally(function () { self.setBusy(false); });
  };

  Organize.prototype.show = function (index) {
    var self = this;
    this.root.classList.remove('is-empty');
    this.card.style.opacity = '';
    this.index = index;
    this.setBusy(true);
    this.render();
    return this.motion([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], 320, EASE_OUT)
      .finally(function () { self.setBusy(false); });
  };

  Organize.prototype.undo = function () {
    if (this.busy) return;
    var e = this.undoStack.pop();
    if (!e) return;
    this.apply(e, true);
    this.redoStack.push(e);
    this.render();
  };

  Organize.prototype.redo = function () {
    if (this.busy) return;
    var e = this.redoStack.pop();
    if (!e) return;
    this.apply(e, false);
    this.undoStack.push(e);
    this.render();
  };

  Organize.prototype.apply = function (e, undoing) {
    var st = this.state[e.id];
    if (e.type === 'trash') {
      st.trashed = !undoing;
      this.queued += undoing ? -1 : 1;
      if (undoing) { this.show(e.index); this.say('Undo: back from Trash.'); }
      else {
        this.say('Redo: queued for Trash.');
        var n = this.nextIndex(1);
        if (n !== -1) this.show(n);
        else {
          this.root.classList.add('is-empty');
          this.card.style.opacity = '0';
        }
      }
    } else if (e.type === 'fav') {
      st.fav = undoing ? !e.value : e.value;
      this.show(e.index);
      this.say(undoing ? 'Undo favorite.' : 'Redo favorite.');
    } else if (e.type === 'rate') {
      st.rating = undoing ? e.from : e.to;
      this.show(e.index);
      this.say(undoing ? 'Undo rating.' : 'Redo rating.');
    } else if (e.type === 'album') {
      var add = undoing ? !e.added : e.added;
      if (add) st.albums[e.name] = true; else delete st.albums[e.name];
      this.show(e.index);
      this.say((undoing ? 'Undo: ' : 'Redo: ') + (add ? 'added to ' : 'removed from ') + e.name + '.');
    }
  };

  Organize.prototype.restart = function () {
    if (this.busy) return;
    var self = this;
    this.order.forEach(function (id) { self.state[id] = { fav: false, rating: 0, albums: {}, trashed: false }; });
    this.queued = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.show(0);
  };

  /* Mouse drag follows the app: up to Trash, down to Favorite, sideways
     to browse. Touch keeps vertical page scrolling and browses sideways. */
  Organize.prototype.bind = function () {
    var self = this;
    var root = this.root;
    var start = null;
    var armedKind = null;
    var controlsRoot = root.closest('section') || root;
    var dragExitMessage = function () {
      return fine.matches
        ? 'Current drag canceled. Use the buttons or start a new mouse drag.'
        : 'Demo dragging off. Scroll the page normally.';
    };

    var resetDrag = function () {
      var pointer = start;
      start = null;
      armedKind = null;
      self.card.style.transform = '';
      self.setCaption('Add to Album');
      if (pointer && self.card.hasPointerCapture(pointer.id)) self.card.releasePointerCapture(pointer.id);
    };

    this.setArmed = function (on) {
      root.classList.toggle('is-armed', on);
      var arm = root.querySelector('[data-arm]');
      if (arm) arm.setAttribute('aria-pressed', String(on));
      var exit = controlsRoot.querySelector('[data-demo-action="exit"]');
      if (exit) exit.hidden = !on;
      if (!on) resetDrag();
    };

    root.addEventListener('click', function (event) {
      var target = event.target.closest('button');
      if (!target || !root.contains(target)) return;
      var act = target.getAttribute('data-act');
      if (self.options.onUser) self.options.onUser();
      if (target.hasAttribute('data-star')) { self.rate(Number(target.getAttribute('data-star'))); return; }
      if (target.hasAttribute('data-album')) { self.album(target.getAttribute('data-album')); return; }
      if (target.hasAttribute('data-arm')) {
        self.setArmed(!root.classList.contains('is-armed'));
        self.note(root.classList.contains('is-armed')
          ? 'Swipe sideways to browse. Use the buttons below for Favorite or Trash. Exit demo or Escape ends touch dragging.'
          : dragExitMessage());
        self.photo.focus({ preventScroll: true });
        return;
      }
      if (target.hasAttribute('data-restart')) { self.restart(); return; }
      if (act === 'favorite') self.favorite();
      else if (act === 'setrating') self.toggleRating();
      else if (act === 'undo') self.undo();
      else if (act === 'redo') self.redo();
      else if (act === 'trash-view') self.note('SortGlass Trash: ' + self.queued + ' queued. Nothing is deleted until you review the queue and confirm on your device.');
      else if (act === 'history') self.note('History keeps your last 100 Album and Trash actions, so you can undo them later.');
      else if (act === 'sort') self.note('Sort by Date Taken or Recently Added.');
      else if (act === 'info') {
        var on = !root.classList.contains('is-info');
        root.classList.toggle('is-info', on);
        target.setAttribute('aria-pressed', String(on));
        if (on) self.say(self.info.textContent);
      }
    });

    controlsRoot.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo-action]');
      if (!target || !controlsRoot.contains(target)) return;
      if (self.options.onUser) self.options.onUser();
      var action = target.getAttribute('data-demo-action');
      if (action === 'exit') {
        self.setArmed(false);
        self.note(dragExitMessage());
        var arm = root.querySelector('[data-arm]');
        if (arm && !fine.matches) arm.focus({ preventScroll: true });
        return;
      }
      if (self.busy) return;
      if (action === 'previous') self.navigate(-1);
      else if (action === 'next') self.navigate(1);
      else if (action === 'favorite') self.favorite();
      else if (action === 'trash') self.trash();
    });

    controlsRoot.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      self.setArmed(false);
      self.root.classList.remove('is-info');
      self.infoBtn.setAttribute('aria-pressed', 'false');
      self.toggleRating(false);
      self.say(dragExitMessage());
    });

    this.photo.addEventListener('keydown', function (event) {
      var k = event.key;
      if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') return;
      event.preventDefault();
      if (self.options.onUser) self.options.onUser();
      if (self.busy) return;
      if (k === 'ArrowUp') self.trash();
      else if (k === 'ArrowDown') self.favorite();
      else self.navigate(k === 'ArrowRight' ? 1 : -1);
    });

    var canDrag = function () { return fine.matches || root.classList.contains('is-armed'); };

    this.card.addEventListener('pointerdown', function (event) {
      if (self.busy || start || !canDrag() || event.button > 0 || event.isPrimary === false) return;
      if (self.options.onUser) self.options.onUser();
      start = { id: event.pointerId, x: event.clientX, y: event.clientY, w: self.card.offsetWidth, h: self.card.offsetHeight };
      self.card.setPointerCapture(event.pointerId);
      self.card.getAnimations().forEach(function (a) { a.cancel(); });
    });

    this.card.addEventListener('pointermove', function (event) {
      if (!start || start.id !== event.pointerId) return;
      var dx = event.clientX - start.x;
      var dy = event.clientY - start.y;
      var vertical = Math.abs(dy) > Math.abs(dx);
      // touch-action: pan-y keeps a phone's page scroll native. Do not show a
      // Favorite/Trash gesture that the browser is about to cancel for scroll.
      if (event.pointerType === 'touch' && vertical) {
        self.card.style.transform = '';
        armedKind = null;
        self.setCaption('Add to Album');
        return;
      }
      var t = vertical
        ? 'translateY(' + dy + 'px) rotate(' + (dy * -0.012) + 'deg)'
        : 'translateX(' + dx + 'px) rotate(' + (dx * 0.02) + 'deg)';
      self.card.style.transform = t;
      var kind = null;
      if (vertical && dy < -start.h * 0.16) kind = 'trash';
      else if (vertical && dy > start.h * 0.14) kind = 'fav';
      if (kind !== armedKind) {
        armedKind = kind;
        if (kind === 'trash') self.setCaption('Release to Trash', 'trash');
        else if (kind === 'fav') self.setCaption('Release to Favorite', 'fav');
        else self.setCaption('Add to Album');
      }
    });

    var end = function (event) {
      if (!start || start.id !== event.pointerId) return;
      if (event.type === 'pointercancel' || event.type === 'lostpointercapture') {
        resetDrag();
        return;
      }
      var dx = event.clientX - start.x;
      var dy = event.clientY - start.y;
      var from = self.card.style.transform || 'none';
      var width = start.w;
      start = null;
      self.card.style.transform = '';
      var kind = armedKind;
      armedKind = null;
      self.setCaption('Add to Album');
      if (kind === 'trash') { self.trash(from); return; }
      if (kind === 'fav') {
        self.favorite();
        self.motion([{ transform: from }, { transform: 'none' }], 420, SPRING);
        return;
      }
      if (Math.abs(dx) > width * 0.22 && Math.abs(dx) > Math.abs(dy)) {
        var dir = dx < 0 ? 1 : -1;
        self.navigate(dir, [{ transform: from, opacity: 1 }, { transform: 'translateX(' + (dx < 0 ? -115 : 115) + '%)', opacity: 0 }]);
        return;
      }
      self.motion([{ transform: from }, { transform: 'none' }], 380, SPRING);
    };
    this.card.addEventListener('pointerup', end);
    this.card.addEventListener('pointercancel', end);
    this.card.addEventListener('lostpointercapture', end);
  };

  // Plays a drag the way a finger would, for the guided demos.
  Organize.prototype.fakeDrag = function (dy, holdMs, isCurrent) {
    var self = this;
    var kind = dy < 0 ? 'trash' : 'fav';
    var to = 'translateY(' + dy + '%) rotate(' + (dy * -0.06) + 'deg)';
    return this.motion([{ transform: 'none' }, { transform: to }], 420, EASE_OUT).then(function () {
      if (isCurrent && !isCurrent()) throw new Error('stopped');
      self.setCaption(kind === 'trash' ? 'Release to Trash' : 'Release to Favorite', kind);
      return wait(holdMs || 420);
    }).then(function () {
      if (isCurrent && !isCurrent()) throw new Error('stopped');
      self.setCaption('Add to Album');
      if (kind === 'trash') return self.trash(to);
      self.favorite();
      return self.motion([{ transform: to }, { transform: 'none' }], 460, SPRING);
    });
  };

  Organize.prototype.press = function (el) {
    el.classList.add('is-press');
    return wait(170).then(function () { el.classList.remove('is-press'); });
  };

  /* ---------------- Hero ---------------- */
  var heroRoot = document.querySelector('[data-og="hero"]');
  var hero = null;
  var autoplay = { stopped: false, paused: false, token: 0 };
  var gateWaiters = [];
  var pauseBtn = document.querySelector('[data-pause]');
  var heroVisible = true;

  if (heroRoot) {
    hero = new Organize(heroRoot, ['bridge', 'hibiscus', 'milkyway', 'ocean', 'canyon', 'dusk', 'redsun', 'rose', 'fern'], {
      interactive: true,
      onUser: function () { stopAutoplay(); }
    });
    if (!fine.matches) heroRoot.classList.add('can-arm');
    fine.addEventListener('change', function () { heroRoot.classList.toggle('can-arm', !fine.matches); });
  }

  function stopAutoplay() {
    if (autoplay.stopped) return;
    autoplay.stopped = true;
    autoplay.token += 1;
    // An uncommitted guided drag must not favorite/trash a photo after the
    // visitor takes over. Already committed transitions finish normally.
    if (hero && !hero.busy) {
      hero.card.getAnimations().forEach(function (animation) { animation.cancel(); });
      hero.card.style.transform = '';
      hero.setCaption('Add to Album');
      hero.render();
    }
    wakeAutoplay();
    if (pauseBtn) pauseBtn.hidden = true;
  }

  function wakeAutoplay() {
    var waiting = gateWaiters;
    gateWaiters = [];
    waiting.forEach(function (resume) { resume(); });
  }

  function gate(token) {
    return new Promise(function (resolve, reject) {
      function check() {
        if (token !== autoplay.token || autoplay.stopped) reject(new Error('stopped'));
        else if (!autoplay.paused && heroVisible && !document.hidden) resolve();
        else gateWaiters.push(check);
      }
      check();
    });
  }

  function step(token, ms) {
    return wait(ms).then(function () { return gate(token); });
  }

  function runAutoplay() {
    if (!hero || autoplay.stopped || reduce.matches) return;
    var token = ++autoplay.token;
    var isCurrent = function () { return token === autoplay.token && !autoplay.stopped; };
    if (pauseBtn) pauseBtn.hidden = false;
    var loops = 0;
    (function loop() {
      step(token, 1100)
        .then(function () { return hero.fakeDrag(-26, 380, isCurrent); })
        .then(function () { return step(token, 1100); })
        .then(function () { return hero.fakeDrag(20, 380, isCurrent); })
        .then(function () { return step(token, 1000); })
        .then(function () { return hero.press(hero.setRatingChip); })
        .then(function () {
          if (!isCurrent()) throw new Error('stopped');
          hero.toggleRating(true);
          return step(token, 600);
        })
        .then(function () {
          var s = hero.stars;
          var i = 0;
          return new Promise(function (resolve) {
            (function lit() {
              if (!isCurrent()) { resolve(); return; }
              if (i < 4) { s[i].classList.add('is-on', 'is-hot'); (function (el) { setTimeout(function () { el.classList.remove('is-hot'); }, 220); })(s[i]); i++; setTimeout(lit, 120); }
              else resolve();
            })();
          });
        })
        .then(function () { return step(token, 0); })
        .then(function () { return hero.rate(4); })
        .then(function () { return step(token, 900); })
        .then(function () { hero.toggleRating(false); return hero.press(hero.chips[0]); })
        .then(function () { return step(token, 0); })
        .then(function () { return hero.album(hero.chips[0].getAttribute('data-album')); })
        .then(function () { return step(token, 1800); })
        .then(function () {
          loops += 1;
          if (loops >= 2) { hero.restart(); stopAutoplay(); hero.note('Your turn: drag the photo, or use the buttons.'); return; }
          hero.restart();
          loop();
        })
        .catch(function () {});
    })();
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      autoplay.paused = !autoplay.paused;
      wakeAutoplay();
      pauseBtn.querySelector('use').setAttribute('href', autoplay.paused ? '#i-play' : '#i-pause');
      pauseBtn.querySelector('span').textContent = autoplay.paused ? 'Play demo' : 'Pause demo';
    });
  }

  if (heroRoot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (!heroVisible && hero) hero.setArmed(false);
      wakeAutoplay();
    }, { threshold: 0.2 }).observe(heroRoot);
  }

  document.addEventListener('visibilitychange', wakeAutoplay);

  reduce.addEventListener('change', function () { if (reduce.matches) stopAutoplay(); });

  if (hero) {
    heroRoot.inert = false;
    var heroControls = (heroRoot.closest('section') || heroRoot).querySelector('.demo-controls');
    if (heroControls) heroControls.inert = false;
  }

  /* ---------------- No second photo library ---------------- */
  var one = document.querySelector('[data-one]');
  if (one) {
    var section = one.closest('section');
    var st = { fav: false, album: false, rate: false, queued: false, deleted: false };
    var photo = one.querySelector('[data-one-photo]');
    var confirmBtn = section.querySelector('[data-one-act="delete"]');
    var q = function (sel) { return section.querySelector(sel); };

    var flash = function (row) {
      var li = q('[data-row="' + row + '"]');
      li.classList.remove('is-changed');
      void li.offsetWidth;
      li.classList.add('is-changed');
    };

    var set = function (sel, text, on) {
      var el = q(sel);
      el.textContent = text;
      el.classList.toggle('is-on', on);
    };

    var renderOne = function () {
      set('[data-v-fav]', st.fav ? 'In Favorites' : 'Not a favorite', st.fav);
      set('[data-v-album]', st.album ? 'In this album' : 'Not in this album', st.album);
      set('[data-v-rate]', st.rate ? '★★★★' : 'No rating', st.rate);
      set('[data-v-status]', st.deleted ? 'In Recently Deleted, recoverable for up to 30 days' : (st.queued ? 'Still in your library (queued in SortGlass Trash)' : 'In your library'), true);
      q('[data-chip-fav]').textContent = st.fav ? '♥' : '';
      q('[data-chip-rate]').textContent = st.rate ? '★★★★' : '';
      q('[data-chip-album]').textContent = st.album ? 'Sunsets' : '';
      ['fav', 'album', 'rate', 'trash'].forEach(function (k) {
        var b = q('[data-one-act="' + k + '"]');
        b.setAttribute('aria-pressed', String(k === 'trash' ? st.queued : st[k]));
        b.disabled = st.deleted;
      });
      q('[data-one-act="trash"]').lastChild.textContent = st.queued ? 'Remove from Trash' : 'Add to Trash';
      confirmBtn.hidden = !st.queued || st.deleted;
      photo.classList.toggle('is-queued', st.queued && !st.deleted);
      photo.classList.toggle('is-deleted', st.deleted);
    };

    section.addEventListener('click', function (event) {
      var b = event.target.closest('[data-one-act]');
      if (!b) return;
      var act = b.getAttribute('data-one-act');
      if (act === 'reset') { st = { fav: false, album: false, rate: false, queued: false, deleted: false }; renderOne(); return; }
      if (act === 'fav') { st.fav = !st.fav; flash('fav'); }
      else if (act === 'album') { st.album = !st.album; flash('album'); }
      else if (act === 'rate') { st.rate = !st.rate; flash('rate'); }
      else if ((act === 'trash' && !st.queued || act === 'delete') && st.fav) {
        set('[data-v-status]', 'Favorites are protected. Unfavorite this photo before adding it to Trash or deleting it.', true);
        flash('status');
        return;
      }
      else if (act === 'trash') { st.queued = !st.queued; flash('status'); }
      else if (act === 'delete') { st.deleted = true; flash('status'); }
      renderOne();
    });
    renderOne();
    one.querySelector('.one-actions').inert = false;
    q('[data-one-act="reset"]').inert = false;
  }

  /* ---------------- A closer look: photo metadata ---------------- */
  var metadataShowcase = document.querySelector('[data-metadata-showcase]');
  if (metadataShowcase) (function (root) {
    // Include every owner-supplied X100VI sample alongside the Nikon photos.
    // Use larger background renditions where available; small previews retain
    // their actual source dimensions rather than advertising invented sizes.
    var order = ['fern', 'bridge', 'x100-pink-sports-car', 'milkyway', 'x100-sunset-street', 'x100-alpine-rain', 'x100-peach-rose', 'x100-redwoods', 'x100-neon-waterfront', 'ocean', 'x100-ocean-sunset', 'x100-magenta-pier', 'hibiscus', 'x100-city-reflections', 'x100-neon-garage', 'canyon', 'x100-cherry-blossoms', 'rose', 'x100-shadow', 'x100-autumn-river', 'x100-city-lights', 'dusk', 'x100-orange-cockpit', 'redsun', 'x100-classic-interior', 'x100-foggy-coast'];
    var images = root.querySelector('[data-metadata-images]');
    var details = root.querySelector('[data-metadata-details]');
    var currentImage = images && images.querySelector('img');
    if (!currentImage) return;
    var forcedColors = window.matchMedia('(forced-colors: active)');
    // Cover sizing is height-driven in these tall panels, not just their CSS width.
    var imageSizes = '(min-width: 1800px) 50vw, (min-width: 900px) 896px, (min-width: 656px) 100vw, 656px';
    currentImage.sizes = imageSizes;
    currentImage.setAttribute('data-photo', order[0]);

    var index = 0, nextIndex = 1, generation = 0;
    var hovered = false, focused = false, visible = false, manualPaused = false;
    var timer = null, pending = null, animation = null, detailsAnimation = null, outgoing = null;

    function field(name, value) {
      var element = root.querySelector('[data-metadata-' + name + ']');
      if (!element) return;
      element.textContent = value || '';
      // Metadata rows are optional when an original doesn't contain a field.
      var row = element.closest('dl > div');
      if (row) row.hidden = !value;
    }

    function renderDetails() {
      var photo = PHOTOS[order[index]];
      var exposure = photo.exp.split(' · ');
      field('camera', photo.cam);
      field('lens', photo.lens);
      field('aperture', exposure[0]);
      field('shutter', exposure[1]);
      field('iso', (exposure[2] || '').replace(/^ISO /, ''));
      field('date', photo.date.replace(' at ', ' • '));
      field('caption', photo.alt);
      field('position', (index + 1) + ' / ' + order.length);
    }

    function finishFade() {
      if (animation) { animation.cancel(); animation = null; }
      if (detailsAnimation) { detailsAnimation.cancel(); detailsAnimation = null; }
      if (outgoing) { outgoing.remove(); outgoing = null; }
      currentImage.classList.add('is-current');
    }

    function cancelLoad() {
      generation += 1;
      if (pending) { pending.cancel(); pending = null; }
      root.setAttribute('aria-busy', 'false');
    }

    function renderRotationControl() {
      images.disabled = reduce.matches || forcedColors.matches;
      images.setAttribute('aria-label', forcedColors.matches ? 'Photo rotation paused for high contrast' : (reduce.matches ? 'Photo rotation paused for reduced motion' : (manualPaused ? 'Resume photo rotation' : 'Pause photo rotation')));
    }

    function canPlay() { return !manualPaused && !hovered && !focused && visible && !document.hidden && !reduce.matches && !forcedColors.matches; }
    function schedule() {
      clearTimeout(timer);
      timer = null;
      if (!canPlay() || pending) return;
      timer = setTimeout(function () {
        timer = null;
        if (canPlay()) show(nextIndex);
      }, 3000);
    }

    // Only the requested image is fetched. Decode before changing either the
    // visible photograph or its details, so a slow/failed request can't mismatch them.
    function show(target) {
      clearTimeout(timer);
      cancelLoad();
      finishFade();
      if (target === index) { nextIndex = (index + 1) % order.length; schedule(); return; }
      var token = generation;
      var photo = PHOTOS[order[target]];
      var rendition = photo.background || photo;
      var image = new Image();
      image.className = 'metadata-image is-current';
      image.setAttribute('data-photo', order[target]);
      image.alt = photo.alt;
      image.width = rendition.width || 800;
      image.height = rendition.height || 1000;
      image.decoding = 'async';
      image.sizes = imageSizes;
      root.setAttribute('aria-busy', 'true');
      var ready = new Promise(function (resolve, reject) {
        var done = false;
        var timeout = setTimeout(function () { settle(new Error('Image loading timed out')); }, 15000);
        function settle(error) {
          if (done) return;
          done = true;
          clearTimeout(timeout);
          image.onload = image.onerror = null;
          if (error) reject(error); else resolve();
        }
        pending = { cancel: function () {
          settle(new Error('Image request cancelled'));
          image.removeAttribute('srcset');
          image.removeAttribute('src');
        } };
        image.onerror = function () { settle(new Error('Image unavailable')); };
        image.onload = function () {
          if (!image.naturalWidth) { settle(new Error('Image unavailable')); return; }
          if (image.decode) image.decode().then(function () { settle(); }, settle);
          else settle();
        };
        if (rendition.srcset) image.srcset = rendition.srcset;
        else if (!rendition.file) image.srcset = src(order[target], 800) + ' 800w, ' + src(order[target], 1200) + ' 1200w';
        image.src = rendition.file ? 'assets/photos/' + rendition.file : src(order[target], 800);
      });
      ready.then(function () {
        if (token !== generation) return;
        pending = null;
        outgoing = currentImage;
        outgoing.alt = '';
        outgoing.setAttribute('aria-hidden', 'true');
        currentImage = image;
        images.appendChild(image);
        index = target;
        nextIndex = (index + 1) % order.length;
        renderDetails();
        root.setAttribute('aria-busy', 'false');
        if (reduce.matches || forcedColors.matches || document.hidden || !visible) finishFade();
        else {
          var fade = image.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: 'ease-in-out' });
          animation = fade;
          // The new values arrive with the decoded photo. A brief delayed fade
          // lets that photograph come forward before its matching details.
          if (details) detailsAnimation = details.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 650, delay: 150, easing: 'ease-out', fill: 'backwards'
          });
          fade.onfinish = function () { if (animation === fade) finishFade(); };
        }
        schedule();
      }).catch(function () {
        if (token !== generation) return;
        pending = null;
        image.removeAttribute('srcset');
        image.removeAttribute('src');
        root.setAttribute('aria-busy', 'false');
        // Keep the current photo and try the next sample after the usual delay.
        // One missing image cannot stall the entire showcase.
        nextIndex = (target + 1) % order.length;
        schedule();
      });
    }

    // The image itself is a native button: pointer, touch, Enter and Space all
    // control a pause that persists after focus or hover leaves the showcase.
    images.addEventListener('click', function () {
      if (reduce.matches || forcedColors.matches) return;
      manualPaused = !manualPaused;
      renderRotationControl();
      suspendOrSchedule();
    });
    // Only hovering the details pauses reading. Hovering the full-panel photo
    // must not prevent its rotation as the user moves down the page.
    if (details) details.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'touch') return;
      hovered = true;
      suspendOrSchedule();
    });
    if (details) details.addEventListener('pointerleave', function () {
      hovered = false;
      suspendOrSchedule();
    });
    root.addEventListener('focusin', function () {
      focused = true;
      suspendOrSchedule();
    });
    root.addEventListener('focusout', function (event) {
      if (root.contains(event.relatedTarget)) return;
      focused = false;
      suspendOrSchedule();
    });

    function suspendOrSchedule() {
      if (!canPlay()) {
        clearTimeout(timer);
        timer = null;
        cancelLoad();
        finishFade();
      } else schedule();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var nowVisible = entries[0].isIntersecting;
        if (visible === nowVisible) return;
        visible = nowVisible;
        suspendOrSchedule();
      }, { threshold: 0.15 }).observe(root);
    }
    document.addEventListener('visibilitychange', suspendOrSchedule);
    reduce.addEventListener('change', function () { renderRotationControl(); suspendOrSchedule(); });
    // High-contrast CSS hides the photo and its pause control, so its metadata
    // must remain static too, including when the system preference changes.
    forcedColors.addEventListener('change', function () { renderRotationControl(); suspendOrSchedule(); });
    renderDetails();
    renderRotationControl();
  })(metadataShowcase);

  /* ---------------- Make it yours: real theme combinations ----------------
     Backgrounds, accents and heart colors are the app's own values. */
  var themeDemo = document.querySelector('[data-theme-demo]');
  if (themeDemo) {
    var THEMES = [
      { bg: '#000000', accent: '#0a84ff', heart: '#ffd60a', light: false },
      { bg: '#122129', accent: '#50d7e6', heart: '#40c8e0', light: false },
      { bg: '#141118', accent: '#b566f2', heart: '#bf5af2', light: false },
      { bg: '#f7c6dc', accent: '#80172c', heart: '#e899a9', light: true },
      { bg: '#181511', accent: '#db7846', heart: '#ff453a', light: false },
      { bg: '#000000', accent: '#52d996', heart: '#30d158', light: false },
      { bg: '#e0ecfb', accent: '#1d71cc', heart: '#ffcc00', light: true },
      { bg: '#faf2de', accent: '#b8470f', heart: '#ff3b30', light: true },
      { bg: '#ffffff', accent: '#0d3785', heart: '#ff2d55', light: true }
    ];
    var themeOgRoot = themeDemo.querySelector('[data-og="theme"]');
    // One photo per theme, chosen to suit its colors.
    var THEME_PHOTOS = ['hibiscus', 'redsun', 'bridge', 'rose', 'ocean', 'fern', 'dusk', 'canyon', 'milkyway'];
    var themeOg = new Organize(themeOgRoot, THEME_PHOTOS.slice(), {});
    THEME_PHOTOS.forEach(function (id) {
      themeOg.state[id].fav = true;
      themeOg.state[id].albums[themeOg.chips[0].getAttribute('data-album')] = true;
    });
    themeOg.render();
    var themeButtons = document.querySelectorAll('[data-theme]');
    var themePause = document.querySelector('[data-theme-pause]');
    var themeIndex = 0;
    var themeTimer = null;
    var themeVisible = false;
    var themeStopped = false;
    var themePaused = false;
    var themeHold = null;
    // While turning, each theme takes the whole step to drift into the next,
    // so the colors never stop moving; a picked theme arrives quickly.
    var THEME_STEP = 6000;
    var THEME_EASE = 'cubic-bezier(0.37, 0, 0.63, 1)';
    var THEME_PICK = 900;

    var applyTheme = function (i, turning) {
      themeDemo.style.setProperty('--blend', (turning ? THEME_STEP : THEME_PICK) + 'ms');
      themeDemo.style.setProperty('--blend-ease', turning ? THEME_EASE : 'ease-in-out');
      var photoChanged = i !== themeOg.index;
      themeIndex = i;
      var t = THEMES[i];
      if (photoChanged) {
        // Cross-fade: the outgoing photo stays on top and fades away while
        // the next one is already in place underneath.
        var shown = themeOg.img;
        var ghost = shown.cloneNode();
        ghost.removeAttribute('fetchpriority');
        ghost.className = 'og-ghost';
        shown.parentNode.appendChild(ghost);
        themeOg.index = i;
        themeOg.render();
        var reveal = function () {
          // While turning, the photo dissolves through the middle of the color drift.
          var fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: reduce.matches ? 1 : (turning ? THEME_STEP / 2 : THEME_PICK),
            delay: turning ? THEME_STEP / 4 : 0,
            easing: 'ease-in-out',
            fill: 'forwards'
          });
          fade.onfinish = function () { ghost.remove(); };
        };
        if (shown.decode) shown.decode().then(reveal, reveal); else reveal();
        var next = new Image();
        next.src = 'assets/photos/' + THEME_PHOTOS[(i + 1) % THEME_PHOTOS.length] + '-800.webp';
      }
      themeOgRoot.style.setProperty('--og-bg', t.bg);
      themeOgRoot.style.setProperty('--accent', t.accent);
      themeOgRoot.style.setProperty('--fav', t.heart);
      themeOgRoot.classList.toggle('is-light', t.light);
      themeDemo.style.setProperty('--glow', t.accent);
      themeButtons.forEach(function (b, n) { b.setAttribute('aria-pressed', String(n === i)); });
      // On phones the choices are one swipeable row: keep the current one in view.
      var row = themeButtons[i].parentNode;
      if (row.scrollWidth > row.clientWidth) {
        var left = themeButtons[i].getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - 20;
        row.scrollTo({ left: Math.max(0, left), behavior: reduce.matches ? 'auto' : 'smooth' });
      }
    };

    // Keeps turning through the themes at an even pace: each drift starts
    // as the last one ends.
    var tick = function (delay) {
      clearTimeout(themeTimer);
      if (themeStopped || themePaused || themeHold || !themeVisible || document.hidden || reduce.matches) return;
      themeTimer = setTimeout(function () {
        applyTheme((themeIndex + 1) % THEMES.length, true);
        tick();
      }, delay === undefined ? THEME_STEP : delay);
    };

    var stopThemes = function () {
      themeStopped = true;
      clearTimeout(themeTimer);
      if (themePause) themePause.hidden = true;
    };

    // Picking a theme shows it for a while, then the rotation carries on.
    themeButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        clearTimeout(themeTimer);
        clearTimeout(themeHold);
        applyTheme(Number(b.getAttribute('data-theme')));
        themeHold = setTimeout(function () { themeHold = null; tick(0); }, 8000);
      });
    });

    if (themePause) {
      themePause.hidden = reduce.matches;
      themePause.addEventListener('click', function () {
        themePaused = !themePaused;
        themePause.querySelector('use').setAttribute('href', themePaused ? '#i-play' : '#i-pause');
        themePause.querySelector('span').textContent = themePaused ? 'Play' : 'Pause';
        tick(0);
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var was = themeVisible;
        themeVisible = entries[0].isIntersecting;
        if (themeVisible !== was) tick(1200);
      }, { threshold: 0.3 }).observe(themeDemo);
    }
    document.addEventListener('visibilitychange', function () { tick(1200); });
    reduce.addEventListener('change', function () { if (reduce.matches) stopThemes(); });
    applyTheme(0);
    themeDemo.closest('section').querySelector('.yours-pick').inert = false;
  }

  /* ---------------- Start ---------------- */
  if (hero) {
    if (document.readyState === 'complete') runAutoplay();
    else window.addEventListener('load', runAutoplay, { once: true });
  }
})();
