// Builds site/search.json for the hub's "Search every tool" box (STYLE.md 6j): one entry per class and
// per subclass, linking to the planner with that class (and subclass) picked. Names and short facts only.
//   node tools/make_search.js          writes site/search.json
//   require('./make_search.js').build() returns the object (tools/check.js checks the file is current)
var path = require('path'), fs = require('fs');
var SITE = path.join(__dirname, '..', 'site');

function load() {
  global.window = global;
  ['data-classes', 'data-casters', 'data-martials'].forEach(function (f) { require(path.join(SITE, f + '.js')); });
  return require(path.join(SITE, 'data.js'));
}

function eds(list) { return list.length > 1 ? list.join(' and ') : list[0]; }

function build() {
  var D = load(), items = [];
  D.CLASS_ORDER.forEach(function (id) {
    var c = D.CLASSES[id], edList = Object.keys(c.ed).sort(), latest = edList[edList.length - 1];
    var caster = { full: 'full caster', half: 'half caster', third: 'third caster', artificer: 'half caster', pact: 'Pact Magic' }[c.caster] || '';
    items.push({ n: c.name, t: 'd' + c.hitDie + ' Hit Die' + (caster ? ', ' + caster : '') + ', ' + eds(edList), k: 'Class',
                 u: '?ed=' + latest + '&lv=' + c.code });
    var subs = {}, order = [];
    edList.forEach(function (ed) {
      var e = c.ed[ed];
      (e.subclasses || []).forEach(function (s) {
        if (!subs[s.name]) { subs[s.name] = { eds: [], id: s.id, ed: ed, lvl: e.subclassLevel }; order.push(s.name); }
        var r = subs[s.name]; r.eds.push(ed); r.id = s.id; r.ed = ed; r.lvl = e.subclassLevel;   // link to the latest edition
      });
    });
    order.forEach(function (name) {
      var r = subs[name];
      items.push({ n: name, t: c.name + ' subclass, ' + eds(r.eds), k: 'Subclass',
                   u: '?ed=' + r.ed + '&lv=' + new Array(r.lvl + 1).join(c.code) + '&sub=' + c.code + '.' + r.id });
    });
  });
  return { v: 1, items: items };
}

function text() { return JSON.stringify(build(), null, 1) + '\n'; }

if (require.main === module) {
  fs.writeFileSync(path.join(SITE, 'search.json'), text());
  console.log('site/search.json: ' + build().items.length + ' entries');
}
module.exports = { build: build, text: text };
