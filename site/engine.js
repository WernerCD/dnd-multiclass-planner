/* Rules engine for the multiclass planner: pure functions, no DOM.
   Loaded by the page and by tools/check.js (Node). */
(function (root) {
  'use strict';

  // Multiclass Spellcaster table: slots per spell level (1st..9th) for caster levels 1-20.
  var MC_TABLE = [
    [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1]
  ];
  var ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  var ABIL_NAME = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };
  var ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

  function mod(score) { return Math.floor((score - 10) / 2); }
  function profBonus(L) { return 2 + Math.floor((L - 1) / 4); }
  function slotsForCasterLevel(cl) { return cl > 0 ? MC_TABLE[Math.min(cl, 20) - 1].slice() : []; }

  function hasSpellcasting(D, id, lv, ed) {
    var c = D.CLASSES[id];
    if (c.caster !== 'full' && c.caster !== 'half' && c.caster !== 'third') return false;
    return lv >= (c.ed[ed].spellcastingFrom || 1);
  }

  /* Caster level for the shared slot table. Pact Magic never counts.
     One Spellcasting class: use that class's own table (half casters = ceil(level/2) in both editions).
     Two or more: 2014 rounds half/third casters down, 2024 rounds half casters up (third casters down). */
  function casterLevel(D, counts, ed) {
    var casting = [];
    D.CLASS_ORDER.forEach(function (id) {
      var lv = counts[id] || 0;
      if (lv && hasSpellcasting(D, id, lv, ed)) casting.push({ id: id, lv: lv, type: D.CLASSES[id].caster });
    });
    var total = 0, multi = casting.length > 1;
    casting.forEach(function (c) {
      var add;
      if (c.type === 'full') add = c.lv;
      else if (c.type === 'half') add = (!multi || ed === '2024') ? Math.ceil(c.lv / 2) : Math.floor(c.lv / 2);
      else add = multi ? Math.floor(c.lv / 3) : Math.ceil(c.lv / 3);
      c.add = add; total += add;
    });
    return { level: total, multi: multi, parts: casting };
  }

  function pactAt(D, lv) {
    var p = D.CLASSES.warlock && D.CLASSES.warlock.pact;
    if (!p || !lv) return null;
    var arc = [];
    Object.keys(p.arcanum).forEach(function (k) { if (lv >= +k) arc.push(p.arcanum[k]); });
    return { count: p.slots[lv - 1], level: p.level[lv - 1], arcanum: arc };
  }

  function maxSpellLevel(D, id, lv, ed, pact) {
    var c = D.CLASSES[id];
    if (c.caster === 'pact') return pact ? pact.level : 0;
    if (!hasSpellcasting(D, id, lv, ed)) return 0;
    if (c.caster === 'full') return Math.min(9, Math.ceil(lv / 2));
    if (c.caster === 'half') return Math.min(5, Math.ceil(Math.ceil(lv / 2) / 2));
    return Math.min(4, Math.ceil(Math.ceil(lv / 3) / 2));
  }

  function spellsFor(D, id, lv, ed, chaMod) {
    var s = D.CLASSES[id].ed[ed].spells;
    if (!s) return 0;
    if (s.formula === 'chaHalfDown') return lv >= 2 ? Math.max(1, chaMod + Math.floor(lv / 2)) : 0;
    return s.table[lv - 1];
  }

  function findSub(D, id, ed, subId) {
    if (!subId) return null;
    var list = D.CLASSES[id].ed[ed].subclasses;
    for (var i = 0; i < list.length; i++) if (list[i].id === subId) return list[i];
    return null;
  }

  function codeMap(D) {
    var m = {};
    D.CLASS_ORDER.forEach(function (id) { m[D.CLASSES[id].code] = id; });
    return m;
  }
  function encodeLevels(D, levels) { return levels.map(function (id) { return D.CLASSES[id].code; }).join(''); }
  function decodeLevels(D, str) {
    // one letter per character level, 1-20 levels (a build can stop before 20)
    var m = codeMap(D), out = [], n = Math.max(1, Math.min(20, String(str || '').length));
    for (var i = 0; i < n; i++) out.push(m[(str || '').charAt(i).toUpperCase()] || null);
    var last = null;
    for (i = 0; i < n; i++) { if (out[i]) last = out[i]; else out[i] = last || D.CLASS_ORDER[0]; }
    return out;
  }

  function compute(D, build) {
    var ed = build.ed === '2024' ? '2024' : '2014';
    var ab = {}; ABIL.forEach(function (k, i) { ab[k] = +build.ab[i] || 10; });
    var chaMod = mod(ab.cha), conMod = mod(ab.con);
    var counts = {}; D.CLASS_ORDER.forEach(function (id) { counts[id] = 0; });
    var rows = [], hp = 0, hadExtraAttack = false, notesSeen = {};
    var first = build.levels[0];
    var milestones = [];
    var slotSeen = 0, pactSeen = 0, asis = [];

    function once(key, L, text) { if (!notesSeen[key]) { notesSeen[key] = L; return text; } return null; }

    var maxL = Math.max(1, Math.min(20, build.levels.length));
    for (var L = 1; L <= maxL; L++) {
      var id = build.levels[L - 1], cls = D.CLASSES[id], ce = cls.ed[ed];
      counts[id] += 1;
      var n = counts[id];
      var feats = [], notes = [];

      if (L === 1) feats.push({ name: 'Starting class', text: 'Saving throws: ' + cls.saves + '. You get all of its starting proficiencies.', kind: 'info' });
      else if (n === 1) feats.push({ name: 'Multiclass proficiencies', text: ce.mcProf, kind: 'info' });

      (ce.features[n] || []).forEach(function (f) {
        if (f[0] === ce.subclassLabel) return; // replaced by the pick line below
        var item = { name: f[0], text: f[1], kind: 'class' };
        if (f[0] === 'Extra Attack') {
          if (hadExtraAttack) item.text += " Doesn't stack with Extra Attack from another class.";
          hadExtraAttack = true;
        }
        if (id === 'warlock' && f[0] === 'Pact Boon') {
          var boon = (D.PACT_BOONS.filter(function (b) { return b.id === build.boon; })[0]);
          if (boon) item.text = boon.name + ': ' + boon.note;
        }
        feats.push(item);
      });

      var subId = build.sub && build.sub[id], sub = findSub(D, id, ed, subId);
      if (n === ce.subclassLevel) {
        if (sub) feats.push({ name: ce.subclassLabel + ': ' + sub.name, text: sub.summary + ' (' + sub.source + ')', kind: 'pick', cls: id });
        else feats.push({ name: 'Choose ' + ce.subclassLabel, text: 'Pick one in the Subclasses panel.', kind: 'pick-missing', cls: id });
        milestones.push({ L: L, text: sub ? cls.name + ' subclass: ' + sub.name : cls.name + ' subclass pick (not chosen)' });
      }
      if (sub && sub.features[n]) sub.features[n].forEach(function (f) { feats.push({ name: f[0], text: f[1], kind: 'sub' }); });
      else if (!sub && n !== ce.subclassLevel && ce.subclassFeatureLevels.indexOf(n) >= 0 && n > ce.subclassLevel)
        feats.push({ name: 'Subclass feature', text: 'From your ' + ce.subclassLabel.toLowerCase() + '.', kind: 'sub' });

      if (ce.asi.indexOf(n) >= 0) {
        feats.push({ name: ed === '2024' ? 'Ability Score Improvement (feat)' : 'Ability Score Improvement', text: '+2 to one score or +1 to two, or a feat instead.', kind: 'asi' });
        asis.push(L);
      }
      if (ce.epicBoon === n) { feats.push({ name: 'Epic Boon', text: 'An Epic Boon feat, or another feat you qualify for.', kind: 'asi' }); asis.push(L); }

      // casting
      var cl = casterLevel(D, counts, ed);
      var slots = slotsForCasterLevel(cl.level);
      var pact = pactAt(D, counts.warlock || 0);

      var spells = [];
      D.CLASS_ORDER.forEach(function (cid) {
        var lv = counts[cid]; if (!lv) return;
        var c = D.CLASSES[cid], e = c.ed[ed];
        spells.push({
          cls: cid, lv: lv,
          cantrips: e.cantrips ? e.cantrips[lv - 1] : 0,
          count: spellsFor(D, cid, lv, ed, chaMod),
          kind: e.spells.kind,
          max: maxSpellLevel(D, cid, lv, ed, cid === 'warlock' ? pact : null)
        });
      });

      var res = {};
      if (counts.paladin) {
        res.layOnHands = 5 * counts.paladin;
        var pl = counts.paladin;
        res.channel = ed === '2024' ? (pl >= 11 ? 3 : pl >= 3 ? 2 : 0) : (pl >= 3 ? 1 : 0);
      }
      if (counts.sorcerer) {
        var se = D.CLASSES.sorcerer.ed[ed];
        res.sorcery = counts.sorcerer >= se.sorceryFrom ? counts.sorcerer : 0;
        res.metamagic = se.metamagic[counts.sorcerer - 1];
      }
      if (counts.warlock) res.invocations = D.CLASSES.warlock.ed[ed].invocations[counts.warlock - 1];

      // hit points (first level max, then fixed average)
      hp += Math.max(1, (L === 1 ? cls.hitDie : cls.hitDie / 2 + 1) + conMod);

      // combination notes
      var smiteFrom = ed === '2024' ? 1 : 2;
      if (counts.paladin >= smiteFrom && counts.warlock) {
        var t = once('pactSmite', L, ed === '2024'
          ? 'Pact slots can cast Divine Smite (a paladin spell) and come back on a short rest. Smite damage follows the pact slot level.'
          : 'Pact slots can fuel Divine Smite and come back on a short rest. Smite damage follows the pact slot level (max 5d8, +1d8 vs undead or fiends).');
        if (t) notes.push(t);
      }
      if (counts.sorcerer >= 2 && counts.warlock) {
        t = once('fontPact', L, 'Font of Magic can turn pact slots into sorcery points (points = slot level). Pact slots return on a short rest, so the points refill too, up to your sorcerer level.');
        if (t) notes.push(t);
      }
      if (cl.multi) {
        t = once('mcTable', L, 'Two Spellcasting classes: slots now come from the multiclass table (caster level ' + cl.level + '). ' + D.ED_INFO[ed].halfNote);
        if (t) notes.push(t);
      }
      if (counts.warlock && cl.level) {
        t = once('pactShare', L, 'Pact slots and regular slots can cast spells from any of your classes, but warlock levels never add to the multiclass caster level.');
        if (t) notes.push(t);
      }
      if (counts.warlock >= 5) {
        t = once('thirst', L, ed === '2024'
          ? 'Thirsting Blade (needs the Pact of the Blade invocation) gives an extra attack with your pact weapon. It does not stack with Extra Attack.'
          : 'Thirsting Blade (needs Pact of the Blade) gives an extra attack with your pact weapon. It does not stack with Extra Attack.');
        if (t) notes.push(t);
      }
      if (cl.level && slots.length) {
        var topClass = 0;
        spells.forEach(function (s) { topClass = Math.max(topClass, s.max); });
        if (topClass && slots.length > topClass) {
          t = once('upcast', L, 'You have ' + ORD[slots.length] + '-level slots but learn spells only up to ' + ORD[topClass] + ' level; the higher slots upcast lower spells.');
          if (t) notes.push(t);
        }
      }

      // milestones
      if (slots.length > slotSeen) { for (var s = slotSeen + 1; s <= slots.length; s++) milestones.push({ L: L, text: 'First ' + ORD[s] + '-level spell slot' }); slotSeen = slots.length; }
      if (pact && pact.level > pactSeen) { milestones.push({ L: L, text: 'Pact slots reach ' + ORD[pact.level] + ' level (' + pact.count + ' slots)' }); pactSeen = pact.level; }
      feats.forEach(function (f) {
        var key = f.name;
        if (/^(Extra Attack|Aura of Protection|Aura of Courage|Divine Smite|Paladin's Smite|Improved Divine Smite|Radiant Strikes|Font of Magic|Eldritch Invocations|Pact Boon|Eldritch Master|Arcane Apotheosis|Sorcerous Restoration)$/.test(key) ||
            /^Mystic Arcanum/.test(key) || (key === 'Metamagic' && !notesSeen.mm)) {
          if (key === 'Metamagic') notesSeen.mm = L;
          milestones.push({ L: L, text: key + (key === 'Extra Attack' && f.text.indexOf("Doesn't stack") >= 0 ? ' (no extra benefit)' : '') });
        }
      });

      var c2 = {}; D.CLASS_ORDER.forEach(function (k) { c2[k] = counts[k]; });
      rows.push({
        L: L, cls: id, n: n, prof: profBonus(L), counts: c2,
        feats: feats, notes: notes, slots: slots, casterLevel: cl.level, casterParts: cl.parts,
        pact: pact, spells: spells, res: res, hp: hp,
        dc: 8 + profBonus(L) + chaMod, atk: profBonus(L) + chaMod,
        attacks: counts.paladin >= 5 ? 2 : 1
      });
    }

    // warnings
    var warnings = [];
    var used = D.CLASS_ORDER.filter(function (k) { return counts[k] > 0; });
    if (used.length > 1) {
      used.forEach(function (k) {
        var pre = D.CLASSES[k].prereq, miss = [];
        Object.keys(pre).forEach(function (a) { if (ab[a] < pre[a]) miss.push(ABIL_NAME[a] + ' ' + pre[a] + ' (you have ' + ab[a] + ')'); });
        if (miss.length) warnings.push({ cls: k, text: D.CLASSES[k].name + ' needs ' + miss.join(' and ') + ' to multiclass ' + (k === first ? 'out of it' : 'into it') + '.' });
      });
    }
    used.forEach(function (k) {
      var e = D.CLASSES[k].ed[ed];
      if (counts[k] >= e.subclassLevel && !findSub(D, k, ed, build.sub && build.sub[k]))
        warnings.push({ cls: k, soft: true, text: D.CLASSES[k].name + ' reaches its subclass at class level ' + e.subclassLevel + '; none is chosen yet.' });
    });
    if (counts.warlock >= 3 && ed === '2014' && !build.boon)
      warnings.push({ cls: 'warlock', soft: true, text: 'Warlock 3 gives a Pact Boon; none is chosen yet.' });

    milestones.sort(function (a, b) { return a.L - b.L; });
    return { ed: ed, rows: rows, counts: counts, used: used, warnings: warnings, milestones: milestones, asis: asis, first: first, ab: ab };
  }

  var API = {
    MC_TABLE: MC_TABLE, ABIL: ABIL, ABIL_NAME: ABIL_NAME, ORD: ORD,
    mod: mod, profBonus: profBonus, casterLevel: casterLevel, slotsForCasterLevel: slotsForCasterLevel,
    pactAt: pactAt, maxSpellLevel: maxSpellLevel, compute: compute, findSub: findSub,
    encodeLevels: encodeLevels, decodeLevels: decodeLevels
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PlannerEngine = API;
})(this);
