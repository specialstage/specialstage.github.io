function Vehicle(){

	// Accessible

	const scope = this;

	this.SPEED = '';
	this.TEXTTIME = '';

	this.START = false;
	this.END = false;
	this.OBJECTIVE = 0;
	this.POSITION;

	// Controls

	let U			= false;
	let D			= false;
	let L			= false;
	let R			= false;
	let ITEM		= false;
	let SLIP		= false;
	let CONTACT		= true;

	// Time parameters
	
	let DT = 60; 
	let AT = 0;
	let CP = [];
	let TIMEOUT = 20;
	let TIME = 0;
	let STARTTIME = 0;

	let REWARD = 0;
	let YEN = 0;

	let objective = 0;
	let CHECK = false;
// 	let DNF = false;

	// Initialization Parameters

	const param = {

		power:			0.5,
		drag:			0.8,
		mass:			1.0,
		brake:			1,
		sensitivity:	0.8,
		ease:			6,

	};

	const limits = {

		power:			{ lo: 0.01, hi: 0.02 },
		drag:			{ lo: 0.98, hi: 0.985 },
		brake:			{ lo: 0.98, hi: 0.95 },
		sensitivity:	{ lo: 0.05,	hi: 0.07 },
		ease:			{ lo: 6,	hi: 18 },

	};

	// Active Parameters

	let power = limits.power.lo + param.power * ( limits.power.hi-limits.power.lo );
	let drag = limits.drag.lo + ( param.drag + 0.1 ) * ( limits.drag.hi-limits.drag.lo );
	let sensitivity = limits.sensitivity.lo + ( param.sensitivity + 0.1 ) * ( limits.sensitivity.hi-limits.sensitivity.lo );
	let ease = param.ease;
	let brake = limits.brake.lo + param.brake * ( limits.brake.hi-limits.brake.lo );
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

	// Geometry

	const geometry = new THREE.EdgesGeometry( new THREE.BoxGeometry( 1, 2, 1 ) );
	const material = new THREE.MeshBasicMaterial();
	const mesh = new THREE.LineSegments( geometry, material );

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

		start.copy( _start );
		position.copy( start );
		last.copy( position );
		scene.add( mesh );
		scene.add( emitter );

		scene.fog = new THREE.FogExp2( palette[0], 0.01 );

		camera.fov = 90;
		camera.updateProjectionMatrix();

		scene.add( stage.generate.stars );

	};

	this.disconnect = function(){

		scene.remove( mesh );
		scene.remove( emitter );
		scope.reset();
		scene.fog = new THREE.FogExp2( palette[0], 0 );
		scene.remove( stage.generate.stars );

	};

	this.ready = function(){

		if( U ){

			ui.clear();
			STARTTIME = performance.now()
			AT = 0;
			scope.START = true;

		};

	};

	this.reset = function(){

		scene.remove( mesh );
		scene.remove( emitter );
		this.START = false;
		this.END = false;
		DNF = false;

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
		objective = 0;

		position.copy( start );
		last.copy( position );

		velocity.set( 0, 0, 0 );
		lookAt.set( 0, 0, 1.0 );
		mesh.lookAt( lookAt );

		rotation = 0; // Temporary Fix
		angle = 0;

		vhs.reset();
		scene.add( mesh );
		scene.add( emitter );

	};

	this.update = function(){

		if( !this.START ){

		this.ready();

		}

		if( !DNF && !scope.END ){

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

	this.display = function(){

		for( let i = 0; i < CP.length; i++ ){

			let n = i+1;
			let text = 'cp' + n;
			let cp = ui.getTextFloat( CP[i] );
			while( text.length < 16-cp.length ){

				text += ' ';

			}

			text += cp;

			ui.textbox( text , 2, 6+i*2 );

			let rank = ui.getTextFloat( ( stage.best[i]-CP[i] ), true )
			ui.textbox( rank, Math.floor(ui.xl-2-16+(16-rank.length)), 6+i*2 );

		}

	};


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
		camera.lookAt( p );

		p.x -= 20;
		p.y += 20;
		p.z += 10;

		camera.position.lerp( p, 0.05 );

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

		let steering = ( L ) ? 1 : ( R ) ? -1 : 0;

		if( ( L || R ) && Math.abs( step ) < ease ){

			step += steering;

		}
		else if( Math.abs( step ) > 0 ){

			step -= step / Math.abs( step );

		}

// 		angle = ( ( step / param.ease ) / param.ease );

		angle = ( step / param.ease);
		
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
// 				normal.copy( intersects[0].face.normal );

				if( position.z < contact.z && Math.abs( position.z - contact.z ) < velocity.z + gravity.z  + 1){

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
					MENU = true;
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

		ray.copy( last );
		ray.sub( position );
		raycaster.far = ray.length();
		ray.normalize();
		raycaster.set( position, ray );

		stage.generate.checkpoints[objective].collision.raycast( raycaster, intersects );
		CHECK = false

		if( intersects.length > 0 ){

			stage.generate.checkpoints[objective].display.material.color = palette[4]

			if( objective > 0 ){

				CP[objective-1] = AT

				scope.display()

			};

		if( objective == 4 ){

			CHECK = true

			if( AT < stage.best[3]  ){

				REWARD = Math.round( ( stage.best[3]-AT ) * 10 )				

			};

			YEN += REWARD

			objective = 0;
			scope.END = true;
			MENU = true;
			firebase.analytics().logEvent('stage_complete', { time: AT, distance: stage.generate.DISTANCE, rating: Math.round( stage.generate.DISTANCE/AT ) } );
		 
		} else if( !scope.END ) {

			CHECK = true
			objective += 1

			};
		};

		scope.SPEED = Math.round( (speed*60/1000)*3600 )

		if( scope.START && !scope.END ){

			AT = Math.floor( ( window.performance.now() - STARTTIME )/10 )/100

		}

		scope.TEXTTIME = ui.getTextFloat( AT );
		scope.OBJECTIVE = objective;

	};

	function rig(){

		let lerp = ( DNF || scope.END ) ? 0.00001 : 0.1;
		const p = direction.clone();
		p.multiplyScalar( -20 );
		p.add( mesh.position );
		p.z += 7;
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
	this.tune = function( p ){

		if( p.power != undefined && p.power > 0 && p.power < 1 ) param.power = p.power;
		if( p.drag != undefined && p.drag > 0 && p.drag < 1 ) param.drag = p.drag;
		if( p.sensitivity != undefined && p.sensitivity > 0 && p.sensitivity < 1 ) param.sensitivity = p.sensitivity;
		if( p.ease != undefined ) param.ease = p.ease;

		power = limits.power.lo + param.power * ( limits.power.hi - limits.power.lo );
		drag = limits.drag.lo + ( param.drag + 0.1 ) * ( limits.drag.hi - limits.drag.lo );
		sensitivity = limits.sensitivity.lo + ( param.sensitivity + 0.1 ) * ( limits.sensitivity.hi - limits.sensitivity.lo );
		ease = param.ease;

	};

	this.getParam = function(){

		return param;
		
	};

};