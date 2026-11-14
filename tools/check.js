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
eq('ddb levels (starting class first, stops at character level)', E.encodeLevels(D, im.levels), 'PPWWWSSSS');
eq('ddb total and show level', [im.total, im.show], [9, 9]);
eq('ddb subclasses', im.sub, { warlock: 'hexblade', sorcerer: 'divine-soul' });
eq('ddb ability scores (race+feat, no items)', im.ab, [14, 10, 14, 8, 10, 16]);
eq('ddb skipped Fighter noted', im.notices.some(function (n) { return /Fighter 1/.test(n); }), true);
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
  { cls: 'sorcerer', lvl: 3, sub: 'x-other-site-id', subName: 'Clockwork Sorcery' }, { cls: 'druid', lvl: 2 }, { cls: 'paladin', lvl: 2, sub: null, subName: null }] });
eq('character -> build: levels in class order, unknown classes skipped', [E.encodeLevels(D, fc.levels), fc.skipped, fc.show], ['SSSPP', ['druid 2'], 5]);
eq('character -> build: subclass matched by name when ids differ', fc.sub, { sorcerer: 'clockwork' });
eq('character round trip', E.charClasses(D, E.buildFromChar(D, { ed: '2014', classes: E.charClasses(D, cb) })), E.charClasses(D, cb));
eq('sameClasses ignores class order', [E.sameClasses([{ cls: 'a', lvl: 1 }, { cls: 'b', lvl: 2 }], [{ cls: 'b', lvl: 2 }, { cls: 'a', lvl: 1 }]), E.sameClasses([{ cls: 'a', lvl: 1 }], [{ cls: 'a', lvl: 2 }])], [true, false]);
console.log('\n' + passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
