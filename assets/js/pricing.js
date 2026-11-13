/* SortGlass website: scheduled prices.
   The page lists the regular prices. Yearly is $24.99 from November 14,
   2026; before then this shows the price it replaces. During a scheduled
   Lifetime sale (the same dates as the App Store's price schedule, from
   midnight Pacific Time) this shows the sale price instead, with the
   regular price struck through, and a small pill names the sale on
   Lifetime and on the "Other purchase options" line, which stays closed. */
(function () {
  'use strict';

  var YEARLY = { from: '2026-11-14T00:00:00-08:00', price: '$24.99', before: '$49.99' };
  if (Date.now() < Date.parse(YEARLY.from)) {
    var plans = document.querySelectorAll('.plans .plan');
    for (var p = 0; p < plans.length; p++) {
      var label = plans[p].querySelector('.plan-name');
      if (!label || label.textContent.trim() !== 'Yearly') continue;
      var amount = plans[p].querySelector('.plan-price');
      if (amount && amount.firstChild && amount.firstChild.nodeType === 3) amount.firstChild.nodeValue = YEARLY.before;
      var terms = plans[p].querySelector('.plan-note');
      if (terms) terms.textContent = terms.textContent.split(YEARLY.price).join(YEARLY.before);
    }
  }

  var SALES = [
    { start: '2026-11-16T00:00:00-08:00', end: '2026-11-30T00:00:00-08:00', price: '$14.99', name: 'Black Friday Sale', note: 'Black Friday price through November 29.' },
    { start: '2026-12-21T00:00:00-08:00', end: '2027-01-01T00:00:00-08:00', price: '$14.99', name: 'Holiday Sale', note: 'Holiday price through December 31.' }
  ];

  var now = Date.now();
  var sale = null;
  for (var i = 0; i < SALES.length; i++) {
    if (now >= Date.parse(SALES[i].start) && now < Date.parse(SALES[i].end)) { sale = SALES[i]; break; }
  }
  if (!sale) return;

  var plan = document.querySelector('.plan-lifetime');
  if (!plan) return;
  var price = plan.querySelector('.plan-price');
  var note = plan.querySelector('.plan-note');
  var unit = price && price.querySelector('span');
  if (!price || !unit) return;

  var regular = price.firstChild && price.firstChild.nodeType === 3 ? price.firstChild.nodeValue.trim() : '';
  price.firstChild.nodeValue = sale.price;
  if (regular) {
    var was = document.createElement('s');
    was.className = 'plan-was';
    was.textContent = regular;
    was.setAttribute('aria-label', 'Regular price ' + regular);
    price.insertBefore(was, unit);
  }
  if (note) note.textContent = sale.note + ' One purchase. All of Pro. No subscription.';
  function pill(text) {
    var tag = document.createElement('span');
    tag.className = 'sale-pill';
    tag.textContent = text;
    return tag;
  }
  var name = plan.querySelector('.plan-name');
  if (name) name.appendChild(pill(sale.name));
  var summary = plan.closest('details') && plan.closest('details').querySelector('summary');
  if (summary) summary.insertBefore(pill(sale.name + ' · ' + sale.price), summary.querySelector('svg'));
})();
