function Vehicle(){

const gravity = new THREE.Vector3(0,0,-0.009)
this.LOAD = false
this.mesh

var scope = this
//var position = 305

// FUCKING CHANGE THIS TO AN INPUT
this.checkpoint
this.TEXTTIME = ''
let TIMEOUT = 0

this.best = []
for( let i = 0; i < 4; i++ ){
this.best[i] = 0
}

var intersects   = []

var normal = new THREE.Vector3(0,0,1)
var target = new THREE.Vector3()
var lookAt = new THREE.Vector3()

this.lookAt = new THREE.Vector3()
this.normal = new THREE.Vector3()
this.position = new THREE.Vector3()

this.light
this.emitter
var emitterCount = 0

var surface, boundry

var objective = 0
var timer = 0
var startTime = 0

let AT = 0
let DT = 0
let CT = []
let DELTA = []
let SAMPLE = 0

this.START = false
this.END = false
this.VELOCITY = 0

this.OBJECTIVE = 0

this.UP
this.DOWN
this.LEFT
this.RIGHT

this.connect = function( _position, input ){

	camera.zoom = 1
	camera.fov  = 90
	camera.updateProjectionMatrix()

	this.position.copy(_position)
	this.position.z += 1
	this.start = new THREE.Vector3().copy(this.position)
	this.last = new THREE.Vector3().copy(this.position)

	this.ray        = new THREE.Vector3(0,0,1)
	this.raycaster  = new THREE.Raycaster(this.position, this.ray, 0, 2)

	this.up = new THREE.Vector3(0,0,1)

	this.vel    = new THREE.Vector3()
	this.acc    = new THREE.Vector3()
	this.dir    = new THREE.Vector3(0,1,0)

	this.rotation = 0
	this.angle    = 0
	this.radian   = 0.01

	this.force      = 0.012
	this.angleGrip  = 0.9
	this.grip       = 0.983
	this.brake      = 0.95

	this.mesh = new THREE.LineSegments(

	new THREE.EdgesGeometry(
	new THREE.BoxGeometry(1,2,1)),
	new THREE.MeshBasicMaterial({ wireframe: false }))

	scene.add(this.mesh)

	this.mesh.visible = true
	this.mesh.name = 'Vehicle'
	this.mesh.geometry.center()

	particles = new THREE.Geometry()
	pMaterial = new THREE.PointsMaterial({
	size: 0.05,
	vertexColors: THREE.VertexColors,
	blending: THREE.AdditiveBlending,
	transparent: true
	});

	pMaterial.sizeAttenuation = true

	for( var i = 0; i < 100; i++ ){
	var p =  new THREE.Vector3(0,0,0)
	p.life = 0
	p.maxLife = 100
	p.acc = new THREE.Vector3(0,0,0)
	particles.vertices.push(p)
	var color = new THREE.Color()
	particles.colors.push(color)
	}

	this.emitter = new THREE.Points(
	particles,
	pMaterial);
	this.emitter.name = 'Emitter'
	scene.add(this.emitter);

	scope.LOAD = true

	surface = new THREE.Mesh(
	input.geometry.clone(),
	new THREE.MeshBasicMaterial({side: THREE.DoubleSide}))

	surface.name = 'surface'
	surface.geometry.mergeVertices()
	surface.geometry.verticesNeedUpdate = true
	surface.geometry.elementsNeedUpdate = true
	surface.geometry.computeFaceNormals()

	this.checkpoint = editor.checkpoint

	for( let i = 0; i < 4; i++ ){

		this.best[i] = 0

	}
}

this.disconnect = function(){

	surface.remove()
	scene.remove(this.mesh)
	scene.remove(this.emitter)
	this.mesh.remove()

}

this.update = function(){

	this.UP    = ( !this.END ) ? control.UP    : false
	this.DOWN  = ( !this.END ) ? control.DOWN  : false
	this.LEFT  = ( !this.END ) ? control.LEFT  : false
	this.RIGHT = ( !this.END ) ? control.RIGHT : false

	DT = 1

	this.acc.multiplyScalar( DT )
	this.vel.multiplyScalar( DT )

	if( this.UP ){
	this.vel.add(this.acc)

	// Create Vehicle Start Function to intiate update loop

	if( objective === 0 && this.START === false ){

		ui.clear()
		startTime = performance.now()
		AT = 0
  		this.START = true

	}

	}

	this.vel.multiplyScalar(this.grip)

	this.position.add(this.vel)
	this.mesh.position.copy(this.position)

	this.detect()

	this.last.copy(this.position)
	this.mesh.updateMatrixWorld()

	this.dir = this.mesh.up.clone()
	this.dir.applyMatrix4( this.mesh.matrixWorld )
	this.dir.sub(this.position)

	if( this.LEFT )  this.angle -= this.radian * DT
	if( this.RIGHT ) this.angle += this.radian * DT

	this.angle *= DT
	this.angle *= (this.angleGrip)
	this.rotation += this.angle

	this.acc.copy(this.dir).multiplyScalar( this.force )

	if( this.DOWN ) this.vel.multiplyScalar(this.brake)

	target.copy( normal )
	lookAt.lerp(target, 0.2)
	lookAt.add( this.position )
	this.mesh.lookAt( lookAt )

	this.mesh.rotateOnAxis( this.up, this.rotation)

	this.emit()

	this.rig( lookAt )

	lookAt.sub( this.position )

	if( control.RESET ){
	  scope.reset()
	}

	this.VELOCITY = Math.round( ( this.vel.length()*60/1000)*3600 )

	if( this.START && !this.END ){
	AT = Math.floor( ( window.performance.now() - startTime )/10 )/100
	}

	this.TEXTTIME = ui.getTextFloat( AT )
	this.OBJECTIVE = objective

}

this.detect = function(){

	let intersects = []

	this.ray.set( 0,0,1 )
	this.ray.normalize()
	this.raycaster.far = -this.vel.z + 1
	surface.raycast( this.raycaster, intersects )

	if( intersects.length > 0 ){

		  this.position.copy(intersects[0].point)
		  normal.copy(intersects[0].face.normal)
		  TIMEOUT = 0

	}
	else if( intersects.length === 0 ){

		this.vel.add(gravity);
		TIMEOUT ++
		if( TIMEOUT === 60 ){
			ui.clear()
			control.clear()
			MENU = true
			this.END = true
		}

	}

	intersects = []

	this.ray.copy(this.last)
	this.ray.sub(this.position)
	this.raycaster.far = this.ray.length()
	this.ray.normalize()

	this.checkpoint[objective].raycast( this.raycaster, intersects )
	this.check = false

	if( intersects.length > 0 ){

		editor.checkpointDisplay[objective].material.color.setHex(0x1fff7f)
		
		if( objective > 0 ){

			CT[objective-1] = AT

		  this.display()
		  this.check = true

		}

	  if( objective == 4 ){

		objective = 0
		this.END = true

		if( AT < editor.best[3]  ){

		for( let i = 0; i < editor.best.length; i++)
		  editor.best[i] = CT[i]
		}

	  }
	  else{

		objective += 1

	  }
	}

}

this.getAT = function(){

	return AT

}

this.getObjective = function(){

	return objective

}

this.reset = function(){

	scope.UP = false
	scope.DOWN = false
	scope.LEFT = false
	scope.RIGHT = false

	this.START = false
	this.END   = false

	scope.position.copy(scope.start)
	scope.last.copy(scope.position)
	scope.rotation = 0
	scope.vel.set(0,0,0)

	scope.mesh.lookAt(scope.up.clone().add(scope.position))
	scope.rig(scope.up)
	renderer.clear()
	objective = 0
	timer = 0
	startTime = performance.now()
	this.TEXTTIME = '0.00'
	ui.clear()
	control.clear()
	editor.resetCheckpoints()

	TIMEOUT = 0
	CT.length = 0
	AT = 0
	MENU = false
}

this.rig = function(up){

	const cameraTarget = this.dir.clone()
	cameraTarget.multiplyScalar(-10)
	
	cameraTarget.add( this.position )
	cameraTarget.z += 6

	if( !this.END ){
	camera.position.lerp( cameraTarget, 0.5)
	}
	camera.lookAt(this.position)

}

this.emit = function(){

	if( this.UP ){

		let i = 0;
		while( i < 1 ){

			this.emitter.geometry.vertices[emitterCount].copy(this.dir)
			this.emitter.geometry.vertices[emitterCount].multiplyScalar( -1 - ( Math.random() * this.vel.length() ) )
			this.emitter.geometry.vertices[emitterCount].add(this.position)

			this.emitter.geometry.vertices[emitterCount].life = this.emitter.geometry.vertices[emitterCount].maxLife
			const rx = Math.random()+0.5
			const ry = Math.random()+0.5
			const rz = Math.random()+0.5

			const r = -Math.random()*0.1

			this.emitter.geometry.vertices[emitterCount].acc.copy(this.dir)
			this.emitter.geometry.vertices[emitterCount].acc.multiplyScalar(r)

			emitterCount ++
			emitterCount %= this.emitter.geometry.vertices.length
			i++

		}

	}

	for( var i in this.emitter.geometry.vertices ){

		if(this.emitter.geometry.vertices[i].life > 0){

			this.emitter.geometry.vertices[i].add(this.emitter.geometry.vertices[i].acc)
			this.emitter.geometry.vertices[i].life -= 1
			this.emitter.geometry.colors[i].setHSL(0,0,this.emitter.geometry.vertices[i].life/100)

		}

		if(this.emitter.geometry.vertices[i].life === 0){

		  this.emitter.geometry.vertices[i].set(0,0,0)
		  this.emitter.geometry.vertices[emitterCount].acc.x = 0
		  this.emitter.geometry.vertices[emitterCount].acc.y = 0
		  this.emitter.geometry.vertices[emitterCount].acc.z = 0

		}

	}

	this.emitter.geometry.verticesNeedUpdate = true
	this.emitter.geometry.colorsNeedUpdate = true
	this.emitter.geometry.computeBoundingSphere();

}

this.display = function(){
	
	for( let i = 0; i < CT.length; i++ ){

		let n = i+1
		let text = 'cp' + n
		let cp = ui.getTextFloat( CT[i] )
		while( text.length < 16-cp.length ){
			
			text += ' '

		}

		text += cp

		ui.textbox( text , 2, 6+i*2 )

		let rank = ui.getTextFloat( ( editor.best[i]-CT[i] ), true )
		ui.textbox( rank, Math.floor(ui.xl-2-16+(16-rank.length)), 6+i*2 )
	}

}

}
