# DnD Helper - Easy Setup for Non-Tech Friends

This guide is for friends who want to use the DnD Helper tool without needing to install Node.js or understand programming.

## What You Get

A simple command-line tool that helps you:
- Create and manage D&D characters
- Roll dice
- Make skill checks and saving throws
- Track combat (attacks, damage, healing)
- Save/load character sheets

## Download & Setup

### For Windows Users:
1. Download the file: `dnd-helper-win.exe`
2. Create a new folder on your Desktop called "DnD Helper"
3. Move the `dnd-helper-win.exe` file into this folder
4. **Important**: Always run the program from inside this folder
5. Double-click the file to run it!

### For Mac Users:
1. Download the file: `dnd-helper-macos`
2. Create a new folder on your Desktop called "DnD Helper"
3. Move the `dnd-helper-macos` file into this folder
4. **Important**: Always run the program from inside this folder
5. Right-click the file and select "Open" (you may need to confirm it's safe to run)

## How to Use

When you run the program, you'll see a prompt like this:
```
Enter Command: 
```

### Quick Start - Create Your First Character

1. Type: `create Gandalf` (replace "Gandalf" with your character's name)
2. Enter your character's ability scores when prompted:
   - Strength: 10
   - Dexterity: 14
   - Constitution: 12
   - Intelligence: 16
   - Wisdom: 15
   - Charisma: 13

3. Enter skills (comma-separated): `Arcana, History, Insight`
4. Enter expertise (comma-separated): `Arcana, History`
5. Set weapon damage: `1d8` (or whatever your weapon does)
6. Set armor class: `12`
7. Set health: `25` (your character's hit points)
8. Set proficiency bonus: `2` (usually 2-6 based on level)
9. Save your character: `save Gandalf`

### Common Commands

- `stats` - View your character's information
- `dice 1d20` - Roll a 20-sided die
- `dice 2d6` - Roll two 6-sided dice
- `attack` - Make an attack roll
- `check perception` - Make a Perception skill check
- `throw constitution` - Make a Constitution saving throw
- `ouch 5` - Take 5 points of damage
- `heal 3` - Heal 3 hit points
- `load CharacterName` - Load a saved character
- `exit` - Quit the program

### Tips

- Character names are case-sensitive
- Skill names can be typed in any case (perception, Perception, PERCEPTION all work)
- **The program creates a "characters" folder where you run it to save character files**
- Always run the program from the same folder to access your saved characters
- If you mess up, just type `exit` and start over

## Troubleshooting

**Windows**: If Windows says the file is unsafe, click "More info" then "Run anyway"

**Mac**: If Mac won't let you run it, go to System Preferences > Security & Privacy > General and click "Open Anyway"

**Can't find saved characters**: Make sure you're running the program from the same folder where you saved them

## Need Help?

The tool has built-in examples. Try these commands to see how things work:
- `create TestCharacter`
- `stats`
- `dice 1d20`
- `attack`

Have fun adventuring! 🎲⚔️
