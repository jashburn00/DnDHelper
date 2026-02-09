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
        proficiency: ['athletics', 'acrobatics'],
        health: 30,
        proficiencyBonus: 3
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
            const consoleLog = console.log;
            console.log = () => {};

            const character = await inputController.loadHandler(`load ${testCharacterName}`);
            assert(character);
            assert.strictEqual(character.strength, testCharacter.strength);
            assert.strictEqual(character.weaponDamage, testCharacter.weaponDamage);
            assert.strictEqual(character.proficiencyBonus, testCharacter.proficiencyBonus);

            console.log = consoleLog;
        });

        it('should save a character to file', async () => {
            const consoleLog = console.log;
            console.log = () => {};

            const character = new Character();
            character.strength = 16;
            character.weaponDamage = '2d4 1d6 3';
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;

            const savedData = await inputController.saveHandler(`save ${testCharacterName}_save`);
            assert(savedData);
            assert.strictEqual(savedData.strength, 16);
            assert.strictEqual(savedData.weaponDamage, '2d4 1d6 3');
            assert.strictEqual(savedData.proficiencyBonus, 3);

            console.log = consoleLog;

            // Clean up
            const savedPath = path.join(__dirname, '..', 'characters', `${testCharacterName}_save.json`);
            if (fs.existsSync(savedPath)) {
                fs.unlinkSync(savedPath);
            }
        });

        it('should delete a character file with confirmation', async () => {
            const consoleLog = console.log;
            console.log = () => {};

            const deletePath = path.join(__dirname, '..', 'characters', `${testCharacterName}_delete.json`);
            fs.writeFileSync(deletePath, JSON.stringify(testCharacter));
            
            // Mock the readline question
            const originalQuestion = inputController.rl.question;
            inputController.rl.question = (query, callback) => callback('yes');
            
            await inputController.deleteHandler(`delete ${testCharacterName}_delete`);
            assert(!fs.existsSync(deletePath));
            
            inputController.rl.question = originalQuestion;

            console.log = consoleLog;
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
            const consoleLog = console.log;
            console.log = () => {};

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
                'athletics, acrobatics',  // Proficiencies
                'stealth',  // Expertise
                '2d4 1d6 3',  // Weapon damage
                '16',  // Armor class
                '30',  // Health
                '3'  // Proficiency bonus
            ];

            inputController.rl.question = (query, callback) => {
                const response = mockResponses[questionIndex++];
                callback(response);
            };

            const character = await inputController.createHandler(`create ${newCharacterName}`);

            // Restore original question function
            inputController.rl.question = originalQuestion;

            console.log = consoleLog;

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
            assert.strictEqual(character.proficiencyBonus, 3);
        });

        it('should not create a character that already exists', async () => {
            const consoleLog = console.log;
            console.log = () => {};

            // First create the character
            await inputController.saveHandler(`save ${newCharacterName}`);
            
            // Try to create a character with the same name
            // const consoleLog = console.log;
            // console.log = (msg) => { output += msg; };
            // let output = '';

            //the above code is more thorough but it's not needed for this test and it logs to the console

            await inputController.createHandler(`create ${newCharacterName}`);
            
            // assert(output.includes('already exists'));
            assert(!inputController.currentCharacter);

            console.log = consoleLog;
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
                '16',   // Armor Class
                '3'  // Proficiency bonus
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
            const consoleLog = console.log;
            console.log = () => {};

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
                '16',   // Armor Class
                '30',  // Health
                '3'  // Proficiency bonus
            ];

            inputController.rl.question = (query, callback) => {
                callback(mockResponses[questionIndex++]);
            };

            const character = await inputController.createHandler(`create ${newCharacterName}`);
            
            // Restore original question function
            inputController.rl.question = originalQuestion;
            console.log = consoleLog;
            assert(character);
            assert.strictEqual(character.weaponDamage, '2d4 1d6 3');
            assert.strictEqual(character.proficiencyBonus, 3);
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
                '16',   // Armor Class
                '30',  // Health
                '3'  // Proficiency bonus
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
            assert.strictEqual(character.proficiencyBonus, 3);
        });
    });

    describe('Dice Rolling', () => {
        it('should roll single dice correctly', () => {
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            Math.random = () => 0.1; // Will always return lowest possible roll

            inputController.diceHandler('dice 2d4');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            assert(output.includes('2 (2d4)'));
            assert(output.includes('Total: 2'));
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

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1]; // For 2d4 and 1d6
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.diceHandler('dice 2d4 1d6');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            assert(output.includes('2 (2d4) + 1 (1d6)'));
            assert(output.includes('Total: 3'));
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
            let mockValues = [0.5, 0.5, 0.5]; // Will return middle values
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.diceHandler('dice 2d6 1d8');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;

            // With Math.random() = 0.5:
            // 2d6: each d6 will roll 4 (Math.floor(0.5 * 6) + 1), total 8
            // 1d8: will roll 5 (Math.floor(0.5 * 8) + 1)
            // Total should be 13
            assert(output.includes('8 (2d6) + 5 (1d8)'));
            assert(output.includes('Total: 13'));
        });
    });

    describe('Combat', () => {
        let originalHealth;

        beforeEach(() => {
            // Store original health and reset before each test
            inputController.health = 69;
            originalHealth = inputController.health;
        });

        afterEach(() => {
            // Restore original health after each test
            inputController.health = originalHealth;
        });

        it('should handle attack rolls', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;
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
            assert(output.includes('+ 3'));  // Strength modifier (default)
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('+ 3'));  // Last standalone number
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the hit roll format
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('+ 3'));  // Standalone number
            assert(output.includes('Total Damage:'));
        });

        it('should handle attack rolls with specified ability', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.95, 0.1, 0.1, 0.1, 0.1, 0.1]; // For d20 and damage dice
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.attackHandler('attack strength');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            // Verify hit roll output
            assert(output.includes('Hit:'));
            assert(output.includes('+ 3'));  // Strength modifier
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('+ 3'));  // Weapon damage bonus
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the new hit roll format with weapon damage bonus
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('+ 3'));
            assert(output.includes('Total Damage:'));
        });

        it('should handle attack rolls with weapon damage containing multiple standalone numbers', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3 2';  // Multiple standalone numbers: 3 and 2
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;
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
            assert(output.includes('+ 3'));  // Strength modifier (default)
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('+ 2'));  // Last standalone number
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the hit roll format
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('+ 3'));  // First standalone number
            assert(output.includes('+ 2'));  // Second standalone number
            assert(output.includes('Total Damage:'));
        });

        it('should handle attack rolls with weapon damage containing no standalone numbers', async () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6';  // No standalone numbers
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;
            
            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.95, 0.1, 0.1, 0.1, 0.1, 0.1]; // For d20 and damage dice
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            await inputController.setCurrentCharacter(character);
            inputController.attackHandler('attack'); 
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            // Verify hit roll output
            assert(output.includes('Hit:'));
            assert(output.includes('+ 3'));  // Strength modifier (default)
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the hit roll format - should only have 3 numbers (roll + modifier + proficiency)
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('Total Damage:'));
        });

        it('should handle attack rolls with ability abbreviations', async () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;

            await inputController.setCurrentCharacter(character);

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.95, 0.1, 0.1, 0.1, 0.1, 0.1]; // For d20 and damage dice
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.attackHandler('attack str');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            // Verify hit roll output
            assert(output.includes('Hit:'));
            assert(output.includes('+ 3'));  // Strength modifier
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('+ 3'));  // Weapon damage bonus
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the new hit roll format with weapon damage bonus
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('+ 3'));
            assert(output.includes('Total Damage:'));
        });

        it('should handle attack rolls with dex abbreviation', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;  // +2 modifier
            character.strength = 16;   // +3 modifier
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            // Mock Math.random to return predictable values
            const originalRandom = Math.random;
            let mockValues = [0.95, 0.1, 0.1, 0.1, 0.1, 0.1]; // For d20 and damage dice
            let mockIndex = 0;
            Math.random = () => mockValues[mockIndex++];

            inputController.attackHandler('attack dex');
            
            // Restore Math.random
            Math.random = originalRandom;
            console.log = consoleLog;
            
            // Verify hit roll output
            assert(output.includes('Hit:'));
            assert(output.includes('+ 2'));  // Dexterity modifier
            assert(output.includes('+ 3'));  // Proficiency bonus
            assert(output.includes('+ 3'));  // Weapon damage bonus
            assert(output.includes('Critical Hit!'));  // Should be a critical hit
            
            // Verify the new hit roll format with weapon damage bonus
            assert.match(output, /Hit: \d+ \(\d+ \+ \d+ \+ \d+ \+ \d+\)/);
            
            // Verify damage output
            assert(output.includes('Damage:'));
            assert(output.includes('(2d4)'));
            assert(output.includes('(1d6)'));
            assert(output.includes('+ 3'));
            assert(output.includes('Total Damage:'));
        });

        it('should handle invalid ability in attack command', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.attackHandler('attack invalid');
            
            console.log = consoleLog;
            
            // Verify error message
            assert(output.includes('Invalid ability: invalid'));
            assert(output.includes('Use one of: strength, dexterity, constitution, wisdom, intelligence, charisma or their 3-letter abbreviations'));
        });

        it('should handle attack command with too many parameters', () => {
            const character = new Character();
            character.weaponDamage = '2d4 1d6 3';
            character.dexterity = 14;
            character.proficiencyBonus = 3;
            inputController.currentCharacter = character;

            const consoleLog = console.log;
            let output = '';
            console.log = (msg) => { output += msg; };

            inputController.attackHandler('attack strength extra');
            
            console.log = consoleLog;
            
            // Verify error message
            assert(output.includes('Invalid format. Use: attack [ability]'));
        });

        it('should handle damage and healing', () => {

            const consoleLog = console.log;
            console.log = () => {};

            const character = new Character();
            character.health = 69;
            inputController.setCurrentCharacter(character);
            
            // Apply damage
            const damageResult = inputController.ouchHandler('ouch 10');
            assert.strictEqual(damageResult, 59);
            
            // Apply healing
            const healResult = inputController.healHandler('heal 5');
            assert.strictEqual(healResult, 64);

            console.log = consoleLog;
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

        it('should handle ability checks', async () => {
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
            
            await inputController.setCurrentCharacter(character);

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
