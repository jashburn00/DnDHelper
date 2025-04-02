//DnD Helper v0.0.0 @jashburn00

const readline = require('readline');

let input = '';
let health = 69;
console.log('input command and args delimited by space\n');

const inputHandler = (inp) => {
	
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
		default:
			console.log('unrecognized command');
			break;

	}
}




//TODO

// dice 
function diceHandler(input){
	//
}

//attack
function attackHandler(input){
	let hit = Math.ceil(Math.random()*20) + 7;
	let fire = Math.ceil(Math.random()*8);
	let bludgeoning = Math.ceil(Math.random()*6);

	console.log(`\nHit: ${hit} (${hit+1} for spell) (${hit - 7})\nDamage: ${fire+bludgeoning+7} (${bludgeoning} bludgeoning ${fire} fire + 7)\n`);
}
	

//ouch
function ouchHandler(input){
	try{
		let vals = input.split(' ');
		health -= parseInt(vals[1]);
		console.log(`\nhealth remaining: ${health}\n`);
	} catch(e){
	}
}

//heal 
function healHandler(input){
	try{
		let vals = input.split(' ');
		health += parseInt(vals[1]);
		console.log(`\nhealth remaining: ${health}\n`);
	} catch(e){
	}
}

//check

//throw

//stats




const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
rl.on('line', inputHandler);


