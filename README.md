# DnD Helper

A command-line tool for Dungeons & Dragons that helps manage character sheets, perform dice rolls, and handle combat mechanics.

## Features

- Character creation and management
- Ability score tracking
- Proficiency and expertise management
- Dice rolling system
- Combat mechanics (attack rolls, damage calculation)
- Character file saving and loading
- Health tracking

## Installation 
*you can ignore this part if you downloaded one of the executable files*

**Prerequisites:**
- Node.js (version 14 or higher)

1. Clone the repository:
```bash
$ git clone https://github.com/jashburn00/DnDHelper.git
$ cd DnDHelper
```

2. Install dependencies:
```bash
$ npm install
```

3. Start the application:
```bash
$ npm start
```

## Usage

### Character Creation Example

Here's an example of creating a new character named "Gandalf":

1. Start the application and enter the following commands:
```
create Gandalf
```

2. When prompted, enter the character's ability scores:
```
Strength: 10
Dexterity: 14
Constitution: 12
Intelligence: 16
Wisdom: 15
Charisma: 13
```

3. Enter the character's proficiencies (comma-separated):
```
Skills: Arcana, History, Insight, Investigation, Perception
```

4. Enter the character's expertise (comma-separated):
```
Expertise: Arcana, History
```

5. Set the character's weapon and armor:
```
Weapon Damage: 1d8 1d4 1    #add extra dice or integers
Armor Class: 12
```

6. Save the character:
```
save Gandalf
```

Now you can use the character in your game:
```
stats          # View character stats
attack         # Make an attack roll
check arcana   # Make an Arcana check
```
### Dice Rolling

Roll dice using the format XdY (repeatable):
```
dice 1d20      # Roll one twenty-sided die
dice 2d6 2d8   # Roll two six-sided dice and two d8
dice 1d6 9d5 2d10 1d20 5d6 3d6
```

### Character Management

Create a new character:
```
create <characterName>
```

Load an existing character:
```
load <characterName>
```

Save a character:
```
save <characterName>
```

Delete a character:
```
delete <characterName>
```

View character stats:
```
stats
```

### Combat

Make an attack roll:
```
attack
```

Take damage:
```
ouch 10     # Take 10 points of damage
```

Heal damage:
```
heal 5      # Heal 5 hit points
```

### Skill Checks

Make a skill check:
```
check acrobatics
check Stealth
check INTIMIDATION
```

Make a saving throw:
```
throw constitution
throw wisdom
throw STR
throw wis
```

## Development

Run tests:
```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 