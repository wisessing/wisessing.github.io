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
        var tripBlock = table.closest('.trip-block');
        if (tripBlock && tripBlock.getAttribute('data-filter-hidden') === '1') return;
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

      // Hide .trip-block wrappers when all child .table-section are hidden,
      // but never touch blocks that are hidden by the trip filter.
      document.querySelectorAll('.trip-block').forEach(function (block) {
        if (block.getAttribute('data-filter-hidden') === '1') return;
        if (!terms.length) {
          block.style.display = '';
          return;
        }
        var children = block.querySelectorAll('.table-section');
        var anyVisible = Array.prototype.some.call(children, function (s) {
          return s.style.display !== 'none';
        });
        block.style.display = anyVisible ? '' : 'none';
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

  function setupTripFilters() {
    var container = document.querySelector('.trip-filters');
    if (!container) return;
    var blocks = document.querySelectorAll('.trip-block');
    if (!blocks.length) return;

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.day-btn');
      if (!btn) return;
      var trip = btn.getAttribute('data-trip');
      Array.prototype.forEach.call(container.querySelectorAll('.day-btn'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      Array.prototype.forEach.call(blocks, function (block) {
        var show = trip === 'all' || block.getAttribute('data-trip') === trip;
        block.style.display = show ? '' : 'none';
        block.setAttribute('data-filter-hidden', show ? '0' : '1');
      });
      // Re-run search so stats reflect only the visible trip's rows.
      var input = document.getElementById('search-input');
      if (input) input.dispatchEvent(new Event('input'));
      // Scroll to first visible trip block.
      if (trip !== 'all') {
        var first = document.querySelector('.trip-block:not([data-filter-hidden="1"])');
        if (first) {
          var top = first.getBoundingClientRect().top + window.pageYOffset - 140;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      }
    });
  }

  function todayDayKey() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    var map = {
      '426': '26apr', '427': '27apr', '428': '28apr', '429': '29apr',
      '430': '30apr', '501': '1may', '502': '2may', '503': '3may'
    };
    return map[String(m * 100 + day)] || null;
  }

  function applyDayFilter(container, blocks, day) {
    Array.prototype.forEach.call(container.querySelectorAll('.day-btn'), function (b) {
      var bDay = b.getAttribute('data-day');
      b.classList.toggle('active', bDay === day || (bDay === 'today' && day === todayDayKey()));
    });
    Array.prototype.forEach.call(blocks, function (block) {
      if (day === 'all' || block.getAttribute('data-day') === day) {
        block.classList.remove('hidden');
      } else {
        block.classList.add('hidden');
      }
    });
    if (day !== 'all') {
      var first = document.querySelector('.day-block:not(.hidden)');
      if (first) {
        var top = first.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }
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
      if (day === 'today') day = todayDayKey() || 'all';
      applyDayFilter(container, blocks, day);
    });

    // Auto-activate "วันนี้" if today is within the camp schedule
    var todayKey = todayDayKey();
    if (todayKey) {
      var todayBtn = container.querySelector('[data-day="today"]');
      if (todayBtn) todayBtn.classList.add('active');
      var allBtn = container.querySelector('[data-day="all"]');
      if (allBtn) allBtn.classList.remove('active');
      applyDayFilter(container, blocks, todayKey);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('search-input');
    var stats = document.getElementById('search-stats');
    if (input) setupTableSearch(input, stats);

    setupTripFilters();
    setupDayFilters();

    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('nav.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var opening = !nav.classList.contains('open');
        nav.classList.toggle('open');
        if (opening) {
          window.scrollTo(0, 0);
        }
      });
    }
  });
})();
