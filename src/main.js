/* ---------------------------------------------------------------
   The page's only script.

   The entrance animation itself lives in CSS and completes on its own,
   so the page is fully readable with JavaScript disabled or blocked.
   All this does is stage the delays, turning a simultaneous fade into
   one orchestrated load moment — which is presentation logic that would
   otherwise have to be inlined on every element.
---------------------------------------------------------------- */

(function () {
  'use strict';

  // start = delay of the first element in the group, step = gap between them.
  var GROUPS = {
    hero:   { start: 0.05, step: 0.08 },
    editor: { start: 0.30, step: 0 },
    code:   { start: 0.40, step: 0.06 },
  };

  var reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  Object.keys(GROUPS).forEach(function (name) {
    var group = GROUPS[name];
    var elements = document.querySelectorAll('[data-reveal="' + name + '"]');

    Array.prototype.forEach.call(elements, function (el, i) {
      el.style.animationDelay = (group.start + i * group.step).toFixed(2) + 's';
    });
  });
})();
