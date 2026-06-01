/* This is a demo of a TUI/CLI app that doesn't let entering any character other than specific ones.
	Enter these in the following OS and terminals to trigger this script:
	Windows - PowerShell: node "$Home/Path to where you saved this script/UnbufferedInputRawMode.js"
	Android - Termux: node "/sdcard/Path to where you saved this script/UnbufferedInputRawMode.js"
*/

'use strict'

const fs=require('fs'),stdin=process.stdin,stdout=process.stdout
,options=[
	{label:'re-index',chars:['#'],msg:'\n\x1b[?25hPlease enter the name or index number of the profile you wish to change the index number of, followed by the new index number, separated by a space OR enter 0 to quit. E.g. "Google Drive" 7 OR 5 12...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'List/ls',chars:['l'],msg:'\n\x1b[?25hPlease enter the name, index number or path of the profile you wish to see its files and folders listed OR enter 0 to quit. E.g. GoogleDrive OR 7 OR "Google Drive/Documents" OR 7/Documents...\n',func:function(){stdout.write(this.msg+fs.readdirSync('.').join('\n')+'\n');process.exit()}},
	{label:'Tree',chars:['t'],msg:'\n\x1b[?25hPlease enter the name, index number or path of the profile you wish to see a tree of, optionally followed by an integer number of --depth, separated by a space OR enter 0 to quit. E.g. "Google Drive" 2 OR 7/Documents...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Delete',chars:['d'],msg:'\n\x1b[?25hPlease enter the names, index numbers and/or paths of the profiles, files and folders you wish to delete, separated by spaces OR enter 0 to quit. E.g. 27 box 5/Note.txt 14 "Google Drive/Documents"...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Fav★',chars:['f'],msg:'\n\x1b[?25hPlease enter the names and/or index numbers of the profiles you wish to toggle their ★, separated by spaces OR enter 0 to quit. E.g. 27 box 5 14 "Google Drive"...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Copy',chars:['c'],msg:'\n\x1b[?25hPlease enter the names and/or index numbers of the profiles you wish to copy separated by spaces OR enter 0 to quit. E.g. 27 box 5 14 "Google Drive"...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Rename',chars:['r'],msg:'\n\x1b[?25hPlease enter the names, index numbers and/or paths of the profiles, files and folders you wish to rename followed by their new names, separated by spaces OR enter 0 to quit. E.g. GoogleDrive "Google Drive" 6 MEGAcmd 3/Documents Notes...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Edit',chars:['e'],msg:'\n\x1b[?25hPlease enter the name or index number of the profile you wish to edit OR enter 0 to quit. E.g. "Google Drive" OR 5...\n',func:function(){stdout.write(this.msg);process.exit()}},
	{label:'Quit',chars:['q','0'],msg:'',func:function(){stdout.write('\x1b[?25h'+this.msg+(process.platform==='win32'?'':'\n'));process.exit()}} // Check the OS to get the line break correctly.
]
,NumberOfOptions=options.length

for(let i=-1;++i<NumberOfOptions;){// Pre-compute formatted string properties at startup to save memory during menu navigation
	options[i].display=options[i].label+'('+options[i].chars.map(c=>c.toUpperCase()).join('/')+')'
	options[i].matchTerms=options[i].label.toLowerCase().split('/')
}

let selectedIndex=0,previousLines=0 // Track the current caret position and menu height

const renderMenu=()=>{// Build the visual menu string, calculate line wraps, and overwrite the terminal efficiently
	let output='',visibleText=''
	for(let i=-1;++i<NumberOfOptions;){
		const separator=i<NumberOfOptions-1?'|':''
		output+=(i===selectedIndex?'\x1b[7m':'')+options[i].display+(i===selectedIndex?'\x1b[0m':'')+separator
		visibleText+=options[i].display+separator
	}
	const moveUp=previousLines>0?'\x1b['+previousLines+'A':''
	stdout.write(moveUp+'\x1b[0G\x1b[0J'+output)
	previousLines=Math.floor((visibleText.length-1)/(stdout.columns||80))
}
,executeOption=i=>{selectedIndex=i;renderMenu();options[i].func()}
,handleInput=key=>{
	switch(key){
		case '\u0003': // It's possible to quit with Ctrl+C or your terminal's equivalent
			stdout.write('\n\x1b[?25hCancelled with Ctrl+C\n');process.exit()
		break
		case '\u001b[A':  // Pressing the ↑ key
		case '\u001b[D':  // Pressing the ← key
		case '\u001b[Z':  // Pressing the Shift ⇧ + Tab ⭾ keys. Doesn't work in Termux.
		case '\u001b[5~': // Pressing the PGUP key in Termux
		case '\u001b[I':  // Pressing the Page Up key on PC
			selectedIndex=(selectedIndex-1+NumberOfOptions)%NumberOfOptions // Cycle backwards
			renderMenu()
		break
		case '\u001b[B':  // Pressing the ↓ key
		case '\u001b[C':  // Pressing the → key
		case '\t':        // Pressing the Tab ⭾ key OR entering a '	' tab. This only cycles one forward even if you hold it in Termux, but cycles fine on PC.
		case '\u001b[6~': // Pressing the PGDN key in Termux
		case '\u001b[G':  // Pressing the Page Down key on PC
			selectedIndex=(selectedIndex+1)%NumberOfOptions // Cycle forwards
			renderMenu()
		break
		/* These keys don't work if you set them to do certain things in your terminal configuration files like in alacritty.toml and .wezterm.lua.
			I personally set the Page Up and Page Down keys in Alacritty and WezTerm to scroll up and down for example.
		*/
		// Use the Keyboard Test script below to find the codes of key presses, including combinations with Shift ⇧, Ctrl and Alt.
		case '\r':
		case '\n':
			options[selectedIndex].func()
		break
		default:// Normalise text for handling pasted strings and multi-character buffers
			const lowerKey=key.toLowerCase(),trimmedKey=lowerKey.trim(),trimmedKeyLength=trimmedKey.length
			
			if(trimmedKeyLength>1&&!key.startsWith('\u001b')){// Check if the input is a pasted word rather than a single escape sequence
				let found=false
				for(let i=-1;++i<NumberOfOptions;){// Attempt to match the pasted word against full labels (e.g. "re-index")
					if(options[i].matchTerms.includes(trimmedKey)){
						executeOption(i)
						found=true
						break
					}
				}
				if(!found){// Scan each pasted character until finding an option
					searchLoop:for(let j=-1;++j<trimmedKeyLength;){
						for(let i=-1;++i<NumberOfOptions;){
							if(options[i].chars.includes(trimmedKey[j])){
								executeOption(i)
								break searchLoop
							}
						}
					}
				}
			}else{// Handle standard single keystroke shortcut matches
				for(let i=-1;++i<NumberOfOptions;){
					if(options[i].chars.includes(lowerKey)){
						executeOption(i)
						break
					}
				}
			}
	}
}

// Hide the caret and perform the interactive session
stdout.write('\x1b[?25l');stdin.setRawMode(true);stdin.resume();stdin.setEncoding('utf8');renderMenu();stdin.on('data',handleInput)