//DnD Helper v0.0.0 @jashburn00

const readline = require('readline');
const Character = require('./character');
const fs = require('fs');
const path = require('path');

let input = '';
let currentCharacter = null;
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to log with extra newlines
function log(message, addNewlines = true) {
    if (addNewlines) {
        console.log('\n' + message + '\n');
    } else {
        console.log(message);
    }
}

async function setCurrentCharacter(character) {
    currentCharacter = character;
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
        let output = '';

        for (let i = 0; i < diceNotations.length; i++) {
            const notation = diceNotations[i];
            const [numDice, numSides] = notation.split('d').map(Number);

            if (isNaN(numDice) || isNaN(numSides) || numDice < 1 || numSides < 1) {
                log(`Invalid dice format: ${notation}. Use format: XdY`);
                return;
            }

            let total = 0;
            for (let j = 0; j < numDice; j++) {
                const roll = Math.floor(Math.random() * numSides) + 1;
                total += roll;
            }

            grandTotal += total;
            
            if (diceNotations.length === 1) {
                output = `${total} (${notation})\nTotal: ${total}`;
            } else {
                output += `${total} (${notation})`;
                if (i < diceNotations.length - 1) {
                    output += ' + ';
                }
            }
        }

        if (diceNotations.length > 1) {
            output += `\nTotal: ${grandTotal}`;
        }

        log(output);
        return output; // Return output for testing
    } catch (e) {
        log('Error rolling dice. Use format: dice XdY [XdY ...]');
        return null;
    }
}

//attack
function attackHandler(input) {

    try {
        if (!currentCharacter) {
            log('No character loaded. Use load <characterName> first.');
            return;
        }

        let vals = input.split(' ');
        if (vals.length > 2) {
            log('Invalid format. Use: attack [ability]');
            return;
        }

        // Default to dexterity if no ability is specified
        const abilityInput = vals.length === 2 ? vals[1].toLowerCase() : 'strength';
        
        // Map abbreviations to full ability names
        const abilityMap = {
            'str': 'strength',
            'dex': 'dexterity',
            'con': 'constitution',
            'int': 'intelligence',
            'wis': 'wisdom',
            'cha': 'charisma'
        };
        
        // Get the full ability name from the map or use the input directly
        const ability = abilityMap[abilityInput] || abilityInput;
        
        // Validate the ability
        const validAbilities = ['strength', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'charisma'];
        if (!validAbilities.includes(ability)) {
            log(`Invalid ability: ${abilityInput}. Use one of: ${validAbilities.join(', ')} or their 3-letter abbreviations`);
            return;
        }

        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = Math.floor((currentCharacter[ability] - 10) / 2);
        const proficiencyBonus = currentCharacter.proficiencyBonus;
        
        // Extract standalone numbers from weapon damage to determine enchantment bonus
        const weaponDamageParts = currentCharacter.weaponDamage.split(' ');
        let enchantmentBonus = 0;
        let enchantmentBonusExplanation = '';
        
        // Find the last trailing standalone number for enchantment bonus
        for (let i = weaponDamageParts.length - 1; i >= 0; i--) {
            const part = weaponDamageParts[i];
            if (!part.includes('d') && !isNaN(parseInt(part))) {
                enchantmentBonus = parseInt(part);
                enchantmentBonusExplanation = part;
                break;
            }
        }
        
        const total = roll + modifier + proficiencyBonus + enchantmentBonus;
        
        let output = '';
        if (roll === 20) {
            output = 'Critical Hit! ';
        }
        
        // Include enchantment bonus in the output if there is any
        if (enchantmentBonus > 0) {
            output += `Hit: ${total} (${roll} + ${modifier} + ${proficiencyBonus} + ${enchantmentBonus})\n`;
        } else {
            output += `Hit: ${total} (${roll} + ${modifier} + ${proficiencyBonus})\n`;
        }
        
        // Calculate damage
        const damage = currentCharacter.weaponDamage.split(' ');
        let totalDamage = 0;
        let damageOutput = 'Damage: ';
        
        // Track dice rolls and flat bonuses separately
        let diceRolls = [];
        let flatBonuses = [];

        modifier > 0 ? flatBonuses.push(modifier) : null;
        modifier > 0 ? totalDamage += modifier : null;
        
        for (let i = 0; i < damage.length; i++) {
            if (damage[i].includes('d')) {
                const [num, sides] = damage[i].split('d');
                let rollTotal = 0;
                for (let j = 0; j < num; j++) {
                    // On critical hit, roll damage dice twice
                    const diceRoll = Math.floor(Math.random() * sides) + 1;
                    rollTotal += roll === 20 ? diceRoll * 2 : diceRoll;
                }
                totalDamage += rollTotal;
                diceRolls.push({ total: rollTotal, notation: damage[i] });
            } else {
                const bonus = parseInt(damage[i]);
                totalDamage += bonus;
                flatBonuses.push(bonus);
            }
        }
        
        // Format the damage output according to the requested convention
        if (diceRolls.length > 0) {
            // Add the first dice roll
            damageOutput += `${diceRolls[0].total} (${diceRolls[0].notation})`;
            
            // Add additional dice rolls if any
            for (let i = 1; i < diceRolls.length; i++) {
                damageOutput += ` + ${diceRolls[i].total} (${diceRolls[i].notation})`;
            }
            
            // Add flat bonuses individually if any
            for (let i = 0; i < flatBonuses.length; i++) {
                damageOutput += ` + ${flatBonuses[i]}`;
            }
        } else if (flatBonuses.length > 0) {
            // If there are only flat bonuses
            damageOutput += `${flatBonuses[0]}`;
            for (let i = 1; i < flatBonuses.length; i++) {
                damageOutput += ` + ${flatBonuses[i]}`;
            }
        }
        
        output += `${damageOutput}\nTotal Damage: ${totalDamage}\n`;
        log(output, true);
        return output; // Return output for testing
    } catch(e) {
        log('Error during attack: ' + e.message);
        return null;
    }
}

//ouch
function ouchHandler(input) {
    try {
        if (!currentCharacter) {
            log('No character loaded. Use load <characterName> first.');
            return;
        }
        
        let vals = input.split(' ');
        const damage = parseInt(vals[1]);
        if (isNaN(damage)) {
            log('Invalid damage amount. Use: ouch <amount>');
            return;
        }
        currentCharacter.health -= damage;
        log(`health remaining: ${currentCharacter.health}`);
        return currentCharacter.health;
    } catch(e) {
        log('Invalid damage amount. Use: ouch <amount>');
        return null;
    }
}

//heal 
function healHandler(input) {
    try {
        if (!currentCharacter) {
            log('No character loaded. Use load <characterName> first.');
            return;
        }
        
        let vals = input.split(' ');
        const heal = parseInt(vals[1]);
        if (isNaN(heal)) {
            log('Invalid heal amount. Use: heal <amount>');
            return;
        }
        currentCharacter.health += heal;
        log(`health remaining: ${currentCharacter.health}`);
        return currentCharacter.health;
    } catch(e) {
        log('Invalid heal amount. Use: heal <amount>');
        return null;
    }
}

//check
function checkHandler(input) {
    try {
        if (!currentCharacter) {
            log('No character loaded. Use load <characterName> first.');
            return;
        }

        let vals = input.split(' ');
        if (vals.length !== 2) {
            log('Invalid format. Use: check <skill>');
            return;
        }

        const skill = vals[1].toLowerCase();  // Convert to lowercase immediately
        const skillMap = {
            'athletics': 'strength',
            'acrobatics': 'dexterity',
            'sleight of hand': 'dexterity',
            'stealth': 'dexterity',
            'arcana': 'intelligence',
            'history': 'intelligence',
            'investigation': 'intelligence',
            'nature': 'intelligence',
            'religion': 'intelligence',
            'animal handling': 'wisdom',
            'insight': 'wisdom',
            'medicine': 'wisdom',
            'perception': 'wisdom',
            'survival': 'wisdom',
            'deception': 'charisma',
            'intimidation': 'charisma',
            'performance': 'charisma',
            'persuasion': 'charisma'
        };

        const abilityScore = currentCharacter[skillMap[skill]];
        if (!abilityScore) {
            log('Invalid skill check');
            return;
        }

        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = Math.floor((abilityScore - 10) / 2);
        let total = roll + modifier;

        let output = `${skill} check: ${roll} + ${modifier}`;
        
        // Always show proficiency first if the character has it
        if (currentCharacter.hasProficiency(skill)) {
            total += 2;
            output += ' + 2 (Proficiency)';
        }
        
        // Then show expertise if they have it
        if (currentCharacter.hasExpertise(skill)) {
            total += 2;
            output += ' + 2 (Expertise)';
        }
        
        output += `\nTotal: ${total}\n`;
        log(output, true);
        return output; // Return output for testing
    } catch(e) {
        log('Error during skill check: ' + e.message);
        return null;
    }
}

//throw
function throwHandler(input) {
    try {
        if (!currentCharacter) {
            log('No character loaded. Use "load <characterName>" or "create <characterName>" first.');
            return;
        }

        let vals = input.split(' ');
        if (vals.length !== 2) {
            log('Invalid format. Use: throw <ability>');
            return;
        }

        const stat = vals[1].toLowerCase();
        const statMap = {
            'str': 'strength',
            'dex': 'dexterity',
            'con': 'constitution',
            'int': 'intelligence',
            'wis': 'wisdom',
            'cha': 'charisma'
        };

        const fullStat = statMap[stat] || stat;
        const abilityScore = currentCharacter[fullStat];

        if (!abilityScore) {
            log('Invalid ability score. Use: Strength, Dexterity, Constitution, Intelligence, Wisdom, or Charisma (or their 3-letter abbreviations)');
            return;
        }

        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = Math.floor((abilityScore - 10) / 2);
        const total = roll + modifier;

        log(`${fullStat.charAt(0).toUpperCase() + fullStat.slice(1)} saving throw: ${total} (${roll} + ${modifier})`);
    } catch(e) {
        log('Error during saving throw: ' + e.message);
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
            return null;
        }

        const characterName = parts[1];
        // Use current working directory for PKG compatibility
        const filePath = path.join(process.cwd(), 'characters', `${characterName}.json`);

        if (!fs.existsSync(filePath)) {
            log(`Character "${characterName}" not found.`);
            return null;
        }

        const characterData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const character = new Character();
        
        // Set all properties from the loaded data
        Object.keys(characterData).forEach(key => {
            if (key === 'expertise' || key === 'proficiency') {
                // Handle Map objects
                const map = new Map();
                characterData[key].forEach(skill => map.set(skill.toLowerCase(), true));
                character[`_${key}`] = map;
            } else {
                character[`_${key}`] = characterData[key];
            }
        });

        currentCharacter = character;
        log(`Character "${characterName}" loaded successfully.`);
        return character;
    } catch (e) {
        log('Error loading character: ' + e.message);
        return null;
    }
}

//save
async function saveHandler(input) {
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
        // Use current working directory for PKG compatibility
        const charactersDir = path.join(process.cwd(), 'characters');
        const filePath = path.join(charactersDir, `${characterName}.json`);

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
            health: currentCharacter.health,
            expertise: Array.from(currentCharacter.expertise.keys()),
            proficiency: Array.from(currentCharacter.proficiency.keys()),
            proficiencyBonus: currentCharacter.proficiencyBonus
        };

        // Create characters directory if it doesn't exist
        if (!fs.existsSync(charactersDir)) {
            fs.mkdirSync(charactersDir);
        }

        // Write character data to file
        await fs.promises.writeFile(filePath, JSON.stringify(characterData, null, 2));
        log(`Character "${characterName}" saved successfully.`);
        
        // Return the saved data for verification
        return characterData;
    } catch (e) {
        log('Error saving character: ' + e.message);
        return null;
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
        // Use current working directory for PKG compatibility
        const filePath = path.join(process.cwd(), 'characters', `${characterName}.json`);

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

// Helper function to validate skills
function validateSkills(skills) {
    const validSkills = [
        'athletics',
        'acrobatics',
        'sleight of hand',
        'stealth',
        'arcana',
        'history',
        'investigation',
        'nature',
        'religion',
        'animal handling',
        'insight',
        'medicine',
        'perception',
        'survival',
        'deception',
        'intimidation',
        'performance',
        'persuasion'
    ];

    const invalidSkills = skills.filter(skill => !validSkills.includes(skill.toLowerCase()));
    return {
        isValid: invalidSkills.length === 0,
        invalidSkills
    };
}

// Helper function to ask for skills with validation
async function askForSkills(prompt) {
    let skills = [];
    let isValid = false;
    
    while (!isValid) {
        const input = await askQuestion(prompt);
        skills = input.split(',').map(s => s.trim());
        const validation = validateSkills(skills);
        
        if (validation.isValid) {
            isValid = true;
        } else {
            log(`Invalid skills: ${validation.invalidSkills.join(', ')}`);
            log('Please try again with valid skills.');
        }
    }
    
    return skills;
}

//create
async function createHandler(input) {
    try {
        const parts = input.split(' ');
        if (parts.length !== 2) {
            log('Invalid create format. Use: create <characterName>');
            return null;
        }

        const characterName = parts[1];
        // Use current working directory for PKG compatibility
        const filePath = path.join(process.cwd(), 'characters', `${characterName}.json`);

        if (fs.existsSync(filePath)) {
            log(`Character "${characterName}" already exists. Use load to load it or choose a different name.`);
            return null;
        }

        const character = new Character();
        character._name = characterName;

        // Get ability scores
        log('Enter ability scores (1-30):');
        character.strength = parseInt(await askQuestion('Strength: '));
        character.dexterity = parseInt(await askQuestion('Dexterity: '));
        character.constitution = parseInt(await askQuestion('Constitution: '));
        character.intelligence = parseInt(await askQuestion('Intelligence: '));
        character.wisdom = parseInt(await askQuestion('Wisdom: '));
        character.charisma = parseInt(await askQuestion('Charisma: '));

        // Get proficiencies with validation
        log('Enter skills you are proficient in (comma-separated):');
        const proficiencies = await askForSkills('Proficiencies: ');
        proficiencies.forEach(skill => character.addProficiency(skill));

        // Get expertise with validation
        log('Enter skills you have expertise in (comma-separated):');
        const expertises = await askForSkills('Expertise: ');
        expertises.forEach(skill => character.addExpertise(skill));

        // Get weapon and armor
        character.weaponDamage = await askQuestion('\nEnter weapon damage (e.g., 2d6 1d4 3): ');
        character.armorClass = parseInt(await askQuestion('Enter armor class: '));
        character.health = parseInt(await askQuestion('Enter health: '));
        
        // Get proficiency bonus
        character.proficiencyBonus = parseInt(await askQuestion('Enter proficiency bonus (0-6): '));

        currentCharacter = character;
        log(`Character "${characterName}" created successfully.`);
        return character;
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
    setCurrentCharacter
}; 