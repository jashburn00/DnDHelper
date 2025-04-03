const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Character = require('../modules/character');
const inputController = require('../modules/inputController');

describe('Input Controller', () => {
    const testCharacter = {
        strength: 16,
        dexterity: 14,
        constitution: 13,
        wisdom: 12,
        intelligence: 11,
        charisma: 10,
        weaponDamage: '2d4 1d6 3',
        armorClass: 16,
        expertise: ['stealth'],
        proficiency: ['athletics', 'acrobatics']
    };

    const testCharacterName = 'test_character';
    const testFilePath = path.join(__dirname, '..', 'characters', `${testCharacterName}.json`);

    before(() => {
        // Create test character file
        const charactersDir = path.join(__dirname, '..', 'characters');
        if (!fs.existsSync(charactersDir)) {
            fs.mkdirSync(charactersDir);
        }
        fs.writeFileSync(testFilePath, JSON.stringify(testCharacter));
    });

    after(() => {
        // Clean up test character file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        // Close the readline interface
        inputController.rl.close();
    });

    describe('Character Management', () => {
        it('should load a character from file', async () => {
            const character = await inputController.loadHandler(`load ${testCharacterName}`);
            assert(character);
            assert.strictEqual(character.strength, testCharacter.strength);
            assert.strictEqual(character.weaponDamage, testCharacter.weaponDamage);
        });

        it('should save a character to file', async () => {
            const character = new Character();
            character.strength = 16;
            character.weaponDamage = '2d4 1d6 3';
            inputController.currentCharacter = character;

            const savedData = await inputController.saveHandler(`save ${testCharacterName}_save`);
            assert(savedData);
            assert.strictEqual(savedData.strength, 16);
            assert.strictEqual(savedData.weaponDamage, '2d4 1d6 3');
            
            // Clean up
            const savedPath = path.join(__dirname, '..', 'characters', `${testCharacterName}_save.json`);
            if (fs.existsSync(savedPath)) {
                fs.unlinkSync(savedPath);
            }
        });

        it('should delete a character file with confirmation', async () => {
            const deletePath = path.join(__dirname, '..', 'characters', `${testCharacterName}_delete.json`);
            fs.writeFileSync(deletePath, JSON.stringify(testCharacter));
            
            // Mock the readline question
            const originalQuestion = inputController.rl.question;
            inputController.rl.question = (query, callback) => callback('yes');
            
            await inputController.deleteHandler(`delete ${testCharacterName}_delete`);
            assert(!fs.existsSync(deletePath));
            
            inputController.rl.question = originalQuestion;
        });
    });

    describe('Character Creation', () => {
        const newCharacterName = 'new_test_character';
        const newCharacterPath = path.join(__dirname, '..', 'characters', `${newCharacterName}.json`);

        afterEach(() => {
            // Clean up after each test
            if (fs.existsSync(newCharacterPath)) {
                fs.unlinkSync(newCharacterPath);
            }
            inputController.currentCharacter = null;
        });

        it('should create a new character with valid input', async () => {
            // Mock the readline question function
            const originalQuestion = inputController.rl.question;
            let questionIndex = 0;
            const mockResponses = [
                '16',  // Strength
                '14',  // Dexterity
                '13',  // Constitution
                '12',  // Intelligence
                '11',  // Wisdom
                '10',  // Charisma
                'Athletics, Acrobatics',  // Proficiencies
                'Stealth',  // Expertise
                '2d4 1d6 3',  // Weapon Damage
                '16'   // Armor Class
            ];

            inputController.rl.question = (query, callback) => {
                const response = mockResponses[questionIndex++];
                callback(response);
            };

            const character = await inputController.createHandler(`create ${newCharacterName}`);

            // Restore original question function
            inputController.rl.question = originalQuestion;

            assert(character);
            assert.strictEqual(character.strength, 16);
            assert.strictEqual(character.dexterity, 14);
            assert.strictEqual(character.constitution, 13);
            assert.strictEqual(character.intelligence, 12);
            assert.strictEqual(character.wisdom, 11);
            assert.strictEqual(character.charisma, 10);
            assert(character.hasProficiency('Athletics'));
            assert(character.hasProficiency('Acrobatics'));
            assert(character.hasExpertise('Stealth'));
            assert.strictEqual(character.weaponDamage, '2d4 1d6 3');
            assert.strictEqual(character.armorClass, 16);
        });

        it('should not create a character that already exists', async () => {
            // First create the character
            await inputController.saveHandler(`save ${newCharacterName}`);
            
            // Try to create a character with the same name
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            await inputController.createHandler(`create ${newCharacterName}`);
            
            console.log = consoleLog;
            assert(output.includes('already exists'));
            assert(!inputController.currentCharacter);
        });

        it('should validate ability score ranges', async () => {
            // Mock the readline question function
            const originalQuestion = inputController.rl.question;
            let questionIndex = 0;
            const mockResponses = [
                '31',  // Invalid Strength
                '14',  // Dexterity
                '13',  // Constitution
                '12',  // Intelligence
                '11',  // Wisdom
                '10',  // Charisma
                'Athletics',  // Proficiencies
                'Stealth',  // Expertise
                '1d8+3',  // Weapon Damage
                '16'   // Armor Class
            ];

            inputController.rl.question = (query, callback) => {
                callback(mockResponses[questionIndex++]);
            };

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            await inputController.createHandler(`create ${newCharacterName}`);
            
            console.log = consoleLog;
            inputController.rl.question = originalQuestion;

            assert(output.includes('Error'));
            assert(!inputController.currentCharacter);
        });

        it('should validate weapon damage format', async () => {
            // Mock the readline question function
            const originalQuestion = inputController.rl.question;
            let questionIndex = 0;
            const mockResponses = [
                '15',  // Strength
                '14',  // Dexterity
                '13',  // Constitution
                '12',  // Intelligence
                '11',  // Wisdom
                '10',  // Charisma
                'Athletics',  // Proficiencies
                'Stealth',  // Expertise
                'invalid',  // Invalid Weapon Damage
                '16'   // Armor Class
            ];

            inputController.rl.question = (query, callback) => {
                callback(mockResponses[questionIndex++]);
            };

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            await inputController.createHandler(`create ${newCharacterName}`);
            
            console.log = consoleLog;
            inputController.rl.question = originalQuestion;

            assert(output.includes('Error'));
            assert(!inputController.currentCharacter);
        });

        it('should accept complex weapon damage format', async () => {
            // Mock the readline question function
            const originalQuestion = inputController.rl.question;
            let questionIndex = 0;
            const mockResponses = [
                '15',  // Strength
                '14',  // Dexterity
                '13',  // Constitution
                '12',  // Intelligence
                '11',  // Wisdom
                '10',  // Charisma
                'Athletics',  // Proficiencies
                'Stealth',  // Expertise
                '2d4 1d6 3',  // Complex Weapon Damage
                '16'   // Armor Class
            ];

            inputController.rl.question = (query, callback) => {
                callback(mockResponses[questionIndex++]);
            };

            const character = await inputController.createHandler(`create ${newCharacterName}`);
            
            // Restore original question function
            inputController.rl.question = originalQuestion;

            assert(character);
            assert.strictEqual(character.weaponDamage, '2d4 1d6 3');
        });

        it('should validate skills during character creation', async () => {
            // Mock the readline question function
            const originalQuestion = inputController.rl.question;
            let questionIndex = 0;
            const mockResponses = [
                '16',  // Strength
                '14',  // Dexterity
                '13',  // Constitution
                '12',  // Intelligence
                '11',  // Wisdom
                '10',  // Charisma
                'Athletics, InvalidSkill',  // First try with invalid skill
                'Athletics, Acrobatics',  // Second try with valid skills
                'Stealth, InvalidSkill',  // First try with invalid expertise
                'Stealth',  // Second try with valid expertise
                '2d4 1d6 3',  // Weapon Damage
                '16'   // Armor Class
            ];

            inputController.rl.question = (query, callback) => {
                const response = mockResponses[questionIndex++];
                callback(response);
            };

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            const character = await inputController.createHandler(`create ${newCharacterName}`);

            // Restore original question function
            inputController.rl.question = originalQuestion;
            console.log = consoleLog;

            assert(character);
            assert(character.hasProficiency('Athletics'));
            assert(character.hasProficiency('Acrobatics'));
            assert(character.hasExpertise('Stealth'));
            assert(output.includes('Invalid skills: InvalidSkill'));
            assert(output.includes('Please try again with valid skills.'));
        });
    });

    describe('Dice Rolling', () => {
        it('should roll single dice correctly', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.diceHandler('dice 2d6');
            
            console.log = consoleLog;
            assert(output.includes('Rolls:'));
            assert(output.includes('Total:'));
        });

        it('should handle invalid dice format', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.diceHandler('dice invalid');
            
            console.log = consoleLog;
            assert(output.includes('Invalid dice format'));
        });

        it('should roll multiple dice notations correctly', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.diceHandler('dice 1d10 2d4 3d4 2d6');
            
            console.log = consoleLog;
            assert(output.includes('1d10:'));
            assert(output.includes('2d4:'));
            assert(output.includes('3d4:'));
            assert(output.includes('2d6:'));
            assert(output.includes('Grand Total:'));
        });

        it('should handle multiple dice notations with invalid format', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.diceHandler('dice 1d10 invalid 2d6');
            
            console.log = consoleLog;
            assert(output.includes('Invalid dice format: invalid'));
        });

        it('should calculate correct totals for multiple dice notations', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.5, 0.5, 0.5]; // For 2d6 and 1d4
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.diceHandler('dice 2d6 1d4');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;

            // With Math.random() = 0.5:
            // 2d6: each d6 will roll 4 (0.5 * 6 rounded down + 1), total 8
            // 1d4: will roll 3 (0.5 * 4 rounded down + 1)
            // Grand total should be 11
            assert(output.includes('Grand Total: 11'));
        });
    });

    describe('Combat', () => {
        let originalHealth;

        beforeEach(() => {
            // Store original health and reset before each test
            originalHealth = inputController.health;
            inputController.health = 69;
        });

        afterEach(() => {
            // Restore original health after each test
            inputController.health = originalHealth;
        });

        it('should handle attack rolls', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;  // +2 modifier
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.95, 0.1, 0.1, 0.1, 0.1, 0.1]; // For d20 and damage dice
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.attackHandler('attack');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            // Verify hit roll output
            assert(output.includes('Hit:'));
            assert(output.includes('+ 2'));  // Dexterity modifier
            assert(output.includes('Critical Hit!'));  // Should be a critical hit (19.95 * 20 + 1 = 20)
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('2d4'));
            assert(output.includes('1d6'));
            assert(output.includes('3'));
            assert(output.includes('Total Damage:'));
        });

        it('should handle damage and healing', () => {
            // Start with known health value
            inputController.health = 69;
            
            // Apply damage
            const damageResult = inputController.ouchHandler('ouch 10');
            assert.strictEqual(damageResult, 59);
            
            // Apply healing
            const healResult = inputController.healHandler('heal 5');
            assert.strictEqual(healResult, 64);
        });

        it('should handle saving throws', () => {
            const character = new Character();
            character.strength = 16;
            character.dexterity = 14;
            character.constitution = 13;
            character.intelligence = 12;
            character.wisdom = 11;
            character.charisma = 10;
            character.addProficiency('athletics');
            character.addExpertise('stealth');
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Test with full stat names
            inputController.throwHandler('throw Strength');
            assert(output.includes('Strength saving throw:'));
            output = '';
            
            inputController.throwHandler('throw Dexterity');
            assert(output.includes('Dexterity saving throw:'));
            output = '';
            
            inputController.throwHandler('throw Constitution');
            assert(output.includes('Constitution saving throw:'));
            output = '';
            
            inputController.throwHandler('throw Intelligence');
            assert(output.includes('Intelligence saving throw:'));
            output = '';
            
            inputController.throwHandler('throw Wisdom');
            assert(output.includes('Wisdom saving throw:'));
            output = '';
            
            inputController.throwHandler('throw Charisma');
            assert(output.includes('Charisma saving throw:'));
            output = '';

            // Test with abbreviations
            inputController.throwHandler('throw STR');
            assert(output.includes('Strength saving throw:'));
            output = '';
            
            inputController.throwHandler('throw DEX');
            assert(output.includes('Dexterity saving throw:'));
            output = '';
            
            inputController.throwHandler('throw CON');
            assert(output.includes('Constitution saving throw:'));
            output = '';
            
            inputController.throwHandler('throw INT');
            assert(output.includes('Intelligence saving throw:'));
            output = '';
            
            inputController.throwHandler('throw WIS');
            assert(output.includes('Wisdom saving throw:'));
            output = '';
            
            inputController.throwHandler('throw CHA');
            assert(output.includes('Charisma saving throw:'));
            output = '';

            // Test invalid stat
            inputController.throwHandler('throw Invalid');
            assert(output.includes('Invalid ability score'));
            
            console.log = consoleLog;
        });

        it('should handle ability checks', () => {
            // Set up test character
            const character = new Character();
            character.strength = 16;
            character.dexterity = 14;
            character.constitution = 13;
            character.intelligence = 12;
            character.wisdom = 11;
            character.charisma = 10;
            character.addProficiency('athletics');
            character.addExpertise('stealth');
            inputController.currentCharacter = character;

            // Mock console.log to capture output
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { 
                output = msg.trim();
            };

            // Test with proficiency
            inputController.checkHandler('check athletics');
            assert(output.includes('athletics check:'), 'Output should include "athletics check:"');
            assert(output.includes('(Proficiency)'), 'Output should include "(Proficiency)"');
            assert(!output.includes('(Expertise)'), 'Output should not include "(Expertise)"');
            assert(output.includes('Total:'), 'Output should include "Total:"');
            output = '';
            
            // Test with expertise (which implies proficiency)
            inputController.checkHandler('check stealth');
            assert(output.includes('stealth check:'), 'Output should include "stealth check:"');
            assert(output.includes('(Proficiency)'), 'Output should include "(Proficiency)"');
            assert(output.includes('(Expertise)'), 'Output should include "(Expertise)"');
            assert(output.includes('Total:'), 'Output should include "Total:"');
            output = '';
            
            // Test without proficiency or expertise
            inputController.checkHandler('check perception');
            assert(output.includes('perception check:'), 'Output should include "perception check:"');
            assert(!output.includes('(Proficiency)'), 'Output should not include "(Proficiency)"');
            assert(!output.includes('(Expertise)'), 'Output should not include "(Expertise)"');
            assert(output.includes('Total:'), 'Output should include "Total:"');
            output = '';

            // Test invalid skill
            inputController.checkHandler('check Invalid');
            assert(output.includes('Invalid skill check'), 'Output should include "Invalid skill check"');
            
            // Restore console.log
            console.log = consoleLog;
        });
    });
});
