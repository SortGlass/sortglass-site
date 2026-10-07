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
    fern:     { alt: 'A fern frond lit against a dark forest floor', date: 'Mar 13, 2026 at 12:23 PM', cam: 'FUJIFILM X100VI', lens: '23 mm', exp: 'ƒ/2 · 1/320 s · ISO 64' }
  };

  var SPRING = 'cubic-bezier(0.34, 1.3, 0.5, 1)';
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_IN = 'cubic-bezier(0.55, 0, 0.75, 0.2)';

  function src(id, w) { return 'assets/photos/' + id + '-' + w + '.webp'; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- Scene: blurred photo behind hero and story ---------------- */
  var scene = document.querySelector('[data-scene]');
  var sceneImgs = scene ? scene.querySelectorAll('img') : [];
  var sceneTurn = 0;
  var sceneId = 'bridge';
  function setScene(id) {
    if (!sceneImgs.length || id === sceneId) return;
    sceneId = id;
    var next = sceneImgs[1 - sceneTurn];
    var prev = sceneImgs[sceneTurn];
    next.src = src(id, 'glow');
    next.classList.add('is-on');
    prev.classList.remove('is-on');
    sceneTurn = 1 - sceneTurn;
  }

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
    this.rating.inert = true;

    if (this.interactive) this.bind();
    this.render();
  }

  Organize.prototype.current = function () { return this.order[this.index]; };

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
    this.heart.setAttribute('aria-label', st.fav ? 'Favorite, on' : 'Favorite');
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
    if (this.options.onPhoto) this.options.onPhoto(id);
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
        self.img.removeAttribute('srcset');
        self.img.src = 'data:,';
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
    if (this.busy) return Promise.resolve();
    this.busy = true;
    var self = this;
    var id = this.current();
    this.state[id].trashed = true;
    this.queued += 1;
    this.push({ type: 'trash', id: id, index: this.index });
    this.setCaption('Add to Album');
    this.say('Queued for Trash. Nothing is deleted until you review and confirm.');
    var start = fromDrag || 'none';
    return this.go(1, [{ transform: start, opacity: 1 }, { transform: 'translateY(-125%) rotate(-5deg)', opacity: 0 }], 360)
      .then(function () { self.busy = false; self.render(); });
  };

  Organize.prototype.favorite = function () {
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
    if (this.busy) return Promise.resolve();
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
    this.busy = true;
    return wait(380).then(function () {
      return self.go(1, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%) scale(0.94)', opacity: 0 }], 300);
    }).then(function () { self.busy = false; });
  };

  Organize.prototype.album = function (name) {
    if (this.busy) return Promise.resolve();
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
    this.busy = true;
    return wait(420).then(function () {
      return self.go(1, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-30%) scale(0.94)', opacity: 0 }], 300);
    }).then(function () { self.busy = false; });
  };

  Organize.prototype.show = function (index) {
    this.root.classList.remove('is-empty');
    this.card.style.opacity = '';
    this.index = index;
    this.render();
    this.motion([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], 320, EASE_OUT);
  };

  Organize.prototype.undo = function () {
    var e = this.undoStack.pop();
    if (!e) return;
    this.apply(e, true);
    this.redoStack.push(e);
    this.render();
  };

  Organize.prototype.redo = function () {
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
      else { this.say('Redo: queued for Trash.'); var n = this.nextIndex(1); if (n !== -1) this.show(n); }
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
    var self = this;
    this.order.forEach(function (id) { self.state[id] = { fav: false, rating: 0, albums: {}, trashed: false }; });
    this.queued = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.show(0);
  };

  /* Drag the photo, as in the app: up to Trash, down to Favorite,
     sideways to move between photos. */
  Organize.prototype.bind = function () {
    var self = this;
    var root = this.root;
    var start = null;
    var armedKind = null;

    root.addEventListener('click', function (event) {
      var target = event.target.closest('button');
      if (!target || !root.contains(target)) return;
      var act = target.getAttribute('data-act');
      if (self.options.onUser) self.options.onUser();
      if (target.hasAttribute('data-star')) { self.rate(Number(target.getAttribute('data-star'))); return; }
      if (target.hasAttribute('data-album')) { self.album(target.getAttribute('data-album')); return; }
      if (target.hasAttribute('data-arm')) {
        root.classList.add('is-armed');
        self.note('Drag up for Trash, down for Favorite, sideways for the next photo.');
        self.photo.focus({ preventScroll: true });
        return;
      }
      if (target.hasAttribute('data-restart')) { self.restart(); return; }
      if (act === 'favorite') self.favorite();
      else if (act === 'setrating') self.toggleRating();
      else if (act === 'undo') self.undo();
      else if (act === 'redo') self.redo();
      else if (act === 'trash-view') self.note('SortGlass Trash: ' + self.queued + ' queued. Nothing is deleted until you review the queue and confirm with iOS.');
      else if (act === 'history') self.note('History keeps your last 100 Album and Trash actions, so you can undo them later.');
      else if (act === 'sort') self.note('Sort by Date Taken or Recently Added.');
      else if (act === 'info') {
        var on = !root.classList.contains('is-info');
        root.classList.toggle('is-info', on);
        target.setAttribute('aria-pressed', String(on));
        if (on) self.say(self.info.textContent);
      }
    });

    this.photo.addEventListener('keydown', function (event) {
      var k = event.key;
      if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') return;
      event.preventDefault();
      if (self.options.onUser) self.options.onUser();
      if (k === 'ArrowUp') self.trash();
      else if (k === 'ArrowDown') self.favorite();
      else if (!self.busy) self.go(k === 'ArrowRight' ? 1 : -1, [{ transform: 'none', opacity: 1 }, { transform: k === 'ArrowRight' ? 'translateX(-30%)' : 'translateX(30%)', opacity: 0 }], 260);
    });

    var canDrag = function () { return fine.matches || root.classList.contains('is-armed'); };

    this.card.addEventListener('pointerdown', function (event) {
      if (self.busy || !canDrag() || event.button > 0) return;
      if (self.options.onUser) self.options.onUser();
      start = { x: event.clientX, y: event.clientY, w: self.card.offsetWidth, h: self.card.offsetHeight };
      self.card.setPointerCapture(event.pointerId);
      self.card.getAnimations().forEach(function (a) { a.cancel(); });
    });

    this.card.addEventListener('pointermove', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x;
      var dy = event.clientY - start.y;
      var vertical = Math.abs(dy) > Math.abs(dx);
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
      if (!start) return;
      var dx = event.clientX - start.x;
      var dy = event.clientY - start.y;
      var from = self.card.style.transform || 'none';
      var width = start.w;
      start = null;
      self.card.style.transform = '';
      var kind = armedKind;
      armedKind = null;
      self.setCaption('Add to Album');
      if (event.type === 'pointercancel') kind = null;
      if (kind === 'trash') { self.trash(from); return; }
      if (kind === 'fav') {
        self.favorite();
        self.motion([{ transform: from }, { transform: 'none' }], 420, SPRING);
        return;
      }
      if (event.type !== 'pointercancel' && Math.abs(dx) > width * 0.22 && Math.abs(dx) > Math.abs(dy)) {
        var dir = dx < 0 ? 1 : -1;
        self.go(dir, [{ transform: from, opacity: 1 }, { transform: 'translateX(' + (dx < 0 ? -115 : 115) + '%)', opacity: 0 }], 260);
        return;
      }
      self.motion([{ transform: from }, { transform: 'none' }], 380, SPRING);
    };
    this.card.addEventListener('pointerup', end);
    this.card.addEventListener('pointercancel', end);
  };

  // Plays a drag the way a finger would, for the guided demos.
  Organize.prototype.fakeDrag = function (dy, holdMs) {
    var self = this;
    var kind = dy < 0 ? 'trash' : 'fav';
    var to = 'translateY(' + dy + '%) rotate(' + (dy * -0.06) + 'deg)';
    return this.motion([{ transform: 'none' }, { transform: to }], 420, EASE_OUT).then(function () {
      self.setCaption(kind === 'trash' ? 'Release to Trash' : 'Release to Favorite', kind);
      return wait(holdMs || 420);
    }).then(function () {
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
  var autoplay = { on: false, stopped: false, paused: false, token: 0 };
  var pauseBtn = document.querySelector('[data-pause]');
  var heroVisible = true;

  if (heroRoot) {
    hero = new Organize(heroRoot, ['bridge', 'hibiscus', 'milkyway', 'ocean', 'canyon', 'dusk', 'redsun', 'rose', 'fern'], {
      interactive: true,
      onPhoto: function (id) { if (heroVisible && !storyActive) setScene(id); },
      onUser: function () { stopAutoplay(); }
    });
    if (!fine.matches) heroRoot.classList.add('can-arm');
    fine.addEventListener('change', function () { heroRoot.classList.toggle('can-arm', !fine.matches); });
  }

  function stopAutoplay() {
    if (autoplay.stopped) return;
    autoplay.stopped = true;
    autoplay.token += 1;
    if (pauseBtn) pauseBtn.hidden = true;
  }

  function gate() {
    return new Promise(function check(resolve) {
      if (!autoplay.paused && heroVisible && !document.hidden) resolve();
      else setTimeout(function () { check(resolve); }, 250);
    });
  }

  function step(token, ms) {
    return wait(ms).then(gate).then(function () {
      if (token !== autoplay.token) throw new Error('stopped');
    });
  }

  function runAutoplay() {
    if (!hero || autoplay.stopped || reduce.matches) return;
    var token = ++autoplay.token;
    if (pauseBtn) pauseBtn.hidden = false;
    var loops = 0;
    (function loop() {
      step(token, 1100)
        .then(function () { return hero.fakeDrag(-26, 380); })
        .then(function () { return step(token, 1100); })
        .then(function () { return hero.fakeDrag(20, 380); })
        .then(function () { return step(token, 1000); })
        .then(function () { return hero.press(hero.setRatingChip); })
        .then(function () { hero.toggleRating(true); return step(token, 600); })
        .then(function () {
          var s = hero.stars;
          var i = 0;
          return new Promise(function (resolve) {
            (function lit() {
              if (i < 4) { s[i].classList.add('is-on', 'is-hot'); (function (el) { setTimeout(function () { el.classList.remove('is-hot'); }, 220); })(s[i]); i++; setTimeout(lit, 120); }
              else resolve();
            })();
          });
        })
        .then(function () { return hero.rate(4); })
        .then(function () { return step(token, 900); })
        .then(function () { hero.toggleRating(false); return hero.press(hero.chips[0]); })
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
      pauseBtn.querySelector('use').setAttribute('href', autoplay.paused ? '#i-play' : '#i-pause');
      pauseBtn.querySelector('span').textContent = autoplay.paused ? 'Play demo' : 'Pause demo';
    });
  }

  if (heroRoot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (!heroVisible) heroRoot.classList.remove('is-armed');
      if (heroVisible && !storyActive && hero) setScene(hero.current());
    }, { threshold: 0.2 }).observe(heroRoot);
  }

  reduce.addEventListener('change', function () { if (reduce.matches) stopAutoplay(); });

  /* ---------------- Story: one stage, five beats ---------------- */
  var story = document.querySelector('[data-story]');
  var storyActive = false;
  var stage = story && story.querySelector('[data-stage]');
  var storyOg = null;

  if (story && stage && 'IntersectionObserver' in window) {
    story.classList.add('is-staged');
    var words = stage.querySelectorAll('[data-word]');
    var wordTurn = 0;
    var captionText = stage.querySelector('[data-caption-text]');
    var captionTag = stage.querySelector('[data-caption-tag]');
    var dots = stage.querySelectorAll('.stage-dots li');
    var beats = story.querySelectorAll('.beat');
    var filters = stage.querySelectorAll('[data-f]');
    var matches = stage.querySelector('[data-matches]');
    var grid = stage.querySelector('[data-grid]');
    var beatToken = 0;
    var currentBeat = null;

    storyOg = new Organize(stage.querySelector('[data-og="story"]'), ['redsun', 'ocean', 'milkyway', 'hibiscus', 'canyon', 'rose', 'bridge', 'dusk', 'fern'], {});

    var fills = {};
    beats.forEach(function (b) { fills[b.getAttribute('data-beat')] = b.getAttribute('data-fill'); });

    var setWord = function (text, fill) {
      var out = words[wordTurn];
      var into = words[1 - wordTurn];
      into.textContent = text;
      into.setAttribute('data-text', text);
      out.classList.add('is-out');
      into.classList.add('is-in');
      // Long words ("Organize.") shrink to fit beside the demo.
      into.style.fontSize = '';
      var box = into.parentNode;
      if (into.scrollWidth > box.clientWidth) into.style.fontSize = (box.clientWidth / into.scrollWidth * 0.97).toFixed(3) + 'em';
      void into.offsetWidth;
      into.classList.remove('is-in');
      wordTurn = 1 - wordTurn;
      setTimeout(function () { out.classList.remove('is-out'); out.classList.add('is-in'); }, 520);
    };

    var setFilter = function (name, count) {
      filters.forEach(function (f) { f.classList.toggle('is-on', f.getAttribute('data-f') === name); });
      matches.textContent = count + ' matching items';
      grid.classList.toggle('is-filtered', name === 'rated');
      grid.querySelectorAll('li').forEach(function (li) { li.classList.toggle('is-out', name === 'rated' && !li.hasAttribute('data-rated')); });
    };

    // Reduce Motion: show where each beat ends up, without the steps.
    var settle = function (beat) {
      var o = storyOg;
      var id = o.current();
      o.toggleRating(beat === 'rate');
      if (beat === 'swipe') { o.state[id].fav = true; o.render(); }
      else if (beat === 'rate') { o.state[id].rating = 5; o.render(); o.setCaption('Rated'); }
      else if (beat === 'organize') { o.state[id].albums[o.chips[0].getAttribute('data-album')] = true; o.render(); o.setCaption('Added to ' + o.chips[0].getAttribute('data-album')); }
      else if (beat === 'find') setFilter('rated', 27);
      else setFilter('all', 248);
    };

    var play = function (beat, token) {
      if (reduce.matches) { settle(beat); return; }
      var alive = function () { return token === beatToken; };
      var w = function (ms) { return wait(ms).then(function () { if (!alive()) throw new Error('stale'); }); };
      var o = storyOg;
      var chain;
      if (beat === 'swipe') {
        o.toggleRating(false);
        chain = w(500).then(function () { return o.fakeDrag(-26, 360); }).then(function () { return w(700); }).then(function () { return o.fakeDrag(20, 360); });
      } else if (beat === 'rate') {
        chain = w(300).then(function () { return o.press(o.setRatingChip); }).then(function () { o.toggleRating(true); return w(500); })
          .then(function () { o.stars[0].classList.add('is-on'); return w(110); })
          .then(function () { o.stars[1].classList.add('is-on'); return w(110); })
          .then(function () { o.stars[2].classList.add('is-on'); return w(110); })
          .then(function () { o.stars[3].classList.add('is-on'); return w(110); })
          .then(function () { o.stars[4].classList.add('is-on'); return w(200); })
          .then(function () { return o.rate(5); });
      } else if (beat === 'organize') {
        o.toggleRating(false);
        chain = w(600).then(function () { return o.press(o.chips[0]); }).then(function () { return o.album(o.chips[0].getAttribute('data-album')); })
          .then(function () { return w(900); }).then(function () { return o.press(o.chips[1]); }).then(function () { return o.album(o.chips[1].getAttribute('data-album')); });
      } else if (beat === 'find') {
        setFilter('all', 248);
        chain = w(700).then(function () { setFilter('favorites', 31); return w(1100); }).then(function () { setFilter('rated', 27); });
      } else {
        setFilter('all', 248);
        chain = Promise.resolve();
      }
      chain.catch(function () {});
    };

    var setBeat = function (beat) {
      if (beat === currentBeat) return;
      currentBeat = beat;
      beatToken += 1;
      var article = story.querySelector('.beat[data-beat="' + beat + '"]');
      var i = Array.prototype.indexOf.call(beats, article);
      stage.setAttribute('data-beat', beat);
      setWord(article.querySelector('.beat-word').textContent, fills[beat]);
      captionText.textContent = article.querySelector('p').textContent;
      var tag = article.getAttribute('data-tag');
      captionTag.hidden = !tag;
      captionTag.textContent = tag || '';
      dots.forEach(function (d, n) { d.classList.toggle('is-on', n === i); });
      setScene(fills[beat]);
      play(beat, beatToken);
    };

    var beatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setBeat(entry.target.getAttribute('data-beat'));
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    beats.forEach(function (b) { beatObserver.observe(b); });

    new IntersectionObserver(function (entries) {
      storyActive = entries[0].isIntersecting;
      if (!storyActive && heroVisible && hero) setScene(hero.current());
      if (storyActive && currentBeat) setScene(fills[currentBeat]);
    }, { rootMargin: '-40% 0px -40% 0px' }).observe(story.querySelector('.beats'));

    currentBeat = null;
    setBeat('swipe');
  }

  /* ---------------- No second photo library ---------------- */
  var one = document.querySelector('[data-one]');
  if (one) {
    var section = one.closest('section');
    var st = { fav: false, album: false, rate: false, queued: false, deleted: false };
    var beam = one.querySelector('[data-one-beam]');
    var photo = one.querySelector('[data-one-photo]');
    var confirmBtn = section.querySelector('[data-one-act="delete"]');
    var q = function (sel) { return section.querySelector(sel); };

    var flash = function (row) {
      beam.classList.remove('is-flash');
      void beam.offsetWidth;
      beam.classList.add('is-flash');
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
      q('[data-one-act="trash"]').lastChild.textContent = st.queued ? 'Queued for Trash' : 'Queue for Trash';
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
      else if (act === 'trash') { st.queued = !st.queued; flash('status'); }
      else if (act === 'delete') { st.deleted = true; flash('status'); }
      renderOne();
    });
    renderOne();
  }

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
  }

  /* ---------------- Keep your place when the screen rotates ----------------
     The story is several screens tall, so rotating changes its height.
     Remember which section or beat is on screen, and return to it. */
  var anchors = document.querySelectorAll('main > section, .story .beat, .story-intro');
  var saved = {};
  var anchorTicking = false;
  var settleTimer = null;
  var isLandscape = function () { return window.innerWidth > window.innerHeight; };
  var landscape = isLandscape();
  // Each orientation keeps its own last place, so events that arrive
  // mid-rotation can't overwrite the place to return to.
  var pickAnchor = function () {
    anchorTicking = false;
    var best = null;
    for (var a = 0; a < anchors.length; a++) {
      var r = anchors[a].getBoundingClientRect();
      // Document order, so a beat wins over the story around it.
      if (r.height && r.top <= 1 && r.bottom > 1) best = { el: anchors[a], ratio: -r.top / r.height };
    }
    saved[isLandscape() ? 'l' : 'p'] = best;
  };
  window.addEventListener('scroll', function () {
    if (!anchorTicking) { anchorTicking = true; setTimeout(pickAnchor, 120); }
  }, { passive: true });
  window.addEventListener('resize', function () {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      var now = isLandscape();
      if (now !== landscape) {
        var keep = saved[landscape ? 'l' : 'p'];
        if (keep) {
          var r = keep.el.getBoundingClientRect();
          window.scrollTo({ top: r.top + window.scrollY + keep.ratio * r.height, behavior: 'instant' });
        }
      }
      landscape = now;
      pickAnchor();
    }, 180);
  });
  pickAnchor();

  /* ---------------- Start ---------------- */
  if (hero) {
    if (document.readyState === 'complete') runAutoplay();
    else window.addEventListener('load', runAutoplay, { once: true });
  }
})();
