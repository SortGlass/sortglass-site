/* SortGlass — sortglass.com
   Builds the tour phone screens, follows the scroll, manages video playback,
   and runs the interactive Organize demo. No dependencies. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const live = document.querySelector('[data-live]');
  const announce = (message) => {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => { live.textContent = message; }, 30);
  };
  const svgIcon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ------------------------------------------------------------------ nav */
  const nav = document.querySelector('[data-nav]');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --------------------------------------------------------------- reveal */
  // Plain scroll-position checks (no IntersectionObserver), so reveals work
  // even in browsers or webviews that throttle observers.
  let pendingReveal = Array.from(document.querySelectorAll('[data-reveal]'));
  function checkReveal() {
    if (!pendingReveal.length) return;
    const limit = window.innerHeight * 0.94;
    pendingReveal = pendingReveal.filter((el) => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
      return true;
    });
  }

  /* -------------------------------------------------------------- screens */
  const SCREENS = {
    browse: [
      { id: 'filters', label: 'Filters', type: 'video', src: 'media/browse-filters.mp4', poster: 'media/browse-filters-poster.jpg', alt: 'Browse tab: choosing filters and customizing the filter list.' },
      { id: 'saved', label: 'Saved Filters', type: 'img', src: 'screens/browse-saved.webp', alt: 'Browse tab with a saved filter and year tiles.' },
      { id: 'search', label: 'Search (Soon)', type: 'img', src: 'screens/browse.webp', alt: 'Browse tab showing the upcoming photo search field.' }
    ],
    organize: [
      { id: 'try', label: 'Try It', type: 'demo' },
      { id: 'watch', label: 'Watch', type: 'video', src: 'media/organize.mp4', poster: 'media/organize-poster.jpg', alt: 'Organize tab: photos are swiped up to Trash and down to Favorites.' }
    ],
    library: [
      { id: 'watch', label: 'Watch', type: 'video', src: 'media/library-grid.mp4', poster: 'media/library-grid-poster.jpg', alt: 'Library tab: showing star ratings and changing the grid.' },
      { id: 'large', label: '3 per Row', type: 'img', src: 'screens/library-large.webp', alt: 'Library grid with three photos per row.' },
      { id: 'dense', label: '8 per Row', type: 'img', src: 'screens/library-dense.webp', alt: 'Dense Library grid with eight photos per row.' },
      { id: 'rated', label: 'Ratings', type: 'img', src: 'screens/library-rated.webp', alt: 'Library grid showing star ratings on each photo.' }
    ],
    albums: [
      { id: 'list', label: 'Albums', type: 'img', src: 'screens/albums.webp', alt: 'Albums tab with folders, albums, and pinned albums.' }
    ],
    more: [
      { id: 'themes', label: 'Themes', type: 'video', src: 'media/more-themes.mp4', poster: 'media/more-themes-poster.jpg', alt: 'More tab: changing the theme, accent color, and Liquid Glass style.' }
    ]
  };
  const CHAPTERS = Object.keys(SCREENS);

  /* ---------------------------------------------------- organize demo */
  const DEMO_PHOTOS = [
    { src: 'swipe/bridge.webp', mb: 4.2 },
    { src: 'swipe/rose-orange.webp', mb: 3.1 },
    { src: 'swipe/milkyway.webp', mb: 6.8 },
    { src: 'swipe/hibiscus.webp', mb: 2.7 },
    { src: 'swipe/sunset.webp', mb: 3.9 },
    { src: 'swipe/canyon.webp', mb: 5.4 },
    { src: 'swipe/rose-pink.webp', mb: 2.9 }
  ];
  const DEMO_ALBUMS = ['Sunsets', 'Travel', 'Nature'];

  class SwipeDemo {
    constructor() {
      this.el = document.createElement('div');
      this.el.className = 'demo';
      this.el.innerHTML = `
        <div class="demo-bg"></div>
        <div class="demo-status" aria-hidden="true"><span>9:41</span><span class="demo-status-right"><i></i></span></div>
        <div class="demo-header">
          <button class="demo-round" type="button" data-act="undo" aria-label="Undo" disabled>${svgIcon('i-undo')}</button>
          <div class="demo-center">
            <div class="demo-count">ALL <span data-count>· 1 / ${DEMO_PHOTOS.length}</span></div>
            <div class="demo-heart" data-heart aria-hidden="true">${svgIcon('i-heart')}</div>
          </div>
          <span class="demo-round" aria-hidden="true">${svgIcon('i-trash')}<span class="demo-badge" data-badge hidden>0</span></span>
        </div>
        <div class="demo-saved" data-saved hidden></div>
        <div class="demo-stage">
          <div class="demo-card next" aria-hidden="true"><img alt="" draggable="false"></div>
          <div class="demo-card current" tabindex="0" role="img"><img alt="" draggable="false"></div>
        </div>
        <div class="demo-hint" aria-hidden="true"><div class="demo-hint-pill">${svgIcon('i-hand')}Drag the photo<small>Up to Trash · Down to Favorite</small></div></div>
        <div class="demo-dock">
          <div class="demo-caption" data-caption>ADD TO ALBUM</div>
          <div class="demo-albums">
            ${DEMO_ALBUMS.map((name) => `<button class="demo-album" type="button" data-album="${name}">${svgIcon('i-albums')}<span>${name}</span></button>`).join('')}
          </div>
        </div>
        <div class="demo-done">
          <div>
            <h5>Session Complete</h5>
            <p data-summary></p>
            <button type="button" data-act="restart">${svgIcon('i-restart')}Start Over</button>
          </div>
        </div>`;

      this.bg = this.el.querySelector('.demo-bg');
      this.card = this.el.querySelector('.demo-card.current');
      this.cardImg = this.card.querySelector('img');
      this.nextImg = this.el.querySelector('.demo-card.next img');
      this.nextCard = this.el.querySelector('.demo-card.next');
      this.countEl = this.el.querySelector('[data-count]');
      this.heartEl = this.el.querySelector('[data-heart]');
      this.badgeEl = this.el.querySelector('[data-badge]');
      this.savedEl = this.el.querySelector('[data-saved]');
      this.captionEl = this.el.querySelector('[data-caption]');
      this.summaryEl = this.el.querySelector('[data-summary]');
      this.undoBtn = this.el.querySelector('[data-act="undo"]');

      this.undoBtn.addEventListener('click', () => this.undo());
      this.el.querySelector('[data-act="restart"]').addEventListener('click', () => this.reset(true));
      this.el.querySelectorAll('[data-album]').forEach((btn) => {
        btn.addEventListener('click', () => this.file(btn.dataset.album, btn));
      });
      this.bindDrag();
      this.card.addEventListener('keydown', (event) => this.onKey(event));
      this.reset(false);
    }

    reset(focus) {
      this.index = 0;
      this.favorites = new Set();
      this.trash = [];
      this.filed = [];
      this.history = [];
      this.busy = false;
      this.el.classList.remove('finished');
      this.render();
      if (focus) this.card.focus({ preventScroll: true });
    }

    get photo() { return DEMO_PHOTOS[this.index]; }

    render() {
      const total = DEMO_PHOTOS.length;
      const finished = this.index >= total;
      const completing = finished && !this.el.classList.contains('finished');
      const hadFocus = this.el.contains(document.activeElement);
      this.el.classList.toggle('finished', finished);
      this.el.querySelectorAll('.demo-header, .demo-stage, .demo-dock').forEach((section) => {
        section.inert = finished;
        section.setAttribute('aria-hidden', String(finished));
      });
      const completion = this.el.querySelector('.demo-done');
      completion.inert = !finished;
      completion.setAttribute('aria-hidden', String(!finished));
      if (finished) {
        const reviewed = total;
        this.summaryEl.textContent = `${reviewed} reviewed · ${this.trash.length} in Trash · ${this.favorites.size} favorited · ${this.filed.length} filed. In the app, nothing is deleted until you confirm in Trash.`;
        announce(`Session complete. ${this.summaryEl.textContent}`);
        if (completing && hadFocus) completion.querySelector('button').focus({ preventScroll: true });
      } else {
        const photo = this.photo;
        this.cardImg.src = photo.src;
        this.bg.style.backgroundImage = `url("${photo.src}")`;
        const next = DEMO_PHOTOS[this.index + 1];
        this.nextCard.style.visibility = next ? 'visible' : 'hidden';
        if (next) this.nextImg.src = next.src;
        this.countEl.textContent = `· ${this.index + 1} / ${total}`;
        const isFav = this.favorites.has(this.index);
        this.heartEl.classList.toggle('on', isFav);
        this.card.setAttribute('aria-label', `Photo ${this.index + 1} of ${total}${isFav ? ', favorited' : ''}. Drag it, or use the arrow keys: up sends it to Trash, down favorites it, left and right move between photos.`);
      }
      this.undoBtn.disabled = this.history.length === 0;
      this.badgeEl.hidden = this.trash.length === 0;
      this.badgeEl.textContent = String(this.trash.length);
      const saved = this.trash.reduce((sum, i) => sum + DEMO_PHOTOS[i].mb, 0);
      this.savedEl.hidden = saved === 0;
      this.savedEl.textContent = `+${saved.toFixed(1)} MB`;
      this.setCaption(null);
      this.card.style.transform = '';
      this.card.style.opacity = '';
      if (this.onRender) this.onRender(finished);
    }

    setCaption(state, text) {
      const labels = { trash: 'RELEASE TO TRASH', fav: this.favorites.has(this.index) ? 'RELEASE TO UNFAVORITE' : 'RELEASE TO FAVORITE' };
      this.captionEl.className = 'demo-caption' + (state ? ` ${state}` : '');
      this.captionEl.textContent = text || labels[state] || 'ADD TO ALBUM';
    }

    touched() { this.el.classList.add('touched'); }

    bindDrag() {
      let start = null;
      let last = null;
      let state = null;

      const size = () => this.card.getBoundingClientRect();

      this.card.addEventListener('pointerdown', (event) => {
        if (this.busy || this.index >= DEMO_PHOTOS.length) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        try { this.card.setPointerCapture(event.pointerId); } catch (_) { /* synthetic or stale pointer */ }
        this.card.classList.remove('anim');
        start = { x: event.clientX, y: event.clientY, t: performance.now() };
        last = { y: event.clientY, t: start.t, vy: 0 };
        state = null;
        this.touched();
      });

      this.card.addEventListener('pointermove', (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const now = performance.now();
        const dt = Math.max(1, now - last.t);
        last = { y: event.clientY, t: now, vy: (event.clientY - last.y) / dt };
        const rect = size();
        const vertical = Math.abs(dy) >= Math.abs(dx);
        if (vertical) {
          this.card.style.transform = `translate(${dx * 0.25}px, ${dy}px) rotate(${dx * 0.02}deg)`;
        } else {
          this.card.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx * 0.03}deg)`;
        }
        if (vertical && dy < -rect.height * 0.26) state = 'trash';
        else if (vertical && dy > rect.height * 0.11) state = 'fav';
        else if (!vertical && Math.abs(dx) > rect.width * 0.24) state = dx < 0 ? 'next' : 'prev';
        else state = null;
        this.setCaption(state === 'trash' || state === 'fav' ? state : null);
      });

      const finish = (event) => {
        if (!start) return;
        const dy = event.clientY - start.y;
        if (!state && last.vy < -0.9 && dy < -18) state = 'trash';
        if (!state && last.vy > 0.8 && dy > 12) state = 'fav';
        start = null;
        const action = state;
        state = null;
        if (action === 'trash') this.sendToTrash();
        else if (action === 'fav') { this.springBack(); this.toggleFavorite(); }
        else if (action === 'next') this.go(1);
        else if (action === 'prev' && this.index > 0) this.go(-1);
        else this.springBack();
      };
      this.card.addEventListener('pointerup', finish);
      this.card.addEventListener('pointercancel', () => {
        start = null;
        state = null;
        this.springBack();
      });
    }

    springBack() {
      this.card.classList.add('anim');
      this.card.style.transform = '';
      this.setCaption(null);
    }

    flyOut(direction, done) {
      this.busy = true;
      const transforms = {
        up: 'translate(0, -135%) rotate(-3deg)',
        left: 'translate(-135%, 0) rotate(-10deg)',
        right: 'translate(135%, 0) rotate(10deg)'
      };
      const instant = reduceMotion.matches;
      this.card.classList.add('anim');
      this.card.style.transform = transforms[direction];
      this.card.style.opacity = '0';
      window.setTimeout(() => {
        this.card.classList.remove('anim');
        done();
        this.busy = false;
      }, instant ? 0 : 300);
    }

    sendToTrash() {
      if (this.busy || this.index >= DEMO_PHOTOS.length) return;
      this.touched();
      const index = this.index;
      this.history.push({ type: 'trash', index });
      this.flyOut('up', () => {
        this.trash.push(index);
        this.index += 1;
        this.render();
        announce(`Added to Trash. ${this.trash.length} in Trash.`);
      });
    }

    toggleFavorite() {
      if (this.busy || this.index >= DEMO_PHOTOS.length) return;
      this.touched();
      const index = this.index;
      const was = this.favorites.has(index);
      this.history.push({ type: 'fav', index, was });
      if (was) this.favorites.delete(index); else this.favorites.add(index);
      this.render();
      this.heartEl.classList.remove('pop');
      void this.heartEl.offsetWidth;
      this.heartEl.classList.add('pop');
      announce(was ? 'Removed from Favorites.' : 'Added to Favorites.');
    }

    file(album, button) {
      if (this.busy || this.index >= DEMO_PHOTOS.length) return;
      this.touched();
      const index = this.index;
      this.history.push({ type: 'album', index, album });
      button.classList.add('flash');
      this.setCaption('album', `ADDED TO ${album.toUpperCase()}`);
      this.busy = true;
      window.setTimeout(() => {
        button.classList.remove('flash');
        this.busy = false;
        this.flyOut('left', () => {
          this.filed.push({ index, album });
          this.index += 1;
          this.render();
          announce(`Added to ${album}.`);
        });
      }, reduceMotion.matches ? 0 : 380);
    }

    go(step) {
      if (this.busy) return;
      const target = this.index + step;
      if (target < 0 || target > DEMO_PHOTOS.length) { this.springBack(); return; }
      this.touched();
      this.history.push({ type: 'nav', from: this.index });
      this.flyOut(step > 0 ? 'left' : 'right', () => {
        this.index = target;
        this.render();
      });
    }

    undo() {
      if (this.busy) return;
      const entry = this.history.pop();
      if (!entry) return;
      if (entry.type === 'trash') {
        this.trash = this.trash.filter((i) => i !== entry.index);
        this.index = entry.index;
      } else if (entry.type === 'fav') {
        if (entry.was) this.favorites.add(entry.index); else this.favorites.delete(entry.index);
        this.index = entry.index;
      } else if (entry.type === 'album') {
        this.filed = this.filed.filter((f) => !(f.index === entry.index && f.album === entry.album));
        this.index = entry.index;
      } else if (entry.type === 'nav') {
        this.index = entry.from;
      }
      this.render();
      announce('Undone.');
    }

    onKey(event) {
      const keys = { ArrowUp: () => this.sendToTrash(), ArrowDown: () => this.toggleFavorite(), ArrowRight: () => this.go(1), ArrowLeft: () => this.go(-1), z: () => this.undo() };
      const handler = keys[event.key];
      if (handler) { event.preventDefault(); handler(); }
    }
  }

  /* ------------------------------------------------------- phone builder */
  const groups = []; // { chapter, groupEl, controlsEl, phone, views, active, demo, buttons }

  function buildView(item, group) {
    const figure = document.createElement('figure');
    figure.className = 'view';
    figure.dataset.view = item.id;
    figure.id = `${group.id}-${item.id}-panel`;
    if (SCREENS[group.chapter].length > 1) {
      figure.setAttribute('role', 'tabpanel');
      figure.setAttribute('aria-labelledby', `${group.id}-${item.id}-tab`);
      figure.tabIndex = 0;
    }
    if (item.type === 'img') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 640;
      img.height = 1388;
      figure.append(img);
    } else if (item.type === 'video') {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.preload = 'none';
      video.poster = item.poster;
      video.setAttribute('aria-label', item.alt);
      video.dataset.autoplay = '';
      const source = document.createElement('source');
      source.src = item.src;
      source.type = 'video/mp4';
      video.append(source);
      figure.append(video);
    } else if (item.type === 'demo') {
      group.demo = new SwipeDemo();
      figure.append(group.demo.el);
    }
    return figure;
  }

  function buildGroup(chapter, phone) {
    const items = SCREENS[chapter];
    const group = { id: `tour-${chapter}-${groups.length}`, chapter, phone, views: new Map(), active: items[0].id, demo: null, buttons: null };

    group.groupEl = document.createElement('div');
    group.groupEl.className = 'screen-group';
    group.groupEl.dataset.group = chapter;
    items.forEach((item) => {
      const view = buildView(item, group);
      group.views.set(item.id, { el: view, item });
      group.groupEl.append(view);
    });

    group.controlsEl = document.createElement('div');
    group.controlsEl.className = 'controls-set';
    group.controlsEl.dataset.group = chapter;

    if (items.length > 1) {
      const seg = document.createElement('div');
      seg.className = 'segmented';
      seg.setAttribute('role', 'tablist');
      seg.setAttribute('aria-label', `${chapter[0].toUpperCase()}${chapter.slice(1)} screens`);
      items.forEach((item) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'tab');
        btn.id = `${group.id}-${item.id}-tab`;
        btn.setAttribute('aria-controls', `${group.id}-${item.id}-panel`);
        btn.dataset.view = item.id;
        btn.textContent = item.label;
        btn.addEventListener('click', () => setView(group, item.id));
        seg.append(btn);
      });
      // Roving tab order requires keyboard navigation between every screen.
      seg.addEventListener('keydown', (event) => {
        const buttons = Array.from(seg.querySelectorAll('[role="tab"]'));
        const current = buttons.indexOf(event.target);
        if (current < 0) return;
        let next;
        if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
        else if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        setView(group, buttons[next].dataset.view);
        buttons[next].focus({ preventScroll: true });
      });
      group.controlsEl.append(seg);
    }

    if (group.demo) {
      const demo = group.demo;
      group.buttons = document.createElement('div');
      group.buttons.className = 'demo-buttons';
      group.buttons.innerHTML = `
        <button type="button" class="b-prev">Previous</button>
        <button type="button" class="b-trash">${svgIcon('i-trash')}Trash</button>
        <button type="button" class="b-fav">${svgIcon('i-heart')}Favorite</button>
        <button type="button" class="b-next">${svgIcon('i-arrow-right')}Next</button>`;
      group.buttons.querySelector('.b-trash').addEventListener('click', () => demo.sendToTrash());
      group.buttons.querySelector('.b-fav').addEventListener('click', () => demo.toggleFavorite());
      group.buttons.querySelector('.b-next').addEventListener('click', () => demo.go(1));
      group.buttons.querySelector('.b-prev').addEventListener('click', () => demo.go(-1));
      demo.onRender = (finished) => {
        const moveFocus = finished && group.buttons.contains(document.activeElement);
        group.buttons.querySelectorAll('button').forEach((button) => {
          button.disabled = finished || (button.classList.contains('b-prev') && demo.index === 0);
        });
        if (moveFocus) demo.el.querySelector('[data-act="restart"]').focus({ preventScroll: true });
      };
      demo.onRender(false);
      group.controlsEl.append(group.buttons);
    }

    groups.push(group);
    setView(group, group.active, true);
    return group;
  }

  function setView(group, id, silent) {
    group.active = id;
    group.views.forEach(({ el }, key) => {
      const active = key === id;
      el.classList.toggle('active', active);
      el.inert = !active;
      el.setAttribute('aria-hidden', String(!active));
    });
    group.controlsEl.querySelectorAll('[role="tab"]').forEach((btn) => {
      btn.setAttribute('aria-selected', String(btn.dataset.view === id));
      btn.tabIndex = btn.dataset.view === id ? 0 : -1;
    });
    if (group.buttons) group.buttons.hidden = id !== 'try';
    updatePhoneState(group.phone);
    if (!silent) syncVideos();
  }

  function makePhone(extraClass) {
    const phone = document.createElement('div');
    phone.className = `phone ${extraClass || ''}`.trim();
    phone.dataset.phone = '';
    phone.innerHTML = `<div class="phone-screen"><div class="phone-island" aria-hidden="true"></div><button class="media-toggle" type="button" data-media-toggle aria-label="Pause video">${svgIcon('i-pause')}</button></div>`;
    return phone;
  }

  // Desktop stage: one phone that holds every chapter's screens.
  const stagePhone = document.querySelector('[data-stage-phone]');
  const stageControls = document.querySelector('[data-stage-controls]');
  const stageGroups = {};
  if (stagePhone && stageControls) {
    const screen = stagePhone.querySelector('.phone-screen');
    const toggle = screen.querySelector('[data-media-toggle]');
    CHAPTERS.forEach((chapter) => {
      const group = buildGroup(chapter, stagePhone);
      screen.insertBefore(group.groupEl, toggle);
      stageControls.append(group.controlsEl);
      stageGroups[chapter] = group;
    });
  }

  // Small screens: a phone inside each chapter.
  document.querySelectorAll('[data-inline-phone]').forEach((slot) => {
    const chapter = slot.dataset.inlinePhone;
    if (!SCREENS[chapter]) return;
    const phone = makePhone();
    const group = buildGroup(chapter, phone);
    group.groupEl.classList.add('active');
    group.controlsEl.classList.add('active');
    const screen = phone.querySelector('.phone-screen');
    screen.insertBefore(group.groupEl, screen.querySelector('[data-media-toggle]'));
    slot.append(phone, group.controlsEl);
    updatePhoneState(phone);
  });

  /* ------------------------------------------------------------ videos */
  const allVideos = () => document.querySelectorAll('video[data-autoplay]');

  function onScreen(el) {
    if (!el || el.offsetParent === null) return false;
    const rect = el.getBoundingClientRect();
    const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    return visible > Math.min(rect.height, window.innerHeight) * 0.25;
  }

  function activeVideoIn(phone) {
    let found = null;
    phone.querySelectorAll('video[data-autoplay]').forEach((video) => {
      const view = video.closest('.view');
      const group = video.closest('.screen-group');
      if (view && view.classList.contains('active') && (!group || group.classList.contains('active'))) found = video;
    });
    return found;
  }

  function updatePhoneState(phone) {
    if (!phone) return;
    const video = activeVideoIn(phone);
    phone.classList.toggle('has-video', Boolean(video));
    const paused = !video || video.paused;
    const toggle = phone.querySelector('[data-media-toggle]');
    if (toggle) {
      toggle.innerHTML = svgIcon(paused ? 'i-play' : 'i-pause');
      toggle.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    }
  }

  function shouldPlay(video) {
    const phone = video.closest('[data-phone]');
    if (!phone || video !== activeVideoIn(phone)) return false;
    if (phone.classList.contains('is-paused')) return false;
    if (reduceMotion.matches && phone.dataset.userPlay !== '1') return false;
    if (document.visibilityState === 'hidden') return false;
    return onScreen(phone);
  }

  function syncVideos() {
    allVideos().forEach((video) => {
      if (shouldPlay(video)) {
        if (video.paused) {
          const attempt = video.play();
          if (attempt && attempt.catch) attempt.catch(() => {});
        }
      } else if (!video.paused) {
        video.pause();
      }
    });
  }

  const phones = document.querySelectorAll('[data-phone]');
  phones.forEach((phone) => {
    if (reduceMotion.matches) phone.classList.add('is-paused');
    updatePhoneState(phone);
    const toggle = phone.querySelector('[data-media-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const video = activeVideoIn(phone);
        if (!video) return;
        const play = video.paused;
        phone.classList.toggle('is-paused', !play);
        if (play) phone.dataset.userPlay = '1';
        updatePhoneState(phone);
        syncVideos();
      });
    }
    phone.querySelectorAll('video[data-autoplay]').forEach((video) => {
      ['play', 'pause', 'error'].forEach((event) => {
        video.addEventListener(event, () => updatePhoneState(phone));
      });
    });
  });

  document.addEventListener('visibilitychange', syncVideos);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) phones.forEach((phone) => {
      phone.classList.add('is-paused');
      delete phone.dataset.userPlay;
    });
    syncVideos();
    phones.forEach(updatePhoneState);
  });

  /* ------------------------------------------------------------- tour */
  const chapters = document.querySelectorAll('[data-chapter]');
  const tabs = document.querySelectorAll('.tabbar [data-tab]');
  let activeChapter = null;

  function setChapter(name) {
    if (!name || name === activeChapter) return;
    activeChapter = name;
    chapters.forEach((el) => el.classList.toggle('is-active', el.dataset.chapter === name));
    Object.values(stageGroups).forEach((group) => {
      const on = group.chapter === name;
      group.groupEl.classList.toggle('active', on);
      group.controlsEl.classList.toggle('active', on);
      group.groupEl.inert = !on;
      group.controlsEl.inert = !on;
      group.groupEl.setAttribute('aria-hidden', String(!on));
      group.controlsEl.setAttribute('aria-hidden', String(!on));
    });
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.classList.toggle('active', on);
      if (on) tab.setAttribute('aria-current', 'true'); else tab.removeAttribute('aria-current');
    });
    updatePhoneState(stagePhone);
    syncVideos();
  }

  function chapterAtCenter() {
    const middle = window.innerHeight / 2;
    let found = null;
    chapters.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= middle && rect.bottom >= middle) found = el.dataset.chapter;
    });
    return found;
  }

  setChapter(CHAPTERS[0]);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setChapter(tab.dataset.tab));
  });

  /* ------------------------------------------------ one scroll handler */
  // Runs directly on scroll (a handful of rect reads), so it keeps working
  // where requestAnimationFrame is throttled.
  function update() {
    checkReveal();
    const current = chapterAtCenter();
    if (current) setChapter(current);
    syncVideos();
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  // Only enable reveal hiding once setup succeeded. A blocked/failed script
  // must never leave the marketing copy invisible.
  document.documentElement.classList.replace('no-js', 'js');
  update();
})();
