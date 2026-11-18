/* More classes for the multiclass planner (stage 1: Barbarian and Druid).
   Same format as data.js. Feature and subclass summaries are original one-line paraphrases written
   for this site, not book text; levels, counts and tables are game facts. Subclasses outside the
   SRD are listed by name, book and level with a one-line summary only.
   Loaded after data.js in the page; in Node, data.js requires this file. */
(function (root) {
  'use strict';
  var A = function (s) { return s.split(',').map(Number); };

  // Wild Shape: highest beast challenge rating as text
  function crText(cr) { return cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : String(cr); }
  function wsCr2014(lv, sub) {
    if (sub === 'moon') return lv >= 6 ? Math.floor(lv / 3) : 1;
    return lv >= 8 ? 1 : lv >= 4 ? 0.5 : 0.25;
  }
  function wsCr2024(lv, sub) {
    if (sub === 'moon' && lv >= 3) return Math.max(1, Math.floor(lv / 3));
    return lv >= 8 ? 1 : lv >= 4 ? 0.5 : 0.25;
  }

  var MORE = {
    barbarian: {
      code: 'B', name: 'Barbarian', short: 'Barb', hitDie: 12, color: 'barb',
      caster: 'none',
      prereq: { str: 13 },
      saves: 'Strength, Constitution',
      extraAttack: [5],
      ed: {
        '2014': {
          subclassLevel: 3, subclassLabel: 'Primal Path',
          subclassFeatureLevels: [3, 6, 10, 14],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Shields, simple and martial weapons',
          cantrips: null, spells: null,
          res: [
            { key: 'rage', label: 'Rage', title: 'Rages per long rest (unlimited at 20)',
              at: function (lv) { return lv >= 20 ? 'unl.' : A('2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6')[lv - 1]; } },
            { key: 'rageDmg', label: 'Rage dmg', title: 'Rage damage bonus on Strength-based weapon attacks',
              at: function (lv) { return '+' + (lv >= 16 ? 4 : lv >= 9 ? 3 : 2); } }
          ],
          features: {
            1: [['Rage', 'Bonus action, while not in heavy armor: advantage on Strength checks and saves, bonus damage on Strength-based weapon attacks, and resistance to bludgeoning, piercing and slashing. No spellcasting or concentration while raging. Lasts 1 minute.'],
                ['Unarmored Defense', 'Without armor your AC is 10 + Dex + Con; a shield still works.']],
            2: [['Reckless Attack', 'Take advantage on Strength attacks this turn; attacks against you have advantage until your next turn.'],
                ['Danger Sense', 'Advantage on Dex saves against effects you can see.']],
            3: [['Primal Path', 'Choose your path.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Fast Movement', '+10 ft speed without heavy armor.']],
            7: [['Feral Instinct', 'Advantage on initiative; you can act on a surprise round if you rage first.']],
            9: [['Brutal Critical', 'One extra weapon damage die on a melee critical hit (two at 13, three at 17).']],
            11: [['Relentless Rage', 'Drop to 1 HP instead of 0 while raging on a Con save (DC rises each time).']],
            13: [['Brutal Critical', 'Two extra dice on melee critical hits.']],
            15: [['Persistent Rage', 'Rage ends early only if you fall unconscious or choose to end it.']],
            17: [['Brutal Critical', 'Three extra dice on melee critical hits.']],
            18: [['Indomitable Might', 'A Strength check below your Strength score uses the score instead.']],
            20: [['Primal Champion', 'Strength and Constitution +4 (max 24); rages are unlimited.']]
          },
          subclasses: [
            { id: 'berserker', name: 'Path of the Berserker', source: 'SRD 5.1', srd: true,
              summary: 'Frenzied fury: extra attacks at the cost of exhaustion.',
              features: {
                3: [['Frenzy', 'While raging, make a bonus-action melee attack each turn; a point of exhaustion when the rage ends.']],
                6: [['Mindless Rage', 'Cannot be charmed or frightened while raging.']],
                10: [['Intimidating Presence', 'Action: frighten a creature with your menace.']],
                14: [['Retaliation', 'Reaction melee attack against a creature within 5 ft that damages you.']] } },
            { id: 'totem-warrior', name: 'Path of the Totem Warrior', source: "Player's Handbook (2014)",
              summary: 'Animal spirits; Bear totem resists all damage but psychic while raging.',
              features: {
                3: [['Spirit Seeker', 'Cast beast sense and speak with animals as rituals.'],
                    ['Totem Spirit', 'Bear: resistance to all damage except psychic while raging. Eagle: dash as a bonus action, enemies have disadvantage on opportunity attacks. Wolf: allies have advantage against foes next to you.']],
                6: [['Aspect of the Beast', 'A lasting exploration perk from your chosen animal (Bear: double carrying capacity).']],
                10: [['Spirit Walker', 'Cast commune with nature as a ritual.']],
                14: [['Totemic Attunement', 'A strong rage benefit from your chosen animal (Bear: nearby foes have disadvantage attacking others).']] } },
            { id: 'ancestral-guardian', name: 'Path of the Ancestral Guardian', source: "Xanathar's Guide to Everything",
              summary: 'Ancestor spirits protect your allies from the foe you strike.',
              features: { 3: [['Ancestral Protectors', 'The first creature you hit while raging deals less damage to others.']], 6: [['Spirit Shield', 'Reaction: reduce damage to a nearby ally.']], 10: [['Consult the Spirits', 'Cast augury or clairvoyance without a slot.']], 14: [['Vengeful Ancestors', 'Spirit Shield damages the attacker.']] } },
            { id: 'storm-herald', name: 'Path of the Storm Herald', source: "Xanathar's Guide to Everything",
              summary: 'A storm aura of desert, sea or tundra while raging.',
              features: { 3: [['Storm Aura', 'A damaging or protective aura each turn while raging.']], 6: [['Storm Soul', 'Resistance and an exploration benefit from your environment.']], 10: [['Shielding Storm', 'Allies in your aura share your resistance.']], 14: [['Raging Storm', 'A reaction effect from your aura.']] } },
            { id: 'zealot', name: 'Path of the Zealot', source: "Xanathar's Guide to Everything",
              summary: 'Divine fury: extra radiant or necrotic damage, hard to kill.',
              features: { 3: [['Divine Fury', 'Extra damage on your first hit each turn while raging.'], ['Warrior of the Gods', 'Spells that raise you from death need no material components.']], 6: [['Fanatical Focus', 'Reroll a failed save once per rage.']], 10: [['Zealous Presence', 'Bonus action: allies gain advantage on attacks and saves.']], 14: [['Rage Beyond Death', 'While raging, 0 HP does not kill you until the rage ends.']] } },
            { id: 'beast', name: 'Path of the Beast', source: "Tasha's Cauldron of Everything",
              summary: 'Bite, claws or tail grow when you rage.',
              features: { 3: [['Form of the Beast', 'Natural weapons appear while raging.']], 6: [['Bestial Soul', 'Swim, climb or jump improvements; natural weapons count as magical.']], 10: [['Infectious Fury', 'Hits can force a target to attack another creature or take psychic damage.']], 14: [['Call the Hunt', 'Share rage bonuses with allies.']] } },
            { id: 'wild-magic', name: 'Path of Wild Magic', source: "Tasha's Cauldron of Everything",
              summary: 'Raging releases random surges of magic.',
              features: { 3: [['Magic Awareness', 'Sense spells and magic items nearby.'], ['Wild Surge', 'Roll a random magical effect when you rage.']], 6: [['Bolstering Magic', 'Boost an ally\'s rolls or restore a spell slot.']], 10: [['Unstable Backlash', 'Reroll the surge when you are hurt or fail a save.']], 14: [['Controlled Surge', 'Roll twice and pick the surge.']] } }
          ]
        },
        '2024': {
          subclassLevel: 3, subclassLabel: 'Barbarian Subclass',
          subclassFeatureLevels: [3, 6, 10, 14],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Shields, martial weapons',
          cantrips: null, spells: null,
          res: [
            { key: 'rage', label: 'Rage', title: 'Rages per long rest (one back on a short rest)',
              at: function (lv) { return A('2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6')[lv - 1]; } },
            { key: 'rageDmg', label: 'Rage dmg', title: 'Rage damage bonus on Strength-based attacks',
              at: function (lv) { return '+' + (lv >= 16 ? 4 : lv >= 9 ? 3 : 2); } }
          ],
          features: {
            1: [['Rage', 'Bonus action, while not in heavy armor: resistance to bludgeoning, piercing and slashing, bonus damage on Strength-based attacks, advantage on Strength checks and saves. No spells or concentration while raging. Lasts up to 10 minutes if you keep it going.'],
                ['Unarmored Defense', 'Without armor your AC is 10 + Dex + Con; a shield still works.'],
                ['Weapon Mastery', 'Use the mastery properties of two kinds of melee weapons (more at higher levels).']],
            2: [['Danger Sense', 'Advantage on Dex saves unless incapacitated.'],
                ['Reckless Attack', 'Advantage on Strength attacks this turn; attacks against you have advantage until your next turn.']],
            3: [['Barbarian Subclass', 'Choose your path.'],
                ['Primal Knowledge', 'An extra skill; Strength can power some checks while raging.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Fast Movement', '+10 ft speed without heavy armor.']],
            7: [['Feral Instinct', 'Advantage on initiative rolls.'],
                ['Instinctive Pounce', 'Move up to half your speed when you enter a rage.']],
            9: [['Brutal Strike', 'Give up Reckless Attack advantage to add damage and a rider effect to one hit.']],
            11: [['Relentless Rage', 'Drop to a few HP instead of 0 while raging on a Con save.']],
            13: [['Improved Brutal Strike', 'More Brutal Strike effects.']],
            15: [['Persistent Rage', 'Regain all rages on initiative once per long rest; rage lasts without upkeep.']],
            17: [['Improved Brutal Strike', 'More Brutal Strike damage; two effects at once.']],
            18: [['Indomitable Might', 'A Strength check or save below your Strength score uses the score instead.']],
            20: [['Primal Champion', 'Strength and Constitution +4 (max 25).']]
          },
          subclasses: [
            { id: 'berserker', name: 'Path of the Berserker', source: 'SRD 5.2', srd: true,
              summary: 'Frenzied fury: extra damage on Reckless Attacks.',
              features: {
                3: [['Frenzy', 'While raging, your first Reckless hit each turn adds extra damage dice.']],
                6: [['Mindless Rage', 'Immune to charm and fright while raging; entering a rage ends them.']],
                10: [['Retaliation', 'Reaction melee attack against a creature within 5 ft that damages you.']],
                14: [['Intimidating Presence', 'Frighten creatures around you; once per long rest or by spending a rage.']] } },
            { id: 'wild-heart', name: 'Path of the Wild Heart', source: "Player's Handbook (2024)",
              summary: 'Animal spirits; the Bear option resists nearly every damage type while raging.',
              features: {
                3: [['Animal Speaker', 'Cast beast sense and speak with animals as rituals.'],
                    ['Rage of the Wilds', 'Each rage pick Bear (resistance to all damage except force, necrotic, psychic and radiant), Eagle (dash and disengage as a bonus action) or Wolf (allies have advantage next to you).']],
                6: [['Aspect of the Wilds', 'Pick an animal benefit (owl darkvision, panther climb, salmon swim); change it on a long rest.']],
                10: [['Nature Speaker', 'Cast commune with nature as a ritual.']],
                14: [['Power of the Wilds', 'A new rage choice: falcon flight, lion pressure or ram knockdown.']] } },
            { id: 'world-tree', name: 'Path of the World Tree', source: "Player's Handbook (2024)",
              summary: 'Cosmic tree magic: temporary hit points and pulling foes.',
              features: { 3: [['Vitality of the Tree', 'Temporary HP when you rage, and more for allies each turn.']], 6: [['Branches of the Tree', 'Reaction: pull a creature next to you and slow it.']], 10: [['Battering Roots', 'Longer reach with heavy and versatile weapons; extra mastery effects.']], 14: [['Travel along the Tree', 'Teleport while raging, bringing allies once per rage.']] } },
            { id: 'zealot', name: 'Path of the Zealot', source: "Player's Handbook (2024)",
              summary: 'Divine fury: extra radiant or necrotic damage and self-healing.',
              features: { 3: [['Divine Fury', 'Extra damage on your first hit each turn while raging.'], ['Warrior of the Gods', 'A pool of healing dice you spend as a bonus action.']], 6: [['Fanatical Focus', 'Reroll a failed save with a bonus once per rage.']], 10: [['Zealous Presence', 'Bonus action: allies gain advantage on attacks and saves.']], 14: [['Rage of the Gods', 'Take a divine form when you rage: flight, resistances, and saving allies from 0 HP.']] } }
          ]
        }
      }
    },

    druid: {
      code: 'D', name: 'Druid', short: 'Dru', hitDie: 8, color: 'dru',
      caster: 'full', castAbil: 'wis',
      prereq: { wis: 13 },
      saves: 'Intelligence, Wisdom',
      ed: {
        '2014': {
          spellcastingFrom: 1,
          subclassLevel: 2, subclassLabel: 'Druid Circle',
          subclassFeatureLevels: [2, 6, 10, 14],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light armor, medium armor, shields (druids avoid metal armor and shields)',
          cantrips: A('2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4'),
          spells: { kind: 'prepared', formula: 'abilLevel', abil: 'wis' },
          res: [
            { key: 'ws', label: 'Wild Shape', title: 'Wild Shape uses, back on a short or long rest',
              at: function (lv) { return lv >= 20 ? 'unl.' : lv >= 2 ? 2 : 0; } },
            { key: 'wsCr', label: 'Beast CR', title: 'Highest beast challenge rating for Wild Shape (before 4: no flying or swimming; before 8: no flying)',
              at: function (lv, sub) { return lv >= 2 ? crText(wsCr2014(lv, sub)) : 0; } }
          ],
          features: {
            1: [['Druidic', 'The secret language of druids.'],
                ['Spellcasting', 'Full caster; prepare Wis mod + druid level from the druid list. Wisdom.']],
            2: [['Wild Shape', 'Turn into a beast you have seen, twice per short rest, for hours equal to half your druid level. The beast\'s HP takes damage first; extra damage carries over to you. You can\'t cast spells in beast form.'],
                ['Druid Circle', 'Choose your circle.']],
            4: [['Wild Shape improvement', 'Beasts up to CR 1/2; swimming forms allowed.']],
            8: [['Wild Shape improvement', 'Beasts up to CR 1; flying forms allowed.']],
            18: [['Timeless Body', 'You age far more slowly.'],
                 ['Beast Spells', 'Cast spells in Wild Shape (verbal and somatic parts).']],
            20: [['Archdruid', 'Unlimited Wild Shape; ignore verbal, somatic and cheap material components.']]
          },
          subclasses: [
            { id: 'land', name: 'Circle of the Land', source: 'SRD 5.1', srd: true,
              summary: 'Land-themed bonus spells and recovering spell slots on a short rest.',
              features: {
                2: [['Bonus Cantrip', 'One extra druid cantrip.'],
                    ['Natural Recovery', 'On a short rest, recover slots totalling half your druid level (no 6th or higher), once per long rest.']],
                3: [['Circle Spells', 'Always-prepared spells for your chosen land; more at 5, 7 and 9.']],
                6: [["Land's Stride", 'Move through nonmagical difficult terrain freely; advantage against magical plants.']],
                10: [["Nature's Ward", 'Immune to poison and disease; elementals and fey cannot charm or frighten you.']],
                14: [["Nature's Sanctuary", 'Beasts and plants must save before attacking you.']] } },
            { id: 'moon', name: 'Circle of the Moon', source: "Player's Handbook (2014)",
              summary: 'Combat Wild Shape: tougher beasts (CR 1, then druid level / 3) as a bonus action.',
              features: {
                2: [['Combat Wild Shape', 'Wild Shape as a bonus action; spend a slot in beast form to heal 1d8 per slot level.'],
                    ['Circle Forms', 'Beasts up to CR 1 from druid 2; from druid 6, CR up to druid level divided by 3.']],
                6: [['Primal Strike', 'Beast-form attacks count as magical.']],
                10: [['Elemental Wild Shape', 'Spend two uses to become an air, earth, fire or water elemental.']],
                14: [['Thousand Forms', 'Cast alter self at will.']] } },
            { id: 'dreams', name: 'Circle of Dreams', source: "Xanathar's Guide to Everything",
              summary: 'Fey healing and safe rests.',
              features: { 2: [['Balm of the Summer Court', 'A pool of d6s to heal at range as a bonus action.']], 6: [['Hearth of Moonlight and Shadow', 'Protect a resting camp.']], 10: [['Hidden Paths', 'Short-range teleports.']], 14: [['Walker in Dreams', 'Cast dream, scrying or teleportation circle after a short rest.']] } },
            { id: 'shepherd', name: 'Circle of the Shepherd', source: "Xanathar's Guide to Everything",
              summary: 'Spirit totems and stronger summoned beasts.',
              features: { 2: [['Speech of the Woods', 'Speak with beasts; learn Sylvan.'], ['Spirit Totem', 'Summon a bear, hawk or unicorn spirit aura.']], 6: [['Mighty Summoner', 'Summoned beasts and fey gain HP and magical attacks.']], 10: [['Guardian Spirit', 'Summons in your totem heal each turn.']], 14: [['Faithful Summons', 'Beasts appear to protect you when you drop to 0 HP.']] } },
            { id: 'spores', name: 'Circle of Spores', source: "Tasha's Cauldron of Everything",
              summary: 'Fungal necrotic damage and animating the dead.',
              features: { 2: [['Circle Spells', 'Always-prepared decay spells.'], ['Halo of Spores', 'Reaction necrotic damage to nearby creatures.'], ['Symbiotic Entity', 'Spend Wild Shape for temporary HP and extra necrotic damage.']], 6: [['Fungal Infestation', 'Raise a slain creature as a zombie.']], 10: [['Spreading Spores', 'Move your halo to a cube of spores.']], 14: [['Fungal Body', 'Immune to critical hits and several conditions.']] } },
            { id: 'stars', name: 'Circle of Stars', source: "Tasha's Cauldron of Everything",
              summary: 'Starry forms instead of beasts: archer, chalice or dragon.',
              features: { 2: [['Star Map', 'Guiding bolt and guidance from a star chart.'], ['Starry Form', 'Spend Wild Shape for a constellation form: ranged radiant attack, extra healing, or steady concentration.']], 6: [['Cosmic Omen', 'Reaction: add or subtract a d6 from a roll.']], 10: [['Twinkling Constellations', 'Stronger forms; switch each turn; fly as the dragon.']], 14: [['Full of Stars', 'Resist bludgeoning, piercing and slashing in Starry Form.']] } },
            { id: 'wildfire', name: 'Circle of Wildfire', source: "Tasha's Cauldron of Everything",
              summary: 'A wildfire spirit companion; fire and healing.',
              features: { 2: [['Circle Spells', 'Always-prepared fire spells.'], ['Summon Wildfire Spirit', 'Spend Wild Shape to summon a fire spirit.']], 6: [['Enhanced Bond', 'Extra fire damage or healing near the spirit.']], 10: [['Cauterizing Flames', 'Spectral flames heal or burn when creatures die nearby.']], 14: [['Blazing Revival', 'The spirit sacrifices itself to bring you back.']] } }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Druid Subclass',
          subclassFeatureLevels: [3, 6, 10, 14],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light armor, shields',
          cantrips: A('2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4'),
          spells: { kind: 'prepared', table: A('4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22') },
          res: [
            { key: 'ws', label: 'Wild Shape', title: 'Wild Shape uses per long rest (one back on a short rest)',
              at: function (lv) { return lv >= 17 ? 4 : lv >= 6 ? 3 : lv >= 2 ? 2 : 0; } },
            { key: 'wsCr', label: 'Beast CR', title: 'Highest beast challenge rating for Wild Shape (flying from druid 8)',
              at: function (lv, sub) { return lv >= 2 ? crText(wsCr2024(lv, sub)) : 0; } }
          ],
          features: {
            1: [['Spellcasting', 'Full caster with a prepared list that grows by level (see Spells). Wisdom.'],
                ['Druidic', 'The secret language of druids; speak with animals always prepared.'],
                ['Primal Order', 'Magician (extra cantrip, nature checks) or Warden (medium armor and martial weapons).']],
            2: [['Wild Shape', 'Bonus action: become a beast form you know. You gain temporary HP equal to your druid level, keep your own HP, and can\'t cast spells in beast form.'],
                ['Wild Companion', 'Spend a slot or Wild Shape use to cast find familiar.']],
            3: [['Druid Subclass', 'Choose your circle.']],
            4: [['Wild Shape improvement', 'More known forms; beasts up to CR 1/2.']],
            5: [['Wild Resurgence', 'Trade a spell slot for a Wild Shape use, or a use for a 1st-level slot.']],
            7: [['Elemental Fury', 'Potent Spellcasting (Wis to cantrip damage) or Primal Strike (extra elemental damage on attacks).']],
            8: [['Wild Shape improvement', 'Beasts up to CR 1; flying forms allowed.']],
            15: [['Improved Elemental Fury', 'Longer cantrip range or bigger Primal Strike damage.']],
            18: [['Beast Spells', 'Cast spells in Wild Shape.']],
            20: [['Archdruid', 'Regain Wild Shape on initiative, convert uses into spell slots, and age slowly.']]
          },
          subclasses: [
            { id: 'land', name: 'Circle of the Land', source: 'SRD 5.2', srd: true,
              summary: 'Land-themed spells, healing and recovering spell slots.',
              features: {
                3: [['Circle of the Land Spells', 'Always-prepared spells for your chosen land type, growing with level.'],
                    ["Land's Aid", 'Spend Wild Shape to damage foes and heal an ally in an area.']],
                6: [['Natural Recovery', 'Cast a circle spell free, and recover slots on a short rest, once per long rest.']],
                10: [["Nature's Ward", 'Immune to poison; resistance tied to your land.']],
                14: [["Nature's Sanctuary", 'Spend Wild Shape to raise a protective grove that shares your resistance.']] } },
            { id: 'moon', name: 'Circle of the Moon', source: "Player's Handbook (2024)",
              summary: 'Tougher Wild Shape: beasts up to druid level / 3, extra AC and temporary HP.',
              features: {
                3: [['Circle Forms', 'Beasts up to CR = druid level / 3 (min 1); AC at least 13 + Wis; temporary HP 3 x druid level.'],
                    ['Circle of the Moon Spells', 'Always-prepared moon spells; cast them in beast form.']],
                6: [['Improved Circle Forms', 'Radiant beast attacks and Wis added to Con saves in form.']],
                10: [['Moonlight Step', 'Bonus-action teleport with advantage on your next attack.']],
                14: [['Lunar Form', 'Extra radiant damage once per turn; teleport an ally with Moonlight Step.']] } },
            { id: 'sea', name: 'Circle of the Sea', source: "Player's Handbook (2024)",
              summary: 'Wrath of the Sea: a stormy emanation that pushes and damages.',
              features: { 3: [['Circle of the Sea Spells', 'Always-prepared sea and storm spells.'], ['Wrath of the Sea', 'Spend Wild Shape for a damaging aura that pushes foes.']], 6: [['Aquatic Affinity', 'Bigger aura and a swim speed.']], 10: [['Stormborn', 'Fly speed and resistances while the aura is up.']], 14: [['Oceanic Gift', 'Place the aura on an ally.']] } },
            { id: 'stars', name: 'Circle of the Stars', source: "Player's Handbook (2024)",
              summary: 'Starry forms instead of beasts: archer, chalice or dragon.',
              features: { 3: [['Star Map', 'Guiding bolt and guidance from a star chart.'], ['Starry Form', 'Spend Wild Shape for a constellation form: ranged radiant attack, extra healing, or steady concentration.']], 6: [['Cosmic Omen', 'Reaction: add or subtract a d6 from a roll.']], 10: [['Twinkling Constellations', 'Stronger forms; switch each turn; fly as the dragon.']], 14: [['Full of Stars', 'Resist bludgeoning, piercing and slashing in Starry Form.']] } }
          ]
        }
      }
    }
  };

  var ORDER = ['barbarian', 'druid'];
  var API = { CLASSES: MORE, ORDER: ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else (root.PLANNER_MORE_LIST = root.PLANNER_MORE_LIST || []).push(API);
})(this);
