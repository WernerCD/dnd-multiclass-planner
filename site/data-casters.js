/* More classes for the multiclass planner (stage 2: Bard, Cleric, Wizard, Ranger, Artificer).
   Same format as data.js and data-classes.js. Feature and subclass summaries are original one-line
   paraphrases written for this site, not book text; levels, counts and tables are game facts.
   Subclasses outside the SRD are listed by name, book and level with a one-line summary only.
   The Artificer is not in either SRD, so all of it is facts only, and the planner uses the
   Tasha's Cauldron of Everything artificer for both editions. */
(function (root) {
  'use strict';
  var A = function (s) { return s.split(',').map(Number); };
  var PREP24 = A('4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22');
  var CAN_FULL3 = A('3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5');
  var CAN_FULL2 = A('2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4');
  var at = function (table) { return function (lv) { return table[lv - 1]; }; };
  // a short helper for subclasses: f(3, 'Name', 'text', 'Name2', 'text2') -> { 3: [[...], [...]] }
  function F(spec) {
    var out = {};
    Object.keys(spec).forEach(function (L) { var a = spec[L], list = []; for (var i = 0; i < a.length; i += 2) list.push([a[i], a[i + 1]]); out[L] = list; });
    return out;
  }
  function inspDie(lv) { return lv >= 15 ? 'd12' : lv >= 10 ? 'd10' : lv >= 5 ? 'd8' : 'd6'; }

  var MORE = {
    bard: {
      code: 'V', name: 'Bard', short: 'Bard', hitDie: 8, color: 'bard',
      caster: 'full', castAbil: 'cha',
      prereq: { cha: 13 },
      saves: 'Dexterity, Charisma',
      ed: {
        '2014': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Bard College',
          subclassFeatureLevels: [3, 6, 14],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light armor, one skill, one musical instrument',
          cantrips: CAN_FULL2,
          spells: { kind: 'known', table: A('4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22') },
          res: [{ key: 'insp', label: 'Inspiration', title: 'Bardic Inspiration: uses (Cha mod, min 1) and die; back on a short rest from bard 5',
            at: function (lv, sub, m) { return Math.max(1, m.cha) + ' x ' + inspDie(lv); } }],
          features: {
            1: [['Spellcasting', 'Full caster with spells known. Charisma.'],
                ['Bardic Inspiration', 'Bonus action: give an ally a d6 to add to one check, attack or save; Cha mod uses per long rest.']],
            2: [['Jack of All Trades', 'Add half your proficiency bonus to ability checks you are not proficient in.'],
                ['Song of Rest', 'Allies who spend Hit Dice in your short rest regain an extra d6 HP (bigger later).']],
            3: [['Bard College', 'Choose your college.'],
                ['Expertise', 'Double proficiency in two skills (two more at 10).']],
            5: [['Font of Inspiration', 'Bardic Inspiration returns on a short rest; the die becomes a d8.']],
            6: [['Countercharm', 'Action: allies near you have advantage against being frightened or charmed.']],
            10: [['Magical Secrets', 'Learn two spells from any class list (again at 14 and 18); Inspiration die d10.'],
                 ['Expertise', 'Two more skills with double proficiency.']],
            14: [['Magical Secrets', 'Two more spells from any class list.']],
            15: [['Bardic Inspiration (d12)', 'Your Inspiration die becomes a d12.']],
            18: [['Magical Secrets', 'Two more spells from any class list.']],
            20: [['Superior Inspiration', 'Regain one use when you roll initiative with none left.']]
          },
          subclasses: [
            { id: 'lore', name: 'College of Lore', source: 'SRD 5.1', srd: true,
              summary: 'Cutting Words and extra Magical Secrets.',
              features: F({ 3: ['Bonus Proficiencies', 'Three more skills.', 'Cutting Words', 'Reaction: spend Inspiration to subtract the die from an enemy roll.'],
                6: ['Additional Magical Secrets', 'Two spells from any class list.'], 14: ['Peerless Skill', 'Spend Inspiration on your own ability checks.'] }) },
            { id: 'valor', name: 'College of Valor', source: "Player's Handbook (2014)", extraAttack: [6],
              summary: 'Battle bard: armor, weapons and Extra Attack at bard 6.',
              features: F({ 3: ['Bonus Proficiencies', 'Medium armor, shields and martial weapons.', 'Combat Inspiration', 'Inspiration can add to damage or AC.'],
                6: ['Extra Attack', 'Attack twice when you take the Attack action.'], 14: ['Battle Magic', 'After casting a spell, make a weapon attack as a bonus action.'] }) },
            { id: 'glamour', name: 'College of Glamour', source: "Xanathar's Guide to Everything",
              summary: 'Fey charm: temporary HP, free movement and enthralling presence.',
              features: F({ 3: ['Mantle of Inspiration', 'Spend Inspiration for temporary HP and reaction movement for allies.', 'Enthralling Performance', 'Charm listeners after a performance.'], 6: ['Mantle of Majesty', 'Cast command as a bonus action for a minute.'], 14: ['Unbreakable Majesty', 'Attackers must save or choose another target.'] }) },
            { id: 'swords', name: 'College of Swords', source: "Xanathar's Guide to Everything", extraAttack: [6],
              summary: 'Blade flourishes powered by Inspiration; Extra Attack at bard 6.',
              features: F({ 3: ['Bonus Proficiencies', 'Medium armor and scimitars.', 'Blade Flourish', 'Spend Inspiration for damage plus defense, mobility or a slash.'], 6: ['Extra Attack', 'Attack twice when you take the Attack action.'], 14: ["Master's Flourish", 'Use a d6 instead of spending Inspiration.'] }) },
            { id: 'whispers', name: 'College of Whispers', source: "Xanathar's Guide to Everything",
              summary: 'Psychic blades and stolen identities.',
              features: F({ 3: ['Psychic Blades', 'Spend Inspiration for psychic damage on a hit.', 'Words of Terror', 'Frighten a creature after talking to it.'], 6: ['Mantle of Whispers', 'Take the shadow of someone who dies near you.'], 14: ['Shadow Lore', 'Charm a creature with its secrets.'] }) },
            { id: 'creation', name: 'College of Creation', source: "Tasha's Cauldron of Everything",
              summary: 'Notes of creation; animate objects and make items from nothing.',
              features: F({ 3: ['Mote of Potential', 'Inspiration dice gain extra effects.', 'Performance of Creation', 'Create a nonmagical item.'], 6: ['Animating Performance', 'Animate a dancing item to fight for you.'], 14: ['Creative Crescendo', 'Create several items at once.'] }) },
            { id: 'eloquence', name: 'College of Eloquence', source: "Tasha's Cauldron of Everything",
              summary: 'Persuasion master; Inspiration that is never wasted.',
              features: F({ 3: ['Silver Tongue', 'Persuasion and Deception rolls of 9 or lower count as 10.', 'Unsettling Words', 'Spend Inspiration to lower a creature\'s next save.'], 6: ['Unfailing Inspiration', 'A failed Inspiration die is kept.', 'Universal Speech', 'Make creatures understand you.'], 14: ['Infectious Inspiration', 'Pass on Inspiration when an ally succeeds.'] }) }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Bard Subclass',
          subclassFeatureLevels: [3, 6, 14],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light armor, one skill, one musical instrument',
          cantrips: CAN_FULL2,
          spells: { kind: 'prepared', table: PREP24 },
          res: [{ key: 'insp', label: 'Inspiration', title: 'Bardic Inspiration: uses (Cha mod, min 1) and die; back on a short rest from bard 5',
            at: function (lv, sub, m) { return Math.max(1, m.cha) + ' x ' + inspDie(lv); } }],
          features: {
            1: [['Bardic Inspiration', 'Bonus action: give an ally a d6 to add to a failed d20 test; Cha mod uses per long rest.'],
                ['Spellcasting', 'Full caster with a prepared list that grows by level. Charisma.']],
            2: [['Expertise', 'Double proficiency in two skills.'],
                ['Jack of All Trades', 'Add half your proficiency bonus to checks you are not proficient in.']],
            3: [['Bard Subclass', 'Choose your college.']],
            5: [['Font of Inspiration', 'Inspiration returns on a short rest, and a spell slot can buy one back; d8 die.']],
            7: [['Countercharm', 'Reaction: let an ally reroll a save against charm or fright.']],
            9: [['Expertise', 'Two more skills with double proficiency.']],
            10: [['Magical Secrets', 'Prepare spells from the bard, cleric, druid and wizard lists; d10 die.']],
            15: [['Bardic Inspiration (d12)', 'Your Inspiration die becomes a d12.']],
            18: [['Superior Inspiration', 'Regain uses on initiative when you are low.']],
            20: [['Words of Creation', 'Power word heal and power word kill always prepared, hitting two creatures.']]
          },
          subclasses: [
            { id: 'lore', name: 'College of Lore', source: 'SRD 5.2', srd: true,
              summary: 'Cutting Words and spells from other lists.',
              features: F({ 3: ['Bonus Proficiencies', 'Three more skills.', 'Cutting Words', 'Reaction: spend Inspiration to subtract the die from a roll.'],
                6: ['Magical Discoveries', 'Two spells from the cleric, druid or wizard lists, always prepared.'], 14: ['Peerless Skill', 'Add Inspiration to a failed check or attack; it is kept if you still fail.'] }) },
            { id: 'dance', name: 'College of Dance', source: "Player's Handbook (2024)",
              summary: 'Unarmored dancer: Dex AC, Inspiration-powered unarmed strikes.',
              features: F({ 3: ['Dazzling Footwork', 'Unarmored AC from Charisma, dance-boosted unarmed strikes.'], 6: ['Inspiring Movement', 'Reaction movement for you and an ally.', 'Tandem Footwork', 'Spend Inspiration to boost allies\' initiative.'], 14: ['Leading Evasion', 'Evasion that you share with nearby allies.'] }) },
            { id: 'glamour', name: 'College of Glamour', source: "Player's Handbook (2024)",
              summary: 'Fey charm: temporary HP and enthralling presence.',
              features: F({ 3: ['Beguiling Magic', 'Charm or frighten after casting enchantment or illusion spells.', 'Mantle of Inspiration', 'Spend Inspiration for temporary HP and reaction movement for allies.'], 6: ['Mantle of Majesty', 'Command as a bonus action for a minute.'], 14: ['Unbreakable Majesty', 'Attackers must save or miss.'] }) },
            { id: 'valor', name: 'College of Valor', source: "Player's Handbook (2024)", extraAttack: [6],
              summary: 'Battle bard: armor, weapons and Extra Attack at bard 6.',
              features: F({ 3: ['Combat Inspiration', 'Inspiration can add to damage or AC.', 'Martial Training', 'Medium armor, shields and martial weapons.'], 6: ['Extra Attack', 'Attack twice; a cantrip can replace one attack.'], 14: ['Battle Magic', 'After casting an action spell, attack as a bonus action.'] }) }
          ]
        }
      }
    },

    cleric: {
      code: 'C', name: 'Cleric', short: 'Clr', hitDie: 8, color: 'clr',
      caster: 'full', castAbil: 'wis',
      prereq: { wis: 13 },
      saves: 'Wisdom, Charisma',
      ed: {
        '2014': {
          spellcastingFrom: 1,
          subclassLevel: 1, subclassLabel: 'Divine Domain',
          subclassFeatureLevels: [1, 2, 6, 8, 17],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light armor, medium armor, shields',
          cantrips: CAN_FULL3,
          spells: { kind: 'prepared', formula: 'abilLevel', abil: 'wis' },
          res: [{ key: 'clrCd', label: 'Clr CD', title: 'Cleric Channel Divinity uses, back on a short rest',
            at: function (lv) { return lv >= 18 ? 3 : lv >= 6 ? 2 : lv >= 2 ? 1 : 0; } }],
          features: {
            1: [['Spellcasting', 'Full caster; prepare Wis mod + cleric level from the whole cleric list, plus domain spells. Wisdom.'],
                ['Divine Domain', 'Choose your domain.']],
            2: [['Channel Divinity', 'Turn Undead plus your domain\'s option; once per short rest (2 at 6, 3 at 18).']],
            5: [['Destroy Undead', 'Turned undead of low CR are destroyed (CR 1/2, rising at 8, 11, 14 and 17).']],
            6: [['Channel Divinity (2/rest)', 'Two uses per short rest.']],
            10: [['Divine Intervention', 'Call on your god; it works if you roll your cleric level or lower on d100.']],
            18: [['Channel Divinity (3/rest)', 'Three uses per short rest.']],
            20: [['Divine Intervention Improvement', 'Divine Intervention always works.']]
          },
          subclasses: [
            { id: 'life', name: 'Life Domain', source: 'SRD 5.1', srd: true,
              summary: 'Heavy armor and stronger healing spells.',
              features: F({ 1: ['Bonus Proficiency', 'Heavy armor.', 'Disciple of Life', 'Healing spells restore 2 + spell level extra HP.'], 2: ['Channel Divinity: Preserve Life', 'Spread healing of 5 x cleric level among nearby creatures.'], 6: ['Blessed Healer', 'Healing others heals you too.'], 8: ['Divine Strike', 'Extra radiant damage once per turn with a weapon.'], 17: ['Supreme Healing', 'Healing dice always roll their maximum.'] }) },
            { id: 'knowledge', name: 'Knowledge Domain', source: "Player's Handbook (2014)",
              summary: 'Languages, expertise in lore skills and reading minds.',
              features: F({ 1: ['Blessings of Knowledge', 'Two languages and expertise in two knowledge skills.'], 2: ['Channel Divinity: Knowledge of the Ages', 'Proficiency in any skill or tool for 10 minutes.'], 6: ['Channel Divinity: Read Thoughts', 'Read a creature\'s thoughts.'], 8: ['Potent Spellcasting', 'Add Wis to cleric cantrip damage.'], 17: ['Visions of the Past', 'See the history of an object or place.'] }) },
            { id: 'light', name: 'Light Domain', source: "Player's Handbook (2014)",
              summary: 'Fire and radiance; Warding Flare protects against attacks.',
              features: F({ 1: ['Bonus Cantrip', 'Light.', 'Warding Flare', 'Reaction: impose disadvantage on an attack against you.'], 2: ['Channel Divinity: Radiance of the Dawn', 'Radiant burst that also dispels magical darkness.'], 6: ['Improved Flare', 'Use Warding Flare for allies.'], 8: ['Potent Spellcasting', 'Add Wis to cleric cantrip damage.'], 17: ['Corona of Light', 'An aura that weakens saves against fire and radiant spells.'] }) },
            { id: 'nature', name: 'Nature Domain', source: "Player's Handbook (2014)",
              summary: 'Heavy armor, a druid cantrip and charming beasts and plants.',
              features: F({ 1: ['Acolyte of Nature', 'A druid cantrip and a nature skill.', 'Bonus Proficiency', 'Heavy armor.'], 2: ['Channel Divinity: Charm Animals and Plants', 'Charm beasts and plants around you.'], 6: ['Dampen Elements', 'Reaction: grant resistance to an elemental hit.'], 8: ['Divine Strike', 'Extra elemental damage once per turn with a weapon.'], 17: ['Master of Nature', 'Command charmed beasts and plants.'] }) },
            { id: 'tempest', name: 'Tempest Domain', source: "Player's Handbook (2014)",
              summary: 'Heavy armor; maximised lightning and thunder damage.',
              features: F({ 1: ['Bonus Proficiencies', 'Martial weapons and heavy armor.', 'Wrath of the Storm', 'Reaction lightning or thunder damage when hit.'], 2: ['Channel Divinity: Destructive Wrath', 'Maximise lightning or thunder damage.'], 6: ['Thunderous Strike', 'Lightning damage can push creatures.'], 8: ['Divine Strike', 'Extra thunder damage once per turn with a weapon.'], 17: ['Stormborn', 'Fly speed outdoors.'] }) },
            { id: 'trickery', name: 'Trickery Domain', source: "Player's Handbook (2014)",
              summary: 'Illusory duplicates and stealth blessings.',
              features: F({ 1: ['Blessing of the Trickster', 'Give a creature advantage on Stealth.'], 2: ['Channel Divinity: Invoke Duplicity', 'Make an illusory double to cast through.'], 6: ['Channel Divinity: Cloak of Shadows', 'Turn invisible.'], 8: ['Divine Strike', 'Extra poison damage once per turn with a weapon.'], 17: ['Improved Duplicity', 'Up to four duplicates.'] }) },
            { id: 'war', name: 'War Domain', source: "Player's Handbook (2014)",
              summary: 'Heavy armor, martial weapons and bonus attacks.',
              features: F({ 1: ['Bonus Proficiencies', 'Martial weapons and heavy armor.', 'War Priest', 'Bonus-action weapon attacks, Wis mod times per long rest.'], 2: ['Channel Divinity: Guided Strike', '+10 to an attack roll.'], 6: ["Channel Divinity: War God's Blessing", 'Give an ally +10 to an attack.'], 8: ['Divine Strike', 'Extra weapon damage once per turn.'], 17: ['Avatar of Battle', 'Resist nonmagical bludgeoning, piercing and slashing.'] }) },
            { id: 'forge', name: 'Forge Domain', source: "Xanathar's Guide to Everything",
              summary: 'Heavy armor and blessed weapons or armor.',
              features: F({ 1: ['Bonus Proficiencies', 'Heavy armor and smith\'s tools.', 'Blessing of the Forge', '+1 to a weapon or armor.'], 2: ["Channel Divinity: Artisan's Blessing", 'Create a metal item.'], 6: ['Soul of the Forge', 'Fire resistance and +1 AC in heavy armor.'], 8: ['Divine Strike', 'Extra fire damage once per turn with a weapon.'], 17: ['Saint of Forge and Fire', 'Fire immunity and nonmagical damage resistance in heavy armor.'] }) },
            { id: 'grave', name: 'Grave Domain', source: "Xanathar's Guide to Everything",
              summary: 'Keep allies alive and mark foes for extra damage.',
              features: F({ 1: ['Circle of Mortality', 'Maximum healing on creatures at 0 HP; spare the dying as a bonus action.', 'Eyes of the Grave', 'Sense undead.'], 2: ['Channel Divinity: Path to the Grave', 'Make a creature vulnerable to the next hit.'], 6: ["Sentinel at Death's Door", 'Turn critical hits into normal hits.'], 8: ['Potent Spellcasting', 'Add Wis to cleric cantrip damage.'], 17: ['Keeper of Souls', 'Heal when enemies die nearby.'] }) },
            { id: 'order', name: 'Order Domain', source: "Tasha's Cauldron of Everything",
              summary: 'Heavy armor; your spells let allies attack.',
              features: F({ 1: ['Bonus Proficiencies', 'Heavy armor and a skill.', 'Voice of Authority', 'An ally you target with a spell can attack as a reaction.'], 2: ["Channel Divinity: Order's Demand", 'Charm creatures and make them drop items.'], 6: ['Embodiment of the Law', 'Cast enchantment spells as a bonus action.'], 8: ['Divine Strike', 'Extra psychic damage once per turn with a weapon.'], 17: ["Order's Wrath", 'Curse a foe so the next ally deals extra damage.'] }) },
            { id: 'peace', name: 'Peace Domain', source: "Tasha's Cauldron of Everything",
              summary: 'Bonded allies add dice and protect each other.',
              features: F({ 1: ['Implement of Peace', 'A social skill.', 'Emboldening Bond', 'Bonded creatures add a d4 to rolls.'], 2: ['Channel Divinity: Balm of Peace', 'Move without provoking and heal those you pass.'], 6: ['Protective Bond', 'Bonded creatures teleport to take a hit for each other.'], 8: ['Potent Spellcasting', 'Add Wis to cleric cantrip damage.'], 17: ['Expansive Bond', 'Longer range; the protector resists the damage.'] }) },
            { id: 'twilight', name: 'Twilight Domain', source: "Tasha's Cauldron of Everything",
              summary: 'Heavy armor, darkvision for the party and temporary HP every round.',
              features: F({ 1: ['Bonus Proficiencies', 'Martial weapons and heavy armor.', 'Eyes of Night', 'Long darkvision you can share.', 'Vigilant Blessing', 'Give a creature advantage on initiative.'], 2: ['Channel Divinity: Twilight Sanctuary', 'A sphere that grants temporary HP or ends charm and fright each turn.'], 6: ['Steps of Night', 'Fly in dim light.'], 8: ['Divine Strike', 'Extra radiant damage once per turn with a weapon.'], 17: ['Twilight Shroud', 'Your sanctuary gives half cover.'] }) }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Cleric Subclass',
          subclassFeatureLevels: [3, 6, 17],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light and medium armor, shields',
          cantrips: CAN_FULL3,
          spells: { kind: 'prepared', table: PREP24 },
          res: [{ key: 'clrCd', label: 'Clr CD', title: 'Cleric Channel Divinity uses per long rest (one back on a short rest)',
            at: function (lv) { return lv >= 18 ? 4 : lv >= 6 ? 3 : lv >= 2 ? 2 : 0; } }],
          features: {
            1: [['Spellcasting', 'Full caster with a prepared list that grows by level. Wisdom.'],
                ['Divine Order', 'Protector (martial weapons and heavy armor) or Thaumaturge (extra cantrip, Wis to Arcana and Religion).']],
            2: [['Channel Divinity', 'Divine Spark (heal or harm at range) and Turn Undead; 2 uses (3 at 6, 4 at 18).']],
            3: [['Cleric Subclass', 'Choose your domain.']],
            5: [['Sear Undead', 'Turn Undead also deals radiant damage.']],
            7: [['Blessed Strikes', 'Divine Strike (extra weapon damage) or Potent Spellcasting (Wis to cantrip damage).']],
            10: [['Divine Intervention', 'Cast any cleric spell of 5th level or lower without a slot, once per long rest.']],
            14: [['Improved Blessed Strikes', 'Your Blessed Strikes option gets stronger.']],
            20: [['Greater Divine Intervention', 'Divine Intervention can cast wish.']]
          },
          subclasses: [
            { id: 'life', name: 'Life Domain', source: 'SRD 5.2', srd: true,
              summary: 'Stronger healing and always-prepared healing spells.',
              features: F({ 3: ['Disciple of Life', 'Healing spells restore extra HP.', 'Life Domain Spells', 'Always-prepared healing spells.', 'Preserve Life', 'Channel Divinity: spread healing among nearby creatures.'], 6: ['Blessed Healer', 'Healing others heals you too.'], 17: ['Supreme Healing', 'Healing dice always roll their maximum.'] }) },
            { id: 'light', name: 'Light Domain', source: "Player's Handbook (2024)",
              summary: 'Radiant bursts and a flare that ruins attacks.',
              features: F({ 3: ['Light Domain Spells', 'Always-prepared fire and light spells.', 'Radiance of the Dawn', 'Channel Divinity: radiant burst that dispels darkness.', 'Warding Flare', 'Reaction: impose disadvantage on an attack.'], 6: ['Improved Warding Flare', 'Warding Flare also gives temporary HP.'], 17: ['Corona of Light', 'An aura that weakens saves against fire and radiant spells.'] }) },
            { id: 'trickery', name: 'Trickery Domain', source: "Player's Handbook (2024)",
              summary: 'Illusory duplicates and stealth blessings.',
              features: F({ 3: ['Blessing of the Trickster', 'Give a creature advantage on Stealth.', 'Invoke Duplicity', 'Channel Divinity: an illusory double to cast through.', 'Trickery Domain Spells', 'Always-prepared trickery spells.'], 6: ["Trickster's Transposition", 'Swap places with your duplicate.'], 17: ['Improved Duplicity', 'Allies gain advantage near your duplicate; it heals when it ends.'] }) },
            { id: 'war', name: 'War Domain', source: "Player's Handbook (2024)",
              summary: 'Guided strikes and bonus-action attacks.',
              features: F({ 3: ['Guided Strike', 'Channel Divinity: +10 to an attack roll.', 'War Domain Spells', 'Always-prepared war spells.', 'War Priest', 'Bonus-action weapon attacks a few times per rest.'], 6: ["War God's Blessing", 'Cast shield of faith or spiritual weapon with Channel Divinity, no concentration.'], 17: ['Avatar of Battle', 'Resist bludgeoning, piercing and slashing.'] }) }
          ]
        }
      }
    },

    wizard: {
      code: 'Z', name: 'Wizard', short: 'Wiz', hitDie: 6, color: 'wiz',
      caster: 'full', castAbil: 'int',
      prereq: { int: 13 },
      saves: 'Intelligence, Wisdom',
      ed: {
        '2014': {
          spellcastingFrom: 1,
          subclassLevel: 2, subclassLabel: 'Arcane Tradition',
          subclassFeatureLevels: [2, 6, 10, 14],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'None',
          cantrips: CAN_FULL3,
          spells: { kind: 'prepared', formula: 'abilLevel', abil: 'int' },
          res: [{ key: 'recov', label: 'Recovery', title: 'Arcane Recovery: total slot levels regained on a short rest, once per day',
            at: function (lv) { return Math.ceil(lv / 2) + ' lvls'; } }],
          features: {
            1: [['Spellcasting', 'Full caster with a spellbook; prepare Int mod + wizard level from it. Intelligence.'],
                ['Arcane Recovery', 'Once a day on a short rest, recover slots totalling half your wizard level (no 6th or higher).']],
            2: [['Arcane Tradition', 'Choose your school.']],
            18: [['Spell Mastery', 'Cast one 1st- and one 2nd-level spell at will.']],
            20: [['Signature Spells', 'Two 3rd-level spells always prepared, each castable once per short rest free.']]
          },
          subclasses: [
            { id: 'evocation', name: 'School of Evocation', source: 'SRD 5.1', srd: true,
              summary: 'Sculpt blasts around allies and boost evocation damage.',
              features: F({ 2: ['Evocation Savant', 'Copy evocation spells for less.', 'Sculpt Spells', 'Allies automatically succeed against your evocation spells and take no damage.'], 6: ['Potent Cantrip', 'Damaging cantrips deal half damage on a successful save.'], 10: ['Empowered Evocation', 'Add Int to evocation spell damage.'], 14: ['Overchannel', 'Maximise a 5th-level-or-lower damage spell, at a cost.'] }) },
            { id: 'abjuration', name: 'School of Abjuration', source: "Player's Handbook (2014)",
              summary: 'An Arcane Ward that soaks damage.',
              features: F({ 2: ['Abjuration Savant', 'Copy abjuration spells for less.', 'Arcane Ward', 'A ward with HP that absorbs damage.'], 6: ['Projected Ward', 'Use your ward to protect an ally.'], 10: ['Improved Abjuration', 'Add proficiency to counterspell and dispel checks.'], 14: ['Spell Resistance', 'Advantage on saves against spells and resistance to spell damage.'] }) },
            { id: 'conjuration', name: 'School of Conjuration', source: "Player's Handbook (2014)",
              summary: 'Short teleports and sturdy summons.',
              features: F({ 2: ['Minor Conjuration', 'Conjure a small object.'], 6: ['Benign Transposition', 'Teleport or swap places.'], 10: ['Focused Conjuration', 'Damage cannot break concentration on conjurations.'], 14: ['Durable Summons', 'Summons gain temporary HP.'] }) },
            { id: 'divination', name: 'School of Divination', source: "Player's Handbook (2014)",
              summary: 'Portent: replace rolls with dice you rolled earlier.',
              features: F({ 2: ['Portent', 'Roll two d20s each day and swap them in for any roll you see.'], 6: ['Expert Divination', 'Casting divination spells recovers lower slots.'], 10: ['The Third Eye', 'Darkvision, ethereal sight or other senses.'], 14: ['Greater Portent', 'Three portent dice.'] }) },
            { id: 'enchantment', name: 'School of Enchantment', source: "Player's Handbook (2014)",
              summary: 'Charm and redirect enemies.',
              features: F({ 2: ['Hypnotic Gaze', 'Charm a nearby creature each turn.'], 6: ['Instinctive Charm', 'Redirect an attack to another creature.'], 10: ['Split Enchantment', 'One-target enchantments hit two.'], 14: ['Alter Memories', 'Make charmed creatures forget.'] }) },
            { id: 'illusion', name: 'School of Illusion', source: "Player's Handbook (2014)",
              summary: 'Malleable illusions that can become real.',
              features: F({ 2: ['Improved Minor Illusion', 'Sound and image together.'], 6: ['Malleable Illusions', 'Change illusions as an action.'], 10: ['Illusory Self', 'An illusion makes an attack miss.'], 14: ['Illusory Reality', 'Make part of an illusion real.'] }) },
            { id: 'necromancy', name: 'School of Necromancy', source: "Player's Handbook (2014)",
              summary: 'Heal by killing and command stronger undead.',
              features: F({ 2: ['Grim Harvest', 'Regain HP when your spells kill.'], 6: ['Undead Thralls', 'Animate dead raises more and tougher undead.'], 10: ['Inured to Undeath', 'Resist necrotic; your max HP cannot be lowered.'], 14: ['Command Undead', 'Take control of undead.'] }) },
            { id: 'transmutation', name: 'School of Transmutation', source: "Player's Handbook (2014)",
              summary: "A Transmuter's Stone and powerful self-changes.",
              features: F({ 2: ['Minor Alchemy', 'Change one material into another for a while.'], 6: ["Transmuter's Stone", 'A stone that grants a benefit.'], 10: ['Shapechanger', 'Polymorph yourself without a slot.'], 14: ['Master Transmuter', 'Spend the stone for a major effect.'] }) },
            { id: 'war-magic', name: 'School of War Magic', source: "Xanathar's Guide to Everything",
              summary: 'Defensive reactions and power surges.',
              features: F({ 2: ['Arcane Deflection', 'Reaction: +2 AC or +4 to a save.', 'Tactical Wit', 'Add Int to initiative.'], 6: ['Power Surge', 'Store surges to add damage.'], 10: ['Durable Magic', '+2 AC and saves while concentrating.'], 14: ['Deflecting Shroud', 'Arcane Deflection also damages foes.'] }) },
            { id: 'bladesinging', name: 'Bladesinging', source: "Tasha's Cauldron of Everything", extraAttack: [6],
              summary: 'Elven blade dance: Int to AC, Extra Attack at wizard 6.',
              features: F({ 2: ['Training in War and Song', 'Light armor and a one-handed melee weapon.', 'Bladesong', 'Add Int to AC, concentration saves and speed.'], 6: ['Extra Attack', 'Attack twice; a cantrip can replace one attack.'], 10: ['Song of Defense', 'Spend a slot to reduce damage.'], 14: ['Song of Victory', 'Add Int to melee weapon damage while singing.'] }) },
            { id: 'scribes', name: 'Order of Scribes', source: "Tasha's Cauldron of Everything",
              summary: 'An awakened spellbook that changes damage types.',
              features: F({ 2: ['Wizardly Quill', 'Copy spells fast.', 'Awakened Spellbook', 'Swap damage types and cast rituals faster.'], 6: ['Manifest Mind', 'Cast through your spellbook\'s spirit.'], 10: ['Master Scrivener', 'Make stronger spell scrolls.'], 14: ['One with the Word', 'Your spellbook protects you from damage.'] }) }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Wizard Subclass',
          subclassFeatureLevels: [3, 6, 10, 14],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'None',
          cantrips: CAN_FULL3,
          spells: { kind: 'prepared', table: A('4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25') },
          res: [{ key: 'recov', label: 'Recovery', title: 'Arcane Recovery: total slot levels regained on a short rest, once per long rest',
            at: function (lv) { return Math.ceil(lv / 2) + ' lvls'; } }],
          features: {
            1: [['Spellcasting', 'Full caster with a spellbook and a prepared list that grows by level. Intelligence.'],
                ['Ritual Adept', 'Cast ritual spells from your book without preparing them.'],
                ['Arcane Recovery', 'Recover slots totalling half your wizard level on a short rest, once per long rest.']],
            2: [['Scholar', 'Expertise in one study skill.']],
            3: [['Wizard Subclass', 'Choose your school.']],
            5: [['Memorize Spell', 'Swap one prepared spell on a short rest.']],
            18: [['Spell Mastery', 'Cast one 1st- and one 2nd-level spell at will.']],
            20: [['Signature Spells', 'Two 3rd-level spells always prepared, each castable once per short rest free.']]
          },
          subclasses: [
            { id: 'evoker', name: 'Evoker', source: 'SRD 5.2', srd: true,
              summary: 'Sculpt blasts around allies and boost evocation damage.',
              features: F({ 3: ['Evocation Savant', 'Free evocation spells for your book.', 'Potent Cantrip', 'Damaging cantrips still deal half damage on a miss or save.'], 6: ['Sculpt Spells', 'Allies automatically succeed against your evocation spells and take no damage.'], 10: ['Empowered Evocation', 'Add Int to one damage roll of a wizard evocation spell.'], 14: ['Overchannel', 'Maximise a 5th-level-or-lower damage spell, at a cost.'] }) },
            { id: 'abjurer', name: 'Abjurer', source: "Player's Handbook (2024)",
              summary: 'An Arcane Ward that soaks damage.',
              features: F({ 3: ['Abjuration Savant', 'Free abjuration spells for your book.', 'Arcane Ward', 'A ward with HP that absorbs damage.'], 6: ['Projected Ward', 'Use your ward to protect an ally.'], 10: ['Spell Breaker', 'Counterspell and dispel magic always prepared and stronger.'], 14: ['Spell Resistance', 'Advantage on saves against spells and resistance to spell damage.'] }) },
            { id: 'diviner', name: 'Diviner', source: "Player's Handbook (2024)",
              summary: 'Portent: replace rolls with dice you rolled earlier.',
              features: F({ 3: ['Divination Savant', 'Free divination spells for your book.', 'Portent', 'Roll two d20s each day and swap them in for any roll you see.'], 6: ['Expert Divination', 'Casting divination spells recovers lower slots.'], 10: ['The Third Eye', 'Darkvision, see invisibility or read any language.'], 14: ['Greater Portent', 'Three portent dice.'] }) },
            { id: 'illusionist', name: 'Illusionist', source: "Player's Handbook (2024)",
              summary: 'Bigger illusions, phantom creatures and illusory doubles.',
              features: F({ 3: ['Illusion Savant', 'Free illusion spells for your book.', 'Improved Illusions', 'Cast illusions without verbal components, at longer range.'], 6: ['Phantasmal Creatures', 'Summon beasts and fey as illusions, free once a day.'], 10: ['Illusory Self', 'An illusion makes an attack miss.'], 14: ['Illusory Reality', 'Make part of an illusion real.'] }) }
          ]
        }
      }
    },

    ranger: {
      code: 'R', name: 'Ranger', short: 'Rgr', hitDie: 10, color: 'rgr',
      caster: 'half', castAbil: 'wis',
      prereq: { dex: 13, wis: 13 },
      saves: 'Strength, Dexterity',
      extraAttack: [5],
      ed: {
        '2014': {
          spellcastingFrom: 2,
          subclassLevel: 3, subclassLabel: 'Ranger Archetype',
          subclassFeatureLevels: [3, 7, 11, 15],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light armor, medium armor, shields, simple and martial weapons, one skill',
          cantrips: null,
          spells: { kind: 'known', table: A('0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11') },
          features: {
            1: [['Favored Enemy', 'Pick a creature type: advantage on tracking and recalling lore about it, plus a language.'],
                ['Natural Explorer', 'A favored terrain where you travel and forage well.']],
            2: [['Fighting Style', 'Archery, Defense, Dueling or Two-Weapon Fighting.'],
                ['Spellcasting', 'Half caster with spells known from the ranger list. Wisdom.']],
            3: [['Ranger Archetype', 'Choose your archetype.'],
                ['Primeval Awareness', 'Spend a slot to sense certain creature types nearby.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.']],
            6: [['Favored Enemy and Natural Explorer improvements', 'One more favored enemy and terrain.']],
            8: [["Land's Stride", 'Move through nonmagical difficult terrain freely.']],
            10: [['Hide in Plain Sight', 'Camouflage yourself to hide.']],
            14: [['Vanish', 'Hide as a bonus action; you cannot be tracked by nonmagical means.']],
            18: [['Feral Senses', 'Fight unseen creatures without disadvantage.']],
            20: [['Foe Slayer', 'Add Wis to one attack or damage roll per turn against a favored enemy.']]
          },
          subclasses: [
            { id: 'hunter', name: 'Hunter', source: 'SRD 5.1', srd: true,
              summary: 'Choose tactics against giant foes, hordes and multiattackers.',
              features: F({ 3: ["Hunter's Prey", 'Colossus Slayer, Giant Killer or Horde Breaker.'], 7: ['Defensive Tactics', 'A defense against fear, groups or multiattack.'], 11: ['Multiattack', 'Volley or Whirlwind Attack.'], 15: ["Superior Hunter's Defense", 'Evasion, Stand Against the Tide or Uncanny Dodge.'] }) },
            { id: 'beast-master', name: 'Beast Master', source: "Player's Handbook (2014)",
              summary: 'A beast companion that fights alongside you.',
              features: F({ 3: ["Ranger's Companion", 'A beast companion that obeys your commands.'], 7: ['Exceptional Training', 'Your beast acts on a bonus action command; its attacks count as magical.'], 11: ['Bestial Fury', 'Your beast attacks twice.'], 15: ['Share Spells', 'Self-target spells also affect your beast.'] }) },
            { id: 'gloom-stalker', name: 'Gloom Stalker', source: "Xanathar's Guide to Everything",
              summary: 'Ambusher: an extra attack on the first turn, invisible to darkvision.',
              features: F({ 3: ['Dread Ambusher', 'Extra speed and an extra attack on your first turn; add Wis to initiative.', 'Umbral Sight', 'Darkvision, and invisible to creatures that rely on it.'], 7: ['Iron Mind', 'Proficiency in Wis (or Int/Cha) saves.'], 11: ["Stalker's Flurry", 'Attack again when you miss.'], 15: ['Shadowy Dodge', 'Reaction: impose disadvantage on an attack.'] }) },
            { id: 'horizon-walker', name: 'Horizon Walker', source: "Xanathar's Guide to Everything",
              summary: 'Planar warrior with force damage and teleports.',
              features: F({ 3: ['Detect Portal', 'Sense planar portals.', 'Planar Warrior', 'Extra force damage on a hit.'], 7: ['Ethereal Step', 'Step into the Ethereal Plane.'], 11: ['Distant Strike', 'Teleport between attacks.'], 15: ['Spectral Defense', 'Resistance to a hit.'] }) },
            { id: 'monster-slayer', name: 'Monster Slayer', source: "Xanathar's Guide to Everything",
              summary: 'Mark a foe for extra damage and counter its magic.',
              features: F({ 3: ["Hunter's Sense", 'Learn a creature\'s resistances.', "Slayer's Prey", 'Extra damage against a marked target.'], 7: ['Supernatural Defense', 'Add a d6 to saves against your prey.'], 11: ["Magic-User's Nemesis", 'Foil a spell or teleport.'], 15: ["Slayer's Counter", 'Attack when your prey forces a save.'] }) },
            { id: 'fey-wanderer', name: 'Fey Wanderer', source: "Tasha's Cauldron of Everything",
              summary: 'Fey charm: psychic damage and social grace.',
              features: F({ 3: ['Dreadful Strikes', 'Extra psychic damage.', 'Otherworldly Glamour', 'Add Wis to Charisma checks.'], 7: ['Beguiling Twist', 'Turn charm or fright onto another creature.'], 11: ['Fey Reinforcements', 'Summon fey free.'], 15: ['Misty Wanderer', 'Misty step with a passenger.'] }) },
            { id: 'swarmkeeper', name: 'Swarmkeeper', source: "Tasha's Cauldron of Everything",
              summary: 'A swarm of spirits that pushes, damages and carries you.',
              features: F({ 3: ['Gathered Swarm', 'Extra damage, a push or movement on a hit.'], 7: ['Writhing Tide', 'Fly with your swarm.'], 11: ['Mighty Swarm', 'Stronger swarm effects.'], 15: ['Swarming Dispersal', 'Reaction: resist damage and teleport.'] }) }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Ranger Subclass',
          subclassFeatureLevels: [3, 7, 11, 15],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light and medium armor, shields, martial weapons, one skill',
          cantrips: null,
          spells: { kind: 'prepared', table: A('2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15') },
          res: [{ key: 'mark', label: "Hunter's Mark", title: "Free Hunter's Mark casts per long rest (Favored Enemy)",
            at: at(A('2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6')) }],
          features: {
            1: [['Spellcasting', 'Half caster with a prepared list that grows by level. Wisdom.'],
                ['Favored Enemy', "Hunter's Mark always prepared, cast free a few times per long rest."],
                ['Weapon Mastery', 'Use the mastery properties of two kinds of weapons.']],
            2: [['Deft Explorer', 'Expertise in a skill and two languages.'],
                ['Fighting Style', 'Pick a fighting style, or Druidic Warrior for two druid cantrips.']],
            3: [['Ranger Subclass', 'Choose your subclass.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.']],
            6: [['Roving', '+10 ft speed and climb and swim speeds without heavy armor.']],
            9: [['Expertise', 'Two more skills with double proficiency.']],
            10: [['Tireless', 'Temporary HP as an action; short rests reduce exhaustion.']],
            13: [['Relentless Hunter', "Damage can't break concentration on Hunter's Mark."]],
            14: [["Nature's Veil", 'Turn invisible as a bonus action, a few times per long rest.']],
            17: [['Precise Hunter', 'Advantage on attacks against your marked target.']],
            18: [['Feral Senses', 'Blindsight 30 ft.']],
            20: [['Foe Slayer', "Hunter's Mark damage die becomes a d10."]]
          },
          subclasses: [
            { id: 'hunter', name: 'Hunter', source: 'SRD 5.2', srd: true,
              summary: 'Choose tactics against big foes and groups; read your prey.',
              features: F({ 3: ["Hunter's Lore", "Learn a marked creature's immunities and resistances.", "Hunter's Prey", 'Colossus Slayer or Horde Breaker.'], 7: ['Defensive Tactics', 'Escape the Horde or Multiattack Defense.'], 11: ["Superior Hunter's Prey", "Spread Hunter's Mark damage to a second creature."], 15: ["Superior Hunter's Defense", 'Reaction resistance to a hit.'] }) },
            { id: 'beast-master', name: 'Beast Master', source: "Player's Handbook (2024)",
              summary: 'A primal beast companion of land, sea or sky.',
              features: F({ 3: ["Primal Companion", 'A primal beast that acts on your turn.'], 7: ['Exceptional Training', 'Your beast can dodge or dash as a bonus action; force damage option.'], 11: ['Bestial Fury', "Your beast attacks twice and deals Hunter's Mark damage."], 15: ['Share Spells', 'Self-target spells also affect your beast.'] }) },
            { id: 'fey-wanderer', name: 'Fey Wanderer', source: "Player's Handbook (2024)",
              summary: 'Fey charm: psychic damage and social grace.',
              features: F({ 3: ['Dreadful Strikes', 'Extra psychic damage.', 'Otherworldly Glamour', 'Add Wis to Charisma checks.', 'Fey Wanderer Spells', 'Always-prepared fey spells.'], 7: ['Beguiling Twist', 'Turn charm or fright onto another creature.'], 11: ['Fey Reinforcements', 'Summon fey free, without concentration once.'], 15: ['Misty Wanderer', 'Misty step with a passenger.'] }) },
            { id: 'gloom-stalker', name: 'Gloom Stalker', source: "Player's Handbook (2024)",
              summary: 'Ambusher: extra first-round damage, invisible to darkvision.',
              features: F({ 3: ['Dread Ambusher', 'Add Wis to initiative and extra psychic damage on hits a few times per rest.', 'Umbral Sight', 'Darkvision, and invisible to creatures that rely on it.', 'Gloom Stalker Spells', 'Always-prepared shadow spells.'], 7: ['Iron Mind', 'Proficiency in Wis (or Int/Cha) saves.'], 11: ["Stalker's Flurry", 'Dread Ambusher can add a follow-up attack or frighten.'], 15: ['Shadowy Dodge', 'Reaction: impose disadvantage and teleport.'] }) }
          ]
        }
      }
    },

    artificer: {
      code: 'A', name: 'Artificer', short: 'Art', hitDie: 8, color: 'art',
      caster: 'artificer', castAbil: 'int',
      prereq: { int: 13 },
      saves: 'Constitution, Intelligence',
      ed: {}
    }
  };

  // Artificer (Tasha's Cauldron of Everything): the same data for both editions
  var ART = {
    spellcastingFrom: 1,
    subclassLevel: 3, subclassLabel: 'Artificer Specialist',
    subclassFeatureLevels: [3, 5, 9, 15],
    asi: [4, 8, 12, 16, 19], epicBoon: null,
    mcProf: "Light armor, medium armor, shields, thieves' tools, tinker's tools",
    cantrips: A('2,2,2,2,2,2,2,2,2,3,3,3,3,4,4,4,4,4,4,4'),
    spells: { kind: 'prepared', formula: 'abilHalf', abil: 'int' },
    res: [{ key: 'infuse', label: 'Infusions', title: 'Infused items you can keep at once (infusions known in brackets)',
      at: function (lv) { var n = lv >= 18 ? 6 : lv >= 14 ? 5 : lv >= 10 ? 4 : lv >= 6 ? 3 : lv >= 2 ? 2 : 0; return n ? n + ' (' + (2 * n) + ')' : 0; } }],
    features: {
      1: [['Magical Tinkering', 'Give tiny objects small magical properties.'],
          ['Spellcasting', 'Half caster that rounds up, so artificer 1 already casts; prepare Int mod + half your artificer level. Intelligence. The planner uses the Tasha\'s Cauldron artificer for both editions.']],
      2: [['Infuse Item', 'Turn mundane items into magic items with infusions you know.']],
      3: [['Artificer Specialist', 'Choose your specialty.'],
          ['The Right Tool for the Job', "Make a set of artisan's tools during a rest."]],
      6: [['Tool Expertise', 'Double proficiency with tools.']],
      7: [['Flash of Genius', 'Reaction: add Int to a check or save; Int mod uses per long rest.']],
      10: [['Magic Item Adept', 'Attune to four items and craft common and uncommon items faster.']],
      11: [['Spell-Storing Item', 'Store a 1st- or 2nd-level spell in an item for others to use.']],
      14: [['Magic Item Savant', 'Attune to five items and ignore item requirements.']],
      18: [['Magic Item Master', 'Attune to six items.']],
      20: [['Soul of Artifice', '+1 to all saves per attuned item; end an infusion to stay at 1 HP.']]
    },
    subclasses: [
      { id: 'alchemist', name: 'Alchemist', source: "Tasha's Cauldron of Everything",
        summary: 'Experimental elixirs and stronger healing and acid or fire spells.',
        features: F({ 3: ['Experimental Elixir', 'Brew random beneficial elixirs after a rest.'], 5: ['Alchemical Savant', 'Add Int to healing and to acid, fire, necrotic or poison spell damage.'], 9: ['Restorative Reagents', 'Elixirs give temporary HP; cast lesser restoration free.'], 15: ['Chemical Mastery', 'Acid and poison resistance; cast greater restoration and heal free.'] }) },
      { id: 'armorer', name: 'Armorer', source: "Tasha's Cauldron of Everything", extraAttack: [5],
        summary: 'Arcane power armor (guardian or infiltrator); Extra Attack at artificer 5.',
        features: F({ 3: ['Arcane Armor', 'Your armor becomes magical; heavy armor proficiency.', 'Armor Model', 'Guardian (thunder gauntlets, temp HP) or Infiltrator (lightning launcher, stealth).'], 5: ['Extra Attack', 'Attack twice when you take the Attack action.'], 9: ['Armor Modifications', 'More infusion slots in your armor.'], 15: ['Perfected Armor', 'A stronger effect for your armor model.'] }) },
      { id: 'artillerist', name: 'Artillerist', source: "Tasha's Cauldron of Everything",
        summary: 'An eldritch cannon and stronger spell damage.',
        features: F({ 3: ['Eldritch Cannon', 'A small cannon: flamethrower, force ballista or protector.'], 5: ['Arcane Firearm', 'Add a d8 to spell damage through your firearm.'], 9: ['Explosive Cannon', 'Bigger cannon damage; detonate it.'], 15: ['Fortified Position', 'Two cannons and half cover around them.'] }) },
      { id: 'battle-smith', name: 'Battle Smith', source: "Tasha's Cauldron of Everything", extraAttack: [5],
        summary: 'Steel defender companion; Int for weapon attacks; Extra Attack at artificer 5.',
        features: F({ 3: ['Battle Ready', 'Martial weapons; attack with Int using magic weapons.', 'Steel Defender', 'A mechanical companion that fights and protects.'], 5: ['Extra Attack', 'Attack twice when you take the Attack action.'], 9: ['Arcane Jolt', 'Extra force damage or healing through your weapon or defender.'], 15: ['Improved Defender', 'Stronger jolt and a tougher defender.'] }) }
    ]
  };
  MORE.artificer.ed['2014'] = ART;
  MORE.artificer.ed['2024'] = ART;

  var ORDER = ['bard', 'cleric', 'wizard', 'ranger', 'artificer'];
  var API = { CLASSES: MORE, ORDER: ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else (root.PLANNER_MORE_LIST = root.PLANNER_MORE_LIST || []).push(API);
})(this);
