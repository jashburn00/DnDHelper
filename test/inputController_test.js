const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Character = require('../modules/character');
const inputController = require('../modules/inputController');

describe('Input Controller', () => {
    const testCharacter = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        wisdom: 12,
        intelligence: 11,
        charisma: 10,
        weaponDamage: '1d8+3',
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
            await inputController.loadHandler(`load ${testCharacterName}`);
            assert(inputController.currentCharacter);
            assert.strictEqual(inputController.currentCharacter.strength, testCharacter.strength);
            assert.strictEqual(inputController.currentCharacter.weaponDamage, testCharacter.weaponDamage);
        });

        it('should save a character to file', async () => {
            const character = new Character();
            character.strength = 16;
            character.weaponDamage = '1d10+4';
            inputController.currentCharacter = character;

            await inputController.saveHandler(`save ${testCharacterName}_save`);
            const savedPath = path.join(__dirname, '..', 'characters', `${testCharacterName}_save.json`);
            assert(fs.existsSync(savedPath));
            
            const savedData = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
            assert.strictEqual(savedData.strength, 16);
            assert.strictEqual(savedData.weaponDamage, '1d10+4');
            
            fs.unlinkSync(savedPath);
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
                '15',  // Strength
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
                callback(mockResponses[questionIndex++]);
            };

            await inputController.createHandler(`create ${newCharacterName}`);

            // Restore original question function
            inputController.rl.question = originalQuestion;

            assert(inputController.currentCharacter);
            assert.strictEqual(inputController.currentCharacter.strength, 15);
            assert.strictEqual(inputController.currentCharacter.dexterity, 14);
            assert.strictEqual(inputController.currentCharacter.constitution, 13);
            assert.strictEqual(inputController.currentCharacter.intelligence, 12);
            assert.strictEqual(inputController.currentCharacter.wisdom, 11);
            assert.strictEqual(inputController.currentCharacter.charisma, 10);
            assert(inputController.currentCharacter.hasProficiency('Athletics'));
            assert(inputController.currentCharacter.hasProficiency('Acrobatics'));
            assert(inputController.currentCharacter.hasExpertise('Stealth'));
            assert.strictEqual(inputController.currentCharacter.weaponDamage, '1d8+3');
            assert.strictEqual(inputController.currentCharacter.armorClass, 16);
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
            assert(output.includes('2d6:'));
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
            Math.random = () => 0.5; // This will make all dice rolls return the middle value

            inputController.diceHandler('dice 2d6 1d4');
            
            // Restore Math.random
            Math.random = originalRandom;
            
            console.log = consoleLog;
            // 2d6 with middle values (3.5) = 7
            // 1d4 with middle value (2.5) = 2
            // Total should be 9
            assert(output.includes('Grand Total: 9'));
        });
    });

    describe('Combat', () => {
        beforeEach(() => {
            // Reset health before each test
            inputController.health = 69;
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
            const originalHealth = inputController.health;
            
            inputController.ouchHandler('ouch 10');
            assert.strictEqual(inputController.health, originalHealth - 10);
            
            inputController.healHandler('heal 5');
            assert.strictEqual(inputController.health, originalHealth - 5);
        });
    });
});
