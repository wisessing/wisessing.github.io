(function () {
  'use strict';

  function normalize(s) {
    return (s || '').toString().toLowerCase().trim();
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(cell, terms) {
    var original = cell.getAttribute('data-original');
    if (original === null) {
      original = cell.innerHTML;
      cell.setAttribute('data-original', original);
    }
    if (!terms.length) {
      cell.innerHTML = original;
      return;
    }
    var html = original;
    terms.forEach(function (t) {
      if (!t) return;
      var rx = new RegExp('(' + escapeRegExp(t) + ')', 'gi');
      html = html.replace(rx, '<mark>$1</mark>');
    });
    cell.innerHTML = html;
  }

  function setupTableSearch(input, statsEl) {
    var tables = document.querySelectorAll('table[data-searchable]');
    if (!tables.length) return;

    function run() {
      var raw = normalize(input.value);
      var terms = raw.split(/\s+/).filter(Boolean);
      var totalShown = 0;
      var totalRows = 0;

      tables.forEach(function (table) {
        var bodyRows = table.tBodies[0] ? table.tBodies[0].rows : table.rows;
        var section = table.closest('.table-section');
        var visibleInSection = 0;

        Array.prototype.forEach.call(bodyRows, function (row) {
          if (row.classList.contains('section-header-row')) return;
          totalRows++;
          var rowText = normalize(row.textContent);
          var match = terms.every(function (t) {
            return rowText.indexOf(t) !== -1;
          });
          if (match) {
            row.classList.remove('hidden');
            visibleInSection++;
            totalShown++;
            Array.prototype.forEach.call(row.cells, function (c) {
              highlight(c, terms);
            });
          } else {
            row.classList.add('hidden');
          }
        });

        if (section) {
          if (visibleInSection === 0 && terms.length) {
            section.style.display = 'none';
          } else {
            section.style.display = '';
          }
        }
      });

      if (statsEl) {
        if (terms.length) {
          statsEl.textContent = 'พบ ' + totalShown + ' จาก ' + totalRows + ' รายการ';
        } else {
          statsEl.textContent = 'ทั้งหมด ' + totalRows + ' รายการ';
        }
      }
    }

    input.addEventListener('input', run);
    run();
  }

  function setupDayFilters() {
    var container = document.querySelector('.day-filters');
    if (!container) return;
    var blocks = document.querySelectorAll('.day-block');
    if (!blocks.length) return;

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.day-btn');
      if (!btn) return;
      var day = btn.getAttribute('data-day');
      Array.prototype.forEach.call(container.querySelectorAll('.day-btn'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      Array.prototype.forEach.call(blocks, function (block) {
        if (day === 'all' || block.getAttribute('data-day') === day) {
          block.classList.remove('hidden');
        } else {
          block.classList.add('hidden');
        }
      });
      // Smooth scroll to first visible block on small screens, except for "all"
      if (day !== 'all') {
        var first = document.querySelector('.day-block:not(.hidden)');
        if (first) {
          var top = first.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('search-input');
    var stats = document.getElementById('search-stats');
    if (input) setupTableSearch(input, stats);

    setupDayFilters();

    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('nav.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('open');
      });
    }
  });
})();
