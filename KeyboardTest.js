'use strict'

const detectKey=()=>{
	const stdin=process.stdin
	console.log("Press any key or combination of keys to see its raw sequence. Press Ctrl+C or your terminal's equivalent to exit.")
	stdin.setRawMode(true);stdin.resume();stdin.setEncoding('utf8')
	stdin.on('data',key=>{key==='\u0003'&&process.exit();console.log(JSON.stringify(key))})
}

detectKey() /* Enter these in the following OS and terminals to trigger this script:
	Windows - PowerShell: node "$Home/Path to where you saved this script/KeyboardTest.js"
	Android - Termux: node "/sdcard/Path to where you saved this script/KeyboardTest.js"
*/