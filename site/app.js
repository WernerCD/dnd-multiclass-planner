(function () {
  'use strict';
  var D = window.PLANNER_DATA, E = window.PlannerEngine;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sgn(n) { return (n >= 0 ? '+' : '') + n; }
  var ORD = E.ORD, ABIL = E.ABIL, ABIL_NAME = E.ABIL_NAME;

  var state, presetId = '';
  var narrowMq = window.matchMedia ? matchMedia('(max-width: 520px)') : null;

  function presetState(p) {
    return { ed: p.ed, levels: E.decodeLevels(D, p.lv), ab: p.ab.slice(), sub: Object.assign({}, p.sub), boon: p.boon || '', name: p.name, show: 20 };
  }
  function clampAb(v) { v = parseInt(v, 10); return isNaN(v) ? 10 : Math.max(1, Math.min(30, v)); }
  function normalize(s) {
    var o = {
      ed: s.ed === '2024' ? '2024' : '2014',
      levels: Array.isArray(s.levels) && s.levels.length === 20 && s.levels.every(function (x) { return D.CLASSES[x]; }) ? s.levels.slice() : E.decodeLevels(D, ''),
      ab: (Array.isArray(s.ab) && s.ab.length === 6 ? s.ab : [10, 10, 10, 10, 10, 10]).map(clampAb),
      sub: {}, boon: '', name: String(s.name || '').slice(0, 60), show: Math.max(1, Math.min(20, parseInt(s.show, 10) || 20))
    };
    D.CLASS_ORDER.forEach(function (id) { if (s.sub && E.findSub(D, id, o.ed, s.sub[id])) o.sub[id] = s.sub[id]; });
    if (D.PACT_BOONS.some(function (b) { return b.id === s.boon; })) o.boon = s.boon;
    return o;
  }

  // ---------- URL ----------
  function toQuery(s) {
    var p = new URLSearchParams();
    p.set('ed', s.ed);
    p.set('lv', E.encodeLevels(D, s.levels));
    p.set('ab', s.ab.join('.'));
    var sub = Object.keys(s.sub).map(function (id) { return D.CLASSES[id].code + '.' + s.sub[id]; });
    if (sub.length) p.set('sub', sub.join(','));
    if (s.boon) p.set('boon', s.boon);
    if (s.name) p.set('n', s.name);
    if (s.show !== 20) p.set('at', s.show);
    return '?' + p.toString();
  }
  function fromQuery(q) {
    var p = new URLSearchParams(q);
    if (!p.get('lv')) return null;
    var codes = {}; D.CLASS_ORDER.forEach(function (id) { codes[D.CLASSES[id].code] = id; });
    var sub = {};
    (p.get('sub') || '').split(',').forEach(function (t) { var i = t.indexOf('.'); if (i > 0 && codes[t.slice(0, i)]) sub[codes[t.slice(0, i)]] = t.slice(i + 1); });
    return normalize({ ed: p.get('ed'), levels: E.decodeLevels(D, p.get('lv')), ab: (p.get('ab') || '').split('.'), sub: sub, boon: p.get('boon'), name: p.get('n'), show: p.get('at') });
  }
  function syncUrl() {
    try { history.replaceState(null, '', location.pathname + toQuery(state)); } catch (e) { /* file:// or sandbox */ }
    store.set('mcp.current', state);
  }

  // ---------- render ----------
  function render() {
    var r = E.compute(D, state);
    renderControls();
    renderAbilities(r);
    renderSubs(r);
    renderLevels(r);
    renderSummary(r);
    renderMilestones(r);
    renderCombine(r);
    renderTable(r);
    syncUrl();
  }

  function renderControls() {
    document.querySelectorAll('[data-ed]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.ed === state.ed)); });
    if (document.activeElement !== $('bName')) $('bName').value = state.name;
    $('notes2024').classList.toggle('dim', state.ed !== '2024');
    var p = D.PRESETS.filter(function (x) { return x.id === presetId; })[0];
    var bl = $('presetBlurb');
    if (p) { bl.hidden = false; bl.className = 'preset-blurb' + (p.exploit ? ' exploit' : ''); bl.innerHTML = '<b>' + esc(p.name) + ' (' + p.ed + ' rules' + (p.exploit ? ', exploit' : '') + ').</b> ' + esc(p.blurb); }
    else bl.hidden = true;
  }

  function renderAbilities(r) {
    var bad = {};
    var need = {};
    if (r.used.length > 1) r.used.forEach(function (id) { var pre = D.CLASSES[id].prereq; Object.keys(pre).forEach(function (a) { need[a] = Math.max(need[a] || 0, pre[a]); }); });
    ABIL.forEach(function (a, i) { if (need[a] && state.ab[i] < need[a]) bad[a] = true; });
    var wrap = $('abil');
    if (!wrap.children.length) {
      wrap.innerHTML = ABIL.map(function (a, i) {
        return '<div class="ab" id="ab-' + a + '"><label for="in-' + a + '">' + ABIL_NAME[a] + '</label>' +
          '<input type="number" inputmode="numeric" min="1" max="30" id="in-' + a + '" data-ab="' + i + '"><span class="m"></span></div>';
      }).join('');
    }
    ABIL.forEach(function (a, i) {
      var box = $('ab-' + a), inp = $('in-' + a);
      if (document.activeElement !== inp) inp.value = state.ab[i];
      box.querySelector('.m').textContent = sgn(E.mod(state.ab[i]));
      box.classList.toggle('bad', !!bad[a]);
      box.title = need[a] ? 'Multiclassing here needs ' + ABIL_NAME[a] + ' ' + need[a] : '';
    });
    var w = r.warnings;
    $('warn').innerHTML = w.length ? w.map(function (x) { return '<p class="notice' + (x.soft ? ' soft' : '') + '">' + esc(x.text) + '</p>'; }).join('')
      : '<p class="ok">' + (r.used.length > 1 ? 'Prerequisites met for every class in this build.' : 'Single class: no multiclass prerequisites apply.') + '</p>';
  }

  function renderSubs(r) {
    var html = r.used.map(function (id) {
      var c = D.CLASSES[id], e = c.ed[state.ed];
      var at = 0; for (var i = 0, n = 0; i < 20; i++) if (state.levels[i] === id && ++n === e.subclassLevel) { at = i + 1; break; }
      var opts = '<option value="">Choose...</option>' + e.subclasses.map(function (s) {
        return '<option value="' + s.id + '"' + (state.sub[id] === s.id ? ' selected' : '') + '>' + esc(s.name + ' - ' + s.source) + '</option>';
      }).join('');
      var sel = E.findSub(D, id, state.ed, state.sub[id]);
      var hint = at ? 'Picked at character level ' + at + ' (' + c.name + ' ' + e.subclassLevel + ').' : 'Needs ' + c.name + ' ' + e.subclassLevel + '; this build never gets there.';
      return '<div class="sub-row"><label for="sub-' + id + '">' + esc(c.name + ': ' + e.subclassLabel) + '</label>' +
        '<select id="sub-' + id + '" data-sub="' + id + '"' + (at ? '' : ' disabled') + '>' + opts + '</select>' +
        '<span class="hint">' + esc(hint) + (sel && at ? ' ' + esc(sel.summary) : '') + '</span></div>';
    }).join('');
    if (state.ed === '2014' && r.counts.warlock >= 3) {
      var at3 = 0; for (var i = 0, n = 0; i < 20; i++) if (state.levels[i] === 'warlock' && ++n === 3) { at3 = i + 1; break; }
      html += '<div class="sub-row"><label for="boon">Warlock: Pact Boon</label><select id="boon"><option value="">Choose...</option>' +
        D.PACT_BOONS.map(function (b) { return '<option value="' + b.id + '"' + (state.boon === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('') +
        '</select><span class="hint">Character level ' + at3 + ' (Warlock 3).</span></div>';
    } else if (state.ed === '2024' && r.counts.warlock) {
      html += '<p class="hint small muted">2024: Pact of the Blade, Chain and Tome are Eldritch Invocations; pick one with your level-1 invocation.</p>';
    }
    $('subs').innerHTML = html;
  }

  function renderLevels(r) {
    var wrap = $('levels');
    var narrow = narrowMq ? narrowMq.matches : false;
    if (!wrap.children.length || wrap.dataset.narrow !== String(narrow)) {
      wrap.dataset.narrow = String(narrow);
      var opts = D.CLASS_ORDER.map(function (id) { var c = D.CLASSES[id]; return '<option value="' + id + '">' + esc(narrow ? c.short || c.name : c.name) + '</option>'; }).join('');
      var h = '';
      for (var i = 0; i < 20; i++) h += '<label class="lv" id="lv' + i + '"><span>Level ' + (i + 1) + '</span><select data-lv="' + i + '" aria-label="Class at level ' + (i + 1) + '">' + opts + '</select></label>';
      wrap.innerHTML = h;
      var fo = ''; for (i = 1; i <= 20; i++) fo += '<option value="' + i + '">' + i + '</option>';
      $('fillFrom').innerHTML = fo;
      $('fillCls').innerHTML = D.CLASS_ORDER.map(function (id) { return '<option value="' + id + '">' + esc(D.CLASSES[id].name) + '</option>'; }).join('');
    }
    for (var j = 0; j < 20; j++) {
      var cell = $('lv' + j), sel = cell.querySelector('select');
      sel.value = state.levels[j];
      cell.className = 'lv c-' + state.levels[j] + (j + 1 > state.show ? ' future' : '');
    }
    $('split').innerHTML = splitHtml(r.rows[19].counts);
  }

  function splitHtml(counts) {
    return D.CLASS_ORDER.filter(function (id) { return counts[id]; })
      .map(function (id) { return '<span class="c-' + id + '">' + esc(D.CLASSES[id].name) + ' ' + counts[id] + '</span>'; }).join(' / ');
  }

  function slotsHtml(slots) {
    if (!slots.length) return '<span class="none">none</span>';
    return '<span class="slots">' + slots.map(function (n, i) { return '<span class="sl"><i>' + ORD[i + 1] + '</i><b>' + n + '</b></span>'; }).join('') + '</span>';
  }
  function pactHtml(p) {
    if (!p) return '';
    var h = '<span class="slots"><span class="sl pact" title="Pact slots, back on a short rest"><i>' + ORD[p.level] + '</i><b>x' + p.count + '</b></span></span>';
    if (p.arcanum.length) h += '<div class="small muted">Arcanum ' + p.arcanum.map(function (l) { return ORD[l]; }).join(', ') + '</div>';
    return h;
  }
  function spellsHtml(sp) {
    return sp.map(function (s) {
      var c = D.CLASSES[s.cls], bits = [];
      if (s.cantrips) bits.push(s.cantrips + ' cantrips');
      if (s.count) bits.push(s.count + ' ' + s.kind);
      if (s.max) bits.push('up to ' + ORD[s.max]);
      if (!bits.length) bits.push('no spells yet');
      return '<div class="sp"><b>' + esc(c.short || c.name) + '</b> ' + bits.join(' &middot; ') + '</div>';
    }).join('');
  }
  function resHtml(res) {
    var b = [];
    if (res.layOnHands) b.push('<span title="Lay on Hands pool">LoH ' + res.layOnHands + '</span>');
    if (res.channel) b.push('<span title="Channel Divinity uses">CD ' + res.channel + '</span>');
    if (res.sorcery) b.push('<span title="Sorcery points">SP ' + res.sorcery + '</span>');
    if (res.metamagic) b.push('<span title="Metamagic options">Meta ' + res.metamagic + '</span>');
    if (res.invocations) b.push('<span title="Eldritch Invocations">Inv ' + res.invocations + '</span>');
    return b.length ? '<div class="res">' + b.join('') + '</div>' : '';
  }

  function renderSummary(r) {
    var row = r.rows[state.show - 1];
    $('showOut').textContent = state.show;
    $('show').value = state.show;
    var asis = r.asis.filter(function (L) { return L <= state.show; });
    var stats = [
      ['Split', '<span class="split-v">' + splitHtml(row.counts) + '</span>', 'wide'],
      ['Proficiency', sgn(row.prof)],
      ['Hit points', row.hp + ' <small class="muted">avg</small>'],
      ['Spell DC / attack', row.dc + ' / ' + sgn(row.atk)],
      ['Attacks', row.attacks + (row.attacks > 1 ? ' (Extra Attack)' : '')],
      ['Caster level', row.casterLevel || '0'],
      ['Spell slots', slotsHtml(row.slots), 'wide'],
      ['Pact Magic', row.pact ? pactHtml(row.pact) : '<span class="none">none</span>'],
      ['ASIs / feats', asis.length + (asis.length ? ' <small class="muted">(lvl ' + asis.join(', ') + ')</small>' : '')],
      ['Saves', esc(D.CLASSES[r.first].saves)]
    ];
    var resB = resHtml(row.res);
    if (resB) stats.push(['Resources', resB, 'wide']);
    stats.push(['Spells', spellsHtml(row.spells), 'wide']);
    $('stats').innerHTML = stats.map(function (s) { return '<div class="stat' + (s[2] ? ' ' + s[2] : '') + '"><div class="v">' + s[1] + '</div><span>' + s[0] + '</span></div>'; }).join('');
  }

  function renderMilestones(r) {
    $('milestones').innerHTML = r.milestones.map(function (m) {
      return '<li' + (m.L > state.show ? ' class="future"' : '') + '><span class="lvn">Lvl ' + m.L + '</span><span>' + esc(m.text) + '</span></li>';
    }).join('') || '<li>Nothing yet.</li>';
  }

  function renderCombine(r) {
    var items = [];
    r.rows.forEach(function (row) { row.notes.forEach(function (n) { items.push('<li><b>Lvl ' + row.L + ':</b> ' + esc(n) + '</li>'); }); });
    var c = r.counts;
    if (c.paladin && c.sorcerer) items.push('<li>Sorcerer slots fuel smites, and Charisma powers both classes, so one high score covers spells, Aura of Protection and (with a Cha-attack option) weapons.</li>');
    if (c.paladin && c.warlock && state.ed === '2014' && state.sub.warlock === 'hexblade') items.push('<li>Hex Warrior lets you attack with Charisma, so Strength only has to meet the 13 prerequisite.</li>');
    if (c.paladin && c.warlock && state.ed === '2024') items.push('<li>Pact of the Blade (an invocation in 2024) lets you attack with Charisma from warlock level 1.</li>');
    if (c.warlock && c.warlock < 11 && r.rows[19].casterLevel >= 11) items.push('<li>Mystic Arcanum needs warlock 11; your 6th-level and higher spells come from the shared slots instead.</li>');
    if (!items.length) items.push('<li>Single class or no special interactions in this build.</li>');
    $('combine').innerHTML = items.join('');
  }

  function renderTable(r) {
    $('tbody').innerHTML = r.rows.map(function (row) {
      var c = D.CLASSES[row.cls];
      var feats = row.feats.map(function (f) {
        return '<p class="feat ' + f.kind + '"><b>' + esc(f.name) + '.</b> ' + esc(f.text) + (f.src ? ' <span class="src">(' + esc(f.src) + ')</span>' : '') + '</p>';
      }).join('') + row.notes.map(function (n) { return '<p class="rnote">' + esc(n) + '</p>'; }).join('');
      var cls = row.L > state.show ? 'future' : row.L === state.show ? 'cur' : '';
      return '<tr class="' + cls + '">' +
        '<td class="lvn">' + row.L + '<small>Prof ' + sgn(row.prof) + '</small></td>' +
        '<td class="c-cls"><span class="tag c-' + row.cls + '">' + esc(c.name) + ' ' + row.n + '</span></td>' +
        '<td>' + (feats || '<span class="none">No new features</span>') + '</td>' +
        '<td><span class="mob">Spell slots' + (row.casterLevel ? ' (caster level ' + row.casterLevel + ')' : '') + '</span>' + slotsHtml(row.slots) + '</td>' +
        '<td>' + (row.pact ? '<span class="mob">Pact Magic</span>' + pactHtml(row.pact) : '') + '</td>' +
        '<td><span class="mob">Spells</span>' + spellsHtml(row.spells) + '</td>' +
        '<td>' + (resHtml(row.res) ? '<span class="mob">Resources</span>' + resHtml(row.res) : '') + '</td>' +
        '<td><span class="mob">HP</span>' + row.hp + '</td></tr>';
    }).join('');
  }

  // ---------- saved builds ----------
  function savedList() { var s = store.get('mcp.builds', {}); return s && typeof s === 'object' ? s : {}; }
  function renderSaved(selected) {
    var s = savedList(), names = Object.keys(s).sort(function (a, b) { return a.localeCompare(b); });
    $('saved').innerHTML = names.length
      ? '<option value="">Load a saved build...</option>' + names.map(function (n) { return '<option' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('')
      : '<option value="">None saved</option>';
  }
  var toastT;
  function toast(msg) { $('toast').textContent = msg; clearTimeout(toastT); toastT = setTimeout(function () { $('toast').textContent = ''; }, 3500); }

  // ---------- events ----------
  function set(fn) { fn(); render(); }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    if (t.id === 'themeBtn') return toggleTheme();
    if (t.dataset.ed) return set(function () { state = normalize(Object.assign({}, state, { ed: t.dataset.ed })); });
    if (t.id === 'fillBtn') return set(function () {
      var from = +$('fillFrom').value, cls = $('fillCls').value;
      for (var i = from - 1; i < 20; i++) state.levels[i] = cls;
      presetId = '';
    });
    if (t.id === 'saveBtn') {
      var name = (state.name || '').trim() || 'My build';
      var s = savedList();
      if (s[name] && !confirm('Replace the saved build "' + name + '"?')) return;
      state.name = name; s[name] = state;
      if (store.set('mcp.builds', s)) toast('Saved "' + name + '" in this browser.'); else toast('Could not save: browser storage is unavailable.');
      renderSaved(name); render(); return;
    }
    if (t.id === 'delBtn') {
      var n = $('saved').value; if (!n) return toast('Pick a saved build to delete first.');
      if (!confirm('Delete the saved build "' + n + '" from this browser?')) return;
      var s2 = savedList(); delete s2[n]; store.set('mcp.builds', s2); renderSaved(''); toast('Deleted "' + n + '".'); return;
    }
    if (t.id === 'shareBtn') {
      syncUrl();
      var url = location.origin + location.pathname + toQuery(state);
      var done = function () { toast('Share link copied.'); };
      try { navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); }); }
      catch (e) { prompt('Copy this link:', url); }
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.lv) return set(function () { state.levels[+t.dataset.lv] = t.value; presetId = ''; });
    if (t.dataset.sub) return set(function () { if (t.value) state.sub[t.dataset.sub] = t.value; else delete state.sub[t.dataset.sub]; });
    if (t.id === 'boon') return set(function () { state.boon = t.value; });
    if (t.id === 'preset') {
      var p = D.PRESETS.filter(function (x) { return x.id === t.value; })[0];
      t.value = '';
      if (p) set(function () { state = presetState(p); presetId = p.id; });
      return;
    }
    if (t.id === 'saved') {
      var s = savedList()[t.value];
      if (s) { set(function () { state = normalize(s); presetId = ''; }); toast('Loaded "' + t.value + '".'); }
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.ab) { var v = parseInt(t.value, 10); if (!isNaN(v)) set(function () { state.ab[+t.dataset.ab] = clampAb(v); }); return; }
    if (t.id === 'bName') { state.name = t.value.slice(0, 60); syncUrl(); return; }
    if (t.id === 'show') return set(function () { state.show = +t.value; });
  });
  document.addEventListener('focusout', function (ev) { if (ev.target.dataset && ev.target.dataset.ab) render(); });

  function toggleTheme() {
    var cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; store.set('mcp.theme', next);
  }

  // ---------- start ----------
  var th = store.get('mcp.theme', null);
  if (th === 'dark' || th === 'light') document.documentElement.dataset.theme = th;
  $('preset').innerHTML += D.PRESETS.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name + ' - ' + p.ed + ' rules' + (p.exploit ? ' (exploit)' : '')) + '</option>'; }).join('');
  $('metaList').innerHTML = D.METAMAGIC.map(function (m) { return '<li><b>' + esc(m[0]) + '.</b> ' + esc(m[1]) + '</li>'; }).join('');
  state = fromQuery(location.search);
  if (!state) { var cur = store.get('mcp.current', null); state = cur ? normalize(cur) : null; }
  if (!state) { state = presetState(D.PRESETS[0]); presetId = D.PRESETS[0].id; }
  renderSaved('');
  render();
  if (narrowMq) { try { narrowMq.addEventListener('change', render); } catch (e) { /* old Safari */ } }
})();
