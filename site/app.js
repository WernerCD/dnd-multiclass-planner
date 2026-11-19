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

  var has = function (o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); };
  var MINE = D.CLASS_ORDER.map(function (id) { return D.CLASSES[id].name.toLowerCase(); });
  function otherName(cls) { var i = D.OTHER_CLASSES[cls]; return i ? i.name : cls.charAt(0).toUpperCase() + cls.slice(1); }

  function presetState(p) {
    return normalize({ ed: p.ed, levels: E.decodeLevels(D, p.lv), ab: p.ab.slice(), sub: Object.assign({}, p.sub), boon: p.boon || '', name: p.name, show: p.lv.length });
  }
  function clampAb(v) { v = parseInt(v, 10); return isNaN(v) ? 10 : Math.max(1, Math.min(30, v)); }
  // locked levels in classes the planner doesn't model (from a shared character or a D&D Beyond import)
  function cleanOther(list) {
    var out = [], seen = Object.create(null), total = 0;
    (Array.isArray(list) ? list : []).forEach(function (o) {
      if (!o) return;
      var cls = String(o.cls || '').toLowerCase().trim(), lvl = Math.max(1, Math.min(20, parseInt(o.lvl, 10) || 0));
      if (!/^[a-z][a-z -]{0,29}$/.test(cls) || MINE.indexOf(cls) >= 0 || seen[cls] || total + lvl > 19) return;
      seen[cls] = 1; total += lvl;
      out.push({ cls: cls, lvl: lvl, sub: o.sub ? String(o.sub).slice(0, 60) : null, subName: o.subName ? String(o.subName).slice(0, 80) : null });
    });
    return out;
  }
  function lockedCount(s) { return E.otherTotal(s); }
  var LIMIT_MSG = 'A build can mix up to ' + (D.MAX_CLASSES || 3) + ' classes. Remove one first.';
  // classes in the build (planner classes plus locked ones), optionally ignoring one level
  function classSet(s, skipIndex) {
    var set = Object.create(null);
    s.levels.forEach(function (id, i) { if (i !== skipIndex) set[id] = 1; });
    (s.other || []).forEach(function (o) { set['other:' + o.cls] = 1; });
    return set;
  }
  function canAdd(s, id, skipIndex) { var set = classSet(s, skipIndex); return !!set[id] || Object.keys(set).length < (D.MAX_CLASSES || 3); }
  var byName = function (a, b) { return D.CLASSES[a].name.localeCompare(D.CLASSES[b].name); };
  function totalLevel(s) { return Math.min(20, s.levels.length + lockedCount(s)); }
  function normalize(s) {
    var conv = [], first = s.otherFirst !== false;
    var rawOther = (Array.isArray(s.other) ? s.other : []).filter(function (x) {
      var id = x && String(x.cls || '').toLowerCase();
      if (!id || !has(D.CLASSES, id)) return true;
      for (var i = 0; i < (parseInt(x.lvl, 10) || 0); i++) conv.push(id);
      return false;
    });
    var other = cleanOther(rawOther), locked = E.otherTotal({ other: other }), max = 20 - locked;
    var okLv = Array.isArray(s.levels) && s.levels.length >= 1 && s.levels.every(function (x) { return has(D.CLASSES, x); });
    var lv0 = okLv ? s.levels.slice() : (conv.length ? [] : E.decodeLevels(D, ''));
    lv0 = first ? conv.concat(lv0) : lv0.concat(conv);
    var o = {
      ed: s.ed === '2024' ? '2024' : '2014',
      levels: lv0.slice(0, max),
      ab: (Array.isArray(s.ab) && s.ab.length === 6 ? s.ab : [10, 10, 10, 10, 10, 10]).map(clampAb),
      sub: {}, otherSub: {}, boon: '', name: String(s.name || '').slice(0, 60),
      other: other, otherFirst: s.otherFirst !== false
    };
    var total = totalLevel(o);
    o.show = Math.max(1, Math.min(total, parseInt(s.show, 10) || total));
    var alt = o.ed === '2014' ? '2024' : '2014';
    D.CLASS_ORDER.forEach(function (id) {
      var v = has(s.sub, id) ? s.sub[id] : null, os = has(s.otherSub, id) ? s.otherSub[id] : null;
      if (v && E.findSub(D, id, o.ed, v)) { o.sub[id] = v; return; }
      if (os && os.sub && E.findSub(D, id, o.ed, os.sub)) { o.sub[id] = os.sub; return; }
      // a subclass picked under the other rules, or one the planner doesn't list: kept as "other"
      var a = v && E.findSub(D, id, alt, v);
      if (a) o.otherSub[id] = { sub: a.id, subName: a.name };
      else if (os && (os.subName || os.sub)) o.otherSub[id] = { sub: os.sub ? String(os.sub).slice(0, 60) : null, subName: String(os.subName || os.sub).slice(0, 80) };
    });
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
    Object.keys(s.otherSub || {}).forEach(function (id) {
      if (!s.sub[id] && s.levels.indexOf(id) >= 0) sub.push(D.CLASSES[id].code + '.~' + s.otherSub[id].subName.replace(/,/g, ' '));
    });
    if (sub.length) p.set('sub', sub.join(','));
    if (s.boon) p.set('boon', s.boon);
    if (s.other && s.other.length) {
      p.set('o', s.other.map(function (o) { return o.cls.replace(/ /g, '_') + o.lvl; }).join('.'));
      if (!s.otherFirst) p.set('of', '0');
    }
    if (s.name) p.set('n', s.name);
    if (s.show !== totalLevel(s)) p.set('at', s.show);
    return '?' + p.toString();
  }
  function fromQuery(q) {
    var p = new URLSearchParams(q);
    if (!p.get('lv')) return null;
    var codes = {}; D.CLASS_ORDER.forEach(function (id) { codes[D.CLASSES[id].code] = id; });
    var sub = {}, otherSub = {};
    (p.get('sub') || '').split(',').forEach(function (t) {
      var i = t.indexOf('.'), id = i > 0 && has(codes, t.slice(0, i)) ? codes[t.slice(0, i)] : null, v = id ? t.slice(i + 1) : '';
      if (!id || !v) return;
      if (v.charAt(0) === '~') otherSub[id] = { sub: null, subName: v.slice(1) }; else sub[id] = v;
    });
    var other = (p.get('o') || '').split('.').map(function (t) { var m = t.match(/^([a-z_]+?)(\d+)$/); return m ? { cls: m[1].replace(/_/g, ' '), lvl: +m[2] } : null; }).filter(Boolean);
    return normalize({ ed: p.get('ed'), levels: E.decodeLevels(D, p.get('lv')), ab: (p.get('ab') || '').split('.'), sub: sub, otherSub: otherSub,
      other: other, otherFirst: p.get('of') !== '0', boon: p.get('boon'), name: p.get('n'), show: p.get('at') });
  }
  function syncUrl() {
    // keep ?sw=1 (offline.js reads it after this script runs; the smoke test's offline check uses it)
    var sw = /[?&]sw=1\b/.test(location.search) ? '&sw=1' : '';
    try { history.replaceState(null, '', location.pathname + toQuery(state) + sw); } catch (e) { /* file:// or sandbox */ }
    store.set('mcp.current', state);
    schedulePush();
  }

  // ---------- shared character (character.js, dnd.characters; syncing rules in STYLE.md 6c) ----------
  var C = window.DndChar || null, REPO = 'dnd-multiclass-planner', writing = false;
  var pushTimer = null, lastKey = null, conflict = false, cleanKey = '', charHtml = null, pendingShare = null;
  function quietly(fn) { writing = true; try { return fn(); } finally { writing = false; } }
  // this site's links entry: { q: the build query, impAt: the import (ch.imp.at) last offered }; old records hold the query string
  function linkQ(ch) { var v = ch && ch.links && ch.links[REPO]; return typeof v === 'string' ? v : v && v.q || null; }
  function linkImpAt(ch) { var v = ch && ch.links && ch.links[REPO]; return v && typeof v === 'object' ? v.impAt || null : null; }
  // the shared fields the planner reads; a change to anything else (updated, other sites' links) is ignored
  function fieldsKey(ch) {
    return JSON.stringify([ch.name, ch.ed, ch.classes.map(function (c) { return [c.cls, c.lvl, c.sub || null, c.subName || null]; }), ch.ab]);
  }
  function charRecord(old) {
    var mine = E.charClasses(D, state), byCls = {}, classes = [];
    mine.forEach(function (c) { byCls[c.cls] = c; });
    if (old) {
      old.classes.forEach(function (c) {
        if (MINE.indexOf(c.cls) < 0) { classes.push(c); return; } // a class the planner doesn't model: untouched
        var m = byCls[c.cls]; if (!m) return;
        delete byCls[c.cls];
        // the same subclass under another site's id or spelling keeps theirs
        if (m.subName && (c.sub || c.subName) && E.subKey(m.subName) === E.subKey(c.subName || c.sub)) m = { cls: m.cls, lvl: m.lvl, sub: c.sub, subName: c.subName || m.subName };
        classes.push(m);
      });
      mine.forEach(function (c) { if (byCls[c.cls]) classes.push(c); });
    } else {
      var oth = state.other.map(function (o) { return { cls: o.cls, lvl: o.lvl, sub: o.sub, subName: o.subName }; });
      classes = state.otherFirst ? oth.concat(mine) : mine.concat(oth);
    }
    var links = {}; links[REPO] = { q: toQuery(state) }; if (linkImpAt(old)) links[REPO].impAt = linkImpAt(old);
    return { id: old ? old.id : undefined, name: (state.name || '').trim() || (old && old.name) || 'My build', ed: state.ed,
      classes: classes, ab: state.ab.slice(), links: links };
  }
  // shared saves wait for a pause in editing
  function waiting() { return conflict || !!(pendingShare && pendingShare.id === state.charId); }
  function schedulePush() {
    if (!C || !state.charId || waiting()) return;
    clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 500);
  }
  function pushNow() {
    clearTimeout(pushTimer); pushTimer = null;
    if (!C || !state.charId || waiting()) return;
    var old = C.get(state.charId);
    if (!old) { delete state.charId; renderChar(); return; } // deleted elsewhere: drop the link quietly
    var rec = charRecord(old);
    if (fieldsKey(old) !== fieldsKey(rec) || JSON.stringify((old.links || {})[REPO] || null) !== JSON.stringify(rec.links[REPO])) {
      var m = quietly(function () { return C.save(rec, REPO); });
      lastKey = fieldsKey(m || rec);
    } else lastKey = fieldsKey(old);
    shareBuild(old.id);
  }
  // what this character's share links (#dndchar=) carry for the planner: the full build query
  function shareBuild(id) {
    if (C && C.setShare) quietly(function () { C.setShare(id, REPO, toQuery(state)); });
    // the read-only summary for the hub's Character Sheet and Party pages (no-op when unchanged)
    if (C && C.setSheet) quietly(function () {
      var ch = C.get(id), im = ch && ch.imp, plan = totalLevel(state), opts = {};
      // the character's real level: from its import when there is one, otherwise the "At level" slider
      var impL = im && Array.isArray(im.classes) ? impLevel(im) : 0;
      if (impL && impL < plan) { opts.nowLvl = impL; opts.nowSrc = 'import'; }
      else if (!impL && state.show < plan) { opts.nowLvl = state.show; opts.nowSrc = 'at'; }
      if (im && im.skills && (im.skills.prof || im.skills.exp)) opts.skills = { prof: im.skills.prof || [], exp: im.skills.exp || [] };
      C.setSheet(id, REPO, E.sheet(D, state, opts));
    });
  }
  /* A share link that was accepted brings the sender's build in the character's inbox. Load it as the linked build
     when this browser has none for that character (or the same one) and nothing unsaved would be lost; otherwise ask. */
  function handleInbox(ch) {
    if (!C || !C.takeInbox || !ch) return false;
    var q = quietly(function () { return C.takeInbox(ch.id, REPO); });
    if (typeof q !== 'string' || !q) return false;
    var s = stateFromChar(ch, q.charAt(0) === '?' ? q : '?' + q);
    if (!s) return false;
    var linkedHere = state.charId === ch.id, link = linkQ(ch);
    var own = linkedHere ? state : link ? fromQuery(link) : null;
    if (linkedHere && sameBuild(s, state)) return true; // already showing it
    var unsaved = linkedHere ? !!(pushTimer || conflict) : isDirty();
    var differs = own && !sameBuild(own, s);
    if (!unsaved && !differs) { applyChar(ch, s); toast('Loaded the Multiclass Planner build that came with ' + ch.name + '.'); return true; }
    pendingShare = { id: ch.id, s: s };
    return true;
  }

  function stateFromChar(ch, linkOverride) {
    // the planner's own link holds the full build (level order, pact boon); the shared record wins where it differs
    var b = E.buildFromChar(D, ch);
    if (!b.levels.length) return null;
    var link = linkOverride || linkQ(ch), s = link ? fromQuery(link) : null;
    if (!s || s.ed !== b.ed || !E.sameClasses(E.charClasses(D, s), E.charClasses(D, b))) s = normalize(b);
    else { s.sub = b.sub; s.otherSub = b.otherSub; s.ab = b.ab; s.other = b.other; s.otherFirst = b.otherFirst; s = normalize(s); }
    s.name = ch.name; s.charId = ch.id;
    return s;
  }
  function sameBuild(a, b) {
    var k = function (x) { return toQuery(Object.assign({}, x, { name: '', show: 0 })); };
    return k(a) === k(b);
  }
  function isDirty() { return !state.charId && toQuery(state) !== cleanKey; }
  function applyChar(ch, s) {
    state = s; presetId = ''; conflict = false;
    lastKey = fieldsKey(ch); cleanKey = toQuery(state);
  }
  function followChar(ch) {
    var s = stateFromChar(ch);
    if (!s) { toast(ch.name + ' has no Paladin, Warlock or Sorcerer levels, so the planner kept your current build.'); return false; }
    applyChar(ch, s);
    toast('Loaded character "' + ch.name + '".' + (s.other.length ? ' Its ' + s.other.map(function (o) { return otherName(o.cls) + ' ' + o.lvl; }).join(' and ') + ' levels are locked here.' : ''));
    return true;
  }
  function splitText(s) {
    var n = {}; s.levels.forEach(function (id) { n[id] = (n[id] || 0) + 1; });
    var mine = D.CLASS_ORDER.filter(function (id) { return n[id]; }).map(function (id) { return D.CLASSES[id].name + ' ' + n[id]; });
    var oth = s.other.map(function (o) { return otherName(o.cls) + ' ' + o.lvl; });
    return (s.otherFirst ? oth.concat(mine) : mine.concat(oth)).join(' / ');
  }
  // a character imported on the hub (ch.imp, STYLE.md 6g) that this site hasn't offered yet
  var IMP_SRC = { ddb: 'D&D Beyond', foundry: 'Foundry VTT', fc5: 'Fight Club 5' };
  function impOffer() {
    if (!C) return null;
    var ch = (state.charId && C.get(state.charId)) || C.active(), im = ch && ch.imp;
    if (!im || !im.at || !Array.isArray(im.classes) || !im.classes.length) return null;
    var seen = linkImpAt(ch);
    return !seen || String(im.at) > String(seen) ? ch : null;
  }
  function impLevel(im) { return (im.classes || []).reduce(function (t, c) { return t + (parseInt(c.lvl, 10) || 0); }, 0); }
  // remember that this import was offered, in our own links entry only
  function markImp(ch) {
    var v = ch.links && ch.links[REPO], next = { q: typeof v === 'string' ? v : v && v.q || null, impAt: ch.imp.at };
    if (!next.q) delete next.q;
    quietly(function () { C.setLink(ch.id, REPO, next); });
  }
  function buildFromImp(ch) {
    var im = ch.imp;
    var b = E.buildFromChar(D, { ed: im.ed || ch.ed, ab: Array.isArray(im.ab) && im.ab.length === 6 ? im.ab : ch.ab, name: im.name || ch.name,
      classes: im.classes.map(function (c) { return { cls: String(c.cls || '').toLowerCase(), lvl: parseInt(c.lvl, 10) || 1, sub: null, subName: c.subName || null }; }) });
    return b.levels.length ? normalize(b) : null;
  }
  function charBarHtml() {
    if (!C) return '';
    var ch = state.charId ? C.get(state.charId) : null, act = C.active();
    var io = !pendingShare && !conflict && impOffer();
    if (io) {
      var im = io.imp, srcName = IMP_SRC[im.src] || 'another site';
      var cls = im.classes.map(function (c) { return (c.cls || '').charAt(0).toUpperCase() + String(c.cls || '').slice(1) + ' ' + c.lvl; }).join(' / ');
      return '<span class="char-txt"><b>' + esc(io.name) + '</b> was imported from ' + esc(srcName) + ' (' + esc(cls) + ', level ' + impLevel(im) + '). ' +
        (state.charId === io.id ? 'Building from it replaces the build here; the level order is a guess you can change.' : 'Build from it to plan ahead; the level order is a guess you can change.') + '</span>' +
        '<span class="char-acts"><button type="button" class="btn btn-accent" data-imp="build">Build from the character imported from ' + esc(srcName) + '</button>' +
        '<button type="button" class="btn" data-imp="skip">Not now</button></span>';
    }
    var ps = pendingShare && C.get(pendingShare.id);
    if (ps) {
      return '<span class="char-txt"><b>' + esc(ps.name) + '</b> was shared with you with its own Multiclass Planner build (' + esc(splitText(pendingShare.s)) + '), which differs from ' +
        (state.charId === ps.id ? 'the build here' : 'your current build') + '.</span>' +
        '<span class="char-acts"><button type="button" class="btn btn-accent" data-share="load">Load the shared build</button>' +
        '<button type="button" class="btn" data-share="keep">Keep mine</button></span>';
    }
    if (ch && conflict) {
      return '<span class="char-txt"><b>' + esc(ch.name) + '</b> was changed on another site or in another tab while you were editing here.</span>' +
        '<span class="char-acts"><button type="button" class="btn btn-accent" data-char="theirs">Load its version</button>' +
        '<button type="button" class="btn" data-char="mine">Keep mine</button></span>';
    }
    if (ch) {
      var acts = (C.copyShare ? '<button type="button" class="btn" id="charShare" title="Copy a link that adds this character, with this build, in another browser">Share character</button>' : '') +
        '<a class="btn" href="' + esc(C.url('dnd-magic', ch.id)) + '">Spells for this character</a>' +
        '<a class="btn" href="' + esc(C.url('dnd-items', ch.id)) + '">Items</a>';
      if (ch.classes.some(function (c) { return c.cls === 'druid'; })) acts += '<a class="btn" href="' + esc(C.url('dnd-druid-wildshapes', ch.id)) + '">Wild Shape</a>';
      return '<span class="char-txt">Character <b>' + esc(ch.name) + '</b> (' + esc(C.summary(ch)) + '). Changes here update it on every D&amp;D Toolbox site.</span>' +
        '<span class="char-acts">' + acts + '</span>';
    }
    var save = '<button type="button" class="btn btn-accent" id="charBtn">Save as character</button>';
    if (act) {
      var usable = !!stateFromChar(act);
      return '<span class="char-txt">Character <b>' + esc(act.name) + '</b> is selected in the header, but this build isn\'t linked to it. ' +
        (usable ? 'Load it, or save this build as a new character.' : 'It has no Paladin, Warlock or Sorcerer levels; you can save this build as a new character.') + '</span>' +
        '<span class="char-acts">' + (usable ? '<button type="button" class="btn" id="charFollow">Load ' + esc(act.name) + '</button>' : '') + save + '</span>';
    }
    return '<span class="char-txt">This build isn\'t one of your characters yet. <b>Save as character</b> adds it to your D&amp;D Toolbox characters (Characters, Character Sheet, Party, Spell Planner and the rest); <b>Save</b> above only keeps it in this planner.</span>' +
      '<span class="char-acts">' + save + '</span>';
  }
  function renderChar() {
    // only touch the (aria-live) bar when its content really changes
    var h = charBarHtml();
    if (h !== charHtml) { $('charBar').innerHTML = h; charHtml = h; }
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
    renderCharts(r);
    syncUrl();
    renderChar();
  }

  function renderControls() {
    document.querySelectorAll('button[data-ed]').forEach(function (b) { var on = b.dataset.ed === state.ed; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    if (document.activeElement !== $('bName')) $('bName').value = state.name;
    $('notes2024').classList.toggle('dim', state.ed !== '2024');
    var ps = $('preset');
    if (ps.dataset.listEd !== state.ed) {
      ps.dataset.listEd = state.ed;
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
    // either-or prerequisites (Fighter: Str 13 or Dex 13): flag both only when neither is met
    if (r.used.length > 1) r.used.forEach(function (id) {
      var any = D.CLASSES[id].prereqAny;
      if (any && !Object.keys(any).some(function (k) { return state.ab[ABIL.indexOf(k)] >= any[k]; })) Object.keys(any).forEach(function (k) { need[k] = Math.max(need[k] || 0, any[k]); });
    });
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
    var off = r.offset;
    var html = r.used.map(function (id) {
      var c = D.CLASSES[id], e = c.ed[state.ed];
      var at = 0; for (var i = 0, n = 0; i < state.levels.length; i++) if (state.levels[i] === id && ++n === e.subclassLevel) { at = off + i + 1; break; }
      if (at > 20) at = 0;
      var os = !state.sub[id] && state.otherSub[id];
      var opts = '<option value="">Choose...</option>' +
        (os ? '<option value="~" selected>' + esc(os.subName + ' (kept from your character; not in this list)') + '</option>' : '') +
        e.subclasses.map(function (s) {
          return '<option value="' + s.id + '"' + (state.sub[id] === s.id ? ' selected' : '') + '>' + esc(s.name + ' - ' + s.source) + '</option>';
        }).join('');
      var sel = E.findSub(D, id, state.ed, state.sub[id]);
      var hint = at ? 'Picked at character level ' + at + ' (' + c.name + ' ' + e.subclassLevel + ').' : 'Needs ' + c.name + ' ' + e.subclassLevel + '; this build never gets there.';
      if (os && at) hint += ' The planner has no details for ' + os.subName + '; pick one from the list to see its features.';
      return '<div class="sub-row"><label for="sub-' + id + '">' + esc(c.name + ': ' + e.subclassLabel) + '</label>' +
        '<select id="sub-' + id + '" data-sub="' + id + '"' + (at ? '' : ' disabled') + '>' + opts + '</select>' +
        '<span class="hint">' + esc(hint) + (sel && at ? ' ' + esc(sel.summary) : '') + '</span></div>';
    }).join('');
    if (state.ed === '2014' && r.counts.warlock >= 3) {
      var at3 = 0; for (var i = 0, n = 0; i < state.levels.length; i++) if (state.levels[i] === 'warlock' && ++n === 3) { at3 = off + i + 1; break; }
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
    var narrow = narrowMq ? narrowMq.matches : false, len = state.levels.length, locked = r.locked, off = r.offset;
    var sig = [narrow, len, JSON.stringify(state.other), state.otherFirst].join('|');
    if (wrap.dataset.sig !== sig) {
      wrap.dataset.sig = sig;
      var opts = D.CLASS_ORDER.slice().sort(byName).map(function (id) { var c = D.CLASSES[id]; return '<option value="' + id + '">' + esc(narrow ? c.short || c.name : c.name) + '</option>'; }).join('');
      var lockH = '', L0 = off ? 1 : len + 1;
      state.other.forEach(function (o) {
        for (var k = 0; k < o.lvl && L0 <= 20; k++, L0++) lockH += '<div class="lv locked" title="' + esc(otherName(o.cls)) + ' levels come from your character and are locked"><span>Level ' + L0 + '</span><b>' + esc(otherName(o.cls)) + '</b></div>';
      });
      var h = '';
      for (var i = 0; i < len; i++) h += '<label class="lv" id="lv' + i + '"><span>Level ' + (off + i + 1) + '</span><select data-lv="' + i + '" aria-label="Class at level ' + (off + i + 1) + '">' + opts + '</select></label>';
      wrap.innerHTML = off ? lockH + h : h + lockH;
      var fo = ''; for (i = 1; i <= len; i++) fo += '<option value="' + i + '">' + (off + i) + '</option>';
      $('fillFrom').innerHTML = fo;
      $('fillTo').textContent = 'to ' + (off + len) + ' as';
      $('fillCls').innerHTML = D.CLASS_ORDER.slice().sort(byName).map(function (id) { return '<option value="' + id + '">' + esc(D.CLASSES[id].name) + '</option>'; }).join('');
    }
    for (var j = 0; j < len; j++) {
      var cell = $('lv' + j), sel = cell.querySelector('select');
      for (var oi = 0; oi < sel.options.length; oi++) {
        var op = sel.options[oi], ok = canAdd(state, op.value, j);
        op.disabled = !ok; op.title = ok ? '' : LIMIT_MSG;
      }
      sel.value = state.levels[j];
      cell.className = 'lv c-' + state.levels[j] + (off + j + 1 > state.show ? ' future' : '');
    }
    var last = r.rows[r.rows.length - 1].counts;
    if (!$('splitN')) $('split').innerHTML = 'Level <span id="splitN">' + (len + locked) + '</span> / 20';
    if (window.DndUI) DndUI.count($('splitN'), len + locked); else $('splitN').textContent = len + locked;
    var lockedSteps = state.other.map(function (o) {
      return '<div class="step locked"><span class="step-name">' + esc(otherName(o.cls)) + (o.subName ? ' <small>(' + esc(o.subName) + ')</small>' : '') + '</span>' +
        '<div class="step-ctl"><span class="lock-n" title="Locked: a class the planner does not model">' + o.lvl + ' <small>locked</small></span>' +
        (state.charId ? '' : '<button type="button" class="btn" data-rmother="' + esc(o.cls) + '">Remove</button>') + '</div></div>';
    }).join('');
    var inUse = D.CLASS_ORDER.filter(function (id) { return last[id]; });
    var room0 = 20 - len - locked, full = !canAdd(state, '__new__');
    var addable = D.CLASS_ORDER.filter(function (id) { return !last[id]; }).sort(byName);
    var addH = '<div class="step add-cls"><label for="addCls">Add a class</label><div class="step-ctl">' +
      '<select id="addCls"' + (full ? ' disabled' : '') + '><option value="">' + (full ? 'Up to ' + (D.MAX_CLASSES || 3) + ' classes' : 'Choose...') + '</option>' +
      addable.map(function (id) { return '<option value="' + id + '">' + esc(D.CLASSES[id].name) + '</option>'; }).join('') + '</select></div>' +
      (full ? '<p class="hint small muted">' + esc(LIMIT_MSG) + '</p>' : !room0 ? '<p class="hint small muted">At level 20, a new class takes over your last level.</p>' : '') + '</div>';
    $('clsSteps').innerHTML = inUse.map(function (id) {
      var c = D.CLASSES[id], n = last[id] || 0, room = room0;
      var canDown = n > 0 && !(n === len), canUp = room > 0;
      return '<div class="step c-' + id + (n ? '' : ' zero') + '"><label for="cnt-' + id + '">' + esc(c.name) + '</label>' +
        '<div class="step-ctl"><button type="button" class="btn" data-step="' + id + '" data-d="-1" aria-label="One less ' + esc(c.name) + ' level"' + (canDown ? '' : ' disabled') + '>&minus;</button>' +
        '<input type="number" inputmode="numeric" min="0" max="20" id="cnt-' + id + '" data-cnt="' + id + '" value="' + n + '">' +
        '<button type="button" class="btn" data-step="' + id + '" data-d="1" aria-label="One more ' + esc(c.name) + ' level"' + (canUp ? '' : ' disabled') + '>+</button></div></div>';
    }).join('') + lockedSteps + addH;
  }

  /* Change how many levels a class has. Keeps the existing order; removes that class's last levels
     or adds new ones at the end. The total stays between 1 and 20. */
  function setCount(id, n) {
    var lv = state.levels, cur = lv.filter(function (x) { return x === id; }).length, others = lv.length - cur, locked = lockedCount(state);
    if (!cur && n > 0 && !canAdd(state, id)) { toast(LIMIT_MSG); return; }
    n = Math.max(others ? 0 : 1, Math.min(20 - others - locked, isNaN(n) ? cur : n));
    if (n === cur) return;
    var followEnd = state.show === totalLevel(state);
    if (n < cur) { var drop = cur - n; for (var i = lv.length - 1; i >= 0 && drop; i--) if (lv[i] === id) { lv.splice(i, 1); drop--; } }
    else for (var k = cur; k < n; k++) lv.push(id);
    state.show = followEnd ? totalLevel(state) : Math.min(state.show, totalLevel(state));
    presetId = '';
  }

  function splitHtml(counts, r, upTo) {
    var oc = {}, order = [];
    if (r) r.rows.slice(0, upTo).forEach(function (row) { if (row.locked) { if (!oc[row.other]) order.push(row.other); oc[row.other] = row.n; } });
    var mine = D.CLASS_ORDER.filter(function (id) { return counts[id]; })
      .map(function (id) { return '<span class="c-' + id + '">' + esc(D.CLASSES[id].name) + ' ' + counts[id] + '</span>'; });
    var oth = order.map(function (c) { return '<span class="c-other">' + esc(otherName(c)) + ' ' + oc[c] + '</span>'; });
    return (state.otherFirst ? oth.concat(mine) : mine.concat(oth)).join(' / ');
  }

  function hitDiceHtml(counts) {
    var con = Math.floor((state.ab[2] - 10) / 2), by = {};
    D.CLASS_ORDER.forEach(function (id) { if (counts[id]) by[D.CLASSES[id].hitDie] = (by[D.CLASSES[id].hitDie] || 0) + counts[id]; });
    var dice = Object.keys(by).map(Number).sort(function (a, b) { return b - a; });
    if (!dice.length) return '<span class="none">none</span>';
    return dice.map(function (d) {
      var expr = '1d' + d + (con ? (con > 0 ? '+' : '') + con : '');
      return '<span class="hd-part">' + by[d] + '<span data-roll="' + expr + '" data-roll-label="Hit die (short rest)">d' + d + '</span></span>';
    }).join(' + ');
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
    (res.extra || []).forEach(function (x) { b.push('<span title="' + esc(x.title) + '">' + esc(x.label) + ' ' + esc(x.v) + '</span>'); });
    return b.length ? '<div class="res">' + b.join('') + '</div>' : '';
  }

  // one DC per casting ability (classes that share an ability share a DC)
  function dcHtml(dcs) {
    var seen = {}, out = [];
    dcs.forEach(function (d) {
      if (seen[d.abil]) { seen[d.abil].names.push(D.CLASSES[d.cls].short || D.CLASSES[d.cls].name); return; }
      seen[d.abil] = { d: d, names: [D.CLASSES[d.cls].short || D.CLASSES[d.cls].name] }; out.push(seen[d.abil]);
    });
    if (out.length === 1) return out[0].d.dc + ' / ' + sgn(out[0].d.atk);
    return out.map(function (x) { return '<span class="dc-part">' + x.d.dc + ' / ' + sgn(x.d.atk) + ' <small class="muted">' + esc(ABIL_NAME[x.d.abil] + ', ' + x.names.join(' & ')) + '</small></span>'; }).join(' ');
  }
  // two small step charts: slots (spell + pact, same scale) and hit points (their own scale)
  var slotPlot = null, hpPlot = null;
  function renderCharts(r) {
    if (!window.DndPlot) return;
    var labels = r.rows.map(function (row) { return row.L; });
    var spell = r.rows.map(function (row) { return row.slots.reduce(function (a, b) { return a + b; }, 0); });
    var pact = r.rows.map(function (row) { return row.pact ? row.pact.count : 0; });
    var series = [];
    if (spell.some(Boolean)) series.push({ name: 'Spell slots', values: spell });
    if (pact.some(Boolean)) series.push({ name: 'Pact slots', values: pact });
    $('slotNone').hidden = !!series.length;
    $('slotChart').hidden = !series.length;
    if (series.length) {
      var so = { labels: labels, series: series, curve: 'step', xLabel: 'Character level', yLabel: 'Slots', title: 'Spell and pact slots by character level' };
      if (slotPlot) slotPlot.update(so); else slotPlot = DndPlot.line($('slotChart'), so);
    }
    var ho = { labels: labels, series: [{ name: 'Hit points (average)', values: r.rows.map(function (row) { return row.hp; }) }], curve: 'step', area: true,
      xLabel: 'Character level', yLabel: 'HP', title: 'Average hit points by character level' };
    if (hpPlot) hpPlot.update(ho); else hpPlot = DndPlot.line($('hpChart'), ho);
  }
  // Feats & Origins (dnd-feats): what the character can take at an ASI level, and the feats taken there (read-only)
  var FEATS = 'https://wernercd.github.io/dnd-feats/';
  function featsUrl(L, boon) {
    var p = new URLSearchParams();
    p.set('ed', state.ed);
    if (state.charId) { p.set('char', state.charId); p.set('at', L); p.set('show', 'ok'); }
    p.set('cat', boon ? 'Epic Boon' : state.ed === '2014' ? 'General|Racial' : 'General');
    return FEATS + '?' + p.toString();
  }
  function takenHtml() {
    var ch = C && state.charId ? C.get(state.charId) : null, df = ch && ch.links && ch.links['dnd-feats'];
    var ids = df && Array.isArray(df.taken) ? df.taken : [];
    if (!ids.length) return '';
    // entry ids look like "xphb_great-weapon-master": the part after the book code, title-cased
    var names = ids.slice(0, 12).map(function (id) {
      return String(id).replace(/^[^_]*_/, '').split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
    });
    return '<div class="small"><span class="muted">Taken in <a href="' + esc(FEATS + '?ed=' + state.ed + '&char=' + encodeURIComponent(state.charId) + '&show=taken') + '">Feats &amp; Origins</a>:</span> ' + names.map(function (n) { return '<span data-link="feat">' + esc(n) + '</span>'; }).join(', ') + '</div>';
  }
  function renderSummary(r) {
    var row = r.rows[state.show - 1];
    $('showOut').textContent = state.show;
    $('show').max = r.rows.length;
    $('show').value = state.show;
    $('show').disabled = r.rows.length < 2;
    var asis = r.asis.filter(function (L) { return L <= state.show; });
    var stats = [
      ['Split', '<span class="split-v">' + splitHtml(row.counts, r, state.show) + '</span>', 'wide'],
      ['Proficiency', sgn(row.prof)],
      ['Hit points', row.hp + ' <small class="muted">avg</small>'],
      ['Hit dice', hitDiceHtml(row.counts)],
      ['Spell DC / attack', row.dcs && row.dcs.length
        ? dcHtml(row.dcs) : '<span class="none">none</span>', row.dcs && row.dcs.length > 1 ? 'wide' : ''],
      ['Attacks', row.attacks + (row.attacks > 1 ? ' (Extra Attack)' : '')],
      ['Caster level', row.casterLevel || '0'],
      ['Spell slots', slotsHtml(row.slots), 'wide'],
      ['Pact Magic', row.pact ? pactHtml(row.pact) : '<span class="none">none</span>'],
      ['ASIs / feats', asis.length + (asis.length ? ' <small class="muted">(lvl ' + asis.join(', ') + ')</small>' : '') + takenHtml()],
      ['Saves', esc(r.saves)]
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
      var ctx = row.locked ? row.otherName + ' ' + row.n : D.CLASSES[row.cls].name + ' ' + row.n;
      var tag = row.locked ? '<span class="tag c-other">' + esc(row.otherName) + ' ' + row.n + '</span>' : '<span class="tag c-' + row.cls + '">' + esc(D.CLASSES[row.cls].name) + ' ' + row.n + '</span>';
      var feats = row.feats.map(function (f) {
        return '<p class="feat ' + f.kind + '" data-roll-entry><b>' + esc(f.name) + '.</b> ' + esc(f.text) + (f.src ? ' <span class="src">(' + esc(f.src) + ')</span>' : '') +
          (f.kind === 'asi' ? ' <a class="feat-link" href="' + esc(featsUrl(row.L, /Epic Boon/.test(f.name))) + '">' + (/Epic Boon/.test(f.name) ? 'Browse Epic Boons' : 'Browse feats') + '</a>' : '') + '</p>';
      }).join('') + row.notes.map(function (n) { return '<p class="rnote">' + esc(n) + '</p>'; }).join('');
      var cls = (row.L > state.show ? 'future' : row.L === state.show ? 'cur' : '') + (row.locked ? ' locked' : '');
      return '<tr class="' + cls + '" data-roll-ctx="' + esc(ctx) + '">' +
        '<td class="lvn">' + row.L + '<small>Prof ' + sgn(row.prof) + '</small></td>' +
        '<td class="c-cls">' + tag + '</td>' +
        '<td>' + (feats || '<span class="none">No new features</span>') + '</td>' +
        '<td><span class="mob">Spell slots' + (row.casterLevel ? ' (caster level ' + row.casterLevel + ')' : '') + '</span>' + slotsHtml(row.slots) + '</td>' +
        '<td>' + (row.pact ? '<span class="mob">Pact Magic</span>' + pactHtml(row.pact) : '') + '</td>' +
        '<td><span class="mob">Spells</span>' + spellsHtml(row.spells) + '</td>' +
        '<td>' + (resHtml(row.res) ? '<span class="mob">Resources</span>' + resHtml(row.res) : '') + '</td>' +
        '<td><span class="mob">HP</span>' + row.hp + '</td></tr>';
    }).join('');
  }

  // ---------- saved builds ----------
  // a plain lookup table, so names like "__proto__" or "constructor" are just names
  function savedList() {
    var raw = store.get('mcp.builds', {}), out = Object.create(null);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) Object.keys(raw).forEach(function (k) { if (raw[k] && typeof raw[k] === 'object') out[k] = raw[k]; });
    return out;
  }
  function renderSaved(selected) {
    var s = savedList(), names = Object.keys(s).sort(function (a, b) { return a.localeCompare(b); });
    $('saved').innerHTML = names.length
      ? '<option value="">Load a saved build...</option>' + names.map(function (n) { return '<option' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('')
      : '<option value="">None saved</option>';
  }
  var toastT;
  function toast(msg) {
    var t = $('toast'), was = t.textContent;
    t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(function () { t.textContent = ''; }, 3500);
    if (msg && !was && window.DndUI) DndUI.enter(t);
  }

  var SHORT_MSG = 'Short ddb.ac links can\'t be read from here. Open the link in your browser, then paste the dndbeyond.com/characters/... address it takes you to.';

  // ---------- events ----------
  function set(fn) { fn(); render(); }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.ed) return set(function () { state = normalize(Object.assign({}, state, { ed: t.dataset.ed })); presetId = ''; });
    if (t.id === 'fillBtn') return set(function () {
      var from = +$('fillFrom').value, cls = $('fillCls').value;
      var trial = { levels: state.levels.slice(0, from - 1).concat([cls]), other: state.other };
      if (Object.keys(classSet(trial)).length > (D.MAX_CLASSES || 3)) { toast(LIMIT_MSG); return; }
      for (var i = from - 1; i < state.levels.length; i++) state.levels[i] = cls;
      presetId = '';
    });
    if (t.id === 'saveBtn') {
      var name = (state.name || '').trim() || 'My build';
      var s = savedList(); // re-read, so another tab's saves are kept
      if (has(s, name) && !confirm('Replace the saved build "' + name + '"?')) return;
      state.name = name; s[name] = state;
      if (store.set('mcp.builds', s)) { toast('Saved "' + name + '" in this planner.' + (state.charId ? '' : ' To add it to your characters, use Save as character.')); cleanKey = toQuery(state); }
      else toast('Could not save: browser storage is unavailable.');
      renderSaved(name); render(); return;
    }
    if (t.id === 'delBtn') {
      var n = $('saved').value; if (!n) return toast('Pick a saved build to delete first.');
      if (!confirm('Delete the saved build "' + n + '" from this browser?')) return;
      var s2 = savedList(); delete s2[n]; store.set('mcp.builds', s2); renderSaved(''); toast('Deleted "' + n + '".'); return;
    }
    if (t.dataset.rmother) {
      var rc = t.dataset.rmother;
      if (!confirm('Remove the ' + otherName(rc) + ' levels from this build?')) return;
      return set(function () { state.other = state.other.filter(function (o) { return o.cls !== rc; }); state = normalize(state); });
    }
    if (t.id === 'charFollow') {
      var fa = C && C.active();
      if (fa && followChar(fa)) render();
      return;
    }
    if (t.dataset.char === 'theirs') {
      var th = C && C.get(state.charId), ts = th && stateFromChar(th);
      if (ts) { applyChar(th, ts); render(); toast('Loaded the latest version of "' + th.name + '".'); }
      else { conflict = false; delete state.charId; render(); }
      return;
    }
    if (t.dataset.imp) {
      var ich = impOffer(); if (!ich) { renderChar(); return; }
      if (t.dataset.imp === 'skip') { markImp(ich); renderChar(); return; }
      var ns = buildFromImp(ich);
      if (!ns) { markImp(ich); toast('The imported character has no classes the planner can use.'); renderChar(); return; }
      // never replace a saved build silently: ask when this character already has a different one here
      var had = state.charId === ich.id ? state : (linkQ(ich) ? fromQuery(linkQ(ich)) : null);
      if (had && !sameBuild(had, ns) && !confirm('Replace the build for ' + ich.name + ' with one made from the import?')) return;
      if (state.charId && state.charId !== ich.id) pushNow();
      markImp(ich);
      ns.charId = ich.id; ns.name = ich.name;
      applyChar(C.get(ich.id), ns); quietly(function () { C.setActive(ich.id); }); render(); pushNow();
      toast('Built ' + ich.name + ' from the import. Check the level order under Class levels.');
      return;
    }
    if (t.dataset.share) {
      var pend = pendingShare, pc = pend && C.get(pend.id); pendingShare = null; conflict = false;
      if (pc && t.dataset.share === 'load') {
        if (state.charId && state.charId !== pc.id) pushNow();
        applyChar(pc, pend.s); quietly(function () { C.setActive(pc.id); }); render(); pushNow();
        toast('Loaded the shared build for ' + pc.name + '.');
      } else { if (state.charId) pushNow(); renderChar(); toast('Kept your build.'); }
      return;
    }
    if (t.id === 'charShare') { pushNow(); var sc = C.get(state.charId); if (sc) C.copyShare(sc, REPO, t); return; }
    if (t.dataset.char === 'mine') { conflict = false; pushNow(); renderChar(); toast('Kept your version; it is saved to the character.'); return;
    }
    if (t.id === 'charBtn') {
      if (!C) return;
      var cname = (state.name || '').trim() || 'My build';
      state.name = cname;
      var m = quietly(function () { var x = C.save(charRecord(null), REPO); C.setActive(x.id); return x; });
      if (!m || !C.get(m.id)) return toast('Could not save: browser storage is unavailable.');
      state.charId = m.id; lastKey = fieldsKey(m); conflict = false; cleanKey = toQuery(state); shareBuild(m.id); render();
      toast('Saved "' + cname + '" as a character. Edits here now update it.');
      return;
    }
    if (t.dataset.step) return set(function () { setCount(t.dataset.step, (state.levels.filter(function (x) { return x === t.dataset.step; }).length) + (+t.dataset.d)); });
    if (t.id === 'ddbBtn') { $('ddbErr').hidden = true; $('ddbDlg').showModal(); $('ddbLink').focus(); return; }
    if (t.id === 'importClose') { $('importNote').hidden = true; return; }
    if (t.id === 'ddbGo') {
      var res;
      if (state.charId) pushNow();
      if (window.DdbImport.isShortLink($('ddbJson').value)) { $('ddbErr').hidden = false; $('ddbErr').textContent = SHORT_MSG; return; }
      try { res = window.DdbImport.parse(D, $('ddbJson').value.trim(), state.ed); }
      catch (e) { $('ddbErr').hidden = false; $('ddbErr').textContent = e instanceof SyntaxError ? 'That is not valid JSON. Copy the whole character data page and paste it again.' : e.message; return; }
      state = normalize(res); presetId = '';
      $('ddbDlg').close(); $('ddbJson').value = '';
      $('importBody').innerHTML = '<p><b>Imported ' + esc(state.name) + ' (level ' + res.total + ').</b></p><ul>' + res.notices.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
      $('importNote').hidden = false;
      if (window.DndUI) DndUI.enter($('importNote'));
      render(); return;
    }
    if (t.id === 'shareBtn') {
      syncUrl();
      var url = location.origin + location.pathname + toQuery(state);
      var done = function () { toast('Share link copied.'); if (window.DndUI) DndUI.pop(t); };
      try { navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); }); }
      catch (e) { prompt('Copy this link:', url); }
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.dataset.cnt) return set(function () { setCount(t.dataset.cnt, parseInt(t.value, 10)); });
    if (t.dataset.lv) {
      if (!canAdd(state, t.value, +t.dataset.lv)) { toast(LIMIT_MSG); t.value = state.levels[+t.dataset.lv]; return; }
      return set(function () { state.levels[+t.dataset.lv] = t.value; presetId = ''; });
    }
    if (t.id === 'addCls') {
      var nc = t.value; if (!nc) return;
      if (!canAdd(state, nc)) { toast(LIMIT_MSG); t.value = ''; return; }
      return set(function () {
        if (totalLevel(state) < 20) setCount(nc, 1);
        else if (state.levels.length > 1) { state.levels[state.levels.length - 1] = nc; presetId = ''; } // level 20: the last level changes class
      });
    }
    if (t.dataset.sub) return set(function () {
      var sid = t.dataset.sub;
      if (t.value === '~') return; // the subclass kept from the character
      if (t.value) state.sub[sid] = t.value; else delete state.sub[sid];
      delete state.otherSub[sid];
    });
    if (t.id === 'boon') return set(function () { state.boon = t.value; });
    if (t.id === 'preset') {
      var p = D.PRESETS.filter(function (x) { return x.id === t.value; })[0];
      t.value = '';
      if (p) { if (state.charId) pushNow(); set(function () { state = presetState(p); presetId = p.id; conflict = false; cleanKey = toQuery(state); }); }
      return;
    }
    if (t.id === 'saved') {
      var list = savedList(), s = has(list, t.value) ? list[t.value] : null, note = '';
      if (s) {
        if (state.charId) pushNow();
        set(function () {
          state = normalize(s); presetId = ''; conflict = false;
          var ch = state.charId && C ? C.get(state.charId) : null, now = ch && stateFromChar(ch);
          if (now && sameBuild(now, state)) {
            // still matches its character: link again and make it active
            quietly(function () { C.setActive(ch.id); });
            lastKey = fieldsKey(ch);
          } else {
            // the character has moved on (or is gone): load the old snapshot unlinked, leave the character alone
            if (ch) note = ' It was saved from ' + ch.name + ', which has changed since, so it was loaded unlinked and ' + ch.name + ' was left as it is.';
            delete state.charId;
          }
          cleanKey = toQuery(state);
        });
        toast('Loaded "' + t.value + '".' + note);
      }
    }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.dataset.ab) { var v = parseInt(t.value, 10); if (!isNaN(v)) set(function () { state.ab[+t.dataset.ab] = clampAb(v); }); return; }
    if (t.id === 'ddbLink') {
      var id = window.DdbImport.idFromLink(t.value), a = $('ddbOpen'), short = window.DdbImport.isShortLink(t.value);
      $('ddbErr').hidden = !short; if (short) $('ddbErr').textContent = SHORT_MSG;
      if (id) { a.href = window.DdbImport.apiUrl(id); a.removeAttribute('aria-disabled'); a.textContent = 'the character data for #' + id; }
      else { a.href = '#'; a.setAttribute('aria-disabled', 'true'); a.textContent = 'the character data'; }
      return;
    }
    if (t.id === 'bName') { state.name = t.value.slice(0, 60); syncUrl(); return; }
    if (t.id === 'show') return set(function () { state.show = +t.value; });
  });
  document.addEventListener('focusout', function (ev) {
    if (ev.target.dataset && ev.target.dataset.ab) render();
    if (pushTimer && ev.target.matches && ev.target.matches('input, select, textarea')) pushNow(); // blur saves at once
  });
  // edition radios: arrow keys move the choice (radio-group pattern)
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (!t.dataset || !t.dataset.ed || t.tagName !== 'BUTTON' || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(ev.key) < 0) return;
    ev.preventDefault();
    var btns = Array.prototype.slice.call(document.querySelectorAll('button[data-ed]')), i = btns.indexOf(t);
    var j = ev.key === 'Home' ? 0 : ev.key === 'End' ? btns.length - 1 : (i + (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 1) + btns.length) % btns.length;
    btns[j].click(); btns[j].focus();
  });
  // leaving the page (or following a hand-off link) saves pending character edits first
  window.addEventListener('pagehide', function () { pushNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') pushNow(); });
  $('ddbDlg').addEventListener('close', function () { $('ddbBtn').focus(); });
  // saved builds changed in another tab
  window.addEventListener('storage', function (e) { if (e.key === 'mcp.builds') renderSaved($('saved').value); });

  // theme toggle: theme.js (shared dnd.theme key)

  // ---------- start ----------
  $('metaList').innerHTML = D.METAMAGIC.map(function (m) { return '<li><b>' + esc(m[0]) + '.</b> ' + esc(m[1]) + '</li>'; }).join('');
  var restored = false;
  state = fromQuery(location.search); // a share link wins
  var act = C && C.active();
  var fromAct = act && stateFromChar(act);
  if (state && fromAct && toQuery(state) === toQuery(fromAct)) state.charId = act.id; // a reload keeps the link
  if (!state && fromAct) state = fromAct; // the active character (also set by ?char=)
  if (!state) { var cur = store.get('mcp.current', null); state = cur ? normalize(cur) : null; restored = !!state; }
  if (state && state.charId && !(fromAct && act.id === state.charId)) delete state.charId;
  if (!state) { state = presetState(D.PRESETS[0]); presetId = D.PRESETS[0].id; }
  if (state.charId) lastKey = fieldsKey(act);
  cleanKey = restored && !state.charId ? '' : toQuery(state); // a restored, unsaved build counts as work to protect
  renderSaved('');
  render();
  if (act && handleInbox(act)) render();
  // ?char=<id> for a character this browser doesn't have (character.js already removed it from the address)
  try {
    var nav = performance.getEntriesByType('navigation')[0], want = nav && new URL(nav.name).searchParams.get('char');
    if (want && C && !C.get(want)) toast('That character isn\'t in this browser. Characters are kept per browser, so it may have been made on another device.');
  } catch (e) { /* old browser */ }
  if (C) C.onChange(function (active) {
    if (writing) return;
    if (active && handleInbox(active)) { render(); return; } // a share link was just accepted
    if (active && pendingShare && pendingShare.id === active.id) { renderChar(); return; }
    if (!active) {
      // no character selected (or it was deleted): keep the build, drop the link
      // (a pending edit is saved first; DndChar.save() selects a character when none is, so clear it again)
      if (state.charId) { if (pushTimer) { pushNow(); quietly(function () { C.setActive(null); }); } delete state.charId; conflict = false; cleanKey = toQuery(state); render(); } else renderChar();
      return;
    }
    if (active.id === state.charId) {
      if (fieldsKey(active) === lastKey) { render(); return; } // only `updated` or another site's link changed (re-render: feats taken in Feats & Origins show in the summary)
      if (pushTimer || conflict) { clearTimeout(pushTimer); pushTimer = null; conflict = true; renderChar(); return; } // unsaved edits here: ask
      var s = stateFromChar(active);
      if (!s) { delete state.charId; render(); toast(active.name + ' no longer has Paladin, Warlock or Sorcerer levels, so the build here was unlinked.'); return; }
      applyChar(active, s); render();
      return;
    }
    // another character was picked
    if (state.charId) pushNow(); // edits so far are safe in the old character
    if (isDirty()) { renderChar(); toast(active.name + ' is selected. Your build here isn\'t saved, so it was kept; use "Load ' + active.name + '" to switch.'); return; }
    if (followChar(active)) render(); else { delete state.charId; render(); }
  });
  if (narrowMq) { try { narrowMq.addEventListener('change', render); } catch (e) { /* old Safari */ } }
})();
