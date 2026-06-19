/* RoadSafe India — Theme Engine v2
   Loads FIRST in <head> to prevent flash.
   Default = dark. Persists via localStorage key: rs_theme */
(function () {
  var KEY = 'rs_theme';
  var DEFAULT = 'dark';

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    // Update toggle button label + icon span
    var label = document.getElementById('themeLabel');
    var icon  = document.getElementById('themeIcon');
    if (label) label.textContent = (theme === 'dark') ? 'Light' : 'Dark';
    if (icon)  icon.textContent  = (theme === 'dark') ? '☀️' : '🌙';
    // Update Chart.js if loaded
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color       = (theme === 'dark') ? '#94a3b8' : '#475569';
      Chart.defaults.borderColor = (theme === 'dark') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
    }
  }

  function toggle() {
    var cur = document.documentElement.getAttribute('data-theme') || DEFAULT;
    apply(cur === 'dark' ? 'light' : 'dark');
  }

  // Validate saved value — only accept 'dark' or 'light'
  var saved = localStorage.getItem(KEY);
  if (saved !== 'dark' && saved !== 'light') saved = DEFAULT;
  apply(saved);

  // Re-sync label after DOM ready (button may not exist yet at parse time)
  document.addEventListener('DOMContentLoaded', function () {
    var cur = document.documentElement.getAttribute('data-theme') || DEFAULT;
    apply(cur);
  });

  window.toggleTheme = toggle;
  window.applyTheme  = apply;
})();
