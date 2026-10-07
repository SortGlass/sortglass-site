/* SortGlass Website V2 — progressive enhancement only.
   Everything on the site reads and works without this file.
   No cookies, no storage, no network requests of its own. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');


  /* ---------------- Navigation ---------------- */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var toggle = nav.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('nav-menu');
    var compact = window.matchMedia('(max-width: 860px)');

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (compact.matches) menu.hidden = !open;
    };

    var syncLayout = function () {
      if (compact.matches) {
        menu.hidden = toggle.getAttribute('aria-expanded') !== 'true';
      } else {
        setOpen(false);
        menu.hidden = false;
      }
    };

    if (toggle && menu) {
      syncLayout();
      compact.addEventListener('change', syncLayout);
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });
    }

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

})();
