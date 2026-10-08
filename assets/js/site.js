/* SortGlass Website V2: progressive enhancement only.
   Everything on the site reads and works without this file.
   No cookies, no storage, no network requests of its own. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  // Decorative Spectrum accents retain their phase while offscreen.
  // Without script or IntersectionObserver, they remain static.
  var motionAccents = document.querySelectorAll('.prism, .compare-pro, .one-beam');
  if (motionAccents.length && 'IntersectionObserver' in window) {
    var accentObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-motion-visible', entry.isIntersecting);
      });
    });
    motionAccents.forEach(function (accent) { accentObserver.observe(accent); });
    var syncVisibility = function () {
      root.classList.toggle('is-page-hidden', document.hidden);
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
  }

  /* ---------------- Navigation ---------------- */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var toggle = nav.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('nav-menu');
    var compact = window.matchMedia('(max-width: 1040px)');

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

  /* ---------------- Guide contents ---------------- */
  var guideToc = document.querySelector('[data-guide-toc]');
  if (guideToc) {
    var guideSections = [];
    guideToc.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) guideSections.push({ link: link, section: section });
    });

    if (guideSections.length) {
      var activeGuideLink = null;
      var guideTicking = false;
      var updateGuideSection = function () {
        guideTicking = false;
        // Match native anchor landing positions, including the sticky header.
        var offset = parseFloat(window.getComputedStyle(root).scrollPaddingTop);
        if (!Number.isFinite(offset)) offset = (nav ? nav.getBoundingClientRect().height : 0) + 16;
        var current = guideSections[0];
        guideSections.forEach(function (entry) {
          if (entry.section.getBoundingClientRect().top <= offset + 1) current = entry;
        });
        // The final section may be too short to reach the header at page end.
        if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
          current = guideSections[guideSections.length - 1];
        }
        if (current.link === activeGuideLink) return;
        guideSections.forEach(function (entry) {
          if (entry === current) entry.link.setAttribute('aria-current', 'location');
          else entry.link.removeAttribute('aria-current');
        });
        activeGuideLink = current.link;
      };
      var scheduleGuideUpdate = function () {
        if (guideTicking) return;
        guideTicking = true;
        window.requestAnimationFrame(updateGuideSection);
      };

      updateGuideSection();
      window.addEventListener('scroll', scheduleGuideUpdate, { passive: true });
      window.addEventListener('resize', scheduleGuideUpdate);
      window.addEventListener('pageshow', scheduleGuideUpdate);
      window.addEventListener('hashchange', scheduleGuideUpdate);
      window.addEventListener('load', scheduleGuideUpdate);
      if ('ResizeObserver' in window) {
        var guideResizeObserver = new ResizeObserver(scheduleGuideUpdate);
        var guideContent = document.querySelector('.doc');
        if (guideContent) guideResizeObserver.observe(guideContent);
        if (nav) guideResizeObserver.observe(nav);
      }
    }
  }

})();
