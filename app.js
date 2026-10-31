/* RPG Quest Log — plain JavaScript, no build step. */
(function () {
  'use strict';

  var DATA_URL = 'enix_square_enix_rpgs.json';
  var STORE_KEY = 'rpgql-log-v1';

  var STATUSES = [
    { id: 'want', label: 'Want to play' },
    { id: 'playing', label: 'Playing' },
    { id: 'finished', label: 'Finished' },
    { id: 'dropped', label: 'Dropped' }
  ];
  var STATUS_LABEL = { '': 'Not tracked' };
  STATUSES.forEach(function (st) { STATUS_LABEL[st.id] = st.label; });

  // Short names for card meta lines.
  var PLATFORM_SHORT = {
    'Windows': 'PC',
    'PlayStation': 'PS1',
    'PlayStation 2': 'PS2',
    'PlayStation 3': 'PS3',
    'PlayStation 4': 'PS4',
    'PlayStation 5': 'PS5',
    'PlayStation Portable': 'PSP',
    'PlayStation Vita': 'Vita',
    'PlayStation Mobile': 'PS Mobile',
    'Nintendo Switch': 'Switch',
    'Nintendo Switch 2': 'Switch 2',
    'Nintendo DS': 'DS',
    'Nintendo 3DS': '3DS',
    'Nintendo Entertainment System': 'NES',
    'Super Nintendo Entertainment System': 'SNES',
    'Game Boy': 'GB',
    'Game Boy Color': 'GBC',
    'Game Boy Advance': 'GBA',
    'Xbox Series X/S': 'Xbox Series',
    'Xbox One': 'Xbox One',
    'Xbox 360': 'X360',
    'NEC PC-8801 FH': 'PC-88',
    'Web browser': 'Browser',
    'Mobile phones': 'Mobile'
  };
  // Merge duplicate platform spellings from the source lists.
  var PLATFORM_ALIAS = { 'Microsoft Windows': 'Windows' };

  var REGION_NAMES = { jp: 'JP', na: 'NA', pal: 'PAL' };
  var REGION_TEXT = {
    enix: 'Enix',
    square_enix: 'Square Enix',
    other_publisher: 'Other publisher',
    not_released: 'Not released'
  };

  var state = {
    games: [],
    byId: {},
    meta: null,
    log: {},          // id -> { status, rating, platform, started, finished, hours, notes, updated }
    tab: 'all',
    filters: defaultFilters()
  };

  function defaultFilters() {
    return {
      search: '',
      series: '',
      platform: '',
      publisher: '',
      type: '',
      sort: 'year-asc',
      english: false,
      hideUpcoming: false
    };
  }

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function normPlatform(p) { return PLATFORM_ALIAS[p] || p; }
  function shortPlatform(p) { return PLATFORM_SHORT[p] || p; }

  function uniq(list) {
    var seen = {};
    return list.filter(function (x) {
      if (seen[x]) return false;
      seen[x] = true;
      return true;
    });
  }

  function yearLabel(g) {
    if (g.upcoming) return g.release_label || 'TBA';
    return g.first_release_year ? String(g.first_release_year) : '—';
  }

  // Strip accents so "Ryu" matches "Ryū" and similar.
  function fold(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // ---------- personal log (localStorage) ----------
  function loadLog() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.games && typeof parsed.games === 'object') return parsed.games;
    } catch (e) { /* unavailable or corrupt: start empty */ }
    return {};
  }

  function saveLog() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, games: state.log }));
    } catch (e) { /* private mode or quota: keep working in memory */ }
  }

  function entry(id) { return state.log[id] || {}; }

  // Merge changes into a game's log entry; drop entries that hold nothing.
  function updateEntry(id, changes) {
    var g = state.byId[id];
    var next = Object.assign({}, state.log[id], changes);
    if (g && g.upcoming) {
      // Upcoming games can only be wish-listed.
      if (next.status && next.status !== 'want') next.status = 'want';
      delete next.rating;
    }
    Object.keys(next).forEach(function (k) {
      if (next[k] === '' || next[k] == null || next[k] === 0) delete next[k];
    });
    delete next.updated;
    if (Object.keys(next).length) {
      next.updated = new Date().toISOString();
      state.log[id] = next;
    } else {
      delete state.log[id];
    }
    saveLog();
  }

  function statusOf(g) { return entry(g.id).status || ''; }

  // ---------- data ----------
  function prepare(data) {
    state.meta = data.meta;
    state.games = data.games.map(function (g, i) {
      g.platforms = uniq((g.platforms || []).map(normPlatform));
      g._order = i;
      g._search = fold([g.title, g.japanese_title, g.romanized_title, g.series,
        (g.genres || []).join(' ')].join(' '));
      state.byId[g.id] = g;
      return g;
    });
  }

  // ---------- filters ----------
  function buildFilterOptions() {
    var seriesCount = {};
    var platformCount = {};
    state.games.forEach(function (g) {
      if (g.series) seriesCount[g.series] = (seriesCount[g.series] || 0) + 1;
      g.platforms.forEach(function (p) { platformCount[p] = (platformCount[p] || 0) + 1; });
    });
    fillSelect($('f-series'), Object.keys(seriesCount).sort(), seriesCount);
    fillSelect($('f-platform'), Object.keys(platformCount).sort(function (a, b) {
      return platformCount[b] - platformCount[a] || a.localeCompare(b);
    }), platformCount);
  }

  function fillSelect(select, values, counts) {
    values.forEach(function (v) {
      select.appendChild(el('option', { value: v, text: v + ' (' + counts[v] + ')' }));
    });
  }

  function matches(g, f) {
    if (state.tab !== 'all' && statusOf(g) !== (state.tab === 'untracked' ? '' : state.tab)) return false;
    if (f.search && g._search.indexOf(fold(f.search)) === -1) return false;
    if (f.series && g.series !== f.series) return false;
    if (f.platform && g.platforms.indexOf(f.platform) === -1) return false;
    if (f.publisher && g.publishers.indexOf(f.publisher) === -1) return false;
    if (f.type && g.rpg !== f.type) return false;
    if (f.english && !g.released_in_english) return false;
    if (f.hideUpcoming && g.upcoming) return false;
    return true;
  }

  function sortGames(list, sort) {
    var byYear = function (a, b) {
      var ya = a.first_release_year || 9999;
      var yb = b.first_release_year || 9999;
      return ya - yb || a._order - b._order;
    };
    var cmp = {
      'year-asc': byYear,
      'year-desc': function (a, b) { return byYear(b, a); },
      'title': function (a, b) { return a.title.localeCompare(b.title); },
      'rating': function (a, b) {
        return (entry(b.id).rating || 0) - (entry(a.id).rating || 0) || byYear(a, b);
      },
      'updated': function (a, b) {
        var ua = entry(a.id).updated || '';
        var ub = entry(b.id).updated || '';
        return ub < ua ? -1 : ub > ua ? 1 : byYear(a, b);
      }
    }[sort] || byYear;
    return list.slice().sort(cmp);
  }

  function visibleGames() {
    var f = state.filters;
    return sortGames(state.games.filter(function (g) { return matches(g, f); }), f.sort);
  }

  // ---------- rendering ----------
  function render() {
    renderStats();
    renderTabs();
    var list = visibleGames();
    var grid = $('grid');
    grid.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (g) { frag.appendChild(renderCard(g)); });
    grid.appendChild(frag);
    $('empty').hidden = list.length > 0;
    $('result-count').textContent = list.length + ' of ' + state.games.length + ' games';
  }

  function renderCard(g) {
    var platforms = g.platforms.slice(0, 4).map(shortPlatform).join(' · ');
    if (g.platforms.length > 4) platforms += ' +' + (g.platforms.length - 4);

    var badges = [];
    if (g.series) badges.push(el('span', { class: 'badge series', text: g.series }));
    if (g.rpg === 'hybrid') badges.push(el('span', { class: 'badge', text: 'Hybrid' }));
    if (!g.released_in_english && !g.upcoming) badges.push(el('span', { class: 'badge warn', text: 'Japan only' }));

    var open = function () { openDetail(g.id); };

    return el('article', { class: 'card', 'data-id': g.id }, [
      el('button', { type: 'button', class: 'cover-btn', 'aria-label': 'Details for ' + g.title, onclick: open }, [
        el('img', { class: 'cover', src: window.PixelCover.url(g), alt: '', width: '40', height: '25', loading: 'lazy' }),
        g.upcoming ? el('span', { class: 'cover-flag', text: 'UPCOMING' }) : null
      ]),
      el('div', { class: 'card-body' }, [
        el('h2', { class: 'card-title' }, [el('button', { type: 'button', onclick: open, text: g.title })]),
        el('div', { class: 'meta', text: platforms ? yearLabel(g) + ' — ' + platforms : yearLabel(g) }),
        el('div', { class: 'badges' }, badges),
        el('div', { class: 'card-controls' }, [
          statusSelect(g, 'status-select'),
          g.upcoming ? el('span', { class: 'meta', text: 'Not out yet' }) : stars(g)
        ])
      ])
    ]);
  }

  function statusSelect(g, cls) {
    var current = statusOf(g);
    var options = g.upcoming ? [{ id: 'want', label: 'Want to play' }] : STATUSES;
    var select = el('select', {
      class: cls,
      'data-status': current,
      'aria-label': 'Status for ' + g.title
    }, [el('option', { value: '', text: 'Not tracked' })].concat(options.map(function (st) {
      return el('option', { value: st.id, text: st.label });
    })));
    select.value = current;
    select.addEventListener('change', function () {
      var changes = { status: select.value };
      var e = entry(g.id);
      var today = new Date().toISOString().slice(0, 10);
      if (select.value === 'playing' && !e.started) changes.started = today;
      if (select.value === 'finished' && !e.finished) changes.finished = today;
      updateEntry(g.id, changes);
      select.setAttribute('data-status', select.value);
      refreshAfterChange(g.id);
    });
    return select;
  }

  function stars(g) {
    var rating = entry(g.id).rating || 0;
    var wrap = el('div', { class: 'stars', role: 'radiogroup', 'aria-label': 'Rate ' + g.title });
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        wrap.appendChild(el('button', {
          type: 'button',
          class: 'star' + (n <= rating ? ' on' : ''),
          role: 'radio',
          'aria-checked': n === rating ? 'true' : 'false',
          'aria-label': n + ' star' + (n > 1 ? 's' : ''),
          title: n === rating ? 'Clear rating' : n + ' / 5',
          text: '★',
          onclick: function () {
            // Clicking the current rating again clears it.
            updateEntry(g.id, { rating: n === (entry(g.id).rating || 0) ? 0 : n });
            refreshAfterChange(g.id);
          }
        }));
      })(i);
    }
    return wrap;
  }

  // Re-render without losing the user's place in the grid or focus in a control.
  var FOCUSABLE = 'button, select, input, textarea';
  function focusPath() {
    var a = document.activeElement;
    if (!a || !a.closest) return null;
    var panel = a.closest('#log-panel');
    if (panel) return { panel: true, index: [].indexOf.call(panel.querySelectorAll(FOCUSABLE), a) };
    var card = a.closest('.card');
    if (card) return { id: card.getAttribute('data-id'), index: [].indexOf.call(card.querySelectorAll(FOCUSABLE), a) };
    return null;
  }

  function restoreFocus(path) {
    if (!path || path.index < 0) return;
    var host = path.panel ? $('log-panel') :
      document.querySelector('.card[data-id="' + CSS.escape(path.id) + '"]');
    var target = host && host.querySelectorAll(FOCUSABLE)[path.index];
    if (target) target.focus({ preventScroll: true });
  }

  function refreshAfterChange(id) {
    var dlg = $('detail');
    var scrollY = window.scrollY;
    var path = focusPath();
    render();
    window.scrollTo(0, scrollY);
    if (dlg.open && dlg.getAttribute('data-id') === id) renderLogPanel(state.byId[id]);
    restoreFocus(path);
  }

  // ---------- stats & tabs ----------
  function counts() {
    var c = { all: state.games.length, untracked: 0, want: 0, playing: 0, finished: 0, dropped: 0 };
    state.games.forEach(function (g) { c[statusOf(g) || 'untracked']++; });
    return c;
  }

  function renderTabs() {
    var c = counts();
    var tabs = [{ id: 'all', label: 'All' }].concat(STATUSES, [{ id: 'untracked', label: 'Not tracked' }]);
    var host = $('status-tabs');
    host.textContent = '';
    tabs.forEach(function (t) {
      host.appendChild(el('button', {
        type: 'button',
        class: 'tab',
        role: 'tab',
        'aria-selected': state.tab === t.id ? 'true' : 'false',
        onclick: function () { state.tab = t.id; render(); }
      }, [t.label, el('span', { class: 'count', text: String(c[t.id]) })]));
    });
  }

  function renderStats() {
    var c = counts();
    var released = state.games.filter(function (g) { return !g.upcoming; }).length;
    var ratings = Object.keys(state.log).map(function (id) { return state.log[id].rating; }).filter(Boolean);
    var avg = ratings.length ? (ratings.reduce(function (a, b) { return a + b; }, 0) / ratings.length).toFixed(1) : '—';
    var hours = Object.keys(state.log).reduce(function (sum, id) { return sum + (Number(state.log[id].hours) || 0); }, 0);
    var pct = released ? Math.round(c.finished / released * 100) : 0;

    var host = $('stats');
    host.textContent = '';
    var stat = function (num, lbl, color) {
      return el('div', { class: 'stat' }, [
        el('div', { class: 'num', text: String(num), style: color ? 'color: var(--' + color + ')' : null }),
        el('div', { class: 'lbl', text: lbl })
      ]);
    };
    host.appendChild(stat(c.finished, 'Finished', 'finished'));
    host.appendChild(stat(c.playing, 'Playing', 'playing'));
    host.appendChild(stat(c.want, 'Want to play', 'want'));
    host.appendChild(stat(c.dropped, 'Dropped', 'dropped'));
    host.appendChild(stat(avg, 'Average rating'));
    host.appendChild(stat(hours ? Math.round(hours) : 0, 'Hours logged'));

    var bar = el('div', { class: 'progress', role: 'img',
      'aria-label': c.finished + ' finished, ' + c.playing + ' playing, ' + c.dropped + ' dropped of ' + released + ' released games' });
    ['finished', 'playing', 'dropped'].forEach(function (k) {
      if (c[k]) bar.appendChild(el('span', { style: 'width:' + (c[k] / released * 100) + '%; background: var(--' + k + ')' }));
    });
    host.appendChild(el('div', { class: 'stat progress-stat' }, [
      el('div', { class: 'lbl', text: 'Completion: ' + c.finished + ' of ' + released + ' released games finished (' + pct + '%)' }),
      bar
    ]));
  }

  // ---------- detail dialog ----------
  function openDetail(id) {
    var g = state.byId[id];
    if (!g) return;
    var body = $('detail-body');
    body.textContent = '';

    var jp = [g.japanese_title, g.romanized_title].filter(Boolean).join(' · ');

    var facts = el('dl', { class: 'facts' });
    addFact(facts, 'First release', g.upcoming ? (g.release_label || 'TBA') + ' (upcoming)' : yearLabel(g));
    addFact(facts, 'Type', g.rpg === 'hybrid' ? 'RPG hybrid' : 'RPG');
    addFact(facts, 'Genres', (g.genres || []).join(', '));
    addFact(facts, 'Series', g.series);
    addFact(facts, 'Publishers', g.publishers.join(', '));
    addFact(facts, 'Platforms', g.platforms.join(', '));
    addFact(facts, 'In English', g.released_in_english ? 'Yes' : 'No');

    body.appendChild(el('img', { class: 'detail-cover', src: window.PixelCover.url(g, 80), alt: '', width: '80', height: '25' }));
    body.appendChild(el('div', { class: 'detail-head' }, [
      el('div', null, [
        el('h2', { id: 'detail-title', text: g.title }),
        jp ? el('p', { class: 'jp', text: jp }) : null
      ]),
      el('button', { type: 'button', class: 'btn ghost small close-btn', onclick: closeDetail, text: 'Close' })
    ]));

    body.appendChild(el('div', { class: 'detail-section log-panel', id: 'log-panel' }));

    body.appendChild(el('div', { class: 'detail-section' }, [
      el('h3', { text: 'About' }),
      el('p', { text: g.description }),
      g.notes ? el('p', { class: 'meta', text: g.notes }) : null,
      el('h3', { text: 'Facts' }),
      facts,
      el('h3', { text: 'Releases' }),
      renderReleases(g),
      renderSources(g)
    ]));

    renderLogPanel(g);

    var dlg = $('detail');
    dlg.setAttribute('data-id', g.id);
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
    dlg.scrollTop = 0;
  }

  function closeDetail() {
    var dlg = $('detail');
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  // "My log" form inside the details dialog.
  function renderLogPanel(g) {
    var host = $('log-panel');
    if (!host) return;
    host.textContent = '';
    var e = entry(g.id);
    host.appendChild(el('h3', { text: 'My log' }));

    if (g.upcoming) {
      host.appendChild(el('div', { class: 'log-grid' }, [
        el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Status' }), statusSelect(g, 'status-select')]),
        notesField(g, e)
      ]));
      host.appendChild(el('p', { class: 'meta', text: 'This game is not out yet, so it can be wish-listed but not rated.' }));
      return;
    }

    var platform = el('select', { 'aria-label': 'Platform played' },
      [el('option', { value: '', text: '—' })].concat(g.platforms.map(function (p) {
        return el('option', { value: p, text: p });
      })));
    platform.value = e.platform || '';
    platform.addEventListener('change', function () { updateEntry(g.id, { platform: platform.value }); refreshAfterChange(g.id); });

    var dateInput = function (key) {
      var input = el('input', { type: 'date', value: e[key] || '' });
      input.addEventListener('change', function () {
        var c = {};
        c[key] = input.value;
        updateEntry(g.id, c);
        refreshAfterChange(g.id);
      });
      return input;
    };

    var hours = el('input', { type: 'number', min: '0', step: '0.5', inputmode: 'decimal', value: e.hours || '' });
    hours.addEventListener('change', function () {
      var v = parseFloat(hours.value);
      updateEntry(g.id, { hours: isFinite(v) && v > 0 ? v : 0 });
      refreshAfterChange(g.id);
    });

    host.appendChild(el('div', { class: 'log-grid' }, [
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Status' }), statusSelect(g, 'status-select')]),
      el('div', { class: 'field' }, [el('span', { class: 'label', text: 'Rating' }), stars(g)]),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Platform played' }), platform]),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Hours' }), hours]),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Started' }), dateInput('started')]),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Finished' }), dateInput('finished')]),
      notesField(g, e)
    ]));
  }

  function notesField(g, e) {
    var notes = el('textarea', { rows: '3', placeholder: 'Party, progress, thoughts…' });
    notes.value = e.notes || '';
    // Save while typing, without re-rendering (keeps the cursor in place).
    var timer;
    notes.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { updateEntry(g.id, { notes: notes.value }); }, 300);
    });
    notes.addEventListener('change', function () {
      clearTimeout(timer);
      updateEntry(g.id, { notes: notes.value });
      refreshAfterChange(g.id);
    });
    return el('label', { class: 'field wide' }, [el('span', { class: 'label', text: 'Notes' }), notes]);
  }

  function addFact(dl, label, value) {
    if (!value) return;
    dl.appendChild(el('dt', { text: label }));
    dl.appendChild(el('dd', { text: value }));
  }

  function renderReleases(g) {
    var rows = g.releases.map(function (r) {
      var regions = el('td');
      if (r.regions) {
        Object.keys(REGION_NAMES).forEach(function (k) {
          var v = r.regions[k];
          if (!v) return;
          var cls = v === 'not_released' ? 'no' : v === 'other_publisher' ? 'other' : 'yes';
          regions.appendChild(el('span', {
            class: 'region ' + cls,
            title: REGION_NAMES[k] + ': ' + (REGION_TEXT[v] || v),
            text: REGION_NAMES[k]
          }));
        });
      } else {
        regions.textContent = '—';
      }
      var tags = [];
      if (r.original_release) tags.push('original');
      if (r.remake_or_port) tags.push('remake/port');
      if (r.upcoming) tags.push('upcoming');
      var date = r.upcoming && r.release_label ? r.release_label : (r.release_date || r.year || '—');
      if (r.year_inferred) date += ' (approx.)';
      return el('tr', null, [
        el('td', null, [
          el('div', { text: r.listed_title || g.title }),
          tags.length ? el('div', { class: 'meta', text: tags.join(', ') }) : null
        ]),
        el('td', { text: String(date) }),
        el('td', { text: uniq((r.platforms || []).map(normPlatform)).join(', ') }),
        el('td', { text: [r.developer, r.publisher].filter(Boolean).join(' / ') || '—' }),
        regions
      ]);
    });
    return el('div', { class: 'table-scroll' }, [
      el('table', { class: 'releases' }, [
        el('thead', null, [el('tr', null, ['Title', 'Date', 'Platforms', 'Developer / publisher', 'Regions'].map(function (h) {
          return el('th', { scope: 'col', text: h });
        }))]),
        el('tbody', null, rows)
      ])
    ]);
  }

  function renderSources(g) {
    if (!g.sources || !g.sources.length) return null;
    var p = el('p', { class: 'meta' }, ['Source: ']);
    g.sources.forEach(function (s, i) {
      if (i) p.appendChild(document.createTextNode(', '));
      p.appendChild(el('a', { href: s, target: '_blank', rel: 'noopener', text: s.replace(/^https?:\/\/(en\.)?/, '') }));
    });
    return p;
  }

  // ---------- events ----------
  function bindFilters() {
    var f = state.filters;
    var bind = function (id, key, prop, evt) {
      $(id).addEventListener(evt || 'change', function (e) {
        f[key] = e.target[prop || 'value'];
        render();
      });
    };
    bind('f-search', 'search', 'value', 'input');
    bind('f-series', 'series');
    bind('f-platform', 'platform');
    bind('f-publisher', 'publisher');
    bind('f-type', 'type');
    bind('f-sort', 'sort');
    bind('f-english', 'english', 'checked');
    bind('f-hide-upcoming', 'hideUpcoming', 'checked');

    $('f-reset').addEventListener('click', function () {
      state.filters = f = Object.assign(defaultFilters(), { sort: f.sort });
      syncFilterInputs();
      render();
    });

    $('detail').addEventListener('click', function (e) {
      // Click on the backdrop closes the dialog.
      if (e.target === e.currentTarget) closeDetail();
    });
  }

  function syncFilterInputs() {
    var f = state.filters;
    $('f-search').value = f.search;
    $('f-series').value = f.series;
    $('f-platform').value = f.platform;
    $('f-publisher').value = f.publisher;
    $('f-type').value = f.type;
    $('f-sort').value = f.sort;
    $('f-english').checked = f.english;
    $('f-hide-upcoming').checked = f.hideUpcoming;
  }

  // ---------- theme ----------
  function initTheme() {
    var root = document.documentElement;
    var saved = null;
    try { saved = localStorage.getItem('rpgql-theme'); } catch (e) { /* storage unavailable */ }
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    $('theme-toggle').addEventListener('click', function () {
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('rpgql-theme', next); } catch (e) { /* ignore */ }
    });
  }

  // ---------- boot ----------
  function showError(err) {
    var grid = $('grid');
    grid.textContent = '';
    var box = el('div', { class: 'error-box' }, [
      el('p', { text: 'Could not load the game list (' + (err && err.message ? err.message : err) + ').' }),
      el('p', null, [
        'If you opened this file directly from disk, serve the folder instead, for example with ',
        el('code', { text: 'python3 -m http.server' }),
        ', then visit ',
        el('code', { text: 'http://localhost:8000' }),
        '.'
      ])
    ]);
    grid.appendChild(box);
  }

  function boot() {
    initTheme();
    $('grid').appendChild(el('div', { class: 'loading', text: 'Loading games…' }));
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        prepare(data);
        state.log = loadLog();
        buildFilterOptions();
        bindFilters();
        var r = state.meta.retrieved || {};
        $('data-note').textContent = state.games.length + ' games from Wikipedia’s Enix and Square Enix game lists' +
          (r.square_enix ? ' (retrieved ' + r.square_enix + ').' : '.');
        render();
      })
      .catch(showError);
  }

  boot();
})();
