const assert = require('assert');
const Character = require('../modules/character');

describe('Character', () => {
    let character;

    beforeEach(() => {
        character = new Character();
    });

    describe('Ability Scores', () => {
        it('should initialize with default ability scores of 10', () => {
            assert.strictEqual(character.strength, 10);
            assert.strictEqual(character.dexterity, 10);
            assert.strictEqual(character.constitution, 10);
            assert.strictEqual(character.wisdom, 10);
            assert.strictEqual(character.intelligence, 10);
            assert.strictEqual(character.charisma, 10);
        });

        it('should validate ability score ranges', () => {
            assert.throws(() => character.strength = 0, Error);
            assert.throws(() => character.strength = 31, Error);
            assert.doesNotThrow(() => character.strength = 15);
        });
    });

    describe('Proficiency and Expertise', () => {
        it('should add and remove proficiencies', () => {
            character.addProficiency('Athletics');
            assert(character.hasProficiency('Athletics'));
            
            character.removeProficiency('Athletics');
            assert(!character.hasProficiency('Athletics'));
        });

        it('should add and remove expertise', () => {
            character.addExpertise('Stealth');
            assert(character.hasExpertise('Stealth'));
            
            character.removeExpertise('Stealth');
            assert(!character.hasExpertise('Stealth'));
        });
    });

    describe('Modifiers', () => {
        it('should calculate ability modifiers correctly', () => {
            character.strength = 15;
            assert.strictEqual(character.getAbilityModifier(character.strength), 2);
            
            character.strength = 8;
            assert.strictEqual(character.getAbilityModifier(character.strength), -1);
        });

        it('should calculate saving throw modifiers correctly', () => {
            character.strength = 15;
            assert.strictEqual(character.getSavingThrowModifier(character.strength, true), 4); // +2 for proficiency
            assert.strictEqual(character.getSavingThrowModifier(character.strength, false), 2);
        });
    });

    describe('Weapon and Armor', () => {
        it('should validate weapon damage format', () => {
            const character = new Character();
            assert.doesNotThrow(() => character.weaponDamage = '2d4 1d6 3');
            assert.strictEqual(character.weaponDamage, '2d4 1d6 3');
            assert.throws(() => character.weaponDamage = 'invalid', /Invalid weapon damage format/);
        });

        it('should validate armor class', () => {
            assert.throws(() => character.armorClass = -1, Error);
            assert.doesNotThrow(() => character.armorClass = 16);
        });
    });

    describe('Proficiency Bonus', () => {
        it('should initialize with default proficiency bonus of 2', () => {
            assert.strictEqual(character.proficiencyBonus, 2);
        });

        it('should validate proficiency bonus ranges', () => {
            assert.throws(() => character.proficiencyBonus = -1, Error);
            assert.throws(() => character.proficiencyBonus = 7, Error);
            assert.doesNotThrow(() => character.proficiencyBonus = 3);
        });
    });
});
