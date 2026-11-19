// Spot checks for the slot math against the Multiclass Spellcaster table.
// Run: node tools/check.js   (CI runs it before deploying)
'use strict';
var path = require('path');
var D = require(path.join(__dirname, '..', 'site', 'data.js'));
var E = require(path.join(__dirname, '..', 'site', 'engine.js'));

var fails = 0, passes = 0;
function eq(label, got, want) {
  var g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { passes++; console.log('ok   ' + label + ' -> ' + g); }
  else { fails++; console.log('FAIL ' + label + ': got ' + g + ', want ' + w); }
}
function build(ed, split, extra) {
  var lv = '';
  split.forEach(function (p) { lv += new Array(p[1] + 1).join(p[0]); });
  var b = { ed: ed, levels: E.decodeLevels(D, lv), ab: [15, 10, 14, 8, 10, 16], sub: {}, boon: 'blade' };
  if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; });
  return E.compute(D, b);
}
function at(r, L) { return r.rows[L - 1]; }

// Pal 6 / Sorc 14: 3 + 14 = 17 in both editions
['2014', '2024'].forEach(function (ed) {
  var r = build(ed, [['P', 6], ['S', 14]]);
  eq(ed + ' Pal6/Sorc14 caster level', at(r, 20).casterLevel, 17);
  eq(ed + ' Pal6/Sorc14 slots', at(r, 20).slots, [4, 3, 3, 3, 2, 1, 1, 1, 1]);
});
// Pal 2 / Lock 3 / Sorc 15: 1 + 15 = 16, pact 2 x 2nd
['2014', '2024'].forEach(function (ed) {
  var r = build(ed, [['P', 2], ['W', 3], ['S', 15]]);
  eq(ed + ' Pal2/Lock3/Sorc15 slots', at(r, 20).slots, [4, 3, 3, 3, 2, 1, 1, 1]);
  eq(ed + ' Pal2/Lock3/Sorc15 pact', [at(r, 20).pact.count, at(r, 20).pact.level], [2, 2]);
});
// Rounding difference: Pal 3 / Sorc 1 -> 2014: 1+1=2, 2024: 2+1=3
eq('2014 Pal3/Sorc1', at(build('2014', [['P', 3], ['S', 17]]), 4).slots, [3]);
eq('2024 Pal3/Sorc1', at(build('2024', [['P', 3], ['S', 17]]), 4).slots, [4, 2]);
// Pal 5 / Sorc 1 -> 2014: 2+1=3, 2024: 3+1=4
eq('2014 Pal5/Sorc1', at(build('2014', [['P', 5], ['S', 15]]), 6).slots, [4, 2]);
eq('2024 Pal5/Sorc1', at(build('2024', [['P', 5], ['S', 15]]), 6).slots, [4, 3]);
// Pal 1 / Sorc 1: 2014 paladin has no Spellcasting yet -> sorcerer 1 = [2]; 2024 1+1=2 -> [3]
eq('2014 Pal1/Sorc1', at(build('2014', [['P', 1], ['S', 19]]), 2).slots, [2]);
eq('2024 Pal1/Sorc1', at(build('2024', [['P', 1], ['S', 19]]), 2).slots, [3]);
// Single-class paladin uses its own table (ceil) in both editions
eq('2014 Paladin 1', at(build('2014', [['P', 20]]), 1).slots, []);
eq('2014 Paladin 2', at(build('2014', [['P', 20]]), 2).slots, [2]);
eq('2024 Paladin 1', at(build('2024', [['P', 20]]), 1).slots, [2]);
eq('2014 Paladin 5', at(build('2014', [['P', 20]]), 5).slots, [4, 2]);
eq('2014 Paladin 9', at(build('2014', [['P', 20]]), 9).slots, [4, 3, 2]);
eq('2014 Paladin 20', at(build('2014', [['P', 20]]), 20).slots, [4, 3, 3, 3, 2]);
// 2014 multiclass rounds down: Pal 7 / Sorc 13 -> 3 + 13 = 16; Pal 7 alone half = 4 (ceil)
eq('2014 Pal7/Sorc13', at(build('2014', [['P', 7], ['S', 13]]), 20).casterLevel, 16);
eq('2024 Pal7/Sorc13', at(build('2024', [['P', 7], ['S', 13]]), 20).casterLevel, 17);
eq('2014 Pal11/Sorc9 slots', at(build('2014', [['P', 11], ['S', 9]]), 20).slots, [4, 3, 3, 3, 2, 1, 1]);
eq('2024 Pal11/Sorc9 slots', at(build('2024', [['P', 11], ['S', 9]]), 20).slots, [4, 3, 3, 3, 2, 1, 1, 1]);
// Warlock never counts: Pal 10 / Lock 10 -> paladin alone, ceil(10/2)=5
var pw = build('2014', [['P', 10], ['W', 10]]);
eq('2014 Pal10/Lock10 slots', at(pw, 20).slots, [4, 3, 2]);
eq('2014 Pal10/Lock10 pact', [at(pw, 20).pact.count, at(pw, 20).pact.level], [2, 5]);
// Sorlock 2014 Sorc 17 / Lock 3
var sl = build('2014', [['S', 1], ['W', 3], ['S', 16]]);
eq('2014 Sorc17/Lock3 slots', at(sl, 20).slots, [4, 3, 3, 3, 2, 1, 1, 1, 1]);
eq('2014 Sorc17/Lock3 sorcery points', at(sl, 20).res.sorcery, 17);
// Warlock 17+: 4 slots of 5th, all arcana
var wl = build('2024', [['W', 20]]);
eq('Warlock 20 pact', [at(wl, 20).pact.count, at(wl, 20).pact.level, at(wl, 20).pact.arcanum], [4, 5, [6, 7, 8, 9]]);
eq('2024 Warlock 1 invocations', at(wl, 1).res.invocations, 1);
eq('2014 Warlock 1 invocations', at(build('2014', [['W', 20]]), 1).res.invocations, 0);
// Spells known / prepared
var p14 = build('2014', [['P', 20]], { ab: [15, 10, 14, 8, 10, 16] });
eq('2014 Paladin 6 prepared (Cha +3, +3)', at(p14, 6).spells[0].count, 6);
eq('2024 Sorcerer 20 prepared', at(build('2024', [['S', 20]]), 20).spells[0].count, 22);
eq('2014 Sorc14 max spell level in Pal6/Sorc14', at(build('2014', [['P', 6], ['S', 14]]), 20).spells[1].max, 7);
// Proficiency bonus
eq('Prof bonus 1,5,9,13,17', [1, 5, 9, 13, 17].map(E.profBonus), [2, 3, 4, 5, 6]);
// Presets parse to 20 levels and their splits
D.PRESETS.forEach(function (p) {
  eq('preset ' + p.id + ' length', p.lv.length, 20);
});
var sla = D.PRESETS.filter(function (p) { return p.id === 'sorlockadin'; })[0];
var r = E.compute(D, { ed: sla.ed, levels: E.decodeLevels(D, sla.lv), ab: sla.ab, sub: sla.sub, boon: sla.boon });
eq('Sorlockadin split', [r.counts.paladin, r.counts.warlock, r.counts.sorcerer], [2, 3, 15]);
eq('Sorlockadin warnings (none)', r.warnings.length, 0);
// Prerequisite warning
var bad = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'PPPPPPSSSSSSSSSSSSSS'), ab: [10, 10, 14, 8, 10, 16], sub: { paladin: 'devotion', sorcerer: 'draconic' } });
eq('Str 10 paladin multiclass warning', bad.warnings.filter(function (w) { return !w.soft; }).length, 1);

// Builds shorter than 20 levels
var short = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'PPPPPPSSS'), ab: [15, 10, 14, 8, 10, 16], sub: {} });
eq('9-level build has 9 rows', short.rows.length, 9);
eq('Pal6/Sorc3 slots (2014)', short.rows[8].slots, [4, 3, 3]);
eq('decodeLevels keeps length', E.decodeLevels(D, 'PWS').length, 3);

// D&D Beyond import
var X = require(path.join(__dirname, '..', 'site', 'ddb.js'));
var fx = require('fs').readFileSync(path.join(__dirname, 'fixtures', 'ddb-sample.json'), 'utf8');
var im = X.parse(D, fx, '2024');
eq('ddb edition from subclass names', im.ed, '2014');
eq('ddb levels (starting class first, every class imported)', E.encodeLevels(D, im.levels), 'PPWWWSSSSF');
eq('ddb total and show level', [im.total, im.show], [10, 10]);
eq('ddb imports Fighter as a real class (nothing locked)', im.other, []);
var jh = JSON.parse(fx); jh.data.classes[3].definition.name = 'Blood Hunter'; var imh = X.parse(D, jh, '2014');
eq('ddb keeps a homebrew class as a locked level after the starting class', [imh.other, imh.otherFirst, imh.total], [[{ cls: 'blood hunter', lvl: 1, sub: null, subName: null }], false, 10]);
eq('ddb subclasses', im.sub, { warlock: 'hexblade', sorcerer: 'divine-soul' });
eq('ddb ability scores (race+feat, no items)', im.ab, [14, 10, 14, 8, 10, 16]);
eq('ddb locked homebrew class noted', imh.notices.some(function (n) { return /Blood Hunter 1/.test(n); }), true);
eq('ddb link parsing', [X.idFromLink('https://www.dndbeyond.com/characters/12345678'), X.idFromLink('https://www.dndbeyond.com/profile/Someone/characters/987654'), X.idFromLink('nope')], ['12345678', '987654', null]);
var j24 = JSON.parse(fx); j24.data.classes[0].subclassDefinition.name = 'Fiend Patron'; j24.data.classes[2].subclassDefinition.name = 'Clockwork Sorcery';
var im24 = X.parse(D, j24, '2014');
eq('ddb 2024 detection', [im24.ed, im24.sub], ['2024', { warlock: 'fiend', sorcerer: 'clockwork' }]);
var threw = false; try { X.parse(D, '{"data":{"name":"x"}}'); } catch (e) { threw = true; }
eq('ddb rejects non-character JSON', threw, true);


// ---------- shared characters (character.js) ----------
var cb = { ed: '2014', levels: E.decodeLevels(D, 'PPWWWSSSSPP'), sub: { paladin: 'devotion', warlock: 'hexblade' } };
var hexName = D.CLASSES.warlock.ed['2014'].subclasses.filter(function (s) { return s.id === 'hexblade'; })[0].name;
eq('character classes in first-taken order', E.charClasses(D, cb), [
  { cls: 'paladin', lvl: 4, sub: 'devotion', subName: 'Oath of Devotion' },
  { cls: 'warlock', lvl: 3, sub: 'hexblade', subName: hexName },
  { cls: 'sorcerer', lvl: 4, sub: null, subName: null }]);
var fc = E.buildFromChar(D, { name: 'Aric', ed: '2024', ab: [15, 10, 14, 8, 10, 16], classes: [
  { cls: 'sorcerer', lvl: 3, sub: 'x-other-site-id', subName: 'Clockwork Sorcery' }, { cls: 'mystic', lvl: 2 }, { cls: 'paladin', lvl: 2, sub: null, subName: null }] });
eq('character -> build: levels in class order, unknown classes locked', [E.encodeLevels(D, fc.levels), fc.other.map(function (o) { return o.cls + o.lvl; }), fc.otherFirst, fc.show], ['SSSPP', ['mystic2'], false, 7]);
eq('character -> build: subclass matched by name when ids differ', fc.sub, { sorcerer: 'clockwork' });
eq('character round trip', E.charClasses(D, E.buildFromChar(D, { ed: '2014', classes: E.charClasses(D, cb) })), E.charClasses(D, cb));
eq('sameClasses ignores class order', [E.sameClasses([{ cls: 'a', lvl: 1 }, { cls: 'b', lvl: 2 }], [{ cls: 'b', lvl: 2 }, { cls: 'a', lvl: 1 }]), E.sameClasses([{ cls: 'a', lvl: 1 }], [{ cls: 'a', lvl: 2 }])], [true, false]);
// ---------- audit fixes: other classes and subclasses ----------
var hb = E.buildFromChar(D, { ed: '2014', ab: [16, 10, 14, 8, 10, 14], classes: [{ cls: 'mystic', lvl: 5 }, { cls: 'paladin', lvl: 15 }] });
eq('homebrew Mystic 5 / Paladin 15: mystic locked first, paladin kept, total 20', [hb.other[0].lvl, hb.otherFirst, hb.levels.length, hb.show, E.compute(D, hb).rows[19].prof], [5, true, 15, 20, 6]);
var fp = E.buildFromChar(D, { ed: '2014', ab: [16, 10, 14, 8, 10, 14], classes: [{ cls: 'fighter', lvl: 5, subName: 'Champion' }, { cls: 'paladin', lvl: 15 }] });
var rp = E.compute(D, fp);
eq('Fighter 5 / Paladin 15: 20 rows, proficiency +6 at 20, fighter saves, Champion matched', [rp.rows.length, rp.rows[19].prof, rp.saves, !!rp.rows[0].locked, rp.rows[5].cls, rp.rows[5].n, fp.sub.fighter], [20, 6, 'Strength, Constitution', false, 'paladin', 1, 'champion']);
eq('Fighter 5 / Paladin 15: HP uses d10 for the fighter levels', rp.rows[0].hp, 12);
eq('Fighter 5 / Paladin 15: Extra Attack from fighter 5; paladin 5 says it does not stack',
  [rp.rows[4].attacks, rp.rows[9].feats.some(function (f) { return f.name === 'Extra Attack' && /stack/.test(f.text); })], [2, true]);
eq('Fighter 5 / Paladin 15: paladin alone uses its own table (caster level 8 at paladin 15)', rp.rows[19].casterLevel, 8);
var cw = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'CCCCCSSSSS'), ab: [10, 10, 10, 10, 10, 16], sub: {} });
eq('Cleric 5 / Sorcerer 5: both full casters add to the multiclass caster level', cw.rows[9].casterLevel, 10);
var ds = E.buildFromChar(D, { ed: '2024', ab: [10, 10, 10, 10, 10, 16], classes: [{ cls: 'sorcerer', lvl: 6, sub: 'divine-soul', subName: 'Divine Soul' }] });
eq('unknown 2024 subclass (Divine Soul) is kept as otherSub', [ds.sub, ds.otherSub], [{}, { sorcerer: { sub: 'divine-soul', subName: 'Divine Soul' } }]);
eq('otherSub round-trips into the shared classes', E.charClasses(D, ds), [{ cls: 'sorcerer', lvl: 6, sub: 'divine-soul', subName: 'Divine Soul' }]);
var rds = E.compute(D, ds);
eq('otherSub: no "choose a subclass" warning, named at the subclass level', [rds.warnings.length, rds.rows[2].feats.some(function (f) { return /Divine Soul/.test(f.name); })], [0, true]);
eq('2024 Sorcadin blurb no longer claims an extra caster level', /one more caster level/.test(D.PRESETS.filter(function (p) { return p.id === 'sorcadin24'; })[0].blurb), false);
var pa24 = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'PPPPPPSSSSSSSSSSSSSS'), ab: [15, 8, 14, 8, 10, 16], sub: {} });
var pa14 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'PPPPPPSSSSSSSSSSSSSS'), ab: [15, 8, 14, 8, 10, 16], sub: {} });
eq('Pal 6 / Sorc 14 is caster level 17 in both editions', [pa14.rows[19].casterLevel, pa24.rows[19].casterLevel], [17, 17]);
eq('ddb.ac short links are recognised', [X.isShortLink('https://ddb.ac/characters/123/AbCd'), X.isShortLink('https://www.dndbeyond.com/characters/1')], [true, false]);
var js = JSON.parse(fx); js.data.classes.forEach(function (k) { k.isStartingClass = k.definition.name === 'Fighter'; });
var ims = X.parse(D, js, '2014');
eq('ddb: the starting class goes first, so its saving throws apply', [ims.levels[0], E.compute(D, ims).saves], ['fighter', 'Strength, Constitution']);

// ---------- stage 1: more classes (Barbarian, Druid), up to 3 classes ----------
D.CLASS_ORDER.forEach(function (id) {
  var c = D.CLASSES[id];
  ['2014', '2024'].forEach(function (ed) {
    var e = c.ed[ed], bad = [];
    if (!e) { bad.push('no edition'); }
    else {
      if (!e.subclassLabel || !e.subclassLevel || !Array.isArray(e.asi) || !e.mcProf) bad.push('core fields');
      if (c.caster !== 'none' && c.caster !== 'pact' && !e.spells) bad.push('spells');
      e.subclasses.forEach(function (sc) { Object.keys(sc.features).forEach(function (L) { if (e.subclassFeatureLevels.indexOf(+L) < 0 && !(id === 'druid' && sc.id === 'land' && L === '3')) bad.push(sc.id + ' L' + L); }); });
      Object.keys(e.features).forEach(function (L) { if (+L < 1 || +L > 20) bad.push('feature L' + L); });
    }
    eq('class data complete: ' + id + ' ' + ed, bad, []);
  });
});
eq('class codes are unique', D.CLASS_ORDER.map(function (id) { return D.CLASSES[id].code; }).filter(function (x, i, a) { return a.indexOf(x) !== i; }), []);
var mb = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'BBBDDDDDDDDDDDDDDDDD'), ab: [15, 12, 14, 8, 14, 10], sub: { barbarian: 'totem-warrior', druid: 'moon' } });
eq('Barbarian 3 / Druid 17 (2014): d12 first level, druid alone uses its own slot table', [mb.rows[0].hp, mb.rows[19].casterLevel, mb.saves], [14, 17, 'Strength, Constitution']);
var ex = function (row, key) { var x = row.res.extra.filter(function (r) { return r.key === key; })[0]; return x ? x.v : null; };
eq('Moon druid beast CR: 1 at druid 2, druid level / 3 later (2014)', [ex(mb.rows[4], 'wsCr'), ex(mb.rows[19], 'wsCr')], ['1', '5']);
eq('Rage count and damage (2014)', [ex(mb.rows[0], 'rage'), ex(mb.rows[2], 'rage'), ex(mb.rows[2], 'rageDmg')], [2, 3, '+2']);
eq('Druid spell DC uses Wisdom', mb.rows[19].dcs.map(function (d) { return d.abil + d.dc; }), ['wis16']);
eq('Barbarian + caster note about casting while raging', mb.rows.some(function (r) { return r.notes.some(function (n) { return /raging/.test(n); }); }), true);
var mb24 = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'BBBDDDDDDDDDDDDDDDDD'), ab: [15, 12, 14, 8, 14, 10], sub: { barbarian: 'wild-heart', druid: 'moon' } });
eq('2024 Wild Shape: CR 1/4 before the circle, Moon CR 1 at druid 3, 3 uses at druid 6, 4 at 17',
  [ex(mb24.rows[4], 'wsCr'), ex(mb24.rows[5], 'wsCr'), ex(mb24.rows[8], 'ws'), ex(mb24.rows[19], 'ws')], ['1/4', '1', 3, 4]);
var b5 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'BBBBBPPPPP'), ab: [15, 10, 14, 8, 10, 13], sub: {} });
eq('Barbarian 5 Extra Attack; Paladin 5 Extra Attack does not stack', [b5.rows[4].attacks, b5.rows[9].attacks, b5.rows[9].feats.some(function (f) { return f.name === 'Extra Attack' && /stack/.test(f.text); })], [2, 2, true]);
var dr = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'DDDDD'), ab: [10, 10, 10, 10, 16, 10], sub: {} });
eq('Druid 2014 prepares Wis mod + druid level', dr.rows[4].spells[0].count, 8);
var four = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'PPWWSSBB'), ab: [13, 10, 10, 10, 10, 13], sub: {} });
eq('a fourth class is flagged', four.warnings.some(function (w) { return /4 classes/.test(w.text); }), true);
var oldDruid = E.buildFromChar(D, { ed: '2014', ab: [10, 10, 10, 10, 14, 10], classes: [{ cls: 'druid', lvl: 3, subName: 'Circle of the Moon' }, { cls: 'paladin', lvl: 2 }] });
eq('a shared Druid is now real levels with its subclass matched', [E.encodeLevels(D, oldDruid.levels), oldDruid.sub, oldDruid.other], ['DDDPP', { druid: 'moon' }, []]);
var bn = X.parse(D, (function () { var j = JSON.parse(fx); j.data.classes[3].definition.name = 'Barbarian'; return j; })(), '2014');
eq('ddb: Barbarian levels import as real levels', [bn.other.length, bn.levels.filter(function (x) { return x === 'barbarian'; }).length], [0, 1]);

// ---------- stage 2: Bard, Cleric, Wizard, Ranger, Artificer ----------
var exr = function (row, key) { var x = row.res.extra.filter(function (r) { return r.key === key; })[0]; return x ? x.v : null; };
var r14 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'RRRRRRRRRR'), ab: [10, 16, 12, 10, 14, 10], sub: {} });
eq('Ranger 2014: no spells at 1, half caster from 2, Extra Attack at 5', [r14.rows[0].casterLevel, r14.rows[1].casterLevel, r14.rows[4].casterLevel, r14.rows[4].attacks, r14.rows[9].spells[0].count], [0, 1, 3, 2, 6]);
var rp14 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'RRRRRPPPPP'), ab: [13, 16, 12, 10, 14, 13], sub: {} });
eq('Ranger 5 / Paladin 5 (2014): two half casters round down, 2 + 2 = caster level 4', rp14.rows[9].casterLevel, 4);
var rp24 = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'RRRRRPPPPP'), ab: [13, 16, 12, 10, 14, 13], sub: {} });
eq('Ranger 5 / Paladin 5 (2024): round up, 3 + 3 = caster level 6', rp24.rows[9].casterLevel, 6);
var ar = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'AAAWWWWWWW'), ab: [10, 14, 14, 16, 10, 10], sub: { artificer: 'battle-smith' } });
eq('Artificer 1 casts (caster level 1); artificer 3 alone is caster level 2; prepared Int + half level', [ar.rows[0].casterLevel, ar.rows[2].casterLevel, ar.rows[2].spells[0].count], [1, 2, 4]);
var ar5 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'AAAAAPPPPP'), ab: [13, 14, 14, 16, 10, 13], sub: { artificer: 'battle-smith' } });
eq('Artificer rounds up even when multiclassed: Art 5 + Pal 5 (2014) = 3 + 2', ar5.rows[9].casterLevel, 5);
eq('Battle Smith Extra Attack at artificer 5; Paladin 5 note says it does not stack', [ar5.rows[4].attacks, ar5.rows[9].feats.some(function (f) { return f.name === 'Extra Attack' && /stack/.test(f.text); })], [2, true]);
var vb = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'VVVVVV'), ab: [10, 14, 12, 10, 10, 16], sub: { bard: 'valor' } });
eq('Valor bard: Extra Attack at bard 6; Inspiration Cha uses and die', [vb.rows[5].attacks, exr(vb.rows[4], 'insp')], [2, '3 x d8']);
var cl = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'CCCCCCZZZZ'), ab: [10, 10, 14, 16, 16, 10], sub: { cleric: 'light', wizard: 'evocation' } });
eq('Cleric 6 / Wizard 4: DCs by Wis and Int; Channel Divinity 2; Arcane Recovery 2 levels', [cl.rows[9].dcs.map(function (d) { return d.abil + d.dc; }).join(' '), exr(cl.rows[9], 'clrCd'), exr(cl.rows[9], 'recov'), cl.rows[9].casterLevel], ['wis15 int15', 2, '2 lvls', 10]);
eq('Cleric 2014 subclass at level 1 (Light domain features from 1)', cl.rows[0].feats.some(function (f) { return /Warding Flare/.test(f.name); }), true);

// ---------- stage 3: Fighter, Rogue, Monk ----------
var exm = function (row, key) { var x = row.res.extra.filter(function (r) { return r.key === key; })[0]; return x ? x.v : null; };
var ftr = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'FFFFFFFFFFFFFFFFFFFF'), ab: [16, 12, 14, 10, 10, 8], sub: { fighter: 'champion' } });
eq('Fighter Extra Attack 2/3/4 at 5, 11, 20; Action Surge 2 at 17; 7 ASIs (2014)', [ftr.rows[4].attacks, ftr.rows[10].attacks, ftr.rows[19].attacks, exm(ftr.rows[16], 'surge'), ftr.asis.length], [2, 3, 4, 2, 7]);
var ek = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'FFFFFFFWWW'), ab: [16, 12, 14, 14, 10, 13], sub: { fighter: 'eldritch-knight' } });
eq('Eldritch Knight: no casting before 3; EK 3 alone = caster level 1; EK 7 + Warlock = ceil(7/3) = 3 (Pact Magic is not Spellcasting); Int DC',
  [ek.rows[1].casterLevel, ek.rows[2].casterLevel, ek.rows[9].casterLevel, ek.rows[9].dcs.map(function (d) { return d.abil; }).sort().join(','), ek.rows[6].spells[0].count, ek.rows[6].spells[0].max], [0, 1, 3, 'cha,int', 5, 2]);
var fNoSub = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'FFFFF'), ab: [16, 12, 14, 14, 10, 13], sub: {} });
eq('a Fighter without Eldritch Knight does not cast', [fNoSub.rows[4].casterLevel, fNoSub.rows[4].spells.length], [0, 0]);
var at = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'TTTTTTTTTZZZZZZZZZZZ'), ab: [8, 16, 12, 16, 12, 10], sub: { rogue: 'arcane-trickster', wizard: 'evoker' } });
eq('Arcane Trickster 9 + Wizard 11 (2024): 3 + 11 = 14; Sneak Attack 5d6; AT cantrips 3', [at.rows[19].casterLevel, exm(at.rows[8], 'sneak'), at.rows[8].spells[0].cantrips], [14, '5d6', 3]);
var mk = E.compute(D, { ed: '2024', levels: E.decodeLevels(D, 'MMMMMMMMMMMMMMMMM'), ab: [10, 16, 14, 10, 14, 8], sub: {} });
eq('Monk 2024: focus = level, martial arts d12 at 17, Extra Attack at 5', [exm(mk.rows[16], 'ki'), exm(mk.rows[16], 'ma'), mk.rows[4].attacks], [17, 'd12', 2]);
var fpq = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'FFFPPP'), ab: [10, 13, 14, 10, 10, 13], sub: {} });
eq('Fighter needs Str 13 OR Dex 13: Dex 13 is enough', fpq.warnings.filter(function (w) { return /Fighter needs/.test(w.text); }).length, 0);
var fpq2 = E.compute(D, { ed: '2014', levels: E.decodeLevels(D, 'FFFPPP'), ab: [12, 12, 14, 10, 10, 13], sub: {} });
eq('Fighter with neither Str 13 nor Dex 13 is flagged', fpq2.warnings.some(function (w) { return /Fighter needs Str 13 or Dex 13/.test(w.text); }), true);
eq('all 13 classes are modelled', [D.CLASS_ORDER.length, Object.keys(D.OTHER_CLASSES).length], [13, 0]);

// ---------- character sheet summary (setSheet) ----------
var sh = E.sheet(D, { ed: '2014', levels: E.decodeLevels(D, 'PPWWWSSSSSSSSSSSSSSS'), ab: [13, 10, 14, 8, 10, 16], sub: { paladin: 'vengeance', warlock: 'hexblade', sorcerer: 'divine-soul' }, boon: 'blade' });
eq('sheet: core numbers at full level', [sh.v, sh.ed, sh.lvl, sh.pb, sh.hp, sh.hd, sh.saves.join(','), sh.attacks], [1, '2014', 20, 6, 131, '2d10+3d8+15d6', 'wis,cha', 1]);
eq('sheet: 9 slot levels, pact slots and one DC per ability', [sh.slots, sh.pact, sh.dc], [[4, 3, 3, 3, 2, 1, 1, 1, 0], { n: 2, lvl: 2 }, [{ abil: 'cha', dc: 17, atk: 9 }]]);
eq('sheet: resources and ASI slots', [sh.res.map(function (r) { return r.name + ' ' + r.max + '/' + r.per; }), sh.feats.map(function (f) { return f.lvl; })], [['Lay on Hands 10/long', 'Sorcery Points 15/long'], [9, 13, 17]]);
eq('sheet: proficiencies from the first class plus multiclass sets', sh.prof, { armor: 'light, medium, heavy, shields', weapons: 'simple, martial', tools: '' });
eq('sheet: feature names only, with class', [sh.features[0], sh.features.every(function (f) { return f.lvl && f.cls && f.name && Object.keys(f).length === 3; })], [{ lvl: 1, cls: 'paladin', name: 'Divine Sense' }, true]);
var sh2 = E.sheet(D, { ed: '2024', levels: E.decodeLevels(D, 'BBBDDDDDDDDDDDDDDDDD'), ab: [15, 12, 14, 8, 14, 10], sub: { barbarian: 'wild-heart', druid: 'moon' } });
eq('sheet: Rage and Wild Shape with notes; d12 + d8 hit dice', [sh2.hd, sh2.res.map(function (r) { return r.name + ' ' + r.max + '/' + r.per; }), /CR up to 5/.test(sh2.res[1].note)], ['3d12+17d8', ['Rage 3/long', 'Wild Shape 4/long'], true]);
var big = E.sheet(D, { ed: '2014', levels: E.decodeLevels(D, 'CCCCCCCCCCCCCCCCCCCC'), ab: [10, 10, 14, 10, 18, 10], sub: { cleric: 'twilight' } });
eq('sheet: stays under 6000 characters', JSON.stringify(big).length < 6000, true);

// ---------- sheet: numbers now (current level) and skills ----------
var shn = E.sheet(D, { ed: '2014', levels: E.decodeLevels(D, 'BBBDDDDDDDDDDDDDDDDD'), ab: [15, 12, 14, 8, 14, 10], sub: { barbarian: 'totem-warrior', druid: 'moon' } }, { nowLvl: 7, nowSrc: 'import', skills: { prof: ['perception'], exp: [] } });
eq('sheet now: level 7 of a level-20 plan (HP, slots, Wild Shape CR at that level)', [shn.lvl, shn.now.lvl, shn.now.src, shn.now.hp, shn.now.slots.slice(0, 3), shn.now.res[1].note], [20, 7, 'import', 60, [4, 3, 0], 'beast CR up to 1']);
eq('sheet now: hit dice and classes at the current level', [shn.now.hd, shn.now.classes], ['3d12+4d8', [{ cls: 'barbarian', lvl: 3 }, { cls: 'druid', lvl: 4 }]]);
eq('sheet now: skills passed through', shn.skills, { prof: ['perception'], exp: [] });
var shf = E.sheet(D, { ed: '2014', levels: E.decodeLevels(D, 'BBBDD'), ab: [15, 12, 14, 8, 14, 10], sub: {} }, { nowLvl: 5 });
eq('sheet now: left out when the character is already at the plan level', shf.now, undefined);

// ---------- a real hub import record (anonymised Brin Ashvale, 2024 Paladin 5 / Warlock 2) ----------
var brin = { v: 1, src: 'ddb', at: '2026-11-19T06:09:16.081Z', ed: '2024', name: 'Brin Ashvale', classes: [{ cls: 'paladin', lvl: 5, subName: 'Oath of Devotion' }, { cls: 'warlock', lvl: 2, subName: null }], ab: [18, 10, 15, 8, 10, 16] };
var bb = E.buildFromChar(D, { ed: brin.ed, ab: brin.ab, name: brin.name, classes: brin.classes.map(function (c) { return { cls: c.cls, lvl: c.lvl, sub: null, subName: c.subName }; }) });
var br = E.compute(D, bb);
eq('hub import sample: starting class first, Devotion matched, level 7, paladin saves', [E.encodeLevels(D, bb.levels), bb.sub, br.rows.length, br.saves, br.warnings.length], ['PPPPPWW', { paladin: 'devotion' }, 7, 'Wisdom, Charisma', 0]);

console.log('\n' + passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
