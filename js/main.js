// P R O C E D U R A L . C A

const BUILD = '0.0.2 _ DEV 2';
window.onload = init;
window.onresize = resize;
window.fullscreenchange = resize;
window.focus = resize;

	let palette = [

	0x101010,	// 00 BLACK
	0xffffff,	// 01 WHITE
	0xc1c1c1,	// 02 MID LIGHT
	0x2c2c2c,	// 03 MID DARK
	0x50ffae,	// 04 ACCENT GREEN
	0xff7272,	// 05 ACCENT RED
	0x2486ff,	// 06 STONE
	0xff295a,	// 07 ??
	0x344234,	// 08 GRASS
	0x219640,	// 09 EVERGREEN
	0x6d6047,	// 10 SOIL
	0x999999,	// 11 ??
	0xffb0ea	// 12 SAKURA

	];

	for( let i in palette ){

		const c = new THREE.Color( palette[i] )
		palette[i] = c
		
	};
	
let LOADSTATUS = 0;

let SEED_NAME = '';
let SEED = Math.floor( Math.random()*2147483647 )
// SEED = 1967515738;
let scene, camera, renderer, stage, vehicle, control, ui, vhs, state;

let UP
let PLAY    	= false;
let IMPORT  	= false;
let BG 	    	= palette[0];
let FRAME		= 0;

let TIME		= 0;
let TIMER		= 0;
let DT			= 0;
let FPS			= 0;
let COUNTER		= 0;
let TIMEOUT		= 0;
let DNF			= false;
let REASON		= 'out of bounds';
let FULLSCREEN	= false;
let MODE 		= 0;
let LOAD 		= 0;
let LOADING		= false;
let MENU 		= false;
let MOBILE 		= false;
let CHALLENGE	= false;
let	OBJECTIVES	= [];
let UPDATES = [];

let SCALE = 1;

let RAFID = 0;

let sakura;

function init(){

	decodeURL();
	window.addEventListener('touchstart', activateTouch );
	window.addEventListener("contextmenu", function() { event.preventDefault() } );
	scene = new THREE.Scene();
	scene.background = BG;

	UP = new THREE.Vector3(0,0,1);
	camera = new THREE.PerspectiveCamera();

	camera.up = UP;
	camera.position.z = 2000;
	camera.lookAt(0,0,0);

	camera.fov   = 70;
	camera.near  = 0.0001;
	camera.far   = 3000;

	camera.name = 'Camera';
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, antialias: false });
	renderer.setClearColor(BG)
	renderer.domElement.id = 'renderer';
	document.body.appendChild(renderer.domElement);

	control = new Control();
	control.connect();

	ui = new UI();

	stage	= new Stage();
	vehicle = new Vehicle();
	vhs		= new VHS();
	state	= new State();

	resize();


	ui.onload = function(){

	sakura = new THREE.LineSegments(

		stage.generate.sakura(),
		new THREE.LineBasicMaterial( { vertexColors: true })

	)
	
	
	sakura.geometry.colorsNeedUpdate = true;
// 	sakura.geometry.center();
	sakura.position.z -= 5;

	scene.add( sakura);

	camera.position.set(0,25,10);
	camera.lookAt( 0,0,0 );

		main();
		state.intro();

	}

}

function activateTouch(){

	MOBILE = true;
	window.removeEventListener('touchstart', activateTouch);

}

function resize( scale = 1){

	scale = ( window.innerWidth > 640 && window.innerHeight > 640 ) ? 2 : 1;

	let width = window.innerWidth/scale;
	let height = window.innerHeight/scale;

	renderer.clear();
	renderer.setSize( width, height );
	renderer.domElement.style.zoom = scale;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	
	ui.resize( width, height, scale );
	state.resize( width, height, scale );

}

function main(){

	RAFID = window.requestAnimationFrame( main );
	let time = window.performance.now();

	FPS  = time - TIME;
	TIME = time;
	FPS = Math.round( 100/FPS )*10;
  	
  	if( PLAY ){

  		vehicle.update();
		vhs.record( vehicle );

		if( !MENU ){

  			state.update();

		}

		if( MOBILE && !MENU && !DNF ){

			ui.dpad();

		}

  	}
  	else if( vhs.PLAY ){

		vhs.play( vehicle );

  	}
  	else if( LOADING ){

		camera.position.applyAxisAngle( camera.up, 0.01 );
		camera.lookAt( new THREE.Vector3(), 0,0,0 );
		
		state.loading();

  	}
  	else{

		camera.position.applyAxisAngle( camera.up, 0.01 );
		camera.lookAt( new THREE.Vector3(), 0,0,0 );

  	}

	renderer.render( scene, camera );

	ui.update( control.touches );

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