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
  function casterLevel(D, counts, ed, extra) {
    var casting = [];
    D.CLASS_ORDER.forEach(function (id) {
      var lv = counts[id] || 0;
      if (lv && hasSpellcasting(D, id, lv, ed)) casting.push({ id: id, lv: lv, type: D.CLASSES[id].caster });
    });
    (extra || []).forEach(function (x) { casting.push(x); });
    var total = 0, multi = casting.length > 1;
    casting.forEach(function (c) {
      var add;
      if (c.type === 'full') add = c.lv;
      else if (c.type === 'artificer') add = Math.ceil(c.lv / 2); // always rounds up
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

  function spellsFor(D, id, lv, ed, mods) {
    var s = D.CLASSES[id].ed[ed].spells;
    if (!s) return 0;
    if (s.formula === 'chaHalfDown') return lv >= 2 ? Math.max(1, mods.cha + Math.floor(lv / 2)) : 0;
    if (s.formula === 'abilLevel') return Math.max(1, mods[s.abil] + lv);
    return s.table[lv - 1];
  }

  // casting contribution of a class the planner doesn't model (null if none)
  function otherCasting(D, o, lv, ed) {
    var info = D.OTHER_CLASSES && D.OTHER_CLASSES[o.cls];
    if (!info || !lv) return null;
    if (info.caster === 'full' || info.caster === 'artificer') return { id: o.cls, lv: lv, type: info.caster };
    if (info.caster === 'half') return lv >= (ed === '2014' ? 2 : 1) ? { id: o.cls, lv: lv, type: 'half' } : null;
    if (info.thirdSub && info.thirdSub.test(o.subName || o.sub || '') && lv >= 3) return { id: o.cls, lv: lv, type: 'third' };
    return null;
  }
  function otherTotal(build) { return (build.other || []).reduce(function (t, o) { return t + o.lvl; }, 0); }
  // the full level sequence: planner class ids, plus {other} entries for locked levels
  function sequence(build) {
    var locked = [];
    (build.other || []).forEach(function (o) { for (var i = 0; i < o.lvl; i++) locked.push({ other: o }); });
    var seq = build.otherFirst === false ? build.levels.concat(locked) : locked.concat(build.levels);
    return seq.slice(0, 20);
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
    var chaMod = mod(ab.cha), conMod = mod(ab.con), mods = {};
    ABIL.forEach(function (k) { mods[k] = mod(ab[k]); });
    var isCaster = function (cid) { var c = D.CLASSES[cid]; return c.caster && c.caster !== 'none'; };
    // spell save DC and attack for each class that casts (by that class's ability)
    function dcsAt(L) {
      var out = [];
      D.CLASS_ORDER.forEach(function (cid) {
        if (!counts[cid] || !isCaster(cid)) return;
        var ab0 = D.CLASSES[cid].castAbil || 'cha';
        out.push({ cls: cid, abil: ab0, dc: 8 + profBonus(L) + mods[ab0], atk: profBonus(L) + mods[ab0] });
      });
      return out;
    }
    var counts = {}; D.CLASS_ORDER.forEach(function (id) { counts[id] = 0; });
    var rows = [], hp = 0, hadExtraAttack = false, notesSeen = {};
    var seq = sequence(build), oc = {};
    var firstOther = seq[0] && seq[0].other ? seq[0].other : null;
    var first = firstOther ? null : seq[0];
    var milestones = [];
    var slotSeen = 0, pactSeen = 0, asis = [];

    function once(key, L, text) { if (!notesSeen[key]) { notesSeen[key] = L; return text; } return null; }

    function extraCasting() {
      var x = [];
      (build.other || []).forEach(function (o) { var c = otherCasting(D, o, oc[o.cls] || 0, ed); if (c) x.push(c); });
      return x;
    }
    function otherAttacks() {
      var a = 1;
      (build.other || []).forEach(function (o) {
        var info = D.OTHER_CLASSES[o.cls], lv = oc[o.cls] || 0;
        if (info && info.extraAttack) info.extraAttack.forEach(function (t, i) { if (lv >= t) a = Math.max(a, i + 2); });
      });
      return a;
    }
    function attacksAt() {
      var a = otherAttacks();
      D.CLASS_ORDER.forEach(function (cid) {
        (D.CLASSES[cid].extraAttack || []).forEach(function (t, i) { if (counts[cid] >= t) a = Math.max(a, i + 2); });
      });
      return a;
    }

    var maxL = Math.max(1, seq.length);
    for (var L = 1; L <= maxL; L++) {
      if (seq[L - 1].other) {
        // a locked level in a class the planner doesn't model
        var o = seq[L - 1].other, info = D.OTHER_CLASSES[o.cls] || { name: o.cls.charAt(0).toUpperCase() + o.cls.slice(1), hitDie: 8 };
        oc[o.cls] = (oc[o.cls] || 0) + 1;
        var lf = [];
        if (L === 1) lf.push({ name: 'Starting class', text: info.saves ? 'Saving throws: ' + info.saves + '.' : 'Its saving throws apply.', kind: 'info' });
        lf.push({ name: info.name + ' ' + oc[o.cls] + (o.subName ? ' (' + o.subName + ')' : ''), text: 'A class the planner does not model. Its levels come from your character and are locked here.', kind: 'locked' });
        var atk0 = attacksAt();
        if (otherAttacks() > 1) hadExtraAttack = true;
        hp += Math.max(1, (L === 1 ? info.hitDie : info.hitDie / 2 + 1) + conMod);
        var clo = casterLevel(D, counts, ed, extraCasting());
        var c0 = {}; D.CLASS_ORDER.forEach(function (k) { c0[k] = counts[k]; });
        var prev = rows.length ? rows[rows.length - 1] : null;
        rows.push({ L: L, locked: true, other: o.cls, otherName: info.name, n: oc[o.cls], prof: profBonus(L), counts: c0,
          feats: lf, notes: [], slots: slotsForCasterLevel(clo.level), casterLevel: clo.level, casterParts: clo.parts,
          pact: pactAt(D, counts.warlock || 0), spells: prev ? prev.spells : [], res: prev ? prev.res : {}, hp: hp,
          dcs: dcsAt(L), dc: 8 + profBonus(L) + chaMod, atk: profBonus(L) + chaMod, attacks: atk0 });
        continue;
      }
      var id = seq[L - 1], cls = D.CLASSES[id], ce = cls.ed[ed];
      counts[id] += 1;
      var n = counts[id];
      var feats = [], notes = [];

      if (L === 1) feats.push({ name: 'Starting class', text: 'Saving throws: ' + cls.saves + '. You get all of its starting proficiencies.', kind: 'info' });
      else if (n === 1) feats.push({ name: 'Multiclass proficiencies', text: ce.mcProf, kind: 'info' });

      (ce.features[n] || []).forEach(function (f) {
        if (f[0] === ce.subclassLabel) return; // replaced by the pick line below
        var item = { name: f[0], text: f[1], kind: 'class' };
        if (f[0] === 'Extra Attack') {
          if (hadExtraAttack || otherAttacks() > 1) item.text += " Doesn't stack with Extra Attack from another class.";
          hadExtraAttack = true;
        }
        if (id === 'warlock' && f[0] === 'Pact Boon') {
          var boon = (D.PACT_BOONS.filter(function (b) { return b.id === build.boon; })[0]);
          if (boon) item.text = boon.name + ': ' + boon.note;
        }
        feats.push(item);
      });

      var subId = build.sub && build.sub[id], sub = findSub(D, id, ed, subId);
      var osub = !sub && build.otherSub && build.otherSub[id];
      if (n === ce.subclassLevel && osub) {
        feats.push({ name: ce.subclassLabel + ': ' + osub.subName, text: 'Kept from your character. It is not in the planner\'s ' + ed + ' list, so its features are not shown.', kind: 'pick', cls: id });
        milestones.push({ L: L, text: cls.name + ' subclass: ' + osub.subName });
      } else if (n === ce.subclassLevel) {
        if (sub) feats.push({ name: ce.subclassLabel + ': ' + sub.name, text: sub.summary + ' (' + sub.source + ')', kind: 'pick', cls: id });
        else feats.push({ name: 'Choose ' + ce.subclassLabel, text: 'Pick one in the Subclasses panel.', kind: 'pick-missing', cls: id });
        milestones.push({ L: L, text: sub ? cls.name + ' subclass: ' + sub.name : cls.name + ' subclass pick (not chosen)' });
      }
      if (sub && sub.features[n]) sub.features[n].forEach(function (f) { feats.push({ name: f[0], text: f[1], kind: 'sub' }); });
      else if (!sub && n !== ce.subclassLevel && ce.subclassFeatureLevels.indexOf(n) >= 0 && n > ce.subclassLevel)
        feats.push({ name: 'Subclass feature', text: 'From your ' + (osub ? osub.subName : ce.subclassLabel.toLowerCase()) + '.', kind: 'sub' });

      if (ce.asi.indexOf(n) >= 0) {
        feats.push({ name: ed === '2024' ? 'Ability Score Improvement (feat)' : 'Ability Score Improvement', text: '+2 to one score or +1 to two, or a feat instead.', kind: 'asi' });
        asis.push(L);
      }
      if (ce.epicBoon === n) { feats.push({ name: 'Epic Boon', text: 'An Epic Boon feat, or another feat you qualify for.', kind: 'asi' }); asis.push(L); }

      // casting
      var cl = casterLevel(D, counts, ed, extraCasting());
      var slots = slotsForCasterLevel(cl.level);
      var pact = pactAt(D, counts.warlock || 0);

      var spells = [];
      D.CLASS_ORDER.forEach(function (cid) {
        var lv = counts[cid]; if (!lv || !isCaster(cid)) return;
        var c = D.CLASSES[cid], e = c.ed[ed];
        spells.push({
          cls: cid, lv: lv,
          cantrips: e.cantrips ? e.cantrips[lv - 1] : 0,
          count: spellsFor(D, cid, lv, ed, mods),
          kind: e.spells ? e.spells.kind : '',
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
      res.extra = [];
      D.CLASS_ORDER.forEach(function (cid) {
        var lv = counts[cid], list = lv && D.CLASSES[cid].ed[ed].res;
        if (!list) return;
        var sid = (build.sub && build.sub[cid]) || (build.otherSub && build.otherSub[cid] && build.otherSub[cid].sub) || null;
        list.forEach(function (r) { var v = r.at(lv, sid); if (v) res.extra.push({ key: r.key, label: r.label, title: r.title, v: v }); });
      });

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
      if (counts.barbarian && D.CLASS_ORDER.some(function (cid) { return counts[cid] && isCaster(cid); })) {
        t = once('rageCast', L, 'While raging you can\'t cast spells or keep concentration, so plan rage turns and casting turns separately.');
        if (t) notes.push(t);
      }
      if (counts.barbarian && counts.druid >= 2) {
        t = once('rageShape', L, ed === '2024'
          ? 'Rage works in Wild Shape. 2024 Wild Shape gives temporary HP instead of a separate HP pool, and rage resistance halves damage before it reaches them. Resistances don\'t stack (see Rules notes).'
          : 'Rage works in Wild Shape: the beast\'s HP takes damage first (halved by rage), and only the overflow reaches your own HP. Resistances don\'t stack (see Rules notes).');
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
        if (/^(Extra Attack|Rage|Wild Shape|Brutal Critical|Brutal Strike|Elemental Fury|Archdruid|Primal Champion|Aura of Protection|Aura of Courage|Divine Smite|Paladin's Smite|Improved Divine Smite|Radiant Strikes|Font of Magic|Eldritch Invocations|Pact Boon|Eldritch Master|Arcane Apotheosis|Sorcerous Restoration)$/.test(key) ||
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
        dcs: dcsAt(L), dc: 8 + profBonus(L) + chaMod, atk: profBonus(L) + chaMod,
        attacks: attacksAt()
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
      if (counts[k] >= e.subclassLevel && !findSub(D, k, ed, build.sub && build.sub[k]) && !(build.otherSub && build.otherSub[k]))
        warnings.push({ cls: k, soft: true, text: D.CLASSES[k].name + ' reaches its subclass at class level ' + e.subclassLevel + '; none is chosen yet.' });
    });
    if (counts.warlock >= 3 && ed === '2014' && !build.boon)
      warnings.push({ cls: 'warlock', soft: true, text: 'Warlock 3 gives a Pact Boon; none is chosen yet.' });

    var nClasses = used.length + (build.other || []).length;
    if (nClasses > (D.MAX_CLASSES || 3))
      warnings.push({ text: 'This build has ' + nClasses + ' classes. The planner plans up to ' + (D.MAX_CLASSES || 3) + '; remove one to add or change classes.' });
    milestones.sort(function (a, b) { return a.L - b.L; });
    var saves = first ? D.CLASSES[first].saves : ((D.OTHER_CLASSES[firstOther.cls] || {}).saves || '');
    return { ed: ed, rows: rows, counts: counts, used: used, warnings: warnings, milestones: milestones, asis: asis, first: first, saves: saves, ab: ab,
      locked: otherTotal(build), offset: build.otherFirst === false ? 0 : Math.min(20, otherTotal(build)) };
  }

  // ---------- shared characters (dnd.characters, see character.js) ----------
  // Subclass names as the shared matcher compares them (same rules as DndChar.sameSub)
  function subKey(s) {
    return String(s || '').toLowerCase().replace(/\(.*?\)/g, '')
      .replace(/^(the|oath of( the)?|circle of( the)?|college of|path of( the)?|way of( the)?|school of|domain of|order of( the)?)\s+/, '')
      .replace(/\s+(domain|patron|bloodline|sorcery|soul|archetype|conclave|tradition|magic)$/, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  // build -> shared classes [{cls, lvl, sub, subName}], in the order the classes were first taken
  // (planner classes only; a subclass the planner doesn't list is carried in build.otherSub)
  function charClasses(D, build) {
    var order = [], counts = {};
    build.levels.forEach(function (id) { if (!counts[id]) { counts[id] = 0; order.push(id); } counts[id]++; });
    return order.map(function (id) {
      var s = findSub(D, id, build.ed, build.sub && build.sub[id]), o = !s && build.otherSub && build.otherSub[id];
      return { cls: D.CLASSES[id].name.toLowerCase(), lvl: counts[id], sub: s ? s.id : o ? o.sub || null : null, subName: s ? s.name : o ? o.subName || null : null };
    });
  }
  // shared character -> planner build (levels in class order, unknown classes left out and reported)
  // Classes the planner doesn't model become locked `other` levels; subclasses it doesn't list go to otherSub.
  function buildFromChar(D, ch) {
    var ed = ch.ed === '2014' ? '2014' : '2024', byName = {}, levels = [], sub = {}, otherSub = {}, other = [];
    D.CLASS_ORDER.forEach(function (id) { byName[D.CLASSES[id].name.toLowerCase()] = id; });
    var cl = ch.classes || [];
    cl.forEach(function (c) {
      var id = byName[String(c.cls || '').toLowerCase()];
      if (!id) { other.push({ cls: String(c.cls).toLowerCase(), lvl: c.lvl, sub: c.sub || null, subName: c.subName || null }); return; }
      for (var i = 0; i < c.lvl; i++) levels.push(id);
      var list = D.CLASSES[id].ed[ed].subclasses, hit = null;
      list.forEach(function (s) { if (!hit && c.sub && s.id === c.sub) hit = s; });
      list.forEach(function (s) { if (!hit && subKey(c.subName || c.sub) && subKey(s.name) === subKey(c.subName || c.sub)) hit = s; });
      if (hit) sub[id] = hit.id;
      else if (c.sub || c.subName) otherSub[id] = { sub: c.sub || null, subName: c.subName || c.sub };
    });
    var locked = other.reduce(function (t, o) { return t + o.lvl; }, 0);
    levels = levels.slice(0, Math.max(0, 20 - locked));
    var otherFirst = !!(cl[0] && !byName[String(cl[0].cls || '').toLowerCase()]);
    return { ed: ed, levels: levels, ab: (ch.ab || []).slice(), sub: sub, otherSub: otherSub, other: other, otherFirst: otherFirst,
      name: ch.name || '', show: Math.min(20, levels.length + locked), skipped: other.map(function (o) { return o.cls + ' ' + o.lvl; }) };
  }
  // same classes and levels (order of classes ignored)?
  function sameClasses(a, b) {
    var k = function (l) { return l.map(function (c) { return c.cls + ':' + c.lvl; }).sort().join(','); };
    return k(a) === k(b);
  }

  var API = {
    MC_TABLE: MC_TABLE, ABIL: ABIL, ABIL_NAME: ABIL_NAME, ORD: ORD,
    mod: mod, profBonus: profBonus, casterLevel: casterLevel, slotsForCasterLevel: slotsForCasterLevel,
    pactAt: pactAt, maxSpellLevel: maxSpellLevel, compute: compute, findSub: findSub,
    encodeLevels: encodeLevels, decodeLevels: decodeLevels,
    charClasses: charClasses, buildFromChar: buildFromChar, sameClasses: sameClasses, subKey: subKey, otherTotal: otherTotal, sequence: sequence
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.PlannerEngine = API;
})(this);
