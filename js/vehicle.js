function Vehicle(){

	// Accessible

	const scope = this;

	this.SPEED = '';
	this.TEXTTIME = '';

	this.START = false;
	this.END = false;
	this.OBJECTIVE = 0;
	this.POSITION;
	this.MODEL = 1;

	this.ANALOG = false;

	this.CAMERA = 1;
	let CAMERA = 1;

	// Controls

	let U			= false;
	let D			= false;
	let A			= 0;
	let ITEM		= false;
	let SLIP		= false;
	let CONTACT		= true;
	let CONTROLS	= false;
	// Time parameters
	
	let DT = 60; 
	let AT = 0;
	let CP = [];
	let TIMEOUT = 60;
	let TIME = 0;
	let STARTTIME = 0;

	let REWARD = 0;
	let YEN = 0;

	let objective = 0;
	let CHECK = false;
// 	let DNF = false;

// 	Initialization Parameters

	const param = {

		power:			2,
		drag:			2,
		mass:			1.0,
		brake:			3,
		sensitivity:	2,
// 		ease:			0,

	};

	

	const limits = {

		power:			{ lo: 0.015, hi: 0.02,	range: 0 },
		drag:			{ lo: 0.98, hi: 0.985,	range: 0 },
		brake:			{ lo: 0.98, hi: 0.95,	range: 0 },
		sensitivity:	{ lo: 0.06,	hi: 0.08,	range: 0 },
// 		ease:			{ lo: 6,	hi: 12,		range: 0 },

	};

	// COMPUTE RANGE LIMITS

	limits.power.range			= limits.power.hi - limits.power.lo
	limits.drag.range			= limits.drag.hi - limits.drag.lo
	limits.brake.range			= limits.brake.hi - limits.brake.lo
	limits.sensitivity.range	= limits.sensitivity.hi - limits.sensitivity.lo
// 	limits.ease.range			= limits.ease.hi - limits.ease.lo

	// ACTIVE PARAMETERS

	let power;
	let drag;
	let sensitivity;
	let ease = 6;
	let brake = 0.98;
	let speed;

	let angle = 0;
	let rotation = 0;
	let step = 0;

	// Steering Vectors

	const direction		= new THREE.Vector3( 0, 1, 0 );
	const acceleration	= new THREE.Vector3( 0, 0, 0 );
	const velocity		= new THREE.Vector3();

	// Orientation Vectors

	const up			= new THREE.Vector3( 0, 0, 1.0 );
	const normal		= new THREE.Vector3( 0, 0, 1.0 );
	const lookTarget	= new THREE.Vector3( 0, 0, 1.0 );
	const lookAt		= new THREE.Vector3( 0, 0, 1.0 );
	const gravity		= new THREE.Vector3( 0, 0, -0.0065 );

	// Location Vectors

	const position		= new THREE.Vector3();
	const last			= new THREE.Vector3();
	const start			= new THREE.Vector3();
	const contact		= new THREE.Vector3();

	// Raycaster

	let intersects	= [];
	const ray       = new THREE.Vector3(0,0,1);
	const raycaster	= new THREE.Raycaster( contact, ray, 0, 2 );

	// Cameras

	this.cameras = []

	this.cameras[0] = { distance: 20, x: 0, y: 0, z: 7, lerp: 0.1, lookAt: new THREE.Vector3() }
	this.cameras[1] = { distance: 0, x: 20, y: 20, z: 10, lerp: 0.05, lookAt: new THREE.Vector3() }
	this.cameras[2] = { distance: 0, x: -30, y: -30, z: 20, lerp: 0.05, lookAt: new THREE.Vector3() }
	this.cameras[3] = { distance: 0, x: -40, y:  40, z: 30, lerp: 0.075, lookAt: new THREE.Vector3() }
	this.cameras[4] = { distance: 0, x: 0, y: -20, z: 60, lerp: 0.0075, lookAt: new THREE.Vector3() }

	// Models

	const models = [];

	this.models = function(){

		return models;

	}

	// Geometry

	models[0] = new THREE.Geometry().fromBufferGeometry( new THREE.EdgesGeometry( new THREE.BoxGeometry( 1, 2, 1 ) ) );
	models[0].name = 'logistics crate'
	const material = new THREE.MeshBasicMaterial();
// 	const mesh = new THREE.LineSegments( geometry, material );

	// Custom Geometry

	models[1] = new THREE.Geometry();

	const model = {

		SIDE_FRONT: 0.3,
		SIDE_BACK: 0.45,
		BODY_FRONT:	1.2,
		BODY_BACK: -0.75,
		SIDE_WING: 1.0,
		WING_BACK: -1.4,
		WING_BOTTOM: 0.4,
		TOP: 1,
		BOTTOM: -0.1,

	}

	// SIDE BODY

	models[1].vertices.push( new THREE.Vector3( model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( model.SIDE_FRONT,  model.BODY_FRONT, model.TOP ) );

	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_FRONT,  model.BODY_FRONT, model.TOP ) );

	// FRONT BACK BODY

	models[1].vertices.push( new THREE.Vector3(  model.SIDE_FRONT, model.BODY_FRONT, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_FRONT, model.BODY_FRONT, model.TOP ) );

	models[1].vertices.push( new THREE.Vector3(  model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.BODY_BACK, model.TOP ) );

	// SIDE WINGS

	models[1].vertices.push( new THREE.Vector3( -model.SIDE_FRONT, model.BODY_FRONT, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_WING, model.BODY_BACK, model.BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_WING, model.BODY_BACK, model.BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3(  model.SIDE_FRONT, model.BODY_FRONT, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( model.SIDE_WING, model.BODY_BACK, model.BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3(  model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( model.SIDE_WING, model.BODY_BACK, model.BOTTOM ) );

	// BACK WING

	models[1].vertices.push( new THREE.Vector3(  model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3(  -model.SIDE_BACK, model.BODY_BACK, model.TOP ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3( model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );

	models[1].vertices.push( new THREE.Vector3( model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );
	models[1].vertices.push( new THREE.Vector3( model.SIDE_WING, model.BODY_BACK, model.BOTTOM  ) );

	models[1].vertices.push( new THREE.Vector3( -model.SIDE_BACK, model.WING_BACK, model.WING_BOTTOM ) );
	models[1].vertices.push( new THREE.Vector3( -model.SIDE_WING, model.BODY_BACK, model.BOTTOM  ) );

	models[1].center();

	models[1].name = 'ag-86'

	const master = new THREE.LineSegments( models[ scope.MODEL ].clone() , material );
	const mesh = master.clone();

// 	const highlight = new THREE.IcosahedronGeometry( 2, 0 );
// 	highlight.scale( 1.2, 1.2, 1.2 );

// 	mesh.add( new THREE.Mesh( highlight,

// 		new THREE.MeshBasicMaterial( {

// 			color: palette[4],
// 			wireframe: true,
// 			blending: THREE.AdditiveBlending,
// 			transparent: true,
			
// 			} )
// 			) );

	let emitterCount = 0;
	const particles = new THREE.Geometry()

	while( particles.vertices.length < 100 ){

		let particle =  new THREE.Vector3(0,0,0)
		particle.life = 0
		particle.maxLife = 100
		particle.acc = new THREE.Vector3(0,0,0)
		particles.vertices.push(particle)

		let color = new THREE.Color(0xffffff00)
		particles.colors.push(color)

	};

	particles.verticesNeedUpdate = true

	emitter = new THREE.Points(
	particles,
	new THREE.PointsMaterial({

	size: 0.1,
	vertexColors: THREE.VertexColors,
	blending: THREE.AdditiveBlending,
	transparent: true

	}));

	emitter.name = 'Emitter';

	this.connect = function( _start, surface ){

		mesh.copy( new THREE.LineSegments( models[ scope.MODEL ].clone(), material ) ); 

		start.copy( _start );
		position.copy( start );
		last.copy( position );

		scene.add( mesh );
		scene.add( emitter );

		scope.tune.power();
		scope.tune.drag();
		scope.tune.sensitivity();
// 		scope.tune.ease();

		scene.fog = new THREE.FogExp2( palette[0], 0.01 );

		camera.fov = 90;
// 		camera.far = 200;
		camera.updateProjectionMatrix();

		scene.add( stage.generate.stars );
		
		CONTROLS = false;
		window.setTimeout( function(){ CONTROLS = true }, 1000 );

	};

	this.disconnect = function(){

		vehicle.reset();
		scene.remove( mesh );
		scene.remove( emitter );
		scene.fog = new THREE.FogExp2( palette[0], 0 );
		scene.remove( stage.generate.stars );

	};

	this.ready = function(){

		if( U ){

			STARTTIME = performance.now()
			AT = 0;
			scope.START = true;

		};

	};

	this.reset = function(){

		this.START = false;
		this.END = false;
		DNF = false;

		CONTROLS = false;

		control.UP = false;
		control.DOWN = false;
		control.LEFT = false;
		control.RIGHT = false;

		U = false;
		D = false;
		L = false;
		R = false;

		AT = 0;
		CP = [];
		REWARD = 0;
		objective = 0;

		position.copy( start );
		last.copy( position );

		velocity.set( 0, 0, 0 );
		lookAt.set( 0, 0, 1.0 );

		mesh.copy( new THREE.LineSegments( models[ scope.MODEL ].clone(), material ) );

		mesh.lookAt( lookAt );

		rotation = 0; // Temporary Fix
		angle = 0;

		vhs.reset();
		window.setTimeout( function(){ CONTROLS = true }, 1000 );

	};

	this.update = function(){

		if( !this.START ){

		this.ready();

		}

		if( !DNF && !scope.END && CONTROLS ){

			U = control.UP;
			D = control.DOWN;
			L = control.LEFT;
			R = control.RIGHT;

		}
		else{

			U = false;
			D = false;
			L = false;
			R = false;

		};

		emit();
		align();
		accelerate();
		detect();
		register();
		rig();
		
	};

	this.results = function(){

		return { reward: REWARD, yen: YEN };

	}

	this.AT = function(){ return AT };

	this.CP = function(){ return CP.slice() }

	this.replay = function( data ){

		position.copy( data.position )
		mesh.position.copy( position )

		direction.copy( data.direction);
		normal.copy( data.normal );
		lookAt.copy( data.lookAt);

		U = data.UP;
		CHECK = data.CHECK;
		rotation = data.rotation;
		objective = data.objective;

		mesh.lookAt( lookAt );
		mesh.rotateOnAxis( up, rotation );

		let p = position.clone();

		let lerp = 1;
		let look = 1;

		if( scope.CAMERA === CAMERA ){

 			lerp = scope.cameras[1].lerp
			look = 1;
		}

		CAMERA = scope.CAMERA;

		p.x += scope.cameras[ scope.CAMERA ].x;
		p.y += scope.cameras[ scope.CAMERA ].y;
		p.z += scope.cameras[ scope.CAMERA ].z;

		camera.position.lerp( p, lerp);

		
		scope.cameras[ CAMERA ].lookAt.lerp( position, look );
		camera.lookAt( scope.cameras[ CAMERA ].lookAt );

		if( CHECK ){

			stage.generate.checkpoints[objective].display.material.color = palette[4]

		}

		emit();

   	}

   	this.record = function(){

   		const data = {

   			position: position.clone(),
   			direction: direction.clone(),
   			normal: normal.clone(),
   			lookAt: lookAt.clone(),
   			UP: U,
   			rotation: rotation,
   			objective: objective,
   			check: CHECK

   		}

   		return( data );

   	}

	function align(){

		let steering = ( L && R ) ? 0 : ( L ) ? 1 : ( R ) ? -1 : 0;

		if( steering != 0 && Math.abs( step ) < ease ){

			step += steering;

		}
		else if( Math.abs( step ) > 0 ){

			step -= step / Math.abs( step );

		}

		angle = ( step / ease );

// 		angle = ( ( step / param.ease ) / param.ease );
		
		angle *= sensitivity;
		
		rotation += angle;

		rotation %= Math.PI * 2;

		direction.copy( mesh.up );
		direction.applyMatrix4( mesh.matrixWorld );
		direction.sub( position );
		direction.normalize();

		acceleration.copy( direction );

		speed = velocity.length();

	}

	function accelerate(){

		if( U && CONTACT ){

			acceleration.copy( direction ).multiplyScalar( power );

			velocity.add( acceleration );

		};

		if( D && CONTACT){

			velocity.multiplyScalar( brake );
		};

		if( CONTACT ){

			velocity.multiplyScalar( drag );

		} else {

			velocity.multiplyScalar( 0.99 );

		};

		position.add( velocity );

		mesh.position.copy( position );

	

	}

	function detect(){

		contact.copy( position );
		contact.z -= 50;

		intersects = [];

		ray.set( 0, 0, 1 );
		raycaster.far = 100;

		raycaster.set( contact, ray );

		stage.surface.raycast( raycaster, intersects );

		if( intersects.length > 0 ){

				contact.copy( intersects[0].point );

				if( position.z < contact.z && Math.abs( position.z - contact.z ) < 5 ){

					TIME = 0;
					CONTACT = true;
					normal.copy( intersects[0].face.normal );
					position.copy( contact )

				}
				else {
				
					if( !CONTACT ){

						velocity.add( gravity );

					}
					else{

						CONTACT = false;
						velocity.sub( gravity );

					}

				}

		}
		else if( intersects.length === 0 ){

				CONTACT = false;
				TIME++;
				velocity.add( gravity );

				if( TIME > TIMEOUT ){

					DNF = true;
					state.dnf();
// 					U = false;
// 					D = false;

				}

		};

		lookTarget.lerp( normal, 0.2 );

		lookAt.copy( lookTarget );
		lookAt.add( position );

		mesh.lookAt( lookAt );
		mesh.rotateOnAxis( up, rotation );

	};

	function register(){

		intersects = [];

		ray.copy( position );
		ray.sub( last );

		raycaster.far = ray.length();
		ray.normalize();

		raycaster.set( position, ray );

		stage.generate.checkpoints[objective].collision.raycast( raycaster, intersects );
		
		CHECK = false

		if( intersects.length > 0 ){

			stage.generate.checkpoints[objective].display.material.color = palette[4]

			if( objective > 0 ){

				CP[objective-1] = AT

			};

		if( objective == 4 ){

			CHECK = true

			if( AT < stage.best[3]  ){

				REWARD = 100 + Math.floor( ( stage.best[3]-AT ) * 10 )				

			}
			else{

				REWARD = 100;

			};

			YEN += REWARD

			objective = 0;
			scope.END = true;

// 			firebase.analytics().logEvent('stage_complete', { time: AT, distance: stage.generate.DISTANCE, rating: Math.round( stage.generate.DISTANCE/AT ) } );

			state.complete();

		} else if( !scope.END ) {

			CHECK = true
			objective += 1

			};
		};

		scope.SPEED = Math.round( (speed*60/1000)*3600 )

		if( scope.START && !scope.END ){

			AT = Math.floor( ( window.performance.now() - STARTTIME )/10 )/100

		}

		scope.OBJECTIVE = objective;
		last.copy( position );

	};

	function rig(){

		let lerp = ( DNF || scope.END ) ? 0.00001 : 0.1;
		const p = direction.clone();
		p.multiplyScalar( -scope.cameras[0].distance );
		p.add( mesh.position );
		p.z += scope.cameras[0].z;
		camera.position.lerp( p, lerp );

		camera.lookAt( mesh.position );

	};

	function emit(){

		// Reference control to play animation in DNF

		if( U ){

			let i = 0;
			while( i < 1 ){

				emitter.geometry.vertices[emitterCount].copy( direction )
				emitter.geometry.vertices[emitterCount].multiplyScalar( -1 - ( Math.random() * speed ) )
				emitter.geometry.vertices[emitterCount].add( position )

				emitter.geometry.vertices[emitterCount].life = emitter.geometry.vertices[emitterCount].maxLife
				const rx = Math.random()+0.5
				const ry = Math.random()+0.5
				const rz = Math.random()+0.5

				const r = -Math.random()*0.1

				emitter.geometry.vertices[emitterCount].acc.copy( direction )
				emitter.geometry.vertices[emitterCount].acc.multiplyScalar(r)

				emitterCount ++
				emitterCount %= emitter.geometry.vertices.length
				i++

			}

		}

		for( var i in emitter.geometry.vertices ){

			if(emitter.geometry.vertices[i].life > 0){

				emitter.geometry.vertices[i].add(emitter.geometry.vertices[i].acc)
				emitter.geometry.vertices[i].life -= 1
				emitter.geometry.colors[i].setHSL(0,0,emitter.geometry.vertices[i].life/100)

			}

			if(emitter.geometry.vertices[i].life === 0){

			  emitter.geometry.vertices[i].set(0,0,0)
			  emitter.geometry.vertices[emitterCount].acc.x = 0
			  emitter.geometry.vertices[emitterCount].acc.y = 0
			  emitter.geometry.vertices[emitterCount].acc.z = 0

			}

		}

		emitter.geometry.verticesNeedUpdate = true
		emitter.geometry.colorsNeedUpdate = true
		emitter.geometry.computeBoundingSphere();

	}

	const tune = function( n ){

		n = ( n < 0 ) ? 0 : ( n > 5 ) ? 5 : n;

		return( n );

	}

	this.tune = {

		power: function( n = param.power ){

			param.power = tune(n);
			power = limits.power.lo + ( ( param.power ) / 5 ) * limits.power.range; 

			},

		drag: function(  n = param.drag ){

			param.drag = tune(n);
			drag = limits.drag.hi - ( ( param.drag ) / 5 ) * limits.drag.range; 

			},

		sensitivity:

			function(  n = param.sensitivity ){

			param.sensitivity = tune(n);
			sensitivity = limits.sensitivity.lo + ( ( param.sensitivity ) / 5 ) * limits.sensitivity.range; 

			},

// 		ease:

// 			function(  n = param.ease ){

// 			param.ease = tune(n)
// 			ease = limits.ease.lo + param.ease;

// 			},

	}

	this.param = function(){

		let array = Object.assign( param , [] );

		return array;
		
	};

	this.yen = function(){

		return YEN;

	}

	this.debug = function(){

		console.log(  'ROTATION:', rotation );
	}

};