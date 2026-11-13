/* Class data for the multiclass planner.
   Feature and subclass summaries are original one-line paraphrases written for this site,
   not book text. Mechanics (levels, counts, slot tables) are game facts.
   To add a class: add an entry to CLASSES with a unique one-letter `code`, then add it to CLASS_ORDER. */
(function (root) {
  'use strict';

  // index = class level - 1
  var A = function (s) { return s.split(',').map(Number); };

  var CLASSES = {
    paladin: {
      code: 'P', name: 'Paladin', short: 'Pal', hitDie: 10, color: 'pal',
      caster: 'half',
      prereq: { str: 13, cha: 13 },
      saves: 'Wisdom, Charisma',
      ed: {
        '2014': {
          spellcastingFrom: 2,
          subclassLevel: 3, subclassLabel: 'Sacred Oath',
          subclassFeatureLevels: [3, 7, 15, 20],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light and medium armor, shields, simple and martial weapons',
          cantrips: null,
          spells: { kind: 'prepared', formula: 'chaHalfDown' },
          features: {
            1: [['Divine Sense', 'Sense celestials, fiends and undead within 60 ft; 1 + Cha mod uses per long rest.'],
                ['Lay on Hands', 'Healing pool of 5 x paladin level, spent by touch; 5 points cures a disease or poison.']],
            2: [['Fighting Style', 'Pick one style, such as Defense, Dueling, Great Weapon Fighting or Protection.'],
                ['Spellcasting', 'Prepare Cha mod + half your paladin level (min 1) from the paladin list. Charisma.'],
                ['Divine Smite', 'On a melee weapon hit, spend a slot for +2d8 radiant, +1d8 per slot level above 1st (max 5d8), +1d8 vs undead or fiends. Not a spell, so pact slots work and it stacks with a spell cast that turn.']],
            3: [['Divine Health', 'You are immune to disease.'],
                ['Sacred Oath', 'Choose your oath.'],
                ['Channel Divinity', 'Your oath gives Channel Divinity options (1 use, back on a short rest) and always-prepared oath spells.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.']],
            6: [['Aura of Protection', 'You and allies within 10 ft add your Cha mod (min +1) to saving throws while you are conscious.']],
            10: [['Aura of Courage', 'You and allies within 10 ft cannot be frightened.']],
            11: [['Improved Divine Smite', 'Every melee weapon hit deals an extra 1d8 radiant.']],
            14: [['Cleansing Touch', 'Action: end one spell on yourself or a willing creature; Cha mod uses per long rest.']],
            18: [['Aura improvements', 'Your auras now reach 30 ft.']]
          },
          subclasses: [
            { id: 'devotion', name: 'Oath of Devotion', source: 'SRD 5.1', srd: true,
              summary: 'Honorable knight; Sacred Weapon adds Cha to weapon attack rolls.',
              features: {
                3: [['Channel Divinity', 'Sacred Weapon (+Cha to weapon attacks for 1 minute) or Turn the Unholy.']],
                7: [['Aura of Devotion', 'You and nearby allies cannot be charmed.']],
                15: [['Purity of Spirit', 'You are always under protection from evil and good.']],
                20: [['Holy Nimbus', 'For 1 minute, a radiant aura burns nearby enemies; advantage on saves vs fiend and undead spells.']] } },
            { id: 'ancients', name: 'Oath of the Ancients', source: "Player's Handbook (2014)",
              summary: 'Warden of light and life; a strong aura against spell damage.',
              features: {
                3: [['Channel Divinity', "Nature's Wrath (spectral vines restrain) or Turn the Faithless."]],
                7: [['Aura of Warding', 'You and nearby allies resist damage from spells.']],
                15: [['Undying Sentinel', 'Drop to 1 HP instead of 0 once per long rest; you stop aging.']],
                20: [['Elder Champion', 'One-minute form: regain HP each turn, cast faster, enemies save at disadvantage vs your spells.']] } },
            { id: 'vengeance', name: 'Oath of Vengeance', source: "Player's Handbook (2014)",
              summary: 'Relentless hunter; Vow of Enmity grants advantage against one foe.',
              features: {
                3: [['Channel Divinity', 'Vow of Enmity (advantage on attacks vs one creature for 1 minute) or Abjure Enemy.']],
                7: [['Relentless Avenger', 'Hitting with an opportunity attack lets you move half your speed for free.']],
                15: [['Soul of Vengeance', 'Reaction attack when your vowed target makes an attack.']],
                20: [['Avenging Angel', 'Wings and a frightening aura for an hour.']] } },
            { id: 'conquest', name: 'Oath of Conquest', source: "Xanathar's Guide to Everything",
              summary: 'Rules through fear; frightens and pins enemies.',
              features: {
                3: [['Channel Divinity', 'Conquering Presence (frighten nearby foes) or Guided Strike (+10 to one attack).']],
                7: [['Aura of Conquest', 'Frightened enemies near you cannot move and take psychic damage.']],
                15: [['Scornful Rebuke', 'Creatures that hit you take psychic damage equal to your Cha mod.']],
                20: [['Invincible Conqueror', 'For 1 minute: resist all damage, an extra attack, and crits on 19-20.']] } },
            { id: 'redemption', name: 'Oath of Redemption', source: "Xanathar's Guide to Everything",
              summary: 'Peacemaker who takes hits for allies.',
              features: {
                3: [['Channel Divinity', 'Emissary of Peace (+5 Persuasion) or Rebuke the Violent (turn damage back on an attacker).']],
                7: [['Aura of the Guardian', 'Reaction: take the damage an ally in your aura would take.']],
                15: [['Protective Spirit', 'Heal a little at the end of each turn while below half HP.']],
                20: [['Emissary of Redemption', 'Resist all damage; attackers take radiant damage back.']] } },
            { id: 'glory', name: 'Oath of Glory', source: "Tasha's Cauldron of Everything",
              summary: 'Heroic athlete; speed for the party and inspiring smites.',
              features: {
                3: [['Channel Divinity', 'Peerless Athlete or Inspiring Smite (share temp HP after a smite).']],
                7: [['Aura of Alacrity', '+10 ft speed, and allies starting a turn in your aura gain +10 ft.']],
                15: [['Glorious Defense', 'Reaction: add Cha to AC against a hit and strike back if it misses.']],
                20: [['Living Legend', 'For 1 minute: advantage on Cha checks, turn a miss into a hit, reroll failed saves.']] } },
            { id: 'watchers', name: 'Oath of the Watchers', source: "Tasha's Cauldron of Everything",
              summary: 'Guards the world against extraplanar threats.',
              features: {
                3: [['Channel Divinity', "Watcher's Will (advantage on mental saves) or Abjure the Extraplanar."]],
                7: [['Aura of the Sentinel', 'You and nearby allies add your Cha mod to initiative.']],
                15: [['Vigilant Rebuke', 'Deal force damage to a creature that forced a save on someone you can see.']],
                20: [['Mortal Bulwark', 'Truesight, advantage vs extraplanar foes, and banish them on a hit.']] } },
            { id: 'oathbreaker', name: 'Oathbreaker', source: "Dungeon Master's Guide (2014)",
              summary: 'Fallen paladin; empowers undead and fiends.',
              features: {
                3: [['Channel Divinity', 'Control Undead or Dreadful Aspect (frighten nearby enemies).']],
                7: [['Aura of Hate', 'You and nearby fiends and undead add your Cha mod to melee damage.']],
                15: [['Supernatural Resistance', 'Resist nonmagical weapon damage.']],
                20: [['Dread Lord', 'An aura of gloom that damages enemies and hides allies.']] } },
            { id: 'crown', name: 'Oath of the Crown', source: "Sword Coast Adventurer's Guide",
              summary: 'Defender of law and civilization.',
              features: {
                3: [['Channel Divinity', 'Champion Challenge (keep foes near you) or Turn the Tide (heal wounded allies).']],
                7: [['Divine Allegiance', 'Reaction: take the damage meant for a nearby ally.']],
                15: [['Unyielding Spirit', 'Advantage on saves against paralysis and stun.']],
                20: [['Exalted Champion', 'For an hour: resist weapon damage and bolster allies against death and saves.']] } }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Paladin Subclass',
          subclassFeatureLevels: [3, 7, 15, 20],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light and medium armor, shields, martial weapons',
          cantrips: null,
          spells: { kind: 'prepared', table: A('2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15') },
          features: {
            1: [['Lay on Hands', 'Bonus action: heal from a pool of 5 x paladin level; 5 points also removes Poisoned.'],
                ['Spellcasting', 'Half caster with a prepared list (see Spells); swap one spell after each long rest. Charisma.'],
                ['Weapon Mastery', 'Use the mastery properties of two kinds of weapons.']],
            2: [['Fighting Style', 'Take a Fighting Style feat, or Blessed Warrior for two cleric cantrips.'],
                ["Paladin's Smite", 'Divine Smite (now a 1st-level spell) is always prepared; cast it once per long rest without a slot.']],
            3: [['Channel Divinity', '2 uses (one back on a short rest, all on a long rest; 3 uses at paladin 11). Divine Sense is one option.'],
                ['Paladin Subclass', 'Choose your oath.']],
            5: [['Extra Attack', 'Attack twice when you take the Attack action.'],
                ['Faithful Steed', 'Find Steed is always prepared; cast it once per long rest without a slot.']],
            6: [['Aura of Protection', 'You and allies within 10 ft add your Cha mod (min +1) to saving throws.']],
            9: [['Abjure Foes', 'Channel Divinity: frighten up to Cha mod creatures within 60 ft (Wis save).']],
            10: [['Aura of Courage', 'You and allies in your aura are immune to Frightened.']],
            11: [['Radiant Strikes', 'Melee weapon and unarmed hits deal an extra 1d8 radiant.']],
            14: [['Restoring Touch', 'Spend Lay on Hands points (5 each) to end Blinded, Charmed, Deafened, Frightened, Paralyzed or Stunned.']],
            18: [['Aura Expansion', 'Aura of Protection reaches 30 ft.']]
          },
          subclasses: [
            { id: 'devotion', name: 'Oath of Devotion', source: 'SRD 5.2', srd: true,
              summary: 'Honorable knight; Sacred Weapon adds Cha to attack rolls.',
              features: {
                3: [['Sacred Weapon', 'Channel Divinity: +Cha to attack rolls with a weapon for a while; it shines and can deal radiant.']],
                7: [['Aura of Devotion', 'You and allies in your aura are immune to Charmed.']],
                15: [['Smite of Protection', 'Casting Divine Smite gives you and allies in your aura half cover.']],
                20: [['Holy Nimbus', 'Bonus action: a radiant aura that damages enemies; advantage on saves vs fiends and undead.']] } },
            { id: 'glory', name: 'Oath of Glory', source: "Player's Handbook (2024)",
              summary: 'Heroic athlete; speed and inspiring smites.',
              features: {
                3: [['Inspiring Smite', 'After Divine Smite, spend Channel Divinity to hand out temp HP.'],
                    ['Peerless Athlete', 'Channel Divinity: advantage on Athletics and Acrobatics, longer jumps.']],
                7: [['Aura of Alacrity', '+10 ft speed; allies entering your aura get +10 ft.']],
                15: [['Glorious Defense', 'Reaction: add Cha to AC against a hit, then attack the attacker if it misses.']],
                20: [['Living Legend', 'For a while: advantage on Cha checks, turn misses into hits, reroll failed saves.']] } },
            { id: 'ancients', name: 'Oath of the Ancients', source: "Player's Handbook (2024)",
              summary: 'Warden of nature; aura that blunts magic damage types.',
              features: {
                3: [["Nature's Wrath", 'Channel Divinity: spectral vines restrain nearby enemies.']],
                7: [['Aura of Warding', 'You and allies in your aura resist necrotic, psychic and radiant damage.']],
                15: [['Undying Sentinel', 'Drop to 1 HP instead of 0 once per long rest; you stop aging.']],
                20: [['Elder Champion', 'One-minute form: regain HP, cast faster, enemies save at disadvantage vs you.']] } },
            { id: 'vengeance', name: 'Oath of Vengeance', source: "Player's Handbook (2024)",
              summary: 'Relentless hunter; Vow of Enmity on your Attack action.',
              features: {
                3: [['Vow of Enmity', 'Channel Divinity when you attack: advantage on attacks vs one creature for 1 minute.']],
                7: [['Relentless Avenger', 'An opportunity attack hit drops the target to speed 0 and lets you move.']],
                15: [['Soul of Vengeance', 'Reaction attack when your vowed creature attacks.']],
                20: [['Avenging Angel', 'Wings and a frightening aura.']] } }
          ]
        }
      }
    },

    warlock: {
      code: 'W', name: 'Warlock', short: 'Lock', hitDie: 8, color: 'lock',
      caster: 'pact',
      prereq: { cha: 13 },
      saves: 'Wisdom, Charisma',
      pact: {
        slots: A('1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4'),
        level: A('1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5'),
        arcanum: { 11: 6, 13: 7, 15: 8, 17: 9 }
      },
      ed: {
        '2014': {
          subclassLevel: 1, subclassLabel: 'Otherworldly Patron',
          subclassFeatureLevels: [1, 6, 10, 14],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'Light armor, simple weapons',
          cantrips: A('2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4'),
          spells: { kind: 'known', table: A('2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15') },
          invocations: A('0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8'),
          pactBoonLevel: 3,
          features: {
            1: [['Otherworldly Patron', 'Choose your patron.'],
                ['Pact Magic', 'A few slots, all at your pact level, back on a short rest. Charisma.']],
            2: [['Eldritch Invocations', 'Pick invocations; Agonizing Blast adds Cha to each Eldritch Blast beam.']],
            3: [['Pact Boon', 'Pact of the Chain, Blade or Tome (Talisman in Tasha\'s).']],
            11: [['Mystic Arcanum (6th)', 'Pick one 6th-level spell; cast it once per long rest without a slot.']],
            13: [['Mystic Arcanum (7th)', 'One 7th-level spell, once per long rest.']],
            15: [['Mystic Arcanum (8th)', 'One 8th-level spell, once per long rest.']],
            17: [['Mystic Arcanum (9th)', 'One 9th-level spell, once per long rest.']],
            20: [['Eldritch Master', 'Spend 1 minute to regain all pact slots, once per long rest.']]
          },
          subclasses: [
            { id: 'fiend', name: 'The Fiend', source: 'SRD 5.1', srd: true,
              summary: 'Infernal patron; temp HP on kills and fire spells.',
              features: {
                1: [["Dark One's Blessing", 'Gain temp HP (Cha mod + warlock level) when you drop a hostile creature to 0.']],
                6: [["Dark One's Own Luck", 'Add a d10 to an ability check or save, once per short rest.']],
                10: [['Fiendish Resilience', 'Choose one damage resistance after each rest.']],
                14: [['Hurl Through Hell', 'Send a creature you hit through the lower planes for 10d10 psychic.']] } },
            { id: 'archfey', name: 'The Archfey', source: "Player's Handbook (2014)",
              summary: 'Fey patron; charm, fear and slippery escapes.',
              features: {
                1: [['Fey Presence', 'Charm or frighten creatures in a 10-ft cube, once per short rest.']],
                6: [['Misty Escape', 'Reaction to damage: turn invisible and teleport.']],
                10: [['Beguiling Defenses', 'Immune to charm; turn charm attempts back on the caster.']],
                14: [['Dark Delirium', 'Trap a creature in an illusory realm for a minute.']] } },
            { id: 'great-old-one', name: 'The Great Old One', source: "Player's Handbook (2014)",
              summary: 'Alien patron; telepathy and mind tricks.',
              features: {
                1: [['Awakened Mind', 'Speak telepathically within 30 ft.']],
                6: [['Entropic Ward', 'Impose disadvantage on an attack; gain advantage if it misses.']],
                10: [['Thought Shield', 'Resist psychic damage; your mind cannot be read unless you allow it.']],
                14: [['Create Thrall', 'Charm an incapacitated humanoid indefinitely.']] } },
            { id: 'celestial', name: 'The Celestial', source: "Xanathar's Guide to Everything",
              summary: 'Radiant patron; a healing pool and radiant damage.',
              features: {
                1: [['Bonus Cantrips', 'Learn Light and Sacred Flame.'],
                    ['Healing Light', 'Bonus action: heal from a pool of d6s (1 + warlock level).']],
                6: [['Radiant Soul', 'Resist radiant; add Cha to one fire or radiant spell damage roll.']],
                10: [['Celestial Resilience', 'You and allies gain temp HP after each rest.']],
                14: [['Searing Vengeance', 'Rise from a death save in a burst of radiant light.']] } },
            { id: 'hexblade', name: 'The Hexblade', source: "Xanathar's Guide to Everything",
              summary: 'Weapon patron; attack with Cha. The classic paladin dip.',
              features: {
                1: [["Hexblade's Curse", 'Curse a target: +prof bonus damage, crits on 19-20, heal when it dies. Once per short rest.'],
                    ['Hex Warrior', 'Medium armor, shields and martial weapons; use Cha for attack and damage with one weapon (or your pact weapon).']],
                6: [['Accursed Specter', 'Raise a slain humanoid as a specter servant.']],
                10: [['Armor of Hexes', 'Attacks from your cursed target miss on a d6 roll of 4+.']],
                14: [['Master of Hexes', 'Move your curse to a new creature when the target dies.']] } },
            { id: 'fathomless', name: 'The Fathomless', source: "Tasha's Cauldron of Everything",
              summary: 'Deep-sea patron; a spectral tentacle and water tricks.',
              features: {
                1: [['Tentacle of the Deeps', 'Summon a tentacle that strikes for cold damage and slows.'],
                    ['Gift of the Sea', 'Swim speed and water breathing.']],
                6: [['Oceanic Soul', 'Cold resistance; talk to anything underwater.'],
                    ['Guardian Coil', 'Your tentacle can reduce damage to a nearby creature.']],
                10: [['Grasping Tentacles', "Evard's Black Tentacles prepared, free cast once per long rest, with temp HP."]],
                14: [['Fathomless Plunge', 'Teleport yourself and allies to a body of water.']] } },
            { id: 'genie', name: 'The Genie', source: "Tasha's Cauldron of Everything",
              summary: 'Elemental noble patron; a vessel and extra damage.',
              features: {
                1: [["Genie's Vessel", 'A vessel you can retreat into; extra elemental damage once per turn.']],
                6: [['Elemental Gift', 'A damage resistance and short bursts of flight.']],
                10: [['Sanctuary Vessel', 'Bring allies into your vessel for a quick rest.']],
                14: [['Limited Wish', 'Cast a 6th-level-or-lower spell from any list, rarely.']] } },
            { id: 'undead', name: 'The Undead', source: "Van Richten's Guide to Ravenloft",
              summary: 'Deathless patron; a frightening transformation.',
              features: {
                1: [['Form of Dread', 'Bonus action form: temp HP, fear immunity, frighten on a hit.']],
                6: [['Grave Touched', 'No need to eat or breathe; turn attack damage necrotic.']],
                10: [['Necrotic Husk', 'Necrotic resistance; avoid dropping to 0 once in a while.']],
                14: [['Spirit Projection', 'Leave your body as a spirit.']] } },
            { id: 'undying', name: 'The Undying', source: "Sword Coast Adventurer's Guide",
              summary: 'Patron who cheated death; survival tricks.',
              features: {
                1: [['Among the Dead', 'Spare the Dying cantrip; undead hesitate to attack you.']],
                6: [['Defy Death', 'Regain HP on a successful death save or when you stabilize someone.']],
                10: [['Undying Nature', 'Little need for air, food or sleep; you age slowly.']],
                14: [['Indestructible Life', 'Bonus action: heal yourself and reattach limbs.']] } }
          ]
        },
        '2024': {
          subclassLevel: 3, subclassLabel: 'Warlock Subclass',
          subclassFeatureLevels: [3, 6, 10, 14],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'Light armor',
          cantrips: A('2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4'),
          spells: { kind: 'prepared', table: A('2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15') },
          invocations: A('1,3,3,3,5,5,6,6,7,7,7,8,8,8,9,9,9,10,10,10'),
          pactBoonLevel: null,
          features: {
            1: [['Eldritch Invocations', 'One invocation at level 1. Pact of the Blade, Chain and Tome are invocations now.'],
                ['Pact Magic', 'Prepared list (see Spells); slots back on a short rest; swap one spell each warlock level. Charisma.']],
            2: [['Magical Cunning', 'A 1-minute rite regains half your pact slots (rounded up), once per long rest.']],
            3: [['Warlock Subclass', 'Choose your patron.']],
            9: [['Contact Patron', 'Contact Other Plane always prepared; cast it free once per long rest and auto-succeed on its save.']],
            11: [['Mystic Arcanum (6th)', 'Pick one 6th-level spell; cast it once per long rest without a slot.']],
            13: [['Mystic Arcanum (7th)', 'One 7th-level spell, once per long rest.']],
            15: [['Mystic Arcanum (8th)', 'One 8th-level spell, once per long rest.']],
            17: [['Mystic Arcanum (9th)', 'One 9th-level spell, once per long rest.']],
            20: [['Eldritch Master', 'Magical Cunning now restores all your pact slots.']]
          },
          subclasses: [
            { id: 'fiend', name: 'Fiend Patron', source: 'SRD 5.2', srd: true,
              summary: 'Infernal patron; temp HP on kills and fire spells.',
              features: {
                3: [["Dark One's Blessing", 'Temp HP (Cha mod + warlock level) when an enemy near you drops to 0.'],
                    ['Fiend Spells', 'Extra always-prepared spells.']],
                6: [["Dark One's Own Luck", 'Add a d10 to an ability check or save a few times per long rest.']],
                10: [['Fiendish Resilience', 'Choose one damage resistance after each rest.']],
                14: [['Hurl Through Hell', 'Send a creature you hit through the lower planes for heavy psychic damage.']] } },
            { id: 'archfey', name: 'Archfey Patron', source: "Player's Handbook (2024)",
              summary: 'Fey patron; teleporting with Misty Step riders.',
              features: {
                3: [['Steps of the Fey', 'Free Misty Steps each long rest, each with a rider (refresh an ally or taunt foes).']],
                6: [['Misty Escape', 'Misty Step as a reaction to taking damage, with extra effects.']],
                10: [['Beguiling Defenses', 'Immune to Charmed; turn damage back on an attacker as psychic.']],
                14: [['Bewitching Magic', 'A free Misty Step when you cast an enchantment or illusion with a slot.']] } },
            { id: 'celestial', name: 'Celestial Patron', source: "Player's Handbook (2024)",
              summary: 'Radiant patron; a healing pool and radiant damage.',
              features: {
                3: [['Healing Light', 'Bonus action: heal from a pool of d6s.'],
                    ['Celestial Spells', 'Extra always-prepared spells.']],
                6: [['Radiant Soul', 'Resist radiant; add Cha to fire or radiant spell damage once per turn.']],
                10: [['Celestial Resilience', 'You and allies gain temp HP after rests and Magical Cunning.']],
                14: [['Searing Vengeance', 'Pull yourself or an ally up from 0 HP in a burst of radiant light.']] } },
            { id: 'great-old-one', name: 'Great Old One Patron', source: "Player's Handbook (2024)",
              summary: 'Alien patron; telepathy, psychic spells, Hex upgrades.',
              features: {
                3: [['Awakened Mind', 'Telepathic link with a creature you can see.'],
                    ['Psychic Spells', 'Extra always-prepared spells; enchantments and illusions need no components.']],
                6: [['Clairvoyant Combatant', 'Link minds with a foe: it attacks you at disadvantage and you have advantage.']],
                10: [['Eldritch Hex', 'Hex also gives disadvantage on saves with the chosen ability.'],
                     ['Thought Shield', 'Resist psychic damage and reflect it.']],
                14: [['Create Thrall', 'Summon an aberration without a slot, empowered by your Pact Magic.']] } }
          ]
        }
      }
    },

    sorcerer: {
      code: 'S', name: 'Sorcerer', short: 'Sorc', hitDie: 6, color: 'sorc',
      caster: 'full',
      prereq: { cha: 13 },
      saves: 'Constitution, Charisma',
      ed: {
        '2014': {
          spellcastingFrom: 1,
          subclassLevel: 1, subclassLabel: 'Sorcerous Origin',
          subclassFeatureLevels: [1, 6, 14, 18],
          asi: [4, 8, 12, 16, 19], epicBoon: null,
          mcProf: 'None',
          cantrips: A('4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6'),
          spells: { kind: 'known', table: A('2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15') },
          metamagic: A('0,0,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4'),
          sorceryFrom: 2,
          features: {
            1: [['Spellcasting', 'Full caster with spells known (see Spells); swap one each sorcerer level. Charisma.'],
                ['Sorcerous Origin', 'Choose your origin.']],
            2: [['Font of Magic', 'Sorcery points = sorcerer level. Bonus action: turn a slot (pact slots too) into points equal to its level, or points into a slot (1st 2, 2nd 3, 3rd 5, 4th 6, 5th 7). Created slots vanish on a long rest.']],
            3: [['Metamagic', 'Learn 2 Metamagic options; one more at 10 and 17.']],
            10: [['Metamagic', 'Learn a third Metamagic option.']],
            17: [['Metamagic', 'Learn a fourth Metamagic option.']],
            20: [['Sorcerous Restoration', 'Regain 4 sorcery points on a short rest.']]
          },
          subclasses: [
            { id: 'draconic', name: 'Draconic Bloodline', source: 'SRD 5.1', srd: true,
              summary: 'Dragon ancestry; natural armor, extra HP and elemental damage.',
              features: {
                1: [['Dragon Ancestor', 'Pick a dragon type; it sets your element. Speak Draconic.'],
                    ['Draconic Resilience', '+1 HP per sorcerer level; unarmored AC 13 + Dex.']],
                6: [['Elemental Affinity', 'Add Cha to damage of your element; 1 point for resistance to it.']],
                14: [['Dragon Wings', 'Sprout wings for a fly speed.']],
                18: [['Draconic Presence', '5 points: a charm or fear aura for 1 minute.']] } },
            { id: 'wild-magic', name: 'Wild Magic', source: "Player's Handbook (2014)",
              summary: 'Chaotic magic that surges unpredictably.',
              features: {
                1: [['Wild Magic Surge', 'Your spells can trigger random surges.'],
                    ['Tides of Chaos', 'Gain advantage once; a surge can recharge it.']],
                6: [['Bend Luck', '2 points: add or subtract a d4 from another creature\'s roll.']],
                14: [['Controlled Chaos', 'Roll twice on the surge table and choose.']],
                18: [['Spell Bombardment', 'Reroll a max damage die and add it.']] } },
            { id: 'divine-soul', name: 'Divine Soul', source: "Xanathar's Guide to Everything",
              summary: 'Adds the cleric list to your choices; a Sorcadin favorite.',
              features: {
                1: [['Divine Magic', 'Learn cleric spells as sorcerer spells, plus one affinity spell.'],
                    ['Favored by the Gods', 'Add 2d4 to a failed save or missed attack, once per short rest.']],
                6: [['Empowered Healing', '1 point: reroll healing dice for you or a nearby ally.']],
                14: [['Otherworldly Wings', 'Bonus action wings for a 30-ft fly speed.']],
                18: [['Unearthly Recovery', 'Below half HP: bonus action to heal half your max, once per long rest.']] } },
            { id: 'shadow', name: 'Shadow Magic', source: "Xanathar's Guide to Everything",
              summary: 'Shadowfell magic; darkness, a hound and teleporting.',
              features: {
                1: [['Eyes of the Dark', 'Darkvision 120 ft; cast Darkness with points and see through it.'],
                    ['Strength of the Grave', 'Cha save to drop to 1 HP instead of 0.']],
                6: [['Hound of Ill Omen', '3 points: a shadow hound harries one target.']],
                14: [['Shadow Walk', 'Teleport 120 ft between dim light or darkness.']],
                18: [['Umbral Form', 'Become shadow: resist most damage and pass through objects.']] } },
            { id: 'storm', name: 'Storm Sorcery', source: "Xanathar's Guide to Everything",
              summary: 'Storm-born; short flights and lightning or thunder.',
              features: {
                1: [['Wind Speaker', 'Speak the Primordial dialects.'],
                    ['Tempestuous Magic', 'Fly 10 ft as a bonus action after casting a leveled spell.']],
                6: [['Heart of the Storm', 'Lightning and thunder resistance; casting them shocks nearby foes.'],
                    ['Storm Guide', 'Calm rain or steer the wind.']],
                14: [["Storm's Fury", 'Reaction: lightning damage and a push when hit in melee.']],
                18: [['Wind Soul', 'Immune to lightning and thunder; 60-ft fly speed you can share.']] } },
            { id: 'aberrant', name: 'Aberrant Mind', source: "Tasha's Cauldron of Everything",
              summary: 'Psionic sorcerer; extra spells, telepathy, silent casting.',
              features: {
                1: [['Psionic Spells', 'Extra psionic spells known, swappable.'],
                    ['Telepathic Speech', 'Form a telepathic link with a creature.']],
                6: [['Psionic Sorcery', 'Cast psionic spells with sorcery points and no V/S components.'],
                    ['Psychic Defenses', 'Psychic resistance; advantage vs charm and fear.']],
                14: [['Revelation in Flesh', 'Spend points for flight, swimming, see invisible or squeezing.']],
                18: [['Warping Implosion', 'Teleport and pull nearby creatures into the gap.']] } },
            { id: 'clockwork', name: 'Clockwork Soul', source: "Tasha's Cauldron of Everything",
              summary: 'Magic of order; cancel advantage and absorb damage.',
              features: {
                1: [['Clockwork Magic', 'Extra order-themed spells known.'],
                    ['Restore Balance', 'Reaction: cancel advantage or disadvantage on a nearby roll.']],
                6: [['Bastion of Law', 'Spend points for a ward of d8s that soaks damage.']],
                14: [['Trance of Order', 'For 1 minute, treat d20 rolls of 9 or lower as 10.']],
                18: [['Clockwork Cavalcade', 'Heal, repair and dispel in a 30-ft cube.']] } },
            { id: 'lunar', name: 'Lunar Sorcery', source: 'Dragonlance: Shadow of the Dragon Queen',
              summary: 'Moon-phase magic; benefits shift with the phase.',
              features: {
                1: [['Lunar Embodiment', 'Extra spells tied to moon phases.'],
                    ['Moon Fire', 'Learn the Sacred Flame cantrip and hit two targets with it.']],
                6: [['Lunar Boons', 'Cheaper Metamagic on spells of your current phase.'],
                    ['Waxing and Waning', 'Spend points to change phase.']],
                14: [['Lunar Empowerment', 'A passive benefit for each phase.']],
                18: [['Lunar Phenomenon', 'A burst effect based on your phase.']] } }
          ]
        },
        '2024': {
          spellcastingFrom: 1,
          subclassLevel: 3, subclassLabel: 'Sorcerer Subclass',
          subclassFeatureLevels: [3, 6, 14, 18],
          asi: [4, 8, 12, 16], epicBoon: 19,
          mcProf: 'None',
          cantrips: A('4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6'),
          spells: { kind: 'prepared', table: A('2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22') },
          metamagic: A('0,2,2,2,2,2,2,2,2,4,4,4,4,4,4,4,6,6,6,6'),
          sorceryFrom: 2,
          features: {
            1: [['Spellcasting', 'Full caster with a prepared list (see Spells); swap one each sorcerer level. Charisma.'],
                ['Innate Sorcery', 'Bonus action for 1 minute: +1 spell save DC and advantage on sorcerer spell attacks; 2 uses per long rest.']],
            2: [['Font of Magic', 'Sorcery points = sorcerer level. Turn a slot (pact slots too) into points equal to its level, or points into a slot up to 5th level; created slots vanish on a long rest.'],
                ['Metamagic', 'Learn 2 Metamagic options; swap one each sorcerer level.']],
            3: [['Sorcerer Subclass', 'Choose your sorcery.']],
            5: [['Sorcerous Restoration', 'On a short rest, regain sorcery points up to half your sorcerer level, once per long rest.']],
            7: [['Sorcery Incarnate', 'Spend 2 points to start Innate Sorcery; while it is on, use two Metamagic options on one spell.']],
            10: [['Metamagic', 'Two more options (4 total).']],
            17: [['Metamagic', 'Two more options (6 total).']],
            20: [['Arcane Apotheosis', 'While Innate Sorcery is on, one Metamagic per turn costs no points.']]
          },
          subclasses: [
            { id: 'draconic', name: 'Draconic Sorcery', source: 'SRD 5.2', srd: true,
              summary: 'Dragon ancestry; natural armor, extra HP and elemental damage.',
              features: {
                3: [['Draconic Resilience', '+1 HP per sorcerer level; unarmored AC 10 + Dex + Cha.'],
                    ['Draconic Spells', 'Extra always-prepared spells.']],
                6: [['Elemental Affinity', 'Resist a chosen element and add Cha to its spell damage.']],
                14: [['Dragon Wings', 'Bonus action wings for a fly speed.']],
                18: [['Dragon Companion', 'Summon Dragon always prepared; cast it once per long rest without a slot.']] } },
            { id: 'aberrant', name: 'Aberrant Sorcery', source: "Player's Handbook (2024)",
              summary: 'Psionic sorcerer; extra spells, telepathy, silent casting.',
              features: {
                3: [['Psionic Spells', 'Extra always-prepared psionic spells.'],
                    ['Telepathic Speech', 'Form a telepathic link with a creature.']],
                6: [['Psionic Sorcery', 'Cast psionic spells with points and no V/S components.'],
                    ['Psychic Defenses', 'Psychic resistance; advantage vs Charmed and Frightened.']],
                14: [['Revelation in Flesh', 'Spend points for flight, swimming, see invisible or squeezing.']],
                18: [['Warping Implosion', 'Teleport and pull nearby creatures into the gap.']] } },
            { id: 'clockwork', name: 'Clockwork Sorcery', source: "Player's Handbook (2024)",
              summary: 'Magic of order; cancel advantage and absorb damage.',
              features: {
                3: [['Clockwork Spells', 'Extra always-prepared order-themed spells.'],
                    ['Restore Balance', 'Reaction: cancel advantage or disadvantage on a nearby roll.']],
                6: [['Bastion of Law', 'Spend points for a ward of d8s that soaks damage.']],
                14: [['Trance of Order', 'For 1 minute, treat d20 rolls of 9 or lower as 10.']],
                18: [['Clockwork Cavalcade', 'Heal, repair and dispel in a 30-ft cube.']] } },
            { id: 'wild-magic', name: 'Wild Magic Sorcery', source: "Player's Handbook (2024)",
              summary: 'Chaotic magic that surges unpredictably.',
              features: {
                3: [['Wild Magic Surge', 'Your spells can trigger random surges.'],
                    ['Tides of Chaos', 'Gain advantage once; a surge can recharge it.']],
                6: [['Bend Luck', 'Spend points to add or subtract a d4 from another creature\'s roll.']],
                14: [['Controlled Chaos', 'Roll twice on the surge table and choose.']],
                18: [['Tamed Surge', 'Pick a surge effect instead of rolling, once per long rest.']] } }
          ]
        }
      }
    }
  };

  var CLASS_ORDER = ['paladin', 'warlock', 'sorcerer'];

  var PACT_BOONS = [
    { id: 'blade', name: 'Pact of the Blade', note: 'Summon a pact weapon; Thirsting Blade and Eldritch Smite build on it.' },
    { id: 'chain', name: 'Pact of the Chain', note: 'An improved familiar.' },
    { id: 'tome', name: 'Pact of the Tome', note: 'Three extra cantrips from any list; ritual and utility options.' },
    { id: 'talisman', name: 'Pact of the Talisman', note: "Tasha's: an amulet that adds a d4 to failed ability checks." }
  ];

  var ED_INFO = {
    '2014': { name: '2014 rules', srd: 'SRD 5.1', halfRound: 'down',
      halfNote: 'Paladin levels count half, rounded down, and only once you have Spellcasting (paladin 2).' },
    '2024': { name: '2024 rules', srd: 'SRD 5.2', halfRound: 'up',
      halfNote: 'Paladin levels count half, rounded up (Paladin 1 adds a full caster level).' }
  };

  var PRESETS = [
    { id: 'sorcadin', name: 'Sorcadin', ed: '2014', lv: 'PPPPPPSSSSSSSSSSSSSS',
      sub: { paladin: 'devotion', sorcerer: 'divine-soul' }, ab: [15, 8, 14, 8, 10, 16],
      blurb: 'Paladin 6 for Extra Attack and Aura of Protection, then Sorcerer for slots to smite with and Quickened Spell.' },
    { id: 'sorcadin24', name: 'Sorcadin', ed: '2024', lv: 'PPPPPPSSSSSSSSSSSSSS',
      sub: { paladin: 'devotion', sorcerer: 'clockwork' }, ab: [15, 8, 14, 8, 10, 16],
      blurb: 'The same split under 2024 rules: one more caster level from rounding up, but Divine Smite is a spell now.' },
    { id: 'hexadin', name: 'Hexadin', ed: '2014', lv: 'PWPPPPPWWPPPPPPPPPPP',
      sub: { paladin: 'vengeance', warlock: 'hexblade' }, ab: [13, 10, 14, 8, 10, 16], boon: 'blade',
      blurb: 'Hexblade dip for Charisma attacks, so Cha drives to-hit, damage, auras and spells. Pact slots refuel smites on a short rest.' },
    { id: 'hexadin24', name: 'Hexadin', ed: '2024', lv: 'PWPPPPPPPPPPPPPPPPPP',
      sub: { paladin: 'vengeance' }, ab: [13, 10, 14, 8, 10, 16],
      blurb: '2024 has no Hexblade in the core book; take Pact of the Blade as your level-1 invocation to attack with Charisma.' },
    { id: 'sorlock', name: 'Sorlock', ed: '2014', lv: 'SWWWSSSSSSSSSSSSSSSS',
      sub: { sorcerer: 'draconic', warlock: 'hexblade' }, ab: [8, 14, 14, 8, 10, 16], boon: 'blade',
      blurb: 'Sorcerer first for Con saves; Warlock 3 for Agonizing Eldritch Blast and short-rest slots that Font of Magic turns into sorcery points.' },
    { id: 'coffeelock', name: 'Coffeelock', ed: '2014', lv: 'WWSSSSSSSSSSSSSSSSSS', exploit: true,
      sub: { warlock: 'celestial', sorcerer: 'shadow' }, ab: [8, 14, 14, 8, 10, 16],
      blurb: '2014 exploit: turn short-rest pact slots into sorcery points, then into slots that last until a long rest, and stockpile them by never taking one. Most DMs ban it.' },
    { id: 'sorlockadin', name: 'Sorlockadin', ed: '2014', lv: 'PPWWWSSSSSSSSSSSSSSS',
      sub: { paladin: 'vengeance', warlock: 'hexblade', sorcerer: 'divine-soul' }, ab: [13, 10, 14, 8, 10, 16], boon: 'blade',
      blurb: 'Paladin 2 for Divine Smite, Hexblade 3 for Cha attacks and short-rest smites, Sorcerer 15 for slots and Metamagic.' }
  ];

  var METAMAGIC = [
    ['Careful Spell', 'Let some creatures automatically succeed on your spell\'s save.'],
    ['Distant Spell', 'Double a spell\'s range, or give a touch spell 30 ft.'],
    ['Empowered Spell', 'Reroll some damage dice.'],
    ['Extended Spell', 'Double a spell\'s duration.'],
    ['Heightened Spell', 'One target has disadvantage on its first save against the spell.'],
    ['Quickened Spell', 'Cast a 1-action spell as a bonus action.'],
    ['Subtle Spell', 'Cast without verbal or somatic components.'],
    ['Twinned Spell', 'Have a single-target spell affect a second target.'],
    ['Seeking Spell', 'Reroll a missed spell attack (Tasha\'s in 2014; PHB in 2024).'],
    ['Transmuted Spell', 'Swap a spell\'s damage type (Tasha\'s in 2014; PHB in 2024).']
  ];

  var DATA = { CLASSES: CLASSES, CLASS_ORDER: CLASS_ORDER, PACT_BOONS: PACT_BOONS, ED_INFO: ED_INFO, PRESETS: PRESETS, METAMAGIC: METAMAGIC };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.PLANNER_DATA = DATA;
})(this);
