
function Generate(){

	scope = this

	this.SEED = 0
	let STEPS  = 4 // Total extrusion steps for terrain generation.
	let iterator = 0
	this.length = 480;

	const biomes = [];
	let biome = 1;

	let min_dist = 9999;

	biomes[0] = {

		name: 'forest',
		palette: palette[09],
		tree: function( x, y ){ return scope.pine(); },
		limit: Math.floor( scope.length/2 ),
		range: 5,
		map: [],
		flags: [],

	}

	biomes[0].map[0] = function( z, index ){

		let color = palette[10];
		let flag = false;

		if( Math.abs( z ) > 0.92 ){

			color = ( Math.abs( z ) > 0.92 ) ? palette[09] : palette[2];
			flag = true;

		}

		biomes[0].flags[index] = flag;

		return color;

	}

	biomes[1] = {

		name: 'sakura',
		palette: palette[12],
		tree: function(){ return scope.sakura(); },
		limit: Math.floor( scope.length * ( 1/4 ) ),
		range: 10,
		map: [],
		flags: [],

	}

	biomes[1].map[0] = function( z, index ){

		let color = palette[1];
		let flag = false;

		if( Math.abs( z ) > 0.95 ){

			color = ( Math.abs( z ) > 0.92 ) ? palette[12] : palette[1];
			flag = true

		}

		biomes[1].flags[index] = flag;
		return color;

	}

	// Reference object used to create new path segments() in this.extrude().

	const extruder = new THREE.Points( new THREE.Geometry() )
	extruder.name = 'Generative Extruder'
	extruder.visible = false

	// Stores path nodes representing each step in the path generation.
	// Generated in this.path() using this.extrude().

	const nodes = new THREE.Line( new THREE.Geometry() )
	nodes.name = 'Generative Nodes'
	nodes.visible = false
	nodes.material.color = palette[6]
	nodes.material.name = 'Node Material'
	nodes.position.z += 2;

	// Segments dividing each path step.
	// Used for rendering and as a reference for generating.
	// Generated in this.import() with this.extrude().

	const segments  = new THREE.LineSegments( new THREE.Geometry() )
	segments.name = 'Generative Segments'
	segments.visible = true
	segments.material.color = palette[3]
	segments.material.name = 'Segments Material'

	// Path surface used for collision detection.
	// Generated in this.import with this.extrude().

	const surface = new THREE.Mesh( new THREE.Geometry() )
	surface.name = 'Generative Surface'
	surface.visible = false
	surface.material.color = palette[0]
	surface.material.name = 'Surface Material'

	// Path perimeter used for rendering the path perimenter.
	// Generated in this.import() with this.extrude().

	const perimeter = new THREE.LineSegments( new THREE.Geometry() )
	perimeter.name = 'Generative Perimeter'
	perimeter.material.color = palette[1]
	perimeter.material.name  = 'Perimeter Material'

	// Terrain mesh object used for rendering and collisions.
	// Generated using this.terrain().

	const terrain = new THREE.Mesh( new THREE.Geometry(),
					new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors} ) )
	terrain.name = 'Terrain'
	terrain.material.name = 'Terrain Material'
	terrain.material.wireframe = true
	terrain.material.side = THREE.DoubleSide
	terrain.visible = true

	wireframe = new THREE.Mesh( new THREE.Geometry(),

		new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors} )
	)
	wireframe.name = 'Wireframe'
	wireframe.material.name = 'Wireframe Material'
	wireframe.material.wireframe = true
	wireframe.material.side = THREE.FrontSide
	wireframe.visible = true

	// Tree container.
	// Generated using this.trees().

	const trees = new THREE.LineSegments(

		new THREE.Geometry(),
		new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors }) );

	trees.name = 'Trees'
// 	trees.material.vertexColors= THREE.VertexColors;

	// Object used to render background behind wireframes.
	// Helps reduce the visual noise of layered wireframe lines.

	const background = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshBasicMaterial() )
	background.name = 'Background'
	background.material.color = palette[0]
	background.material.name = 'Background Material'
	background.material.wireframe = false
	background.material.side = THREE.FrontSide
	background.material.opacity = 0.75
	background.material.blendMode = THREE.MultiplyBlending
	background.material.transparent = true

	// A simple star field.

	const stars = new THREE.Points( new THREE.Geometry() )
	stars.material.color = palette[1]
	stars.material.sizeAttenuation = false
	stars.material.size = 1.5
	stars.material.fog = false

	scope.stars = stars;

	// Collision mesh container.
	// As new collision objects are generated they are added.

	const collision = new THREE.Mesh( new THREE.Geometry() )
	collision.name = 'Collision Mesh'
	collision.visible = true
	collision.material.color = palette[3]
	collision.material.name = 'Collision Material'
	collision.material.side = THREE.BackSide

	// Container for generated checkpoints

	this.checkpoints = []

	// Targets used for the extruder object.

	const up 	= new THREE.Vector3( 0, 0, 1 );
	const pitch = new THREE.Vector3( 1, 0, 0 );
	const roll 	= new THREE.Vector3( 0, 1, 0 );
	const yaw 	= new THREE.Vector3( 0, 0, 1 );

	const direction = new THREE.Vector3( 0, 3, 0 );
	const normal	= new THREE.Vector3( 0, 0, 1 );

	const nodesBuffer     = nodes.geometry.clone()
	const surfaceBuffer   = surface.geometry.clone()
	const segmentsBuffer  = segments.geometry.clone()
	const perimeterBuffer = perimeter.geometry.clone()

	// Used to store lane width values and extrusion targets.

	const lane = []
	const laneNormal = []
	const lastNormal = new THREE.Vector3()

	// Initial lane size parameters and normals.

	lane[0] = new THREE.Vector3(  4, 3, 0 )
	lane[1] = new THREE.Vector3( -4, 3, 0 )

	laneNormal[0] = lane[0].clone()
	laneNormal.z += 1

	laneNormal[1] = lane[1].clone()
	laneNormal.z += 1

	// Angle grid used for stepping angle and slope incrementally
	// Used in this.path and this.extrude

	const slope_step = Math.PI/64
	const angle_step = Math.PI/32

	// Used to store generated path extrusion instructions.

	let instructions = []
	let timer   = 0
	let framecount = 0
	let timeout = 50000
	let loadtime = 0

	// The translation to center the stage and the start position.

	let translate = new THREE.Vector3()
	this.start	= new THREE.Vector3()

	// Booleans used to communicate generation status.

	let END			= false
	let PATH		= false
	let GENERATE	= false
	let IMPORT		= false

	this.END = false
	this.IMPORT = false
	this.DISTANCE = 0

	// Heuristic used to generate intial stage challenge times

	let HEURISTIC	= 18

	const raycaster = new THREE.Raycaster()
	raycaster.far = 800

	// Initial Extruder settings

	extruder.geometry.vertices[0] = direction.clone()
	extruder.geometry.vertices[1] = up.clone().add(direction)
	extruder.geometry.vertices[2] = lane[0].clone()
	extruder.geometry.vertices[3] = lane[1].clone()
	extruder.geometry.vertices[4] = laneNormal[0].clone()
	extruder.geometry.vertices[5] = laneNormal[1].clone()

	this.connect = function(){

		scope.SEED = SEED

// 		biome = scope.randomInt(0,2);

		scene.add( extruder )
		scene.add( nodes )
		scene.add( segments )
		scene.add( perimeter )
		scene.add( surface )
		scene.add( wireframe )
		scene.add( background )

		loadtime = window.performance.now()
		window.setTimeout( scope.generate, 0 )

	}

	this.disconnect = function(){

		instructions = []
		
		scene.remove( extruder )
		scene.remove( nodes )
		scene.remove( segments )
		scene.remove( perimeter )
		scene.remove( surface )
		scene.remove( wireframe )
		scene.remove( background )
		scene.remove( trees )

		for( let b in biomes ){

			biomes[b].flag = []

		}

		for( let i in scope.checkpoints ){

			scene.remove( scope.checkpoints[i].display )

			scope.checkpoints[i].display.geometry.dispose()
			scope.checkpoints[i].collision.geometry.dispose()

		}

	}

	this.complete = function(){

		// Clean up collision geometry

		collision.geometry.mergeVertices()
		collision.geometry.verticesNeedUpdate = true
		collision.geometry.elementsNeedUpdate = true
		collision.geometry.computeFaceNormals()
		collision.geometry.computeBoundingSphere()

		wireframe.geometry.mergeVertices()
		wireframe.geometry.verticesNeedUpdate = true
		wireframe.geometry.elementsNeedUpdate = true
		wireframe.geometry.computeFaceNormals()
		wireframe.geometry.computeBoundingSphere()

		// Create background render object.

		background.geometry.copy( collision.geometry )
		background.position.z -= 1

		scene.add( background )

		// Create starfield.

		const buffer = new THREE.IcosahedronGeometry(1200,4)

		for( let i in buffer.vertices ){

			let random = scope.random()

			if( random < 0.3 && buffer.vertices[i].z > -400 ){

				stars.geometry.vertices.push( buffer.vertices[i].clone() )

			}
		}

		buffer.dispose()
		stars.geometry.computeBoundingSphere()

		// Register collision object.

		stage.surface = collision.clone()
		stage.start   = scope.start.clone()
		loadtime = window.performance.now()-loadtime

		// firebase.analytics().logEvent('stage_generation_complete', { time: Math.round(loadtime/1000) } )

			END = true
			scope.END = true

			state.ready();

// 		window.setTimeout( function(){ stage.reset() }, 10000 );

	}

	this.reset = function(){

		HEURISTIC	= ( 36+scope.random()-0.5 )/2
		iterator = 0
		timer = 0
		framecount = 0

		nodes.geometry.dispose()
		segments.geometry.dispose()
		surface.geometry.dispose()
		extruder.geometry.dispose()
		perimeter.geometry.dispose()
		terrain.geometry.dispose()
		wireframe.geometry.dispose()
		collision.geometry.dispose()
		trees.geometry.dispose()
		stars.geometry.dispose()
		
		segmentsBuffer.dispose()
		perimeterBuffer.dispose()
		nodesBuffer.dispose()
		surfaceBuffer.dispose()

		segmentsBuffer.copy( new THREE.Geometry() )
		perimeterBuffer.copy( new THREE.Geometry() )
		nodesBuffer.copy( new THREE.Geometry() )
		surfaceBuffer.copy( new THREE.Geometry() )

		nodes.geometry.copy( new THREE.Geometry() )
		extruder.geometry.copy( new THREE.Geometry() )
		segments.geometry.copy( new THREE.Geometry() )
		perimeter.geometry.copy( new THREE.Geometry() )
		surface.geometry.copy( new THREE.Geometry() )
		terrain.geometry.copy( new THREE.Geometry() )
		collision.geometry.copy( new THREE.Geometry() )

		direction.set( 0, 3, 0 )

		normal.set( 0, 0, 1 )

		lane[0] = new THREE.Vector3(  4, 3, 0 )
		lane[1] = new THREE.Vector3( -4, 3, 0 )

		if( END ){

		END		 = false
		PATH	 = false
		GENERATE = false
		IMPORT	 = false
		
		}

		this.END = false

		extruder.position.set(0,0,0)

		extruder.geometry.vertices[0] = direction.clone()
		extruder.geometry.vertices[1] = up.clone().add(direction)
		extruder.geometry.vertices[2] = lane[0].clone()
		extruder.geometry.vertices[3] = lane[1].clone()
		extruder.geometry.vertices[4] = laneNormal[0].clone()
		extruder.geometry.vertices[5] = laneNormal[1].clone()

		extruder.geometry.verticesNeedUpdate = true

	}

	this.generate = function(){
			
			scope.path();

	}

	// Begin Path Generation function

	this.path = function(

			index		= 0,
			angle		= 0,
			slope		= 0,
			sign		= 0,
			rotation	= 0,
			section		= { start: 0, end: 30, angle: 0, slope: 0 },
			history		= [],
			decisions	= [],
			backtrack	= false,

		){

		let DEBUG = true;

		let RESET = false;

		let time = window.performance.now();
		
		let dt   = 0;

		if( sign === 0 ){

			let rn = scope.random();

			sign = ( rn > 0.5 ) ? 1 : -1;

		}

		while( dt < 32 && !PATH ){

			let spacing  = 10;
			
			let threshold = 18;

			if( index === section.end+1 ){

				decisions = [];
				
				for( let d = 0; d < 1; d++ ){

					if( angle === 0 ){

						let a = scope.randomInt( 2,4 ) * sign;

						let limit = Math.floor( Math.abs( 36 / a ) );
						let s = 0;

						sign = ( scope.random() < 0.01 ) ? sign*1 : sign*-1;

						let end = scope.randomInt( 1, limit );

						decisions.push( { angle: a, slope: s, end: end } )

					}
					else{

						let a = 0;

						let s = scope.randomInt( -5, -1);

						s = ( scope.random() < 0.2 ) ? s *= -1 : s;

						let end = scope.randomInt( 2, 20 );

						decisions.push( { angle: a, slope: s, end: end } )

					}

				}

				let rn = scope.randomInt( 0, decisions.length );

				angle = decisions[rn].angle;
				slope = decisions[rn].slope;
				section.start = index;
				section.end = index + decisions[rn].end;

				decisions = decisions.slice( rn,1 );

			}

			// Extrude new path node & push instructions
			if( !backtrack && !RESET ){

				scope.extrude( angle, slope );

				instructions.push( { angle: angle, slope: slope } );

				nodesBuffer.verticesNeedUpdate = true;

				index++;

			}
			if( index >= spacing && !backtrack ){

				let position = new THREE.Vector2(

					nodesBuffer.vertices[ index-1 ].x,
					nodesBuffer.vertices[ index-1 ].y );

				for( let i = 0; i < nodesBuffer.vertices.length-1-spacing; i++ ){

					let target = new THREE.Vector2(

					nodesBuffer.vertices[ i ].x,
					nodesBuffer.vertices[ i ].y );

					let distance = target.distanceTo( position );

					if( distance < threshold ){

						backtrack = true;

						break;

					}

				}

				if( backtrack ){

					window.setTimeout( stage.reset( true ), 0 );

				}


			}

			if( DEBUG ){

				scene.remove( nodes );

				nodes.geometry.dispose();
				nodes.geometry = nodesBuffer.clone();
				nodes.geometry.computeBoundingSphere();

				scene.add( nodes );

// 					let cam = nodes.geometry.vertices[nodes.geometry.vertices.length-1].clone();

// 					cam.z += 900;

// 					camera.position.copy( cam )

			}

			if( index >= scope.length ){

				PATH = true // Signal path completion.

				nodes.geometry.dispose()
				nodes.geometry = nodesBuffer.clone()
				nodes.geometry.computeBoundingSphere()
				nodes.geometry.center()
				nodes.updateMatrixWorld()

				if( nodes.geometry.vertices.length > 0 ){

					translate.copy( nodes.geometry.vertices[0] )
					translate.sub( nodesBuffer.vertices[0] )

				}

				window.setTimeout( function(){ scope.import() }, 0 );
				console.log( 'IMPORT' )

			}
			
			dt = window.performance.now() - time;
		}

// 		renderer.render( scene, camera );
		if( !PATH && !backtrack ){ window.setTimeout(

			scope.path,
			0,
			index,
			angle,
			slope,
			sign,
			rotation,
			section,
			history,
			decisions,
			backtrack

		); }
		else if( backtrack ) {

// 			window.setTimeout( stage.reset(), 0 );
		}

	}

	this.import = function( index = 0 ){

		let time = window.performance.now();
		let dt = 0;

		while( !IMPORT && dt < 32 ){

			if( index === 0 ){

				extruder.position.set(0,0,0)
				extruder.rotation.z = 0;
				direction.set( 0,3,0 );

				extruder.geometry.vertices[0] = direction.clone()
				extruder.geometry.vertices[1] = up.clone().add(direction)
				extruder.geometry.vertices[2] = lane[0].clone()
				extruder.geometry.vertices[3] = lane[1].clone()
				extruder.geometry.vertices[4] = laneNormal[0].clone()
				extruder.geometry.vertices[5] = laneNormal[1].clone()

				extruder.geometry.verticesNeedUpdate = true

				extruder.updateMatrixWorld();

			}

			if( index < instructions.length ){

				angle = instructions[index].angle;
				slope = instructions[index].slope;

				scope.extrude( angle, slope )

				segments.geometry.dispose()
				segments.geometry = segmentsBuffer.clone()
				segments.geometry.computeBoundingSphere()

				perimeter.geometry.dispose()
				perimeter.geometry = perimeterBuffer.clone()
				perimeter.geometry.computeBoundingSphere()

				surface.geometry.dispose()
				surface.geometry = surfaceBuffer.clone()
				surface.geometry.computeBoundingSphere()

				index++

			}

			else if( !IMPORT && index === instructions.length ){

			// Generate checkpoints.

				scope.checkpoints = scope.checkpoint()

				// Add checkpoints to scene.

				for( let i in scope.checkpoints ){

					scene.add( scope.checkpoints[i].display )

				}

				IMPORT = true

				window.setTimeout( scope.terrain, 0, true )

			}

			dt = window.performance.now() - time;

		}

		if( !IMPORT ){

			window.setTimeout( scope.import, 0, index, angle, slope );

		}


	} // End this.import()

	this.extrude = function( angle = 0, slope = 0 ){

		extruder.updateMatrixWorld();

		extruder.rotateZ( angle * angle_step );

		for( let i in extruder.geometry.vertices ){

			extruder.geometry.vertices[i].applyAxisAngle( pitch, slope * slope_step );

		}

		extruder.geometry.verticesNeedUpdate = true

		const a = extruder.geometry.vertices[0].clone();
		const b = extruder.geometry.vertices[2].clone();
		const c = extruder.geometry.vertices[3].clone();

		const normal = extruder.geometry.vertices[1].clone();

		a.applyMatrix4( extruder.matrix );
		b.applyMatrix4( extruder.matrix );
		c.applyMatrix4( extruder.matrix );

		normal.applyMatrix4( extruder.matrix );
		normal.sub(a);

		if( PATH ){

			b.add( translate );
			c.add( translate );

		if ( segmentsBuffer.vertices.length > 0 ) {

			const d = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 1].clone().sub( lastNormal );
			const e = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 2].clone().sub( lastNormal );

			surfaceBuffer.vertices.push(b.clone().sub( normal ));
			surfaceBuffer.vertices.push(c.clone().sub( normal ));
			surfaceBuffer.vertices.push(e);

			surfaceBuffer.vertices.push(c.clone().sub( normal ) );
			surfaceBuffer.vertices.push(d);
			surfaceBuffer.vertices.push(e);

			const collision_a = b.clone(); //.add( normal )
			const collision_b = c.clone(); //.add( normal )
			const collision_c = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 1].clone() //.add( lastNormal )
			const collision_d = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 2].clone() //.add( lastNormal )

			collision.geometry.vertices.push( collision_a );
			collision.geometry.vertices.push( collision_b );
			collision.geometry.vertices.push( collision_d );

			collision.geometry.vertices.push( collision_b );
			collision.geometry.vertices.push( collision_c );
			collision.geometry.vertices.push( collision_d );

			let length = surfaceBuffer.vertices.length;

			surfaceBuffer.faces.push(new THREE.Face3(length - 3, length - 2, length - 1));
			surfaceBuffer.faces.push(new THREE.Face3(length - 5, length - 4, length - 6));
			
			collision.geometry.faces.push(new THREE.Face3(length - 3, length - 2, length - 1));
			collision.geometry.faces.push(new THREE.Face3(length - 5, length - 4, length - 6));

		}

		if ( perimeterBuffer.vertices.length > 0 ) {

			let n1 = 2
			let n2 = 1

				if( perimeterBuffer.vertices.length > 4 ){
				n1 = 4
				n2 = 2
				}

				let p1 = perimeterBuffer.vertices[ perimeterBuffer.vertices.length - n1 ].clone();
				let p2 = perimeterBuffer.vertices[ perimeterBuffer.vertices.length - n2 ].clone();

				perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) );
				perimeterBuffer.vertices.push( p1.clone() )

				perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) );
				perimeterBuffer.vertices.push( p2.clone() )

				if( iterator == instructions.length-1 ){

					perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) );
					perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) );

				}

			}

			else {

			perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) );
			perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) );

			}

			segmentsBuffer.vertices.push( b.clone() );
			segmentsBuffer.vertices.push( c.clone() );

			lastNormal.copy( normal );
		}

		else{

			nodesBuffer.vertices.push( a.clone() );

		}

		direction.copy(a).sub( extruder.position );

		extruder.position.add( direction );
		for( let i in extruder.geometry.vertices ){

			extruder.geometry.vertices[i].applyAxisAngle( pitch, slope * -1 * slope_step );

		}
// 		extruder.updateMatrixWorld();

	} // End this.extrude()

	this.terrain = function(

		init 		= true,
		buffer 		= [],
		vertices 	= [],
		target 		= [],
		index 		= 0,
		side 		= 0,
		vert 		= 0

		){

		// Needed to reset terrain geometry.

		if( init ){

			segments.updateMatrixWorld();

			terrain.geometry.dispose()
			terrain.geometry.copy( new THREE.Geometry() )

			buffer   = [] // List buffer vertices by index.
			vertices = [] // List of active vertices.
			target   = [] // List of extrusion targets.

			// Edges are split into two sides for easier referencing.

			for( let s = 0; s < 2; s++ ){

				target[s] = []
				buffer[s] = []
				vertices[s] = []

			}

			// Create initial list of edge vertices by using the previously generated segments geometry.

			for( let v = 0; v < segments.geometry.vertices.length; v++ ){

				let s = v%2
				vertices[s].push( segments.geometry.vertices[v] )

			}

			// Create initial extrusion targets by mirroring the shared edge vertices in the same segment.

			for( let s = 0; s < 2; s++ ){
			for( let i = 0; i < vertices[s].length; i++ ){

				let n = ( s === 0 ) ? 1 : -1

					let t = vertices[s][i].clone()
					t.sub( vertices[s+n][i] )

					t.normalize().multiplyScalar(3)

				target[s][i] = (t.clone())

			}
			}

		// End Initialization

		}

		// Begin mesh growth. STEPS is how many extrusion steps away from the path.
		// As STEPS increases, the generation time increases exponetially... ):

		let dt = 0;
		let time = window.performance.now();

		if( index < STEPS ){

			terrain.geometry.verticesNeedUpdate = true
			terrain.geometry.elementsNeedUpdate = true
			terrain.geometry.computeBoundingSphere()
			terrain.geometry.computeFaceNormals()
			terrain.geometry.computeVertexNormals()
			terrain.updateMatrixWorld()

		// Iterate through each side

// 		for( side = 0; side < 2; side++ ){

			// Copy buffer to active edge vertices

			if( index > 0 && vert === 0 ){

				vertices[side] = []

				for( let v = 0; v < buffer[side].length; v++ ){

					vertices[side][v] = terrain.geometry.vertices[buffer[side][v]]

				}

			}

			if( vert === 0 ){

				// Carry over extrusion targets from previous iteration.

// 				target[side] = target[side].slice()

				// Clear the buffer.

				buffer[side] = []

			}

			// Iterate through active edge vertices

			v = vert

			while( v < vertices[side].length && dt < 32 ){

// 				target[s][v].z -= i/5 // Apply a slight slope away from the path.

				let flag = false // flag intersecting vertices

				// Skip face generation if vertices is undefined.

				if( vertices[side][v] !== undefined && vertices[side][v-1] !== undefined ){

					// Ignore undefined targets as they previously intersected the terrain.

					if( target[side][v] === undefined ){

						target[side][v] = target[s][v-1].clone()

					}

					// Pre-check if the target will intersect the existing terrain geometry.

					else{

						terrain.geometry.computeBoundingSphere()

						let location = vertices[side][v].clone().add( target[side][v] )
						location.z -= 100
						
						raycaster.set( location, up )

						location.z += 100 // Reset location for distance checking.

						let intersects = raycaster.intersectObjects( [ terrain ], true )

						if( intersects.length > 0 ){

							for( let intersect in intersects ){

								if( intersects[intersect].point.distanceTo( location ) > 0.01 ){

								buffer[side][v] = undefined // Ignore vertices with intersecting targets.
								flag		 = true		 // flag intersecting target.

								}

							}

						}

					}

					// Push a new face for the first half of a quadstrip if target does not intersect terrain geometry.
					
					if( !flag ){

						terrain.geometry.vertices.push( vertices[side][v].clone() )
						terrain.geometry.vertices.push( vertices[side][v].clone().add( target[side][v]) )

						buffer[side][v] = terrain.geometry.vertices.length-1

						if( v > 0  ){

						terrain.geometry.vertices.push( vertices[side][v-1].clone() )
						const length = terrain.geometry.vertices.length

							if( side === 0 ){

								terrain.geometry.faces.push( new THREE.Face3( length-2, length-1, length-3 ) )

							}
							else if( side === 1 ){

								terrain.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )

							}

						}
					
					} // End first quadstrip face creation.

				} // End vertices type checking.	

				dt = window.performance.now() - time;
				v++
				vert = v

			} // End edge vertices iteration.

			if( vert === vertices[side].length ){

			vert = 0;

			// Iterate through edge buffer to pre-validate edge distances.

			for( let v = 1; v < buffer[side].length; v++ ){

				// Ignore undefined buffer vertices as they have previously had intersecting targets.

				if( buffer[side][v] !== undefined && buffer[side][v-1] !== undefined ){

					let a = terrain.geometry.vertices[ buffer[side][v] ]
					let b = terrain.geometry.vertices[ buffer[side][v-1] ]

					// Decimate buffer edge if below the distance threshold by merging vertices and ignoring the second quadstrip face.

					if ( a.distanceTo(b) < 2.8 ){

						a.copy(b)
						buffer[side][v] = buffer[side][v-1]
						target[side][v].copy( target[side][v-1] )

					}

					// Else add a new vertices and push a new face to fill the quadstrip.

					else if ( v > 1 ){

						terrain.geometry.vertices.push( vertices[side][v-1] )

						let a = ( side === 0 ) ? buffer[side][v  ] : buffer[side][v-1]
						let b = ( side === 0 ) ? buffer[side][v-1] : buffer[side][v  ]

						terrain.geometry.faces.push(

							new THREE.Face3( a, b, terrain.geometry.vertices.length-1 )

						)


					} // End decimate/face fill.

				} // End buffer type check.	


			} // End buffer iteration

			side++

			} // End vert check

			
		// } // End side iteration.

		if( side > 1 ){

		side = 0;
		index++;

		}
		
		} // End step iteration.

		if( index === STEPS ){

			// Signal terrain geometry updates.

// 			scene.remove( terrain )

			terrain.geometry.verticesNeedUpdate = true
			terrain.geometry.elementsNeedUpdate = true
			terrain.geometry.colorsNeedUpdate = true
			terrain.geometry.computeFaceNormals()
			terrain.geometry.computeVertexNormals()
			terrain.geometry.mergeVertices()
			terrain.geometry.computeBoundingSphere()

			scope.noise( terrain.geometry )

			// Copy terrain faces to collision mesh.

			for( let i = 0; i < terrain.geometry.faces.length; i++ ){

				let a = terrain.geometry.vertices[ terrain.geometry.faces[i].a ].clone()
				let b = terrain.geometry.vertices[ terrain.geometry.faces[i].b ].clone()
				let c = terrain.geometry.vertices[ terrain.geometry.faces[i].c ].clone()

				let c1 = terrain.geometry.colors[ terrain.geometry.faces[i].a ]
				let c2 = terrain.geometry.colors[ terrain.geometry.faces[i].b ]
				let c3 = terrain.geometry.colors[ terrain.geometry.faces[i].c ]

				collision.geometry.vertices.push( a )
				collision.geometry.vertices.push( b )
				collision.geometry.vertices.push( c )

				wireframe.geometry.vertices.push( a )
				wireframe.geometry.vertices.push( b )
				wireframe.geometry.vertices.push( c )

				let length = collision.geometry.vertices.length

				collision.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )
				wireframe.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )

			}

			wireframe.geometry.copy( terrain.geometry )
			wireframe.geometry.computeVertexNormals();

			scope.biome() // Add some trees and color.

			window.setTimeout( scope.complete, 0 ) // Enqueue stage generate completion.

			} else {

				// Callback to reinitialize loading loop between animation frames.

				window.setTimeout( function(){ scope.terrain( false, buffer.slice(), vertices.slice(), target.slice(), index, side, vert ) }, 0 );

			}

	} // End this.terrain()

	this.biome = function(){

		let b = biome;

		let flags = [];

		const faces = wireframe.geometry.faces

		let buffer = [];
		let positions = [];

		// Map terrain colors and create initial biome flags for tree placement

		for( let i = 0; i < faces.length; i++ ){

			for( let m = 0; m < biomes[biome].map.length; m++ ){

				faces[i].vertexColors[0] = biomes[biome].map[m]( faces[i].vertexNormals[0].z, faces[i].a );
				faces[i].vertexColors[1] = biomes[biome].map[m]( faces[i].vertexNormals[1].z, faces[i].b );
				faces[i].vertexColors[2] = biomes[biome].map[m]( faces[i].vertexNormals[2].z, faces[i].c );

			}

		}

		// Remove flags too close to Surface

		for( let i = 0; i < biomes[biome].flags.length; i++ ){

			for( let v = 0; v < segments.geometry.vertices.length; v++ ){

				if( wireframe.geometry.vertices[i].distanceTo( segments.geometry.vertices[v] ) < 0.1 ){

					biomes[biome].flags[i] = false

				}

			}

		}

		for( let i = 0; i < biomes[biome].flags.length; i++ ){

			if( biomes[biome].flags[i] ) buffer.push( i );
		
		}

		// PLACE TREES
		let t = 0;

		while( t < biomes[biome].limit && t < buffer.length ){

			let rn = scope.randomInt( 0, buffer.length );
			let distance = true;

			if( positions.length > 0 && buffer.length > 0 ){

				while( distance ){

					for( let p in positions ){

						if( wireframe.geometry.vertices[ buffer[rn] ].distanceTo(

							wireframe.geometry.vertices[ positions[p] ] ) < biomes[biome].range ){

							distance = true;
							buffer.slice( rn, 1 );
							rn = scope.randomInt( 0, buffer.length );

							break

						}
						else{

							distance = false;

						}

					}
					
					if( buffer.length <= 0 ){ distance = false }

				}

			}

			if( buffer.length > 0 ){

				let tree = biomes[b].tree();

				for( let v in tree.vertices ){

					trees.geometry.vertices.push(

						tree.vertices[v].clone().add( wireframe.geometry.vertices[ buffer[rn] ] )

					);

					trees.geometry.colors[ trees.geometry.vertices.length-1 ] = ( tree.colors[v] );

				}

				positions.push( buffer[rn]  );
				buffer.slice( rn, 1 );

			}

			t++

		}
		

		// Add Trees

		trees.verticesNeedUpdate = true;
		trees.elementsNeedUpdate = true;

		scene.add( trees );

	} // End this.biome

	this.sakura = function(){

		let geometry = new THREE.Geometry();

		let branches = [];
		let nodes = [];

		let factor = 4;
		let size = 3;
		let scale = 1;

		let a = new THREE.Vector3(0,0,0);
		let b = new THREE.Vector3( 0, 0, size );

		let angle = 12;

		let generation = 0;

		let pitch	= new THREE.Vector3( 1,0,0 );
		let roll	= new THREE.Vector3( 0,0,1 );

		geometry.vertices.push( a );
		geometry.vertices.push( b );

		geometry.colors.push( palette[2] );
		geometry.colors.push( palette[2] );

		nodes.push( { v: b.clone(), n: b.clone(), pitch: pitch.clone(), roll: roll.clone() } )

		let flowers = [];

		while( generation < factor ){

			let buffer = [];
			
			// SPLIT STARTING NODE

			for( let n = 0; n < nodes.length; n++ ){

			let limit = 3;
			let b = 0;

			for( let i = 0; i < limit; i++ ){

			let rn = ( generation === 0 && i === limit-1 &&  b < 1 ) ? 1 : scope.random();

				if( rn > 0.2){

					rn = scope.randomInt( -2, 2 );
// 					rn = 0;

					let normal = nodes[n].n.clone();
					let color = palette[2];

						normal.applyAxisAngle( nodes[n].pitch, Math.PI * 2 / ( angle + rn ) )
						normal.applyAxisAngle( nodes[n].roll, ( Math.PI * 2 / limit ) * i  );

						normal.multiplyScalar( scale );

						let d = normal.clone().add( nodes[n].v )

						geometry.vertices.push( nodes[n].v.clone() );
						geometry.vertices.push( d );

						geometry.colors.push( color );
						geometry.colors.push( color );

						let p = nodes[n].pitch.clone();

						p.applyAxisAngle( nodes[n].roll, ( Math.PI * 2 / 3 ) * i  );
						p.applyAxisAngle( nodes[n].pitch, Math.PI * 2 / angle );

						let r = nodes[n].roll.clone();

						r.applyAxisAngle( nodes[n].pitch, Math.PI * 2 / angle );
						r.applyAxisAngle( nodes[n].roll, ( Math.PI * 2 / 3 ) * i );

						branches.push( { a: d.clone(), b: nodes[n].v.clone(), pitch: p, roll: r  } );

						buffer.push( { v: d.clone(), n: normal.clone(), pitch: p, roll: r } );
						b++;
						
				}
				else if( b === 0 && i === limit-1){

					flowers.push( { v: nodes[n].v.clone(), n: nodes[n].n.clone(), pitch: nodes[n].pitch.clone(), roll: nodes[n].roll.clone() } )

				}

			}

			}

			nodes = buffer.slice();

				scale *= 0.9;
// 				angle -= 1
				generation++;
				
		}

		// BRANCH PASS

		angle = 6;

		for( let i in branches ){

				let a = branches[i].a.clone();
				let b = branches[i].b.clone();

				let normal = a.clone().sub(b);

				let position = normal.clone().multiplyScalar( 0.1 ).add(b);
				let rn = scope.randomInt(0,3) - 1

				normal.applyAxisAngle( branches[i].pitch, Math.PI * 2 / ( angle ) )
				normal.applyAxisAngle( branches[i].roll, ( Math.PI * 2 / rn )  );

				normal.multiplyScalar( 0.5 );

				let c = position;
				let d = normal.clone().add( position );

				geometry.vertices.push( c );
				geometry.vertices.push( d );

				geometry.colors.push( palette[2] );
				geometry.colors.push( palette[2] );

				let p = branches[i].pitch.clone();

				p.applyAxisAngle( branches[i].roll, ( Math.PI * 2 / rn ) );
				p.applyAxisAngle( branches[i].pitch, Math.PI * 2 / angle );

				let r = branches[i].roll.clone();

				r.applyAxisAngle( branches[i].pitch, Math.PI * 2 / angle );
				r.applyAxisAngle( branches[i].roll, ( Math.PI * 2 / rn ) );

				nodes.push( { v: d.clone(), n: normal.clone(), pitch: p, roll: r } )
							
		}

		nodes = nodes.concat( flowers );

		// FLOWER PASS

		for( let n = 0; n < nodes.length; n++ ){

		let limit = 5;

		for( let i = 0; i < limit; i++ ){

			let normal = nodes[n].n.clone();
			normal.normalize();

				normal.applyAxisAngle( nodes[n].pitch, Math.PI * 2 / 6 );
				normal.applyAxisAngle( nodes[n].roll, ( Math.PI * 2 / limit ) * i  );

				normal.multiplyScalar( 0.5);

				let c = normal.add( nodes[n].v );
				let d = nodes[n].v.clone();

				geometry.vertices.push( c );
				geometry.vertices.push( d );

				geometry.colors.push( palette[12] );
				geometry.colors.push( palette[12] );

		}
		}

		geometry.colorsNeedUpdate = true;

		// Create a list of open branches

		return geometry;

	}

	this.pine = function(){

			const scale = 1
			const segments   = Math.floor(scope.random()*8)+6
			const branch = 6
			const angle = (Math.PI*2)/branch
			const weight = 0.3
			const base = 1

			const tree = new THREE.Geometry()

			tree.vertices.push(new THREE.Vector3(0,0,0))
			tree.vertices.push(new THREE.Vector3(0,0,segments*scale-scale/2+base))

			tree.colors.push( palette[9] );
			tree.colors.push( palette[9] );
			tree.colors.push( palette[9] );

			for ( let s = 1; s < segments; s++ ){
			for ( let b = 0; b < branch; b++ ){

				off = angle*((s%2)*0.5)

				tree.vertices.push(new THREE.Vector3(0,0,s*scale+base))
				tree.vertices.push(new THREE.Vector3((segments-s)*0.3,0,s*scale-weight+base))
				tree.vertices[tree.vertices.length-1].applyAxisAngle(up, angle*b+off)

				tree.colors.push( palette[9] );
				tree.colors.push( palette[9] );

			}
			}

			return(tree)

	}

	this.checkpoint = function(){

		const geometry = segments.geometry

		const length = geometry.vertices.length-( 80 )
		const offset = 40
		const i = ( Math.floor(length/4) - Math.floor(length/4)%2 )

		const array = []

		array[0] = checkpoint(geometry.vertices[offset],geometry.vertices[offset+1], 0)
		array[1] = checkpoint(geometry.vertices[i+offset],geometry.vertices[i+1+offset], 1)
		array[2] = checkpoint(geometry.vertices[i*2+offset],geometry.vertices[i*2+1+offset], 2)
		array[3] = checkpoint(geometry.vertices[i*3+offset],geometry.vertices[i*3+1+offset], 3)
		array[4] = checkpoint(geometry.vertices[i*4+offset],geometry.vertices[i*4+1+offset], 4)

		this.DISTANCE = ( (i*4)/2 )*3
		
		scope.start.copy(geometry.vertices[offset-4])
		scope.start.sub(geometry.vertices[offset-4+1])
		scope.start.multiplyScalar(-0.75)
		scope.start.add(geometry.vertices[offset-4])

		// Distances from start to each checkpoint

		let d1 = i
		let d2 = i*2
		let d3 = i*3
		let d4 = i*4

		// Create time objectives

		for( let k = 0; k < 4; k++ ){

			if( CHALLENGE ){

				stage.best[k] = OBJECTIVES[k]

			}
			else{

				stage.best[k] = ( i*( k+1 ) )/( HEURISTIC )

			}

		}

		state.target();

		// Generate checkpoint collision object and render object.

		function checkpoint(v1, v2, i){

			const geometry = new THREE.Geometry()

			const d = new THREE.Vector3().copy(v1).sub(v2)

			const a = new THREE.Vector3().copy(v1).add( d.clone().multiplyScalar(1.5) )
			const b = new THREE.Vector3().copy(v2).sub( d.clone().multiplyScalar(1.5) )

			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z-12) )
			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z+12) )
			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z+12) )

			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z+12) )
			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z-12) )
			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z-12) )

			geometry.faces.push(new THREE.Face3(0,1,2))
			geometry.faces.push(new THREE.Face3(3,4,5))

			const lines = new THREE.Geometry()

			let z1 = 6;
			let z2 = 8;

			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+z1) )
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+z2) )

			lines.vertices.push( new THREE.Vector3(v2.x,v2.y,v2.z+z1) )
			lines.vertices.push( new THREE.Vector3(v2.x,v2.y,v2.z+z2) )

			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+z1) )
			lines.vertices.push( new THREE.Vector3(v2.x,v2.y,v2.z+z1) )

			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+z2) )
			lines.vertices.push( new THREE.Vector3(v2.x,v2.y,v2.z+z2) )
			
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+1) )
			lines.vertices.push( new THREE.Vector3(v2.x,v2.y,v2.z+1) )

			const material = new THREE.MeshBasicMaterial({

				side: THREE.DoubleSide, wireframe: false, fog: true })

			material.color = palette[5]
			const mesh = new THREE.Mesh(geometry, material)
			mesh.visible = true

			const display = new THREE.LineSegments(lines, material)

			mesh.name = 'Objective ' + i
			display.name = 'Checkpoint' + i
// 			scene.add( mesh )
			return { display: display, collision: mesh }

		} // End checkpoint()

		return array

	} // End this.checkpoint()

	this.resetCheckpoints = function(){
		
		for( let i in scope.checkpoints ){

			scope.checkpoints[i].display.material.color = palette[5]

		}

	} // End this.resetCheckpoints()

	this.random = function(){

		SEED = ( SEED + 1 ) % 2147483647

		let n = Math.sin(SEED) * 10000;
		n -= Math.floor( n )

		return n

	} // End this.random()

	this.randomInt = function( lo, hi ){

		return Math.floor( scope.random()*( hi-lo ))+lo

	} // End this.randomInt()

	this.noise = function( geometry ){

	const perlin = new ImprovedNoise()
	const noise = []
	let quality = 8

	let hi = 0
	let lo = 0
	const z = scope.random()*1000
	let factor = 0.5

	for (let i = 0; i < geometry.vertices.length; i++) {

	  noise[i] = 0

	}

	for (let r = 0; r < 2; r++) {
	for (let i = 0; i < geometry.vertices.length; i++) {

		let x = geometry.vertices[i].x
		let y = geometry.vertices[i].y

		noise[i] += Math.floor(perlin.noise(x / (quality), y / (quality), z) * quality )

		if( noise[i] > hi ) hi = noise[i]
		if( noise[i] < lo ) lo = noise[i]

	}

	quality *= 3

	}

	for (let i = 0; i < noise.length; i++) {

		let factor = 0.5

		for (let k = 0; k < segments.geometry.vertices.length; k++ ) {
		  const dist = geometry.vertices[i].distanceTo(segments.geometry.vertices[k])
		  const d = ( dist*dist )/100

		  if( d < factor ){
			 factor = d
		  }

		}

	  geometry.vertices[i].z += noise[i]*factor

		}

	} // End this.noise()

	this.name = function(){

		let SUFFIX = [

			' pass',
			' line',
			' forest',
			' summit',
			' route',
			' path',
			' mountain',
			' park'

		];

		let VOWEL = 'aeiou';
		let CONST = 'kgstdnhbpmyrw'
		let HIRAGANA = [

			'n','wa','ra','ya','ma','ha','na','ta','ka','a',
			'wi','ri','mi','hi','ni','chi','shi','ki','i',
			'ru','yu','mu','fu','nu','tsu','su','ku','u',
			'we','re','me','he','ne','te','se','ke','e',
			'wo','ro','yo','mo','no','to','so','ko','o',

		]

// 		let TOGGLE = ( Math.random() < 0.5 ) ? true : false;

		TOGGLE = false;
		let length = Math.ceil( Math.random() * 3 ) + 1;

		let string = ''

// 		while( string.length < length ){

// 			let c = ( TOGGLE ) ? VOWEL.charAt( Math.floor( Math.random() * VOWEL.length ) )
// 			: CONST.charAt( Math.floor( Math.random() * CONST.length ) );

// 			string += c
// 			TOGGLE = !TOGGLE

// 		}

		let i = 0;

		while( i < length ){

			let rn = Math.floor( Math.random() * HIRAGANA.length );
			
			string += HIRAGANA[ rn ];

			i++;

		}

		string += SUFFIX[ Math.floor( Math.random() * SUFFIX.length ) ];

		return string;

	} // End this.name

}