/* D&D Beyond import: turns the JSON from character-service.dndbeyond.com into a planner build.
   Runs entirely in the browser; nothing is sent anywhere or stored except the resulting build.
   D&D Beyond does not record the order levels were taken, so the order is a guess the user can edit. */
(function (root) {
  'use strict';

  var ABIL = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  var ED2024_SOURCES = [145]; // Player's Handbook (2024) on D&D Beyond

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/\b(the|oath of|of the|patron|sorcery|bloodline|magic|soul|mind|origin)\b/g, ' ')
      .replace(/[^a-z]+/g, ' ').trim();
  }

  // ddb.ac short links redirect on D&D Beyond's side; the page can't follow them without a proxy
  function isShortLink(text) { return /(^|\/\/|\s)(www\.)?ddb\.ac\//i.test(String(text || '')); }
  function idFromLink(text) {
    var m = String(text || '').match(/dndbeyond\.com\/(?:profile\/[^/]+\/)?characters\/(\d+)/i) || String(text || '').match(/^\s*(\d{4,})\s*$/);
    return m ? m[1] : null;
  }
  function apiUrl(id) { return 'https://character-service.dndbeyond.com/character/v5/character/' + id; }

  function scores(c) {
    var out = [];
    ABIL.forEach(function (name, i) {
      var id = i + 1;
      var pick = function (arr) { var x = (arr || []).filter(function (s) { return s && s.id === id; })[0]; return x && x.value != null ? x.value : null; };
      var over = pick(c.overrideStats);
      if (over != null) { out.push(over); return; }
      var v = (pick(c.stats) || 10) + (pick(c.bonusStats) || 0);
      var mods = c.modifiers || {};
      ['race', 'class', 'background', 'feat'].forEach(function (k) {
        (mods[k] || []).forEach(function (m) { if (m && m.type === 'bonus' && m.subType === name + '-score' && typeof m.value === 'number') v += m.value; });
      });
      out.push(Math.max(1, Math.min(30, v)));
    });
    return out;
  }

  function parse(D, input, currentEd) {
    var json = typeof input === 'string' ? JSON.parse(input) : input;
    var c = json && json.data && json.data.classes ? json.data : json;
    if (!c || !Array.isArray(c.classes)) throw new Error('That does not look like D&D Beyond character data. Copy the whole page from the character data link.');

    var byName = {}; D.CLASS_ORDER.forEach(function (id) { byName[D.CLASSES[id].name.toLowerCase()] = id; });
    var notices = [], votes = { '2014': 0, '2024': 0 }, picked = [], others = [];

    c.classes.forEach(function (k) {
      var def = k.definition || {}, name = String(def.name || '').trim(), id = byName[name.toLowerCase()];
      var lv = +k.level || 0;
      if (!id) {
        // a class the planner doesn't model: kept as locked levels so the level, proficiency and saves stay right
        if (name && lv) others.push({ cls: name.toLowerCase(), lvl: lv, sub: null, subName: (k.subclassDefinition && k.subclassDefinition.name) || null, start: !!k.isStartingClass, label: name + ' ' + lv });
        return;
      }
      (def.sources || []).forEach(function (s) { if (ED2024_SOURCES.indexOf(s.sourceId) >= 0) votes['2024'] += 2; });
      var subName = k.subclassDefinition && k.subclassDefinition.name;
      if (subName) ['2014', '2024'].forEach(function (ed) {
        if (D.CLASSES[id].ed[ed].subclasses.some(function (s) { return s.name.toLowerCase() === subName.toLowerCase(); })) votes[ed] += 1;
      });
      picked.push({ id: id, lv: lv, start: !!k.isStartingClass, sub: subName });
    });
    if (!picked.length) throw new Error('No Paladin, Warlock or Sorcerer levels found' + (others.length ? ' (found ' + others.map(function (o) { return o.label; }).join(', ') + ')' : '') + '.');

    var ed = votes['2024'] > votes['2014'] ? '2024' : votes['2014'] > votes['2024'] ? '2014' : (currentEd || '2014');
    notices.push(votes['2024'] === votes['2014'] ? 'Could not tell which rules the character uses; kept ' + ed + '. Switch Rules if that is wrong.' : 'Rules set to ' + ed + ' from the class and subclass versions on the sheet.');

    // order: starting class first, then the rest in sheet order; other classes form one locked block,
    // first when the starting class is one of them (so its saving throws apply), otherwise last
    var byStart = function (a, b) { return (b.start ? 1 : 0) - (a.start ? 1 : 0); };
    picked.sort(byStart); others.sort(byStart);
    var otherFirst = others.some(function (o) { return o.start; });
    var lockedN = Math.min(20, others.reduce(function (t, o) { return t + o.lvl; }, 0));
    var levels = [];
    picked.forEach(function (p) { for (var i = 0; i < p.lv && levels.length < 20 - lockedN; i++) levels.push(p.id); });
    if (!levels.length) throw new Error('The character is already level 20 in classes the planner does not model.');
    var total = levels.length + lockedN;
    if (picked.length > 1) notices.push('D&D Beyond does not record the order you took levels, so the planner put ' + D.CLASSES[picked[0].id].name + ' first. Rearrange them under Levels.');
    if (others.length) notices.push('Kept ' + others.map(function (o) { return o.label; }).join(', ') + ' as locked levels' + (otherFirst ? ' at the start (your starting class, so its saving throws apply)' : ' after your other levels') + '. The planner counts them toward your level, proficiency and hit points but doesn\'t list their features.');
    if (total < 20) notices.push('The character is level ' + total + '. Add levels under Class levels to plan ahead.');

    var sub = {}, otherSub = {};
    picked.forEach(function (p) {
      if (!p.sub) return;
      var list = D.CLASSES[p.id].ed[ed].subclasses, hit = null;
      list.forEach(function (s) { if (!hit && s.name.toLowerCase() === p.sub.toLowerCase()) hit = s; });
      list.forEach(function (s) { if (!hit && norm(s.name) === norm(p.sub)) hit = s; });
      if (hit) sub[p.id] = hit.id;
      else { otherSub[p.id] = { sub: null, subName: p.sub }; notices.push('Subclass "' + p.sub + '" is not in the planner\'s ' + ed + ' list. It is kept on the build, but its features are not shown.'); }
    });

    notices.push('Ability scores include racial, background, class and feat bonuses but not magic items.');
    var other = others.map(function (o) { return { cls: o.cls, lvl: o.lvl, sub: o.sub, subName: o.subName }; });
    return { ed: ed, levels: levels, other: other, otherFirst: otherFirst, otherSub: otherSub, ab: scores(c), sub: sub, name: String(c.name || 'Imported character').slice(0, 60), show: Math.max(1, total), notices: notices, total: total };
  }

  var API = { parse: parse, idFromLink: idFromLink, isShortLink: isShortLink, apiUrl: apiUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.DdbImport = API;
})(this);
