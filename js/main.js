window.onload = init
window.onresize = resize
window.fullscreenchange = resize
window.focus = resize

	let palette = [

	0x101010, // BLACK
	0xffffff, // WHITE
	0xc1c1c1, // MID LIGHT
	0x2c2c2c, // MID DARK
	0x50ffae, // ACCENT GREEN
	0xff7272, // ACCENT RED
	0x2486ff,
	0xff295a,
	0x344234, // GRASS
	0x219640, // EVERGREEN
	0x6d6047, // SOIL

	]

	for( let i in palette ){
		const c = new THREE.Color( palette[i] )
		palette[i] = c
	}
	
let LOADSTATUS = 0
let SEED = Math.floor( Math.random()*999999 )

let scene, camera, renderer, stage, vehicle, control, ui, vhs

let UP
let PLAY    	= false
let IMPORT  	= false
let BG 	    	= palette[0]
let FRAME		= 0

let TIME		= 0
let TIMER		= 0
let DT			= 0
let FPS			= 0
let COUNTER		= 0
let TIMEOUTS	= 0
let DNF			= false
let REASON		= 'dnf'
let FULLSCREEN	= false
let MODE 		= 0
let LOAD 		= 0
let MENU 		= false
let MOBILE 		= false

function init(){

	window.addEventListener('touchstart', activateTouch )

	scene = new THREE.Scene()
	scene.background = BG

	UP = new THREE.Vector3(0,0,1)
	camera = new THREE.PerspectiveCamera()

	camera.up = UP
	camera.position.z = 2000
	camera.lookAt(0,0,0)

	camera.fov   = 70
	camera.near  = 0.0001
	camera.far   = 6000

	camera.name = 'Camera'
	scene.add(camera)

	renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: true, antialias: false })
	renderer.setClearColor(BG)
	renderer.domElement.id = 'renderer';
	document.body.appendChild(renderer.domElement)

	vehicle = new Vehicle()

	control = new Control()
	control.connect()

	stage = new Stage()

	ui = new UI()
	ui.connect()

	vehicle = new Vehicle()
	vhs = new VHS
	resize()
	menu()

	// LOAD SEED FROM URL
	let url = window.location.href
	let seed = SEED
	let challenge = false

	for( let i = 0; i < url.length; i++ ){

		if( challenge ){
			char = url.charCodeAt(i)
			length = seed.toString().length
			console.log( length )
			seed *= Math.pow( 10, char.toString().length )
			seed += char
			seed %= 2147483647
		}
		if( url.charAt(i) === '#' && !challenge ){
			challenge = true
			seed = 0
		}

	}

	if( challenge ){
		SEED = seed
	}

}

function activateTouch(){

	MOBILE = true
	window.removeEventListener('touchstart', activateTouch)

}

function resize(){

	const w = window.innerWidth
	const h = window.innerHeight

	renderer.clear()
	renderer.setSize(w,h)

	if ( camera.isPerspectiveCamera ){

	  camera.aspect = w/h

	}
	else {

	  camera.top    = h/-2
	  camera.bottom = h/2
	  camera.left   = w/-2
	  camera.right  = w/2

	}

	camera.updateProjectionMatrix()
	ui.resize()

}

function menu(){

	const id = window.requestAnimationFrame( menu )
	let START = false
	title()

	ui.button('start', function(){
		START = true
		ui.clear()
		title()
		stage.connect()
		window.cancelAnimationFrame( id )
		window.requestAnimationFrame( main )

	}, 2, ui.yl-12, ui.xl-4, 6, true )

	if( !START ){

	fullscreen( ui.yl-20 )

	}

	renderer.render( scene, camera )

}

function fullscreen( y ){

	if (document.body.requestFullscreen) {

	let label = ( FULLSCREEN ) ? 'exit fullscreen' : 'enter fullscreen'
	ui.button(label, function() {
		ui.clear()
		if( !FULLSCREEN ){
		document.body.requestFullscreen()
		FULLSCREEN = true
		}
		else{
		document.exitFullscreen()
		FULLSCREEN = false
		}

	}, 2, y, ui.xl-4, 6, true)

	}
}

function pause(){

	let ln = vehicle.getCT().length*2+4

	if( DNF ){
		ui.textbox('dnf', 2, ln+=4)
		ui.textbox('reason        ' + REASON, 2, ln +=2)
		ui.textbox('repair cost   Y100', 2, ln +=2)

	}

	if( MENU ){

  	ui.button('restart stage', function(){
  		
  		MENU = false
		vehicle.reset()
		ui.clear()
		MENU = false
  	}, 2, ln+=4, ui.xl-4, 6, true )

	}

	if( MENU ){

		fullscreen( ln+=8 )

	}
}

function title(){

	ui.textbox('special stage',  2, 3 )
	ui.textbox('-', 2, 6 )

}

function menuButton(){

  	ui.button('menu', function(){

		ui.clear()
		MENU = !MENU
		if( !MENU && PLAY ) vehicle.display()

  	}, ui.xl-10, 2, 8, 2, true, false )

}

function results(){
	let RESULTS = true
	ui.clear()
	ui.textbox( vehicle.TEXTTIME, 2, 3 )
	vehicle.display()
	ui.textbox( '-', 2, 15 )
	let ln = 15

	if( vehicle.getReward() > 0 ){

		ui.textbox('new record', 2, ln+=2 )
		ln+=2
		ui.textbox( 'reward    Y' + vehicle.getReward(), 2, ln+=2 )

	}

	ui.textbox( 'total     Y' + vehicle.getYen(), 2, ln+=2 )

	 ui.button('next stage', function(){

  		MENU = false
  		PLAY = false
		ui.clear()
		renderer.clear()
	    title()
	    vehicle.disconnect()
	    vehicle.reset()
		stage.reset()

  	}, 2, ln += 4, ui.xl-4, 6, true)

	if( PLAY || vhs.PLAY ){

  	ui.button('restart stage', function(){

  		MENU = false
  		PLAY = true
		vehicle.reset()
		ui.clear()
		RESULTS = false

  	}, 2, ln+=9, ui.xl-4, 6, true )

	if( RESULTS ){
  	ui.button('view replay', function(){

  		vhs.PLAY = true
  		PLAY = false
  		MENU = false
  		ui.clear()

  	}, 2, ln+=9, ui.xl-4, 6, true)
	}
	}

}

function main(){

	const id = window.requestAnimationFrame( main )

	let time = window.performance.now()

	FPS  = time - TIME
	TIME = time
	FPS = Math.round( 100/FPS )*10

  	if( PLAY ){

  		menuButton()
		vhs.update()
  		vehicle.update()
		vehicle.display()

  		ui.textbox( vehicle.TEXTTIME, 2, 3 )
		ui.textbox( 'fps ' + FPS, 2, ui.yl-4)
  		ui.textbox( 'vel' + ' ' + vehicle.VELOCITY, 2, ui.yl-6 )

		if( vehicle.END && vehicle.OBJECTIVE == 0 ){

			results()

		}
		else if( MOBILE && !MENU ){

			ui.dpad()

		}
		else if( MENU ){

			pause()

		}

  	}
  	else if( vhs.PLAY ){

  		vhs.update()

  		if( MENU ){

  			results()

  		}

		menuButton()


  	}
  	else if( stage.generate.END === true ){
  		
		ui.button( 'ready', function(){
			vehicle.connect( stage.start, stage.surface )
			stage.generate.END = false
			PLAY = true
			TIMER = 0
			ui.clear()
		}, 2, ui.yl-12, ui.xl-4, 6, true )
  	}
  	
	renderer.render( scene, camera )

}
