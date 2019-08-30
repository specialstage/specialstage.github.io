window.onload = init
window.onresize = resize

let scene, camera, renderer, vehicle, control, ui
let editor
let up

const BUILD = '20190823-1A'
let TEST = false
let IMPORT = false
let BG = 0x101010

let TIME = 0
let DT = 0
let FPS = 0

let MODE = 0
let LOAD = 0
let MENU = false
let MOBILE = false

function init(){

  let bg = new THREE.Color(BG)
  scene = new THREE.Scene()
  scene.background = bg
  scene.fog = new THREE.FogExp2(BG, 0.02);

  up = new THREE.Vector3(0,0,1)
  camera = new THREE.PerspectiveCamera()
//   camera = new THREE.OrthographicCamera()

  camera.up = up
  camera.lookAt(0,0,0)

    camera.fov   = 50
    camera.near  = 0.001
    camera.far   = 10000
    
    camera.name = 'Camera'
    scene.add(camera)

  renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: true, antialias: false })
  //renderer.setPixelRatio(1)
  renderer.setClearColor(bg)
  renderer.domElement.id = 'renderer';
  document.body.appendChild(renderer.domElement)
 
  vehicle = new Vehicle()

  control = new Control()
  control.connect()

  editor = new Editor()
  editor.connect()
  
  ui = new UI()
  ui.connect()
  
  window.addEventListener('touchstart', activateTouch )
  vehicle = new Vehicle()

  load()

}

function activateTouch(){
	MOBILE = true
	window.removeEventListener('touchstart', activateTouch)
}

function resize(){

  var w = window.innerWidth
  var h = window.innerHeight

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

function load(){

  if( LOAD == 3 ){
	  ui.clear()	
	  editor.disconnect()
	  vehicle.connect( new THREE.Vector3(0,10,5), editor.surface )
	  main()
  }
  else if( LOAD == 2 ){	  
	  editor.generateMesh()
	  editor.generateCheckpoints()
	  LOAD++
// 	  renderer.render( scene, camera )
  	  renderer.clear()
	  window.requestAnimationFrame( load )
  }
  else if( LOAD == 1 ){
  	  ui.clear()
	  titleBar()
	  editor.import()
	  ui.textbox('generating terrain mesh...', 2, 9 )
	  LOAD ++
  	  renderer.clear()
	  window.requestAnimationFrame( load )
  }
  else if( LOAD == 0 ){
	  if( ui.load ){
	  resize()
	  mainMenu()
	  titleBar()
	  }
	  window.requestAnimationFrame( load )
	  renderer.render(scene, camera)
  }

}

function mainMenu(){

  ui.textbox('keybinds', 2, ui.yl-26)
  ui.textbox('activate touch      touch', 2, ui.yl-22)
  ui.textbox('main menu           enter', 2, ui.yl-20)
  ui.textbox('control vehicle     arrow keys', 2, ui.yl-18)
  ui.textbox('reset stage         r', 2, ui.yl-16)

  ui.button('start', function(){

  	LOAD++
  	ui.clear()
	titleBar()
  	ui.textbox('generating stage path...', 2, 9 )

  }, 2, ui.yl-12, ui.xl-4, 6)

}

function pauseMenu(){

  	ui.button('generate new stage', function(){
  		MENU = false
		ui.clear()
		renderer.clear()
  		ui.textbox('generating stage path...', 2, 9 )
	    titleBar()

		vehicle.disconnect()
  		editor.reset()
  		editor.connect()
  		LOAD = 0

  	}, 2, 8, ui.xl-4, 4)

  	ui.button('reset vehicle', function(){
		vehicle.reset()
		ui.clear()
		titleBar()
		MENU = false

  	}, 2, 15, ui.xl-4, 4, true )
}

function titleBar(){
	ui.textbox('special stage',  2, 3 )
	ui.textbox('-', 2, 6 )

// 	menuButton()
}

function menuButton(){

  	ui.button('menu', function(){

  	ui.clear()
	MENU = !MENU
  	}, ui.xl-10, 2, 8, 2, true, false )

}

function main(){

	FPS = Math.round( 1000 / ( performance.now()-TIME ) )
	TIME = performance.now()

  	menuButton()

  	if( MENU ){
		pauseMenu()
  	}
  	else if( MOBILE && !MENU ){
  		ui.dpad()
  	}

	vehicle.update()

	renderer.render(scene, camera)

	const fps = 'fps ' + FPS
  	ui.textbox(fps,  2, ui.yl-3 )
  	
  	ui.textbox( vehicle.getTextTime(), 2, 3 )

  	menuButton()

	if( LOAD == 0 ){
		ui.clear()
		renderer.clear()
		LOAD = 1
		titleBar()

		ui.textbox('generating stage path...', 2, 9)
		window.requestAnimationFrame(load)
	}
	else{
		window.requestAnimationFrame(main)
	}

}

function main_game(){

}

function main_menu(){

}
