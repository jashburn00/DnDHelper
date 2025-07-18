//DnD Helper v0.0.0 @jashburn00

const readline = require('readline');

class Character {
    constructor() {
        this._strength = 10;
        this._dexterity = 10;
        this._constitution = 10;
        this._wisdom = 10;
        this._intelligence = 10;
        this._charisma = 10;
        this._expertise = new Map(); // Map of skill names to boolean
        this._proficiency = new Map(); // Map of skill names to boolean
        this._weaponDamage = '1d8';
        this._armorClass = 10;
        this._health = 10; // Default health
        this._proficiencyBonus = 2; // Default proficiency bonus
    }

    // Strength
    get strength() {
        return this._strength;
    }

    set strength(value) {
        if (value >= 1 && value <= 30) {
            this._strength = value;
        } else {
            throw new Error('Strength must be between 1 and 30');
        }
    }

    // Dexterity
    get dexterity() {
        return this._dexterity;
    }

    set dexterity(value) {
        if (value >= 1 && value <= 30) {
            this._dexterity = value;
        } else {
            throw new Error('Dexterity must be between 1 and 30');
        }
    }

    // Constitution
    get constitution() {
        return this._constitution;
    }

    set constitution(value) {
        if (value >= 1 && value <= 30) {
            this._constitution = value;
        } else {
            throw new Error('Constitution must be between 1 and 30');
        }
    }

    // Wisdom
    get wisdom() {
        return this._wisdom;
    }

    set wisdom(value) {
        if (value >= 1 && value <= 30) {
            this._wisdom = value;
        } else {
            throw new Error('Wisdom must be between 1 and 30');
        }
    }

    // Intelligence
    get intelligence() {
        return this._intelligence;
    }

    set intelligence(value) {
        if (value >= 1 && value <= 30) {
            this._intelligence = value;
        } else {
            throw new Error('Intelligence must be between 1 and 30');
        }
    }

    // Charisma
    get charisma() {
        return this._charisma;
    }

    set charisma(value) {
        if (value >= 1 && value <= 30) {
            this._charisma = value;
        } else {
            throw new Error('Charisma must be between 1 and 30');
        }
    }

    // Expertise
    get expertise() {
        return this._expertise;
    }

    addExpertise(skill) {
        const lowerSkill = skill.toLowerCase();
        this._expertise.set(lowerSkill, true);
        // Having expertise implies having proficiency
        this._proficiency.set(lowerSkill, true);
    }

    removeExpertise(skill) {
        this._expertise.delete(skill.toLowerCase());
    }

    hasExpertise(skill) {
        return this._expertise.has(skill.toLowerCase());
    }

    // Proficiency
    get proficiency() {
        return this._proficiency;
    }

    addProficiency(skill) {
        this._proficiency.set(skill.toLowerCase(), true);
    }

    removeProficiency(skill) {
        const lowerSkill = skill.toLowerCase();
        // Don't remove proficiency if the character has expertise
        if (!this.hasExpertise(lowerSkill)) {
            this._proficiency.delete(lowerSkill);
        }
    }

    hasProficiency(skill) {
        return this._proficiency.has(skill.toLowerCase());
    }

    // Weapon Damage
    get weaponDamage() {
        return this._weaponDamage;
    }

    set weaponDamage(value) {
        // Split the weapon damage into individual notations
        const notations = value.split(' ');
        for (const notation of notations) {
            // Check if it's a dice notation or a standalone number
            if (!/^\d+d\d+$/.test(notation) && !/^\d+$/.test(notation)) {
                throw new Error('Invalid weapon damage format. Use format: XdY or standalone numbers separated by spaces (e.g., "2d4 1d6 3")');
            }
        }
        this._weaponDamage = value;
    }

    // Armor Class
    get armorClass() {
        return this._armorClass;
    }

    set armorClass(value) {
        if (value >= 0) {
            this._armorClass = value;
        } else {
            throw new Error('Armor class cannot be negative');
        }
    }

    // Health
    get health() {
        return this._health;
    }

    set health(value) {
        if (value >= 0) {
            this._health = value;
        } else {
            throw new Error('Health cannot be negative');
        }
    }

    // Proficiency Bonus
    get proficiencyBonus() {
        return this._proficiencyBonus;
    }

    set proficiencyBonus(value) {
        if (value >= 0 && value <= 6) {
            this._proficiencyBonus = value;
        } else {
            throw new Error('Proficiency Bonus must be between 0 and 6');
        }
    }

    // Helper method to get ability modifier
    getAbilityModifier(abilityScore) {
        return Math.floor((abilityScore - 10) / 2);
    }

    // Helper method to get saving throw modifier
    getSavingThrowModifier(abilityScore, isProficient = false) {
        const baseModifier = this.getAbilityModifier(abilityScore);
        return isProficient ? baseModifier + 2 : baseModifier; // Using base proficiency of 2
    }

    // Static method to create a character with user input
    static async create() {
        const character = new Character();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question) => {
            return new Promise((resolve) => {
                rl.question(question, (answer) => {
                    resolve(answer);
                });
            });
        };

        try {
            // Get ability scores
            console.log('\nEnter ability scores (1-30):');
            character.strength = parseInt(await askQuestion('Strength: '));
            character.dexterity = parseInt(await askQuestion('Dexterity: '));
            character.constitution = parseInt(await askQuestion('Constitution: '));
            character.intelligence = parseInt(await askQuestion('Intelligence: '));
            character.wisdom = parseInt(await askQuestion('Wisdom: '));
            character.charisma = parseInt(await askQuestion('Charisma: '));

            // Get proficiencies
            console.log('\nEnter skills you are proficient in (comma-separated):');
            const skills = await askQuestion('Skills: ');
            skills.split(',').forEach(skill => {
                character.addProficiency(skill.trim());
            });

            // Get expertise
            console.log('\nEnter skills you have expertise in (comma-separated):');
            const expertSkills = await askQuestion('Expertise: ');
            expertSkills.split(',').forEach(skill => {
                character.addExpertise(skill.trim());
            });

            // Get weapon and armor
            character.weaponDamage = await askQuestion('\nEnter weapon damage (e.g., 1d8+3): ');
            character.armorClass = parseInt(await askQuestion('Enter armor class: '));

            return character;
        } finally {
            rl.close();
        }
    }

    // Method to display character information
    display() {
        console.log('\nCharacter Stats:');
        console.log('----------------');
        console.log(`Strength: ${this.strength} (${this.getAbilityModifier(this.strength)})`);
        console.log(`Dexterity: ${this.dexterity} (${this.getAbilityModifier(this.dexterity)})`);
        console.log(`Constitution: ${this.constitution} (${this.getAbilityModifier(this.constitution)})`);
        console.log(`Intelligence: ${this.intelligence} (${this.getAbilityModifier(this.intelligence)})`);
        console.log(`Wisdom: ${this.wisdom} (${this.getAbilityModifier(this.wisdom)})`);
        console.log(`Charisma: ${this.charisma} (${this.getAbilityModifier(this.charisma)})`);
        console.log(`Proficiency Bonus: +${this.proficiencyBonus}`);
        
        console.log('\nProficiencies:');
        this.proficiency.forEach((_, skill) => console.log(`- ${skill}`));
        
        console.log('\nExpertise:');
        this.expertise.forEach((_, skill) => console.log(`- ${skill}`));
        
        console.log(`\nWeapon Damage: ${this.weaponDamage}`);
        console.log(`Armor Class: ${this.armorClass}`);
        console.log(`Health: ${this.health}`);
    }
}

module.exports = Character;
