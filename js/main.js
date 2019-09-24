window.onload = init
window.onresize = resize
window.focus = resize

	let palette = [

		0xc4cfa1,
		0x8b956d,
		0x4d533c,
		0x1f1f1f,
		0xff33ff,
		0xff0000

	]
	
let LOADSTATUS = 0

let scene, camera, renderer, stage, vehicle, control, ui

let UP
let PLAY    = false
let IMPORT  = false
let BG 	    = palette[3]
let FRAME	= 0

let TIME = 0
let TIMER = 0
let DT = 0
let FPS = 0
let COUNTER = 0
let TIMEOUTS = 0

let MODE = 0
let LOAD = 0
let MENU = false
let MOBILE = false

function init(){

	window.addEventListener('touchstart', activateTouch )

	let bg = new THREE.Color(BG)
	scene = new THREE.Scene()
	scene.background = bg

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
	renderer.setClearColor(bg)
	renderer.domElement.id = 'renderer';
	document.body.appendChild(renderer.domElement)

	vehicle = new Vehicle()

	control = new Control()
	control.connect()

	stage = new Stage()

	ui = new UI()
	ui.connect()

	vehicle = new Vehicle()

	resize()
	menu()

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

	title()

	ui.button('start', function(){

		ui.clear()
		title()
		stage.connect()
		window.cancelAnimationFrame( id )
		window.requestAnimationFrame( main )

	}, 2, ui.yl-12, ui.xl-4, 6 )

	renderer.render( scene, camera )

}

function pause(){

  	ui.button('generate new stage', function(){
  		MENU = false
		ui.clear()
		renderer.clear()
	    title()
	    vehicle.reset()
	    vehicle.disconnect()

		renderer.render( scene, camera )
  		stage.reset()

		PLAY = false
  	}, 2, 6, ui.xl-4, 4, true)

	if( MENU ){
  	ui.button('restart stage', function(){
  		MENU = false
		vehicle.reset()
		ui.clear()
		MENU = false
  	}, 2, 12, ui.xl-4, 4, true )
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
	if( !MENU ) vehicle.display()
  	}, ui.xl-10, 2, 8, 2, true, false )

}

function results(){

	vehicle.display()
	ui.textbox( '-', 2, 15 )
	let ln = 15
	if( vehicle.getReward() > 0 ){
	ui.textbox('new record', 2, ln+=2 )
	ln+=2
	ui.textbox( 'reward ' + vehicle.getReward(), 2, ln+=2 )
	}

	ui.textbox( 'total yen ' + vehicle.getYen(), 2, ln+=2 )

	 ui.button('next stage', function(){
  		MENU = false
  		PLAY = false
		ui.clear()
		renderer.clear()
	    title()
	    vehicle.disconnect()
	    vehicle.reset()
		stage.reset()
  	}, 2, ln += 5, ui.xl-4, 4, true)

	if( PLAY ){

  	ui.button('restart stage', function(){
  		MENU = false
		vehicle.reset()

		ui.clear()
  	}, 2, ln+=6, ui.xl-4, 4, true )

	}

}

function main(){

	const id = window.requestAnimationFrame( main )

	let time = window.performance.now()

	FPS  = time - TIME
	TIME = time
	FPS = Math.round( 100/FPS )*10

	if( vehicle.END && vehicle.OBJECTIVE == 0 ){
		results()
	}
  	else if( MOBILE && !MENU ){
  		ui.dpad()
  	}
  	else if( MENU ){
		pause()
  	}

  	if( PLAY ){

  		menuButton()
  		vehicle.update()
		vehicle.display()
  		ui.textbox( vehicle.TEXTTIME, 2, 3 )
		ui.textbox( 'fps ' + FPS, 2, ui.yl-4)
  		if( !vehicle.END ) ui.textbox( 'vel' + ' ' + vehicle.VELOCITY, 2, ui.yl-6 )

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

function demo(){

	

}