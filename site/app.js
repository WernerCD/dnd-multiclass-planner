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
    return { ed: p.ed, levels: E.decodeLevels(D, p.lv), ab: p.ab.slice(), sub: Object.assign({}, p.sub), boon: p.boon || '', name: p.name, show: p.lv.length };
  }
  function clampAb(v) { v = parseInt(v, 10); return isNaN(v) ? 10 : Math.max(1, Math.min(30, v)); }
  function normalize(s) {
    var o = {
      ed: s.ed === '2024' ? '2024' : '2014',
      levels: Array.isArray(s.levels) && s.levels.length >= 1 && s.levels.length <= 20 && s.levels.every(function (x) { return D.CLASSES[x]; }) ? s.levels.slice() : E.decodeLevels(D, ''),
      ab: (Array.isArray(s.ab) && s.ab.length === 6 ? s.ab : [10, 10, 10, 10, 10, 10]).map(clampAb),
      sub: {}, boon: '', name: String(s.name || '').slice(0, 60)
    };
    o.show = Math.max(1, Math.min(o.levels.length, parseInt(s.show, 10) || o.levels.length));
    D.CLASS_ORDER.forEach(function (id) { if (s.sub && E.findSub(D, id, o.ed, s.sub[id])) o.sub[id] = s.sub[id]; });
    if (D.PACT_BOONS.some(function (b) { return b.id === s.boon; })) o.boon = s.boon;
    if (typeof s.charId === 'string' && s.charId) o.charId = s.charId;
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
    if (s.show !== s.levels.length) p.set('at', s.show);
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
    pushChar();
  }

  // ---------- shared character (character.js, dnd.characters) ----------
  var C = window.DndChar || null, REPO = 'dnd-multiclass-planner', writing = false;
  var MINE = D.CLASS_ORDER.map(function (id) { return D.CLASSES[id].name.toLowerCase(); });
  function quietly(fn) { writing = true; try { return fn(); } finally { writing = false; } }
  function charRecord(old) {
    // classes this planner doesn't cover (set on another site) are kept, in the record's own order
    var mine = E.charClasses(D, state), byCls = {}, classes = [];
    mine.forEach(function (c) { byCls[c.cls] = c; });
    (old ? old.classes : []).forEach(function (c) {
      if (MINE.indexOf(c.cls) < 0) classes.push(c);
      else if (byCls[c.cls]) { classes.push(byCls[c.cls]); delete byCls[c.cls]; }
    });
    mine.forEach(function (c) { if (byCls[c.cls]) classes.push(c); });
    var links = {}; links[REPO] = toQuery(state);
    return { id: old ? old.id : undefined, name: (state.name || '').trim() || (old && old.name) || 'My build', ed: state.ed,
      classes: classes, ab: state.ab.slice(), links: links };
  }
  function pushChar() {
    // keep the linked character up to date as the build changes
    if (!C || !state.charId) return;
    var old = C.get(state.charId);
    if (!old) { delete state.charId; renderChar(); return; }
    var rec = charRecord(old);
    var key = function (c) { return JSON.stringify([c.name, c.ed, c.classes, c.ab, c.links[REPO]]); };
    if (key(old) !== key(rec)) quietly(function () { C.save(rec, REPO); });
  }
  function stateFromChar(ch) {
    // the planner's own link holds the full build (level order, pact boon); the shared record wins if another site changed it
    var b = E.buildFromChar(D, ch);
    if (!b.levels.length) return null;
    var link = ch.links && ch.links[REPO], s = link ? fromQuery(link) : null;
    if (!s || s.ed !== b.ed || !E.sameClasses(E.charClasses(D, s), E.charClasses(D, b))) s = normalize(b);
    else { s.sub = b.sub; s.ab = b.ab; s = normalize(s); }
    s.name = ch.name; s.charId = ch.id;
    return s;
  }
  function loadChar(ch) {
    var s = stateFromChar(ch);
    if (!s) { delete state.charId; toast(ch.name + ' has no Paladin, Warlock or Sorcerer levels, so the planner kept your current build.'); return false; }
    var skipped = E.buildFromChar(D, ch).skipped;
    state = s; presetId = '';
    toast(skipped.length ? 'Loaded ' + ch.name + '. The planner does not cover ' + skipped.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }).join(', ') + '; those levels are kept on the character.' : 'Loaded character "' + ch.name + '".');
    return true;
  }
  function renderChar() {
    var el = $('charBar');
    if (!C) { el.innerHTML = ''; return; }
    var ch = state.charId ? C.get(state.charId) : null;
    if (!ch) {
      el.innerHTML = '<span class="char-txt">Save this build as a character to use it on the other D&amp;D Toolbox sites: the Spell Planner, Item Finder and more.</span>' +
        '<span class="char-acts"><button type="button" class="btn btn-accent" id="charBtn">Save as character</button></span>';
      return;
    }
    var acts = '<a class="btn" href="' + esc(C.url('dnd-magic', ch.id)) + '">Spells for this character</a>' +
      '<a class="btn" href="' + esc(C.url('dnd-items', ch.id)) + '">Items</a>';
    if (ch.classes.some(function (c) { return c.cls === 'druid'; })) acts += '<a class="btn" href="' + esc(C.url('dnd-druid-wildshapes', ch.id)) + '">Wild Shape</a>';
    el.innerHTML = '<span class="char-txt">Character <b>' + esc(ch.name) + '</b> (' + esc(C.summary(ch)) + '). Changes here update it on every D&amp;D Toolbox site.</span>' +
      '<span class="char-acts">' + acts + '</span>';
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
    renderChar();
  }

  function renderControls() {
    document.querySelectorAll('[data-ed]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.ed === state.ed)); });
    if (document.activeElement !== $('bName')) $('bName').value = state.name;
    $('notes2024').classList.toggle('dim', state.ed !== '2024');
    var ps = $('preset');
    if (ps.dataset.ed !== state.ed) {
      ps.dataset.ed = state.ed;
      ps.innerHTML = '<option value="">Load a ' + state.ed + ' preset...</option>' + D.PRESETS.filter(function (x) { return x.ed === state.ed; })
        .map(function (x) { return '<option value="' + x.id + '">' + esc(x.name + (x.exploit ? ' (exploit)' : '')) + '</option>'; }).join('');
    }
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
      var at = 0; for (var i = 0, n = 0; i < state.levels.length; i++) if (state.levels[i] === id && ++n === e.subclassLevel) { at = i + 1; break; }
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
      var at3 = 0; for (var i = 0, n = 0; i < state.levels.length; i++) if (state.levels[i] === 'warlock' && ++n === 3) { at3 = i + 1; break; }
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
    var narrow = narrowMq ? narrowMq.matches : false, len = state.levels.length;
    if (!wrap.children.length || wrap.dataset.narrow !== String(narrow) || wrap.children.length !== len) {
      wrap.dataset.narrow = String(narrow);
      var opts = D.CLASS_ORDER.map(function (id) { var c = D.CLASSES[id]; return '<option value="' + id + '">' + esc(narrow ? c.short || c.name : c.name) + '</option>'; }).join('');
      var h = '';
      for (var i = 0; i < len; i++) h += '<label class="lv" id="lv' + i + '"><span>Level ' + (i + 1) + '</span><select data-lv="' + i + '" aria-label="Class at level ' + (i + 1) + '">' + opts + '</select></label>';
      wrap.innerHTML = h;
      var fo = ''; for (i = 1; i <= len; i++) fo += '<option value="' + i + '">' + i + '</option>';
      $('fillFrom').innerHTML = fo;
      $('fillTo').textContent = 'to ' + len + ' as';
      $('fillCls').innerHTML = D.CLASS_ORDER.map(function (id) { return '<option value="' + id + '">' + esc(D.CLASSES[id].name) + '</option>'; }).join('');
    }
    for (var j = 0; j < len; j++) {
      var cell = $('lv' + j), sel = cell.querySelector('select');
      sel.value = state.levels[j];
      cell.className = 'lv c-' + state.levels[j] + (j + 1 > state.show ? ' future' : '');
    }
    var last = r.rows[r.rows.length - 1].counts;
    $('split').innerHTML = 'Level ' + len + ' / 20';
    $('clsSteps').innerHTML = D.CLASS_ORDER.map(function (id) {
      var c = D.CLASSES[id], n = last[id] || 0, room = 20 - len;
      var canDown = n > 0 && !(n === len), canUp = room > 0;
      return '<div class="step c-' + id + (n ? '' : ' zero') + '"><label for="cnt-' + id + '">' + esc(c.name) + '</label>' +
        '<div class="step-ctl"><button type="button" class="btn" data-step="' + id + '" data-d="-1" aria-label="One less ' + esc(c.name) + ' level"' + (canDown ? '' : ' disabled') + '>&minus;</button>' +
        '<input type="number" inputmode="numeric" min="0" max="20" id="cnt-' + id + '" data-cnt="' + id + '" value="' + n + '">' +
        '<button type="button" class="btn" data-step="' + id + '" data-d="1" aria-label="One more ' + esc(c.name) + ' level"' + (canUp ? '' : ' disabled') + '>+</button></div></div>';
    }).join('');
  }

  /* Change how many levels a class has. Keeps the existing order; removes that class's last levels
     or adds new ones at the end. The total stays between 1 and 20. */
  function setCount(id, n) {
    var lv = state.levels, cur = lv.filter(function (x) { return x === id; }).length, others = lv.length - cur;
    n = Math.max(others ? 0 : 1, Math.min(20 - others, isNaN(n) ? cur : n));
    if (n === cur) return;
    var followEnd = state.show === lv.length;
    if (n < cur) { var drop = cur - n; for (var i = lv.length - 1; i >= 0 && drop; i--) if (lv[i] === id) { lv.splice(i, 1); drop--; } }
    else for (var k = cur; k < n; k++) lv.push(id);
    state.show = followEnd ? lv.length : Math.min(state.show, lv.length);
    presetId = '';
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
    $('show').max = state.levels.length;
    $('show').value = state.show;
    $('show').disabled = state.levels.length < 2;
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
    if (c.warlock && c.warlock < 11 && r.rows[r.rows.length - 1].casterLevel >= 11) items.push('<li>Mystic Arcanum needs warlock 11; your 6th-level and higher spells come from the shared slots instead.</li>');
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
    if (t.dataset.ed) return set(function () { state = normalize(Object.assign({}, state, { ed: t.dataset.ed })); presetId = ''; });
    if (t.id === 'fillBtn') return set(function () {
      var from = +$('fillFrom').value, cls = $('fillCls').value;
      for (var i = from - 1; i < state.levels.length; i++) state.levels[i] = cls;
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
    if (t.id === 'charBtn') {
      if (!C) return;
      var cname = (state.name || '').trim() || 'My build';
      state.name = cname;
      var m = quietly(function () { var x = C.save(charRecord(null), REPO); C.setActive(x.id); return x; });
      if (!m || !C.get(m.id)) return toast('Could not save: browser storage is unavailable.');
      state.charId = m.id; render();
      toast('Saved "' + cname + '" as a character. Edits here now update it.');
      return;
    }
    if (t.dataset.step) return set(function () { setCount(t.dataset.step, (state.levels.filter(function (x) { return x === t.dataset.step; }).length) + (+t.dataset.d)); });
    if (t.id === 'ddbBtn') { $('ddbErr').hidden = true; $('ddbDlg').showModal(); return; }
    if (t.id === 'importClose') { $('importNote').hidden = true; return; }
    if (t.id === 'ddbGo') {
      var res;
      try { res = window.DdbImport.parse(D, $('ddbJson').value.trim(), state.ed); }
      catch (e) { $('ddbErr').hidden = false; $('ddbErr').textContent = e instanceof SyntaxError ? 'That is not valid JSON. Copy the whole character data page and paste it again.' : e.message; return; }
      state = normalize(res); presetId = '';
      $('ddbDlg').close(); $('ddbJson').value = '';
      $('importBody').innerHTML = '<p><b>Imported ' + esc(state.name) + ' (level ' + res.total + ').</b></p><ul>' + res.notices.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
      $('importNote').hidden = false;
      render(); return;
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
    if (t.dataset.cnt) return set(function () { setCount(t.dataset.cnt, parseInt(t.value, 10)); });
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
      if (s) {
        set(function () {
          state = normalize(s); presetId = '';
          // a saved build linked to a character makes that character active again
          if (state.charId && C && C.get(state.charId)) quietly(function () { C.setActive(state.charId); });
          else delete state.charId;
        });
        toast('Loaded "' + t.value + '".');
      }
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.ab) { var v = parseInt(t.value, 10); if (!isNaN(v)) set(function () { state.ab[+t.dataset.ab] = clampAb(v); }); return; }
    if (t.id === 'ddbLink') {
      var id = window.DdbImport.idFromLink(t.value), a = $('ddbOpen');
      if (id) { a.href = window.DdbImport.apiUrl(id); a.removeAttribute('aria-disabled'); a.textContent = 'the character data for #' + id; }
      else { a.href = '#'; a.setAttribute('aria-disabled', 'true'); a.textContent = 'the character data'; }
      return;
    }
    if (t.id === 'bName') { state.name = t.value.slice(0, 60); syncUrl(); return; }
    if (t.id === 'show') return set(function () { state.show = +t.value; });
  });
  document.addEventListener('focusout', function (ev) { if (ev.target.dataset && ev.target.dataset.ab) render(); });

  // theme toggle: theme.js (shared dnd.theme key)

  // ---------- start ----------
  $('metaList').innerHTML = D.METAMAGIC.map(function (m) { return '<li><b>' + esc(m[0]) + '.</b> ' + esc(m[1]) + '</li>'; }).join('');
  state = fromQuery(location.search); // a share link wins
  var act = C && C.active();
  var fromAct = act && stateFromChar(act);
  if (state && fromAct && toQuery(state) === toQuery(fromAct)) state.charId = act.id; // a reload keeps the link
  if (!state && fromAct) state = fromAct; // the active character (also set by ?char=)
  if (!state) { var cur = store.get('mcp.current', null); state = cur ? normalize(cur) : null; }
  if (state && state.charId && !(fromAct && act.id === state.charId)) delete state.charId;
  if (!state) { state = presetState(D.PRESETS[0]); presetId = D.PRESETS[0].id; }
  renderSaved('');
  render();
  if (C) C.onChange(function (active) {
    if (writing) return;
    if (!active) { if (state.charId) { delete state.charId; render(); } return; }
    if (active.id === state.charId) {
      // edited on another site or in another tab: follow it
      var s = stateFromChar(active);
      if (!s) { delete state.charId; render(); } // no planner classes left on it: stop writing to it
      else if (toQuery(s) !== toQuery(state)) { state = s; render(); }
      else renderChar();
      return;
    }
    loadChar(active); render();
  });
  if (narrowMq) { try { narrowMq.addEventListener('change', render); } catch (e) { /* old Safari */ } }
})();
