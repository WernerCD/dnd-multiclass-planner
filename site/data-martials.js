/* More classes for the multiclass planner (stage 3: Fighter, Rogue, Monk).
   Same format as data.js and the other class files. Feature and subclass summaries are original
   one-line paraphrases written for this site, not book text; levels, counts and tables are game facts.
   Subclasses outside the SRD are listed by name, book and level with a one-line summary only.
   Eldritch Knight and Arcane Trickster add third-caster spellcasting through their `casting` block. */
(function (root) {
  'use strict';
  var A = function (s) { return s.split(',').map(Number); };
  function F(spec) {
    var out = {};
    Object.keys(spec).forEach(function (L) { var a = spec[L], list = []; for (var i = 0; i < a.length; i += 2) list.push([a[i], a[i + 1]]); out[L] = list; });
    return out;
  }
  var THIRD_KNOWN = A('0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13');
  var EK_CAN = A('0,0,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3');
  var AT_CAN = A('0,0,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4');
  var ekCasting = function (kind) { return { caster: 'third', castAbil: 'int', spellcastingFrom: 3, cantrips: EK_CAN, spells: { kind: kind, table: THIRD_KNOWN } }; };
  var atCasting = function (kind) { return { caster: 'third', castAbil: 'int', spellcastingFrom: 3, cantrips: AT_CAN, spells: { kind: kind, table: THIRD_KNOWN } }; };
  var sneak = function (lv) { return Math.ceil(lv / 2) + 'd6'; };

  var MORE = {
    fighter: {
      code: 'F', name: 'Fighter', short: 'Ftr', hitDie: 10, color: 'ftr',
      caster: 'none',
      prereq: {}, prereqAny: { str: 13, dex: 13 },
      saves: 'Strength, Constitution',
      extraAttack: [5, 11, 20],
      ed: {
        '2014': {
          subclassLevel: 3, subclassLabel: 'Martial Archetype',
          subclassFeatureLevels: [3, 7, 10, 15, 18],
          asi: [4, 6, 8, 12, 14, 16, 19], epicBoon: null,
          mcProf: 'Light armor, medium armor, shields, simple and martial weapons',
          cantrips: null, spells: null,
          res: [
            { key: 'surge', label: 'Action Surge', title: 'Action Surge uses per short rest', at: function (lv) { return lv >= 17 ? 2 : lv >= 2 ? 1 : 0; } },
            { key: 'indom', label: 'Indomitable', title: 'Indomitable rerolls per long rest', at: function (lv) { return lv >= 17 ? 3 : lv >= 13 ? 2 : lv >= 9 ? 1 : 0; } }
          ],
          features: {
            1: [['Fighting Style', 'Pick a style, such as Archery, Defense, Dueling or Great Weapon Fighting.'],
                ['Second Wind', 'Bonus action: regain 1d10 + fighter level HP, once per short rest.']],
            2: [['Action Surge', 'Take one extra action on your turn, once per short rest (twice at 17).']],
            3: [['Martial Archetype', 'Choose your archetype.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.']],
            9: [['Indomitable', 'Reroll a failed save, once per long rest (more uses at 13 and 17).']],
            11: [['Extra Attack (2)', 'Attack three times when you take the Attack action.']],
            13: [['Indomitable (2)', 'Two rerolls per long rest.']],
            17: [['Action Surge (2)', 'Two uses per short rest (only one per turn).'], ['Indomitable (3)', 'Three rerolls per long rest.']],
            20: [['Extra Attack (3)', 'Attack four times when you take the Attack action.']]
          },
          subclasses: [
            { id: 'champion', name: 'Champion', source: 'SRD 5.1', srd: true,
              summary: 'Wider critical range and simple, steady toughness.',
              features: F({ 3: ['Improved Critical', 'Critical hits on 19 or 20.'], 7: ['Remarkable Athlete', 'Half proficiency on physical checks; longer running jumps.'], 10: ['Additional Fighting Style', 'A second fighting style.'], 15: ['Superior Critical', 'Critical hits on 18 to 20.'], 18: ['Survivor', 'Regain HP each turn while below half.'] }) },
            { id: 'battle-master', name: 'Battle Master', source: "Player's Handbook (2014)",
              summary: 'Superiority dice for tactical maneuvers.',
              features: F({ 3: ['Combat Superiority', 'Four superiority dice (d8) for maneuvers such as Trip or Riposte.', 'Student of War', "An artisan's tool."], 7: ['Know Your Enemy', "Learn how a creature compares to you."], 10: ['Improved Combat Superiority', 'Superiority dice become d10.'], 15: ['Relentless', 'Regain a die on initiative if you have none.'], 18: ['Improved Combat Superiority', 'Superiority dice become d12.'] }) },
            { id: 'eldritch-knight', name: 'Eldritch Knight', source: "Player's Handbook (2014)", casting: ekCasting('known'),
              summary: 'Third caster (Intelligence, mostly abjuration and evocation spells) who mixes spells and attacks.',
              features: F({ 3: ['Spellcasting', 'Third caster with spells known from the wizard list (mostly abjuration and evocation). Intelligence.', 'Weapon Bond', 'Summon your bonded weapon; it cannot be disarmed.'], 7: ['War Magic', 'After casting a cantrip, make a weapon attack as a bonus action.'], 10: ['Eldritch Strike', 'A hit gives disadvantage on the next save against your spell.'], 15: ['Arcane Charge', 'Teleport when you Action Surge.'], 18: ['Improved War Magic', 'After casting a spell, make a weapon attack as a bonus action.'] }) },
            { id: 'arcane-archer', name: 'Arcane Archer', source: "Xanathar's Guide to Everything",
              summary: 'Magical arrow shots a few times per rest.',
              features: F({ 3: ['Arcane Archer Lore', 'A skill and a cantrip.', 'Arcane Shot', 'Two magical shot effects per short rest.'], 7: ['Magic Arrow', 'Arrows count as magical.', 'Curving Shot', 'Redirect a missed arrow.'], 10: ['Arcane Shot improvement', 'Another shot option.'], 15: ['Ever-Ready Shot', 'Regain a shot on initiative.'], 18: ['Arcane Shot improvement', 'Stronger shot effects.'] }) },
            { id: 'cavalier', name: 'Cavalier', source: "Xanathar's Guide to Everything",
              summary: 'Mounted defender who marks foes.',
              features: F({ 3: ['Bonus Proficiency', 'A skill or language.', 'Born to the Saddle', 'Mount and dismount easily.', 'Unwavering Mark', 'Marked foes have disadvantage attacking others.'], 7: ['Warding Maneuver', 'Reaction: boost an ally\'s AC.'], 10: ['Hold the Line', 'Opportunity attacks stop movement.'], 15: ['Ferocious Charger', 'Knock foes prone after moving.'], 18: ['Vigilant Defender', 'An opportunity attack every turn.'] }) },
            { id: 'samurai', name: 'Samurai', source: "Xanathar's Guide to Everything",
              summary: 'Fighting Spirit: advantage and temporary HP.',
              features: F({ 3: ['Bonus Proficiency', 'A skill or language.', 'Fighting Spirit', 'Bonus action: advantage on attacks and temporary HP.'], 7: ['Elegant Courtier', 'Add Wis to Persuasion; a save proficiency.'], 10: ['Tireless Spirit', 'Regain Fighting Spirit on initiative.'], 15: ['Rapid Strike', 'Trade advantage for an extra attack.'], 18: ['Strength before Death', 'Take a turn when dropped to 0 HP.'] }) },
            { id: 'psi-warrior', name: 'Psi Warrior', source: "Tasha's Cauldron of Everything",
              summary: 'Psionic dice for force damage, shields and telekinesis.',
              features: F({ 3: ['Psionic Power', 'Psionic dice for protective fields, force strikes and telekinesis.'], 7: ['Telekinetic Adept', 'Psi-powered leaps and pushes.'], 10: ['Guarded Mind', 'Psychic resistance; end charm and fright.'], 15: ['Bulwark of Force', 'Half cover for allies.'], 18: ['Telekinetic Master', 'Cast telekinesis and attack while holding it.'] }) },
            { id: 'rune-knight', name: 'Rune Knight', source: "Tasha's Cauldron of Everything",
              summary: 'Giant runes and growing to Large size.',
              features: F({ 3: ['Rune Carver', 'Inscribe giant runes on gear.', 'Giant\'s Might', 'Grow Large, gain advantage on Strength and deal extra damage.'], 7: ['Runic Shield', 'Reaction: make an attacker reroll.'], 10: ['Great Stature', 'Grow taller; more Giant\'s Might damage.'], 15: ['Master of Runes', 'Use each rune twice per rest.'], 18: ['Runic Juggernaut', 'Grow Huge with more reach and damage.'] }) }
          ]
        },
        '2024': {
          subclassLevel: 3, subclassLabel: 'Fighter Subclass',
          subclassFeatureLevels: [3, 7, 10, 15, 18],
          asi: [4, 6, 8, 12, 14, 16], epicBoon: 19,
          mcProf: 'Light and medium armor, shields, martial weapons',
          cantrips: null, spells: null,
          res: [
            { key: 'wind', label: 'Second Wind', title: 'Second Wind uses per long rest (one back on a short rest)', at: function (lv) { return lv >= 10 ? 4 : lv >= 4 ? 3 : 2; } },
            { key: 'surge', label: 'Action Surge', title: 'Action Surge uses per short rest', at: function (lv) { return lv >= 17 ? 2 : lv >= 2 ? 1 : 0; } },
            { key: 'indom', label: 'Indomitable', title: 'Indomitable rerolls per long rest', at: function (lv) { return lv >= 17 ? 3 : lv >= 13 ? 2 : lv >= 9 ? 1 : 0; } }
          ],
          features: {
            1: [['Fighting Style', 'A fighting style feat.'],
                ['Second Wind', 'Bonus action: regain 1d10 + fighter level HP; uses grow with level.'],
                ['Weapon Mastery', 'Use the mastery properties of three kinds of weapons (more later).']],
            2: [['Action Surge', 'One extra action on your turn, once per short rest (twice at 17).'],
                ['Tactical Mind', 'Spend Second Wind to add a d10 to a failed ability check.']],
            3: [['Fighter Subclass', 'Choose your subclass.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Tactical Shift', 'Second Wind also lets you move without provoking.']],
            9: [['Indomitable', 'Reroll a failed save with a bonus, once per long rest.'],
                ['Tactical Master', 'Swap a weapon\'s mastery property for Push, Sap or Slow.']],
            11: [['Two Extra Attacks', 'Attack three times when you take the Attack action.']],
            13: [['Indomitable (2)', 'Two rerolls per long rest.'], ['Studied Attacks', 'Advantage on your next attack against a creature you missed.']],
            17: [['Action Surge (2)', 'Two uses per short rest (only one per turn).'], ['Indomitable (3)', 'Three rerolls per long rest.']],
            20: [['Three Extra Attacks', 'Attack four times when you take the Attack action.']]
          },
          subclasses: [
            { id: 'champion', name: 'Champion', source: 'SRD 5.2', srd: true,
              summary: 'Wider critical range and steady toughness.',
              features: F({ 3: ['Improved Critical', 'Critical hits on 19 or 20.', 'Remarkable Athlete', 'Advantage on initiative and Athletics; move after a critical hit.'], 7: ['Additional Fighting Style', 'A second fighting style feat.'], 10: ['Heroic Warrior', 'Gain Heroic Inspiration each turn if you have none.'], 15: ['Superior Critical', 'Critical hits on 18 to 20.'], 18: ['Survivor', 'Advantage on death saves; regain HP each turn while below half.'] }) },
            { id: 'battle-master', name: 'Battle Master', source: "Player's Handbook (2024)",
              summary: 'Superiority dice for tactical maneuvers.',
              features: F({ 3: ['Combat Superiority', 'Superiority dice (d8) for maneuvers.', 'Student of War', 'A tool and a skill.'], 7: ['Know Your Enemy', "Learn a creature's immunities, resistances and vulnerabilities."], 10: ['Improved Combat Superiority', 'Superiority dice become d10.'], 15: ['Relentless', 'Use a d8 for a maneuver when you are out of dice, once per turn.'], 18: ['Ultimate Combat Superiority', 'Superiority dice become d12.'] }) },
            { id: 'eldritch-knight', name: 'Eldritch Knight', source: "Player's Handbook (2024)", casting: ekCasting('prepared'),
              summary: 'Third caster (Intelligence) who mixes spells and attacks.',
              features: F({ 3: ['Spellcasting', 'Third caster with prepared wizard spells. Intelligence.', 'War Bond', 'Summon your bonded weapon; it cannot be disarmed.'], 7: ['War Magic', 'Replace one attack with a cantrip.'], 10: ['Eldritch Strike', 'A hit gives disadvantage on the next save against your spell.'], 15: ['Arcane Charge', 'Teleport when you Action Surge.'], 18: ['Improved War Magic', 'Replace two attacks with a spell of 1st or 2nd level.'] }) },
            { id: 'psi-warrior', name: 'Psi Warrior', source: "Player's Handbook (2024)",
              summary: 'Psionic energy dice for force damage, shields and telekinesis.',
              features: F({ 3: ['Psionic Power', 'Energy dice for protective fields, psionic strikes and telekinetic movement.'], 7: ['Telekinetic Adept', 'Psi-powered leaps and throws.'], 10: ['Guarded Mind', 'Psychic resistance; end charm and fright.'], 15: ['Bulwark of Force', 'Half cover for allies.'], 18: ['Telekinetic Master', 'Cast telekinesis and attack while holding it.'] }) }
          ]
        }
      }
    },

    rogue: {
      code: 'T', name: 'Rogue', short: 'Rog', hitDie: 8, color: 'rog',
      caster: 'none',
      prereq: { dex: 13 },
      saves: 'Dexterity, Intelligence',
      ed: {
        '2014': {
          subclassLevel: 3, subclassLabel: 'Roguish Archetype',
          subclassFeatureLevels: [3, 9, 13, 17],
          asi: [4, 8, 10, 12, 16, 19], epicBoon: null,
          mcProf: "Light armor, one skill from the rogue list, thieves' tools",
          cantrips: null, spells: null,
          res: [{ key: 'sneak', label: 'Sneak Attack', title: 'Sneak Attack damage, once per turn', at: sneak }],
          features: {
            1: [['Expertise', 'Double proficiency in two skills (or one and thieves\' tools); two more at 6.'],
                ['Sneak Attack', 'Once per turn, extra damage with a finesse or ranged weapon when you have advantage or an ally is next to the target.'],
                ["Thieves' Cant", 'A secret rogue language.']],
            2: [['Cunning Action', 'Bonus action: Dash, Disengage or Hide.']],
            3: [['Roguish Archetype', 'Choose your archetype.']],
            5: [['Uncanny Dodge', 'Reaction: halve the damage of an attack you can see. This is not resistance, so it stacks with it.']],
            6: [['Expertise', 'Two more skills with double proficiency.']],
            7: [['Evasion', 'No damage on a successful Dex save for half, half on a failure.']],
            11: [['Reliable Talent', 'Proficient checks treat a d20 roll below 10 as 10.']],
            14: [['Blindsense', 'Sense hidden and invisible creatures within 10 ft.']],
            15: [['Slippery Mind', 'Proficiency in Wisdom saves.']],
            18: [['Elusive', 'No attack roll has advantage against you while you can act.']],
            20: [['Stroke of Luck', 'Turn a miss into a hit or a failed check into a 20, once per short rest.']]
          },
          subclasses: [
            { id: 'thief', name: 'Thief', source: 'SRD 5.1', srd: true,
              summary: 'Fast Hands, climbing and using magic items.',
              features: F({ 3: ['Fast Hands', 'Cunning Action can use an object or thieves\' tools.', 'Second-Story Work', 'Climb at full speed; longer running jumps.'], 9: ['Supreme Sneak', 'Advantage on Stealth when moving at half speed.'], 13: ['Use Magic Device', 'Ignore class, race and level requirements on items.'], 17: ["Thief's Reflexes", 'Two turns in the first round.'] }) },
            { id: 'arcane-trickster', name: 'Arcane Trickster', source: "Player's Handbook (2014)", casting: atCasting('known'),
              summary: 'Third caster (Intelligence, mostly enchantment and illusion) with an invisible mage hand.',
              features: F({ 3: ['Spellcasting', 'Third caster with spells known from the wizard list (mostly enchantment and illusion). Intelligence.', 'Mage Hand Legerdemain', 'An invisible mage hand that can pick locks and pockets.'], 9: ['Magical Ambush', 'Spells you cast while hidden impose disadvantage on saves.'], 13: ['Versatile Trickster', 'Your mage hand grants you advantage.'], 17: ['Spell Thief', 'Steal a spell that targets you.'] }) },
            { id: 'assassin', name: 'Assassin', source: "Player's Handbook (2014)",
              summary: 'Automatic critical hits on surprised foes.',
              features: F({ 3: ['Bonus Proficiencies', 'Disguise and poisoner\'s kits.', 'Assassinate', 'Advantage early in combat; hits on surprised creatures are critical.'], 9: ['Infiltration Expertise', 'Build false identities.'], 13: ['Impostor', 'Mimic another person.'], 17: ['Death Strike', 'Double damage on surprised creatures that fail a save.'] }) },
            { id: 'inquisitive', name: 'Inquisitive', source: "Xanathar's Guide to Everything",
              summary: 'Spot lies and set up Sneak Attacks with Insight.',
              features: F({ 3: ['Ear for Deceit', 'Insight rolls of 7 or lower count as 8.', 'Eye for Detail', 'Search as a bonus action.', 'Insightful Fighting', 'Insight check enables Sneak Attack without advantage.'], 9: ['Steady Eye', 'Advantage on Perception and Investigation at half speed.'], 13: ['Unerring Eye', 'Sense illusions and shapechangers.'], 17: ['Eye for Weakness', 'Extra Sneak Attack damage with Insightful Fighting.'] }) },
            { id: 'mastermind', name: 'Mastermind', source: "Xanathar's Guide to Everything",
              summary: 'Help as a bonus action at range; social infiltration.',
              features: F({ 3: ['Master of Intrigue', 'Languages, kits and mimicry.', 'Master of Tactics', 'Help as a bonus action from 30 ft.'], 9: ['Insightful Manipulator', 'Learn how a creature compares to you.'], 13: ['Misdirection', 'Redirect an attack to a creature next to you.'], 17: ['Soul of Deceit', 'Your thoughts cannot be read.'] }) },
            { id: 'scout', name: 'Scout', source: "Xanathar's Guide to Everything",
              summary: 'Skirmisher with free movement and nature skills.',
              features: F({ 3: ['Skirmisher', 'Reaction: move away when an enemy approaches.', 'Survivalist', 'Expertise in Nature and Survival.'], 9: ['Superior Mobility', '+10 ft speed.'], 13: ['Ambush Master', 'Advantage on initiative and grant advantage against your first target.'], 17: ['Sudden Strike', 'An extra bonus-action attack that can Sneak Attack another target.'] }) },
            { id: 'swashbuckler', name: 'Swashbuckler', source: "Xanathar's Guide to Everything",
              summary: 'Duelist: Sneak Attack one-on-one and Cha to initiative.',
              features: F({ 3: ['Fancy Footwork', 'Foes you attack cannot make opportunity attacks against you.', 'Rakish Audacity', 'Add Cha to initiative; Sneak Attack when alone with the target.'], 9: ['Panache', 'Charm or goad with Persuasion.'], 13: ['Elegant Maneuver', 'Advantage on an Acrobatics or Athletics check.'], 17: ['Master Duelist', 'Reroll a miss with advantage.'] }) },
            { id: 'phantom', name: 'Phantom', source: "Tasha's Cauldron of Everything",
              summary: 'Ghostly skills and necrotic damage from the dead.',
              features: F({ 3: ['Whispers of the Dead', 'Gain a proficiency from spirits.', 'Wails from the Grave', 'Sneak Attack also hurts a second creature.'], 9: ['Tokens of the Departed', 'Soul trinkets that empower you.'], 13: ['Ghost Walk', 'Become spectral and fly.'], 17: ["Death's Friend", 'Stronger wails; always a soul trinket.'] }) },
            { id: 'soulknife', name: 'Soulknife', source: "Tasha's Cauldron of Everything",
              summary: 'Psychic blades and telepathy.',
              features: F({ 3: ['Psionic Power', 'Psionic dice for skills and telepathy.', 'Psychic Blades', 'Manifest psychic blades to attack.'], 9: ['Soul Blades', 'Guide your blades and teleport by throwing them.'], 13: ['Psychic Veil', 'Turn invisible.'], 17: ['Rend Mind', 'Stun with Sneak Attack.'] }) }
          ]
        },
        '2024': {
          subclassLevel: 3, subclassLabel: 'Rogue Subclass',
          subclassFeatureLevels: [3, 9, 13, 17],
          asi: [4, 8, 10, 12, 16], epicBoon: 19,
          mcProf: "Light armor, one skill from the rogue list, thieves' tools",
          cantrips: null, spells: null,
          res: [{ key: 'sneak', label: 'Sneak Attack', title: 'Sneak Attack damage, once per turn', at: sneak }],
          features: {
            1: [['Expertise', 'Double proficiency in two skills; two more at 6.'],
                ['Sneak Attack', 'Once per turn, extra damage with a finesse or ranged weapon when you have advantage or an ally is next to the target.'],
                ["Thieves' Cant", 'A secret rogue language, plus another language.'],
                ['Weapon Mastery', 'Use the mastery properties of two kinds of weapons.']],
            2: [['Cunning Action', 'Bonus action: Dash, Disengage or Hide.']],
            3: [['Rogue Subclass', 'Choose your subclass.'],
                ['Steady Aim', 'Bonus action: advantage on your next attack if you do not move.']],
            5: [['Cunning Strike', 'Trade Sneak Attack dice for effects like poison, trip or withdraw.'],
                ['Uncanny Dodge', 'Reaction: halve the damage of an attack you can see. This is not resistance, so it stacks with it.']],
            6: [['Expertise', 'Two more skills with double proficiency.']],
            7: [['Evasion', 'No damage on a successful Dex save for half, half on a failure.'],
                ['Reliable Talent', 'Proficient checks treat a d20 roll below 10 as 10.']],
            11: [['Improved Cunning Strike', 'Use two Cunning Strike effects at once.']],
            14: [['Devious Strikes', 'New Cunning Strike effects: daze, knock out, obscure.']],
            15: [['Slippery Mind', 'Proficiency in Wisdom and Charisma saves.']],
            18: [['Elusive', 'No attack roll has advantage against you while you can act.']],
            20: [['Stroke of Luck', 'Turn a failed d20 test into a 20, once per short rest.']]
          },
          subclasses: [
            { id: 'thief', name: 'Thief', source: 'SRD 5.2', srd: true,
              summary: 'Fast Hands, climbing and using magic items.',
              features: F({ 3: ['Fast Hands', 'Cunning Action can use an object, thieves\' tools or sleight of hand.', 'Second-Story Work', 'Climb speed and longer jumps.'], 9: ['Supreme Sneak', 'A stealthy Cunning Strike option.'], 13: ['Use Magic Device', 'More attunement and better luck with scrolls and charges.'], 17: ["Thief's Reflexes", 'Two turns in the first round.'] }) },
            { id: 'arcane-trickster', name: 'Arcane Trickster', source: "Player's Handbook (2024)", casting: atCasting('prepared'),
              summary: 'Third caster (Intelligence) with an invisible mage hand.',
              features: F({ 3: ['Spellcasting', 'Third caster with prepared wizard spells. Intelligence.', 'Mage Hand Legerdemain', 'An invisible mage hand that can pick locks and pockets.'], 9: ['Magical Ambush', 'Spells you cast while hidden impose disadvantage on saves.'], 13: ['Versatile Trickster', 'Your mage hand can trip a creature.'], 17: ['Spell Thief', 'Steal a spell that targets you.'] }) },
            { id: 'assassin', name: 'Assassin', source: "Player's Handbook (2024)",
              summary: 'Strike first: advantage and extra damage early in combat.',
              features: F({ 3: ['Assassinate', 'Advantage on initiative and on attacks against creatures that have not acted; extra damage in round one.', "Assassin's Tools", 'Disguise and poisoner\'s kits.'], 9: ['Infiltration Expertise', 'False identities and mimicry.'], 13: ['Envenom Weapons', 'Poison Cunning Strikes deal extra damage.'], 17: ['Death Strike', 'Double damage on a failed save in round one.'] }) },
            { id: 'soulknife', name: 'Soulknife', source: "Player's Handbook (2024)",
              summary: 'Psychic blades and telepathy.',
              features: F({ 3: ['Psionic Power', 'Energy dice for skills and telepathy.', 'Psychic Blades', 'Manifest psychic blades to attack.'], 9: ['Soul Blades', 'Guide your blades and teleport by throwing them.'], 13: ['Psychic Veil', 'Turn invisible.'], 17: ['Rend Mind', 'Stun with Sneak Attack.'] }) }
          ]
        }
      }
    },

    monk: {
      code: 'M', name: 'Monk', short: 'Monk', hitDie: 8, color: 'monk',
      caster: 'none',
      prereq: { dex: 13, wis: 13 },
      saves: 'Strength, Dexterity',
      extraAttack: [5],
      ed: {
        '2014': {
          subclassLevel: 3, subclassLabel: 'Monastic Tradition',
          subclassFeatureLevels: [3, 6, 11, 17],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Simple weapons, shortswords',
          cantrips: null, spells: null,
          res: [
            { key: 'ki', label: 'Ki', title: 'Ki points, back on a short rest', at: function (lv) { return lv >= 2 ? lv : 0; } },
            { key: 'ma', label: 'Martial Arts', title: 'Martial Arts damage die', at: function (lv) { return lv >= 17 ? 'd10' : lv >= 11 ? 'd8' : lv >= 5 ? 'd6' : 'd4'; } }
          ],
          features: {
            1: [['Unarmored Defense', 'Without armor or a shield your AC is 10 + Dex + Wis.'],
                ['Martial Arts', 'Use Dex for unarmed strikes and monk weapons, a martial arts die for damage, and a bonus-action unarmed strike.']],
            2: [['Ki', 'Ki points equal to monk level for Flurry of Blows, Patient Defense and Step of the Wind.'],
                ['Unarmored Movement', 'Extra speed without armor, growing with level.']],
            3: [['Monastic Tradition', 'Choose your tradition.'],
                ['Deflect Missiles', 'Reaction: reduce ranged weapon damage, and catch and throw the missile.']],
            4: [['Slow Fall', 'Reaction: reduce falling damage.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Stunning Strike', 'Spend 1 ki on a hit to stun the target on a failed Con save.']],
            6: [['Ki-Empowered Strikes', 'Unarmed strikes count as magical.']],
            7: [['Evasion', 'No damage on a successful Dex save for half, half on a failure.'],
                ['Stillness of Mind', 'Action: end charm or fright on yourself.']],
            9: [['Unarmored Movement improvement', 'Run along walls and across water.']],
            10: [['Purity of Body', 'Immune to disease and poison.']],
            13: [['Tongue of the Sun and Moon', 'Understand and be understood in any language.']],
            14: [['Diamond Soul', 'Proficiency in all saves; spend ki to reroll one.']],
            15: [['Timeless Body', 'You age slowly and need no food or water.']],
            18: [['Empty Body', 'Spend ki to turn invisible and resist damage, or to cast astral projection.']],
            20: [['Perfect Self', 'Regain 4 ki on initiative when you have none.']]
          },
          subclasses: [
            { id: 'open-hand', name: 'Way of the Open Hand', source: 'SRD 5.1', srd: true,
              summary: 'Flurry of Blows knocks foes down and away.',
              features: F({ 3: ['Open Hand Technique', 'Flurry of Blows hits can knock prone, push or deny reactions.'], 6: ['Wholeness of Body', 'Heal 3 x monk level HP once per long rest.'], 11: ['Tranquility', 'A sanctuary effect after a long rest.'], 17: ['Quivering Palm', 'Set lethal vibrations in a creature.'] }) },
            { id: 'shadow', name: 'Way of Shadow', source: "Player's Handbook (2014)",
              summary: 'Shadow magic and teleporting between shadows.',
              features: F({ 3: ['Shadow Arts', 'Spend ki to cast darkness, pass without trace and similar spells.'], 6: ['Shadow Step', 'Teleport between dim areas with advantage on your next attack.'], 11: ['Cloak of Shadows', 'Turn invisible in darkness.'], 17: ['Opportunist', 'Reaction attack when an ally hits a creature next to you.'] }) },
            { id: 'four-elements', name: 'Way of the Four Elements', source: "Player's Handbook (2014)",
              summary: 'Spend ki on elemental disciplines (spell effects).',
              features: F({ 3: ['Disciple of the Elements', 'Elemental disciplines powered by ki.'], 6: ['Extra Elemental Discipline', 'Another discipline.'], 11: ['Extra Elemental Discipline', 'Another discipline.'], 17: ['Extra Elemental Discipline', 'Another discipline.'] }) },
            { id: 'drunken-master', name: 'Way of the Drunken Master', source: "Xanathar's Guide to Everything",
              summary: 'Swaying evasion and redirected attacks.',
              features: F({ 3: ['Bonus Proficiencies', 'Performance and brewer\'s supplies.', 'Drunken Technique', 'Flurry of Blows also grants Disengage and speed.'], 6: ['Tipsy Sway', 'Stand up easily and redirect misses.'], 11: ["Drunkard's Luck", 'Spend ki to cancel disadvantage.'], 17: ['Intoxicated Frenzy', 'Flurry of Blows hits more targets.'] }) },
            { id: 'kensei', name: 'Way of the Kensei', source: "Xanathar's Guide to Everything",
              summary: 'Weapon master monk.',
              features: F({ 3: ['Path of the Kensei', 'Kensei weapons with AC and damage benefits.'], 6: ['One with the Blade', 'Magic kensei weapons and a precise strike.'], 11: ['Sharpen the Blade', 'Spend ki for a weapon bonus.'], 17: ['Unerring Accuracy', 'Reroll a missed monk weapon attack.'] }) },
            { id: 'sun-soul', name: 'Way of the Sun Soul', source: "Xanathar's Guide to Everything",
              summary: 'Radiant bolts and bursts.',
              features: F({ 3: ['Radiant Sun Bolt', 'A ranged radiant attack that counts as a monk weapon.'], 6: ['Searing Arc Strike', 'Cast burning hands with ki.'], 11: ['Searing Sunburst', 'A radiant explosion.'], 17: ['Sun Shield', 'A radiant aura that burns attackers.'] }) },
            { id: 'mercy', name: 'Way of Mercy', source: "Tasha's Cauldron of Everything",
              summary: 'Healing and harming touches powered by ki.',
              features: F({ 3: ['Implements of Mercy', 'Insight, Medicine and a mask.', 'Hand of Healing', 'Spend ki to heal.', 'Hand of Harm', 'Spend ki for necrotic damage.'], 6: ["Physician's Touch", 'Heals end conditions; harm poisons.'], 11: ['Flurry of Healing and Harm', 'Heal or harm with Flurry of Blows.'], 17: ['Hand of Ultimate Mercy', 'Bring back the recently dead.'] }) },
            { id: 'astral-self', name: 'Way of the Astral Self', source: "Tasha's Cauldron of Everything",
              summary: 'Spectral arms with reach, using Wisdom to attack.',
              features: F({ 3: ['Arms of the Astral Self', 'Spectral arms: Wis for unarmed strikes and reach.'], 6: ['Visage of the Astral Self', 'A spectral face with sight and voice benefits.'], 11: ['Body of the Astral Self', 'Deflect damage and add damage.'], 17: ['Awakened Astral Self', 'Your full astral self with AC and extra attacks.'] }) }
          ]
        },
        '2024': {
          subclassLevel: 3, subclassLabel: 'Monk Subclass',
          subclassFeatureLevels: [3, 6, 11, 17],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'None',
          cantrips: null, spells: null,
          res: [
            { key: 'ki', label: 'Focus', title: 'Focus points, back on a short rest', at: function (lv) { return lv >= 2 ? lv : 0; } },
            { key: 'ma', label: 'Martial Arts', title: 'Martial Arts damage die', at: function (lv) { return lv >= 17 ? 'd12' : lv >= 11 ? 'd10' : lv >= 5 ? 'd8' : 'd6'; } }
          ],
          features: {
            1: [['Martial Arts', 'Dex for unarmed strikes and monk weapons, a martial arts die, and a bonus-action unarmed strike.'],
                ['Unarmored Defense', 'Without armor or a shield your AC is 10 + Dex + Wis.']],
            2: [["Monk's Focus", 'Focus points equal to monk level for Flurry of Blows, Patient Defense and Step of the Wind.'],
                ['Unarmored Movement', 'Extra speed without armor, growing with level.'],
                ['Uncanny Metabolism', 'Regain all focus points and some HP on initiative, once per long rest.']],
            3: [['Deflect Attacks', 'Reaction: reduce damage from an attack and redirect it with a focus point.'],
                ['Monk Subclass', 'Choose your subclass.']],
            4: [['Slow Fall', 'Reaction: reduce falling damage.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Stunning Strike', 'Spend a focus point on a hit to stun until your next turn, or slow on a success.']],
            6: [['Empowered Strikes', 'Unarmed strikes can deal force damage.']],
            7: [['Evasion', 'No damage on a successful Dex save for half, half on a failure.']],
            9: [['Acrobatic Movement', 'Run along walls and across liquids.']],
            10: [['Heightened Focus', 'Stronger Flurry of Blows, Patient Defense and Step of the Wind.'],
                 ['Self-Restoration', 'End charm, fright or poison on yourself each turn; no exhaustion from hunger.']],
            13: [['Deflect Energy', 'Deflect Attacks works on any damage type.']],
            14: [['Disciplined Survivor', 'Proficiency in all saves; spend focus to reroll one.']],
            15: [['Perfect Focus', 'Regain focus on initiative when you are low.']],
            18: [['Superior Defense', 'Spend focus to resist all damage except force for a minute.']],
            20: [['Body and Mind', 'Dexterity and Wisdom +4 (max 25).']]
          },
          subclasses: [
            { id: 'open-hand', name: 'Warrior of the Open Hand', source: 'SRD 5.2', srd: true,
              summary: 'Flurry of Blows knocks foes down and away.',
              features: F({ 3: ['Open Hand Technique', 'Flurry of Blows hits can knock prone, push or deny reactions.'], 6: ['Wholeness of Body', 'Bonus action: heal a few times per long rest.'], 11: ['Fleet Step', 'Step of the Wind after any bonus action.'], 17: ['Quivering Palm', 'Set lethal vibrations in a creature.'] }) },
            { id: 'mercy', name: 'Warrior of Mercy', source: "Player's Handbook (2024)",
              summary: 'Healing and harming touches powered by focus.',
              features: F({ 3: ['Hand of Harm', 'Extra necrotic damage on an unarmed hit.', 'Hand of Healing', 'Heal with focus or Flurry of Blows.', 'Implements of Mercy', 'Insight, Medicine and an herbalism kit.'], 6: ["Physician's Touch", 'Heals end conditions; harm poisons.'], 11: ['Flurry of Healing and Harm', 'Heal or harm with Flurry of Blows.'], 17: ['Hand of Ultimate Mercy', 'Bring back the recently dead.'] }) },
            { id: 'shadow', name: 'Warrior of Shadow', source: "Player's Handbook (2024)",
              summary: 'Darkness you can see through and shadow teleports.',
              features: F({ 3: ['Shadow Arts', 'Spend focus to cast darkness and see through it; minor illusion.'], 6: ['Shadow Step', 'Teleport between dim areas with advantage on your next attack.'], 11: ['Improved Shadow Step', 'Spend focus to shadow step anywhere and attack.'], 17: ['Cloak of Shadows', 'Turn invisible and pass through creatures.'] }) },
            { id: 'elements', name: 'Warrior of the Elements', source: "Player's Handbook (2024)",
              summary: 'Elemental reach and damage from focus.',
              features: F({ 3: ['Elemental Attunement', 'Spend focus for reach and elemental damage on unarmed strikes.', 'Manipulate Elements', 'Cast elementalism.'], 6: ['Elemental Burst', 'An elemental area attack.'], 11: ['Stride of the Elements', 'Fly and swim while attuned.'], 17: ['Elemental Epitome', 'Resistance, extra damage and a damaging dash.'] }) }
          ]
        }
      }
    }
  };

  var ORDER = ['fighter', 'rogue', 'monk'];
  var API = { CLASSES: MORE, ORDER: ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else (root.PLANNER_MORE_LIST = root.PLANNER_MORE_LIST || []).push(API);
})(this);
