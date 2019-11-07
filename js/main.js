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

let SEED_NAME = ''
let SEED = Math.floor( Math.random()*2147483647 )

let scene, camera, renderer, stage, vehicle, control, ui, vhs, state

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
let TIMEOUT		= 0
let DNF			= false
let REASON		= 'dnf'
let FULLSCREEN	= false
let MODE 		= 0
let LOAD 		= 0
let MENU 		= false
let MOBILE 		= false
let CHALLENGE	= false
let	OBJECTIVES	= []

function init(){

	decodeURL()
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

	ui = new UI()
	ui.connect()

	stage	= new Stage()
	vehicle = new Vehicle()
	vhs		= new VHS()
	state	= new State()

	resize()

	const promo = document.createElement('a')
	promo.id = 'promo'
	promo.href = 'https://ginko.ltd'
	promo.target = '_blank'
	
	if( CHALLENGE ){
		
		promo.style.top = '176px'
		
	}
	document.body.appendChild( promo )

	state.start()

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

  	ui.button('   menu   ', function(){

		ui.clear()
		MENU = !MENU
		if( !MENU && PLAY ) vehicle.display()
		menu()
// 		if( !vhs.PLAY || vehicle.END ) state.instruments()

  	}, ui.xl-8, 0, 8, 6, true, false )

}

function main(){

	const id = window.requestAnimationFrame( main )
	let time = window.performance.now()

	FPS  = time - TIME
	TIME = time
	FPS = Math.round( 100/FPS )*10

  	if( PLAY ){

		vhs.record( vehicle )
  		vehicle.update()
		vehicle.display()
		state.instruments()

		if( MOBILE && !MENU ){

			ui.dpad()

		}
		if( vehicle.END && vehicle.OBJECTIVE == 0 && MENU){

			state.results()
			TIMEOUT++

			if( TIMEOUT > 300 ){
				PLAY = false
				vhs.PLAY = true
				ui.clear()
			}

		}
		else if( MENU ){

			state.pause()

		}

		if( !DNF ) {
			menu()
		}

  	}
  	else if( vhs.PLAY ){

  		vhs.play( vehicle )

  		if( MENU ){

  			state.results()

  		}
  		
		if( vhs.PLAY ) menu()

  	}
  	else if( stage.generate.END === true ){
  		
		state.readycheck()

  	}
  	
	renderer.render( scene, camera )

}

function encodeURL(){

	let data = '#'
	let location = window.location.href
	let buffer = ''

	for( let i = 0; i < location.length; i++ ){

		if( location.charAt(i) === '#' ){

			location = buffer
			break

		}
		else{

		buffer += location.charAt(i)	

		}

	}

	let best   = vehicle.getCT()
	let base64 = stage.generate.SEED.toString()
	base64 += '#'

	for( let i in best ){

		let string = ui.getTextFloat( best[i] )		 
		base64 = base64.concat( string )
		base64 += ','

	}

	base64 = btoa( base64 )
	data = data.concat( base64 )

	let string = location.concat( data )

	const element = document.createElement('textarea');
	element.value = string;
	element.setAttribute('readonly', '');
	element.style = {position: 'absolute', left: '-9999px'};

	document.body.appendChild(element);
	element.select();
	document.execCommand('copy');
   	document.body.removeChild(element);

}

function decodeURL(){

	let url = window.location.href
	let base64 = ''
	let seed = SEED
	let objective = 0
	let buffer = ''
	let parse = false

	for( let i = 0; i < url.length; i++ ){

			let char = url.charAt(i)

			if( parse ){

				base64 += url.charAt(i)

			}
			if( char === '#' ){

				parse = true	

			}

	}

	if( parse ){

		base64 = atob( base64 )
		seed = ''
		
		for( let i = 0; i < base64.length; i++ ){

			let char = base64.charAt(i)

			if( char ==='#'){

				CHALLENGE = true

			}
			else if( CHALLENGE ){
				
				if( char === ',' ){

					OBJECTIVES[objective] = buffer

					buffer = ''
					objective++

				}
				else if( char != undefined ){

					buffer += char

				}

			}
			else if( !CHALLENGE ) {

				seed += char.toString()

			}

		}
	

	}

	if( CHALLENGE ){
		SEED = parseInt( seed )
	}
		
}
