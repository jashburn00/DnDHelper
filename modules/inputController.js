//DnD Helper v0.0.0 @jashburn00

const readline = require('readline');
const Character = require('./character');
const fs = require('fs');
const path = require('path');

let health = 69;
let input = '';
let currentCharacter = null;
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to log with extra newlines
function log(message) {
    console.log('\n' + message + '\n');
}

// dice 
function diceHandler(input) {
    try {
        const parts = input.split(' ');
        if (parts.length < 2) {
            log('Invalid dice format. Use: dice XdY [XdY ...]');
            return;
        }

        // Remove the 'dice' command and process all remaining parts as dice notations
        const diceNotations = parts.slice(1);
        let grandTotal = 0;
        let allRolls = [];
        let output = '';

        for (const notation of diceNotations) {
            const [numDice, numSides] = notation.split('d').map(Number);

            if (isNaN(numDice) || isNaN(numSides) || numDice < 1 || numSides < 1) {
                log(`Invalid dice format: ${notation}. Use format: XdY`);
                return;
            }

            let total = 0;
            const rolls = [];
            for (let i = 0; i < numDice; i++) {
                const roll = Math.floor(Math.random() * numSides) + 1;
                rolls.push(roll);
                total += roll;
            }

            grandTotal += total;
            allRolls.push(...rolls);
            
            if (diceNotations.length === 1) {
                // Single dice notation format
                output = `Rolls: ${rolls.join(', ')}\nTotal: ${total}`;
            } else {
                // Multiple dice notations format
                output += `${notation}: ${rolls.join(', ')} (Total: ${total})\n`;
            }
        }

        if (diceNotations.length > 1) {
            output += `Grand Total: ${grandTotal}`;
        }

        log(output);
    } catch (e) {
        log('Error rolling dice. Use format: dice XdY [XdY ...]');
    }
}

//attack
function attackHandler(input) {
    if (!currentCharacter) {
        log('No character loaded. Create a character first.');
        return;
    }

    const hit = Math.ceil(Math.random() * 20) + 7;
    const damage = currentCharacter.weaponDamage;
    const [numDice, numSides, bonus] = damage.split(/[d+]/).map(Number);
    
    let totalDamage = 0;
    for (let i = 0; i < numDice; i++) {
        totalDamage += Math.ceil(Math.random() * numSides);
    }
    totalDamage += bonus || 0;

    log(`Hit: ${hit} (${hit-7} + 7)\nDamage: ${totalDamage} (${damage})`);
}

//ouch
function ouchHandler(input) {
    try {
        let vals = input.split(' ');
        health -= parseInt(vals[1]);
        log(`health remaining: ${health}`);
    } catch(e) {
        log('Invalid damage amount. Use: ouch <amount>');
    }
}

//heal 
function healHandler(input) {
    try {
        let vals = input.split(' ');
        health += parseInt(vals[1]);
        log(`health remaining: ${health}`);
    } catch(e) {
        log('Invalid heal amount. Use: heal <amount>');
    }
}

//check
function checkHandler(input) {
    if (!currentCharacter) {
        log('No character loaded. Create a character first.');
        return;
    }

    try {
        const skill = input.split(' ')[1].toLowerCase();
        const abilityScores = {
            'strength': currentCharacter.strength,
            'dexterity': currentCharacter.dexterity,
            'constitution': currentCharacter.constitution,
            'intelligence': currentCharacter.intelligence,
            'wisdom': currentCharacter.wisdom,
            'charisma': currentCharacter.charisma
        };

        if (abilityScores[skill]) {
            const modifier = currentCharacter.getAbilityModifier(abilityScores[skill]);
            const isProficient = currentCharacter.hasProficiency(skill);
            const isExpert = currentCharacter.hasExpertise(skill);
            const roll = Math.ceil(Math.random() * 20);
            let total = roll + modifier;

            if (isProficient) total += 2;
            if (isExpert) total += 2;

            log(`Roll: ${roll}\nModifier: ${modifier}${isProficient ? '\nProficiency: +2' : ''}${isExpert ? '\nExpertise: +2' : ''}\nTotal: ${total}`);
        } else {
            log('Invalid skill. Use: check <skill>');
        }
    } catch(e) {
        log('Invalid check format. Use: check <skill>');
    }
}

//throw
function throwHandler(input) {
    if (!currentCharacter) {
        log('No character loaded. Create a character first.');
        return;
    }

    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid throw format. Use: throw <skill>');
            return;
        }

        const skill = parts[1].toLowerCase();
        if (currentCharacter.hasProficiency(skill)) {
            const abilityScores = {
                'strength': currentCharacter.strength,
                'dexterity': currentCharacter.dexterity,
                'constitution': currentCharacter.constitution,
                'intelligence': currentCharacter.intelligence,
                'wisdom': currentCharacter.wisdom,
                'charisma': currentCharacter.charisma
            };

            if (abilityScores[skill]) {
                const modifier = currentCharacter.getAbilityModifier(abilityScores[skill]);
                const roll = Math.ceil(Math.random() * 20);
                const total = roll + modifier + 2; // +2 for proficiency

                log(`Roll: ${roll}\nModifier: ${modifier}\nProficiency: +2\nTotal: ${total}`);
            } else {
                log('Invalid skill. Use: throw <skill>');
            }
        } else {
            log('You are not proficient in that skill.');
        }
    } catch(e) {
        log('Invalid throw format. Use: throw <skill>');
    }
}

//stats
function statsHandler() {
    if (!currentCharacter) {
        log('No character loaded. Create a character first.');
        return;
    }
    console.log('\n');
    currentCharacter.display();
    console.log('\n');
}

//load
async function loadHandler(input) {
    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid load format. Use: load <characterName>');
            return;
        }

        const characterName = parts[1];
        const filePath = path.join(__dirname, '..', 'characters', `${characterName}.json`);

        if (!fs.existsSync(filePath)) {
            log(`Character "${characterName}" not found.`);
            return;
        }

        const characterData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        currentCharacter = new Character();
        
        // Set all properties from the loaded data
        Object.keys(characterData).forEach(key => {
            if (key === 'expertise' || key === 'proficiency') {
                // Handle Map objects
                const map = new Map();
                characterData[key].forEach(skill => map.set(skill, true));
                currentCharacter[`_${key}`] = map;
            } else {
                currentCharacter[`_${key}`] = characterData[key];
            }
        });

        log(`Character "${characterName}" loaded successfully.`);
        return currentCharacter;
    } catch (e) {
        log('Error loading character: ' + e.message);
        return null;
    }
}

//save
function saveHandler(input) {
    if (!currentCharacter) {
        log('No character loaded to save.');
        return;
    }

    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid save format. Use: save <characterName>');
            return;
        }

        const characterName = parts[1];
        const filePath = path.join(__dirname, '..', 'characters', `${characterName}.json`);

        // Convert character data to a plain object
        const characterData = {
            strength: currentCharacter.strength,
            dexterity: currentCharacter.dexterity,
            constitution: currentCharacter.constitution,
            wisdom: currentCharacter.wisdom,
            intelligence: currentCharacter.intelligence,
            charisma: currentCharacter.charisma,
            weaponDamage: currentCharacter.weaponDamage,
            armorClass: currentCharacter.armorClass,
            expertise: Array.from(currentCharacter.expertise.keys()),
            proficiency: Array.from(currentCharacter.proficiency.keys())
        };

        // Create characters directory if it doesn't exist
        const charactersDir = path.join(__dirname, '..', 'characters');
        if (!fs.existsSync(charactersDir)) {
            fs.mkdirSync(charactersDir);
        }

        // Write character data to file
        fs.writeFileSync(filePath, JSON.stringify(characterData, null, 2));
        log(`Character "${characterName}" saved successfully.`);
    } catch (e) {
        log('Error saving character: ' + e.message);
    }
}

//delete
async function deleteHandler(input) {
    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid delete format. Use: delete <characterName>');
            return;
        }

        const characterName = parts[1];
        const filePath = path.join(__dirname, '..', 'characters', `${characterName}.json`);

        if (!fs.existsSync(filePath)) {
            log(`Character "${characterName}" not found.`);
            return;
        }

        // Ask for confirmation
        const answer = await new Promise((resolve) => {
            rl.question(`\nAre you sure you want to delete character "${characterName}"? (yes/no): `, resolve);
        });

        if (answer.toLowerCase() === 'yes') {
            fs.unlinkSync(filePath);
            log(`Character "${characterName}" deleted successfully.`);
            
            // If the deleted character was the current character, clear it
            if (currentCharacter && currentCharacter._name === characterName) {
                currentCharacter = null;
            }
        } else {
            log('Deletion cancelled.');
        }
    } catch (e) {
        log('Error deleting character: ' + e.message);
    }
}

//create
async function createHandler(input) {
    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid create format. Use: create <characterName>');
            return;
        }

        const characterName = parts[1];
        const filePath = path.join(__dirname, '..', 'characters', `${characterName}.json`);

        if (fs.existsSync(filePath)) {
            log(`Character "${characterName}" already exists. Use load to load it or choose a different name.`);
            return;
        }

        currentCharacter = new Character();
        currentCharacter._name = characterName;

        // Get ability scores
        log('Enter ability scores (1-30):');
        currentCharacter.strength = parseInt(await askQuestion('Strength: '));
        currentCharacter.dexterity = parseInt(await askQuestion('Dexterity: '));
        currentCharacter.constitution = parseInt(await askQuestion('Constitution: '));
        currentCharacter.intelligence = parseInt(await askQuestion('Intelligence: '));
        currentCharacter.wisdom = parseInt(await askQuestion('Wisdom: '));
        currentCharacter.charisma = parseInt(await askQuestion('Charisma: '));

        // Get proficiencies
        log('Enter skills you are proficient in (comma-separated):');
        const skills = await askQuestion('Skills: ');
        skills.split(',').forEach(skill => {
            currentCharacter.addProficiency(skill.trim());
        });

        // Get expertise
        log('Enter skills you have expertise in (comma-separated):');
        const expertSkills = await askQuestion('Expertise: ');
        expertSkills.split(',').forEach(skill => {
            currentCharacter.addExpertise(skill.trim());
        });

        // Get weapon and armor
        currentCharacter.weaponDamage = await askQuestion('\nEnter weapon damage (e.g., 1d8+3): ');
        currentCharacter.armorClass = parseInt(await askQuestion('Enter armor class: '));

        log(`Character "${characterName}" created successfully.`);
        return currentCharacter;
    } catch (e) {
        log('Error creating character: ' + e.message);
        return null;
    }
}

// Helper function for asking questions
async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

function inputHandler(inp) {
    input = inp.split(' ')[0];

    switch (input) {
        case 'exit':
            process.exit();
            break;
        case 'dice':
            diceHandler(inp);
            break;
        case 'attack':
            attackHandler(inp);
            break;
        case 'ouch':
            ouchHandler(inp);
            break;
        case 'heal':
            healHandler(inp);
            break;
        case 'check':
            checkHandler(inp);
            break;
        case 'throw':
            throwHandler(inp);
            break;
        case 'stats':
            statsHandler();
            break;
        case 'create':
            createHandler(inp);
            break;
        case 'load':
            loadHandler(inp);
            break;
        case 'save':
            saveHandler(inp);
            break;
        case 'delete':
            deleteHandler(inp);
            break;
        default:
            log('unrecognized command');
            break;
    }
}

function startInput() {
    log('input command and args delimited by space');
    rl.on('line', inputHandler);
}

module.exports = {
    startInput,
    rl,
    diceHandler,
    attackHandler,
    ouchHandler,
    healHandler,
    checkHandler,
    throwHandler,
    statsHandler,
    createHandler,
    loadHandler,
    saveHandler,
    deleteHandler,
    health
}; 