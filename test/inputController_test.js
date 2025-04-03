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
        weaponDamage: '1d10+4',
        armorClass: 16,
        expertise: ['Stealth'],
        proficiency: ['Athletics', 'Acrobatics']
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
            character.weaponDamage = '1d10+4';
            inputController.currentCharacter = character;

            const savedData = await inputController.saveHandler(`save ${testCharacterName}_save`);
            assert(savedData);
            assert.strictEqual(savedData.strength, 16);
            assert.strictEqual(savedData.weaponDamage, '1d10+4');
            
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
                '1d8+3',  // Weapon Damage
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
            assert.strictEqual(character.weaponDamage, '1d8+3');
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
            character.weaponDamage = '1d8+3';
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.attackHandler('attack');
            
            console.log = consoleLog;
            assert(output.includes('Hit:'));
            assert(output.includes('Damage:'));
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
    });
});
