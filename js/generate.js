/*

Generate handles the procedural generation of stages.
The Generation process is broken down into the following steps:

Path Generation ( Currently broken, but usable )

	A non intersecting path is generated using the extruder object and this.extrusion.

	The extruder is aligned and stepped forward.

	The position of the extruder is checked against previously generated vertices using a weighted distance.

	If the distance of the generated vertices is below the defined threshold the path is backtracked to the last state.

	**This is essentially a depth first search using levy flights.
	**Instead of checking for occupied cells, a weighted distance is used.
	**This helps avoid intersections and dead end states.

	The generated path is represented in a set of discrete instructions describing the angle and slope of the next path step.

Path Importing

	Once a valid path has been generated, the path geometry is generated
	during this.import

	The Path Segments and Perimeter are drawn out using the world position of the extruder lane vectors.

	A surface mesh is drawn using the segments as a reference.

Terrain Generation

	**Currently this is the heaviest process, as it involves heavy checking.

	**Currently incompleted. Requires more edge solving.
	
	Using the segments as an initial reference, a list of open edges is created with extrusion targets generated outward from the path.

	The target raycasts against the terrain mesh in progress to insure there are no intersecting faces.

		If the target intersects a previously generated face it is ignored.

			** Will add recursive angle checking and a stitching algorithm to fill seems

		Else The first half of a quad strip is generated

	The distance between the previously generated vertices and target vertices is checked.

		If below the defined threshold, the vertices merge.

		Else the second half of the quad strip is generated.

	This process is repeated to continuously grow a solid geometry out from the path.

	Once the mesh growth process is complete noise is applied to the generated mesh.

Feature Generation

	Any additional features like decorations and interactable objects will be generated
	based on vertex normals and path sections.

	Trees

		Each terrain vertex normal is checked for verticality.

		If the vertex normal and noise value are within the thresholds defined a tree is generated.

Complete Process

	Once the generation process is complete a quick clean up is performed.
	The generator comunicates to the engine that the stage is ready.

*/

function Generate(){

	scope = this

	this.SEED = 0
	let STEPS  = 4 // Total extrusion steps for terrain generation.
	let iterator = 0

	// Reference object used to create new path segments() in this.extrude().

	const extruder = new THREE.Points( new THREE.Geometry() )
	extruder.name = 'Generative Extruder'
	extruder.visible = false

	// Stores path nodes representing each step in the path generation.
	// Generated in this.path() using this.extrude().

	const nodes = new THREE.Line( new THREE.Geometry() )
	nodes.name = 'Generative Nodes'
	nodes.visible = false
	nodes.material.color = palette[4]
	nodes.material.name = 'Node Material'

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

	// Tree container.
	// Generated using this.trees().

	const trees = new THREE.LineSegments( new THREE.Geometry() )
	trees.name = 'Trees'
	trees.material.color = palette[9]

	// Object used to render background behind wireframes.
	// Helps reduce the visual noise of layered wireframe lines.

	const background = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshBasicMaterial() )
	background.name = 'Background'
	background.material.color = palette[0]
	background.material.name = 'Background Material'
	background.material.wireframe = false
	background.material.side = THREE.FrontSide
	background.material.opacity = 0.75
	background.material.blending = 'Custom Blending'
	background.material.blendMode = THREE.MultiplyBlending
	background.material.transparent = true

	// A simple star field.

	const stars = new THREE.Points( new THREE.Geometry() )
	stars.material.color = palette[1]
	stars.material.sizeAttenuation = false
	stars.material.size = 1.5
	stars.material.fog = false

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

	const direction = new THREE.Vector3( 0, 3, 0 )
	const pitch		= new THREE.Vector3( 1, 0, 0 )
	const normal	= new THREE.Vector3( 0, 0, 1 )

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

	// Parameters for Path Generation

	let up = new THREE.Vector3( 0, 0, 1 )
	let slope	  = 0
	let angle	  = 0
	let slope_sum = 0
	let angle_sum = 0

	// Angle grid used for stepping angle and slope incrementally
	// Used in this.path and this.extrude

	const slope_step = Math.PI/64
	const angle_step = Math.PI/32

	// Used to store turn state, and the alignment.

	let turn = true
	let sign = -1

	// Current position in generation and total length of the path.
	// Length actually varies depending on the last section generated.

	let position = 0
	let length = 666

	// Used to store information for a section generated.

	let section = 0
	let section_angle = 0
	let section_slope = 0
	let section_start = 50
	let section_end = 9999

	// Used to store backtracking information.

	let backtrack = false
	let history = []

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
		
		scene.add( extruder )
		scene.add( nodes )
		scene.add( segments )
		scene.add( perimeter )
		scene.add( surface )
		scene.add( terrain )
		scene.add( background )

		ui.clear()
		loadtime = window.performance.now()
		window.setTimeout( scope.generate, 0 )
		ui.textbox( 'generating path...', 2,4 )

	}

	this.disconnect = function(){

		instructions = []
		
		scene.remove( extruder )
		scene.remove( nodes )
		scene.remove( segments )
		scene.remove( perimeter )
		scene.remove( surface )
		scene.remove( terrain )
		scene.remove( background )
		scene.remove( trees )
		scene.remove( stars )
		
		for( let i in scope.checkpoints ){

			scene.remove( scope.checkpoints[i].display )

			scope.checkpoints[i].display.geometry.dispose()
			scope.checkpoints[i].collision.geometry.dispose()

		}

	}

	this.complete = function(){

		collision.geometry.mergeVertices()
		collision.geometry.verticesNeedUpdate = true
		collision.geometry.elementsNeedUpdate = true
		collision.geometry.computeFaceNormals()
		collision.geometry.computeBoundingSphere()

		scope.checkpoints = scope.checkpoint()

		for( let i in scope.checkpoints ){

			scene.add( scope.checkpoints[i].display )

		}

		background.geometry.copy( collision.geometry )
		background.position.z -= 1

		scene.add( background )

		const buffer = new THREE.IcosahedronGeometry(1200,4)

		for( let i in buffer.vertices ){

			let random = scope.random()

			if( random < 0.3 && buffer.vertices[i].z > -400 ){

				stars.geometry.vertices.push( buffer.vertices[i].clone() )

			}
		}

		buffer.dispose()
		stars.geometry.computeBoundingSphere()
		scene.add( stars )

		stage.surface = collision.clone()
		stage.start   = scope.start.clone()
		loadtime = window.performance.now()-loadtime
		console.log( 'Load Time: ' + loadtime/1000 )
		//firebase.analytics().logEvent('stage_generation_complete', { time: Math.round(loadtime/1000) } )
		
		ui.clear()
		ui.textbox('stage generation complete.',2,4)
		ui.textbox( '-', 2, 6)
		ui.textbox('target times', 2, 8)

		for( let i = 0; i < stage.best.length; i++ ){

			let n = i+1
			let text = 'cp' + n
			let cp = ui.getTextFloat( stage.best[i] )

			while( text.length < 16-cp.length ){

				text += ' '

			}

			text += cp

			ui.textbox( text , 2, 12+i*2 )

		}

			END = true
			scope.END = true

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

		pitch.set( 1, 0, 0 )
		normal.set( 0, 0, 1 )

		lane[0] = new THREE.Vector3(  4, 3, 0 )
		lane[1] = new THREE.Vector3( -4, 3, 0 )

		slope	 = 0
		angle	 = 0
		slope_sum = 0
		angle_sum = 0

		position = 0
		section = 0
		section_angle = 0
		section_slope = 0
		section_start = 40
		section_end = 9999

		backtrack = false
		history = []

		turn = true
		sign = scope.random()*0.5
		sign /= Math.abs(sign)
		stop = false

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

		while( !PATH ){
			
			scope.path()

			nodes.geometry.dispose()
			nodes.geometry = nodesBuffer.clone()
			nodes.geometry.computeBoundingSphere()
			nodes.geometry.center()
			nodes.updateMatrixWorld()
			if( nodes.geometry.vertices.length > 0 ){
						translate.copy( nodes.geometry.vertices[0] )
						translate.sub( nodesBuffer.vertices[0] )
			}
			
		}
		if( PATH && !IMPORT ){
			
			scope.reset()
			collision.geometry.elementsNeedUpdate = true
			window.setTimeout( scope.import, 16 )
			ui.textbox( 'importing path...', 2,4 )

		}

	}

	this.import = function(){

		while( !IMPORT ){

		if( iterator <= instructions.length ){

		angle = instructions[iterator].angle

		if( iterator > 30 && angle === 0 && instructions[iterator-1].angle != 0 ){

		 slope = scope.randomInt(3,4)

		 let random = scope.random()

		 if( random > 0.1 ){

			slope *= -1

		 }
		 else if( random < 0.01 ){

			slope = 0

		 }

		}
		else if( iterator > 0 && angle != 0 && instructions[iterator-1].angle === 0 ){

		 slope -= slope_sum

		}
		else{

		 slope = 0

		}

			scope.extrude()

			segments.geometry.dispose()
			segments.geometry = segmentsBuffer.clone()
			segments.geometry.computeBoundingSphere()

			perimeter.geometry.dispose()
			perimeter.geometry = perimeterBuffer.clone()
			perimeter.geometry.computeBoundingSphere()

			surface.geometry.dispose()
			surface.geometry = surfaceBuffer.clone()
			surface.geometry.computeBoundingSphere()

			iterator++

		}

		if( iterator > 0 && iterator >= instructions.length ){

			ui.clear()
			ui.textbox('generating terrain...', 2, 4)

			window.setTimeout( scope.terrain, 0 )

			IMPORT = true

		}

		}


	} // End this.import()

	this.extrude = function(){

		pitch.applyAxisAngle( UP, angle * angle_step )

		for( let i in extruder.geometry.vertices ){

			extruder.geometry.vertices[i].applyAxisAngle( UP, angle * angle_step )

		}

		for( let i in extruder.geometry.vertices ){

			extruder.geometry.vertices[i].applyAxisAngle( pitch, slope * slope_step )

		}

		extruder.geometry.verticesNeedUpdate = true

		angle_sum += angle
		slope_sum += slope

		const a = extruder.geometry.vertices[0].clone()
		const b = extruder.geometry.vertices[2].clone()
		const c = extruder.geometry.vertices[3].clone()
		const normal = extruder.geometry.vertices[1].clone()

		a.applyMatrix4( extruder.matrix )
		b.applyMatrix4( extruder.matrix )
		c.applyMatrix4( extruder.matrix )

		normal.applyMatrix4( extruder.matrix )
		normal.sub(a)

		if( PATH ){

			b.add( translate )
			c.add( translate )

		if ( segmentsBuffer.vertices.length > 0 ) {

			const d = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 1].clone().sub( lastNormal )
			const e = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 2].clone().sub( lastNormal )

			surfaceBuffer.vertices.push(b.clone().sub( normal ))
			surfaceBuffer.vertices.push(c.clone().sub( normal ))
			surfaceBuffer.vertices.push(e)

			surfaceBuffer.vertices.push(c.clone().sub( normal ) )
			surfaceBuffer.vertices.push(d)
			surfaceBuffer.vertices.push(e)

			const collision_a = b.clone() //.add( normal )
			const collision_b = c.clone() //.add( normal )
			const collision_c = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 1].clone() //.add( lastNormal )
			const collision_d = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 2].clone() //.add( lastNormal )

			collision.geometry.vertices.push( collision_a )
			collision.geometry.vertices.push( collision_b )
			collision.geometry.vertices.push( collision_d )

			collision.geometry.vertices.push( collision_b )
			collision.geometry.vertices.push( collision_c )
			collision.geometry.vertices.push( collision_d )

			let length = surfaceBuffer.vertices.length

			surfaceBuffer.faces.push(new THREE.Face3(length - 3, length - 2, length - 1))
			surfaceBuffer.faces.push(new THREE.Face3(length - 5, length - 4, length - 6))
			
			collision.geometry.faces.push(new THREE.Face3(length - 3, length - 2, length - 1))
			collision.geometry.faces.push(new THREE.Face3(length - 5, length - 4, length - 6))

		}

		if ( perimeterBuffer.vertices.length > 0 ) {

			let n1 = 2
			let n2 = 1

				if( perimeterBuffer.vertices.length > 4 ){
				n1 = 4
				n2 = 2
				}

				let p1 = perimeterBuffer.vertices[ perimeterBuffer.vertices.length - n1 ].clone()
				let p2 = perimeterBuffer.vertices[ perimeterBuffer.vertices.length - n2 ].clone()

				perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) )
				perimeterBuffer.vertices.push( p1.clone() )

				perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) )
				perimeterBuffer.vertices.push( p2.clone() )

				if( iterator == instructions.length-1 ){
					perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) )
					perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) )
				}

			}

			else {

			perimeterBuffer.vertices.push( b.clone().add( normal.clone() ) )
			perimeterBuffer.vertices.push( c.clone().add( normal.clone() ) )

			}

			segmentsBuffer.vertices.push( b.clone() )
			segmentsBuffer.vertices.push( c.clone() )

			lastNormal.copy( normal )
		}

		else{

		nodesBuffer.vertices.push( a.clone() )

		}

		direction.copy(a).sub( extruder.position )
		extruder.position.add(direction)

		angle = 0
		
		extruder.updateMatrixWorld()

	} // End this.extrude()

	this.path = function(){

		while( !PATH ){
		
		// Used to store path extrusion decisions.

		let decisions = []

		// Backtrack to the last valid state if backtracking is initiated.

		if( backtrack && history.length > 1 ){

			// Copy backtracked state to parameters

			parameter = history[history.length-1]

			position = parameter.position
			section  = parameter.position

			nodesBuffer.dispose()
			nodesBuffer.copy( parameter.buffer )

			decisions    = Array.from( parameter.decisions )
			history      = Array.from( parameter.history )
			instructions = Array.from( parameter.instructions )

			extruder.geometry.dispose()
			extruder.geometry = parameter.extruder.clone()
			extruder.position.copy( parameter.location )

			turn = !parameter.turn
			sign = parameter.sign
			backtrack = false

		}

		// Start and end the path with straight sections.

		else if( position === 0 ){

			decisions.push({ angle: 0, section: 40 })

		}
		else if( position === section && position > length && turn ){

			decisions.push({ angle: 0, section: 40 })
			section_end = position + decisions[0].section

		}

		// Create decisions for the next section.

		else {

			// Minimize total decision options to limit time spent searching a single node.

			for( let n = 0; n < 3; n++ ){

				if( turn ){

					// Add turn sections to decisions.

					for( let i = 2; i < 4; i++ ){

					decisions.push({ angle: i*sign, section: scope.randomInt(3,7) * scope.randomInt(1,4) })

					}

				}
				else{

					// Add straightaways to decisions.

					decisions.push({ angle: 0, section: scope.randomInt(3,10) * scope.randomInt(1,4) })

				}
			}
		}

		// Initiate backtracking if there are no availabe decisions to make.

		if( decisions.length == 0 ){

			backtrack = true

		}
		else{

			// Create a new section once the previous section has been completed.

			if( position === section ){

				// Switch between turn and straightaways.
	
				turn = !turn

				// Switch turn alignment.

				if ( turn ) { sign *= -1 }

				// Select a decision.

				let decision = scope.randomInt(0,decisions.length)	
				section = position+decisions[ decision ].section

				section_angle = decisions[ decision ].angle
				decisions.splice( decision, 1 )

				// Add last section to history for potential backtracking.

				history.push({

					buffer: nodesBuffer.clone(),
					position: position,
					decisions: Array.from( decisions ),
					history: Array.from( history ),
					extruder: extruder.geometry.clone(),
					location: new THREE.Vector3().copy(extruder.position),
					turn: turn,
					sign: sign,
					instructions: Array.from( instructions )

				})

			}

			angle = section_angle

			position++

			// Write step information to instructions.

			instructions.push( { angle: angle, slope: slope } )

			this.extrude() // Extrude new path node.

			for( let j = 0; j < nodesBuffer.vertices.length; j++ ){

				let d1 = new THREE.Vector2( nodesBuffer.vertices[position-1].x, nodesBuffer.vertices[position-1].y )
				let d2 = new THREE.Vector2( nodesBuffer.vertices[j].x, nodesBuffer.vertices[j].y )

				let distance = d1.distanceTo(d2)

// 				let factor   = Math.abs( (position-1) - j )*0.065
// 				if ( factor > 20 ) factor = 20

				let factor = 20;
				if( distance < factor && Math.abs( ( position-1 ) - j ) > 20 ){

				backtrack = true

				}

			}

			// Timeout condition for locked edge case states.
		
			framecount ++

			if( framecount > timeout ){

				stage.reset()
				framecount = 0

			}
		
		}

		nodesBuffer.verticesNeedUpdate = true

			if( position >= section_end ){

				PATH = true // Signal path completion.

			}

		}

	}

	this.terrain = function(){
		//this.initTargets = function(){
		//	return [];
		//}

		this.initTarget = function(x){
			let target = [[],[]]
		
			for( let s = 0; s < 2; s++ ){
				for( let i = 0; i < vertices[s].length; i++ ){

					
					target[s][i] = x[s][i].clone()
					
					if(s === 0) target[s][i].sub( vertices[1][i] );
					else target[s][i].sub( vertices[0][i] );
					
					target[s][i].normalize().multiplyScalar(3)

				

				}
			}	
			return target;

		}

		this.initVert = function(){
			// Create initial list of edge vertices by using the previously generated segments geometry.
			let vertices = [[],[]];
			for( let v = 0; v < segments.geometry.vertices.length; v++ ){

					let s = v%2
					vertices[s].push( segments.geometry.vertices[v] )
		
				}

			return vertices;
		}

		// Needed to reset terrain geometry.

		terrain.geometry.dispose()
		terrain.geometry.copy( new THREE.Geometry() )

		let buffer   = [[],[]] // List buffer vertices by index.
		let vertices = initVert();// [[],[]] // List of active vertices.
		let target   = initTarget(vertices); // List of extrusion targets.

		// Edges are split into two sides for easier referencing.

		// for( let s = 0; s < 2; s++ ){

		// 	target[s] = []
		// 	buffer[s] = []
		// 	vertices[s] = []

		// }

		

	

		// Begin mesh growth. STEPS is how many extrusion steps away from the path.
		// As STEPS increases, the generation time increases exponetially... ):

		for( let i = 0; i < STEPS; i++ ){

			console.log('Terrain Level ' + i + ' / ' + 5)

			terrain.geometry.verticesNeedUpdate = true
			terrain.geometry.elementsNeedUpdate = true
			terrain.geometry.computeBoundingSphere()
			terrain.geometry.computeFaceNormals()
			terrain.updateMatrixWorld()

		// Iterate through each side

			for( let s = 0; s < 2; s++ ){

			// Copy buffer to active edge vertices

				if( i > 0 ){

					vertices[s] = []

					for( let v = 0; v < buffer[s].length; v++ ){

						vertices[s][v] = terrain.geometry.vertices[buffer[s][v]]

					}

				}

				// Carry over extrusion targets from previous iteration.

				target[s] = Array.from( target[s] )

				// Clear the buffer.

				buffer[s] = []

				// Iterate through active edge vertices

				for( let v = 0; v < vertices[s].length; v++ ){

					target[s][v].z -= i/5 // Apply a slight slope away from the path.

					let flag = false // flag intersecting vertices

					// Skip face generation if vertices is undefined.

					if( vertices[s][v] !== undefined && vertices[s][v-1] !== undefined ){

					// Ignore undefined targets as they previously intersected the terrain.

						if( target[s][v] === undefined ){

							target[s][v] = target[s][v-1].clone()

						}else{ // Pre-check if the target will intersect the existing terrain geometry.

							terrain.geometry.computeBoundingSphere()

							let location = vertices[s][v].clone().add( target[s][v] )
							location.z -= 100
							
							raycaster.set( location, up )

							location.z += 100 // Reset location for distance checking.

							let intersects = raycaster.intersectObjects( [ terrain ], true )

							if( intersects.length > 0 ){

								for( let intersect in intersects ){

									if( intersects[intersect].point.distanceTo( location ) > 0.01 ){

									buffer[s][v] = undefined // Ignore vertices with intersecting targets.
									flag		 = true		 // flag intersecting target.

									}

								}

							}

						}

					// Push a new face for the first half of a quadstrip if target does not intersect terrain geometry.
					
					if( !flag ){

						terrain.geometry.vertices.push( vertices[s][v].clone() )
						terrain.geometry.vertices.push( vertices[s][v].clone().add( target[s][v]) )

						buffer[s][v] = terrain.geometry.vertices.length-1

						if( v > 0  ){

						terrain.geometry.vertices.push( vertices[s][v-1].clone() )
						const length = terrain.geometry.vertices.length

							if( s === 0 ){

								terrain.geometry.faces.push( new THREE.Face3( length-2, length-1, length-3 ) )

							}
							else if( s === 1 ){

								terrain.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )

							}

						}
					
					} // End first quadstrip face creation.

				} // End vertices type checking.	

			} // End edge vertices iteration.

			// Iterate through edge buffer to pre-validate edge distances.
		
			for( let v = 1; v < buffer[s].length; v++ ){

				// Ignore undefined buffer vertices as they have previously had intersecting targets.

				if( buffer[s][v] !== undefined && buffer[s][v-1] !== undefined ){

					let a = terrain.geometry.vertices[ buffer[s][v] ]
					let b = terrain.geometry.vertices[ buffer[s][v-1] ]

					// Decimate buffer edge if below the distance threshold by merging vertices and ignoring the second quadstrip face.

					if ( a.distanceTo(b) < 2.8 ){

						a.copy(b)
						buffer[s][v] = buffer[s][v-1]
						target[s][v].copy( target[s][v-1] )

					}

					// Else add a new vertices and push a new face to fill the quadstrip.

					else if ( v > 1 ){

						terrain.geometry.vertices.push( vertices[s][v-1] )

						let a = ( s === 0 ) ? buffer[s][v  ] : buffer[s][v-1]
						let b = ( s === 0 ) ? buffer[s][v-1] : buffer[s][v  ]

						terrain.geometry.faces.push(

							new THREE.Face3( a, b, terrain.geometry.vertices.length-1 )

						)


					} // End decimate/face fill.

				} // End buffer type check.	


			} // End buffer iteration


		} // End side iteration.


		} // End step iteration.


		// Signal terrain geometry updates.

		terrain.geometry.verticesNeedUpdate = true
		terrain.geometry.elementsNeedUpdate = true
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

			collision.geometry.vertices.push( a )
			collision.geometry.vertices.push( b )
			collision.geometry.vertices.push( c )

			let length = collision.geometry.vertices.length
			collision.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )

		}

		scope.trees() // Add some trees and color.

		window.setTimeout( scope.complete, 0 ) // Enqueue stage generate completion.

			// Create initial extrusion targets by mirroring the shared edge vertices in the same segment.
		
	} // End this.terrain()

	this.trees = function(){

		const flags = []

		for( let i = 0; i < terrain.geometry.vertices.length; i++ ){

			flags[i] = false

		}

		const faces = terrain.geometry.faces
		for( let i = 0; i < faces.length; i++ ){ //Dylan plz why 
			for(let j = 0; j < 3; j++){
				if( Math.abs( faces[i].vertexNormals[j].z ) > 0.9 ){

					flags[ faces[i].a ] = true
					faces[i].vertexColors[0] = palette[10]
	
				}
				else{
	
					faces[i].vertexColors[0] = palette[10]
	
				}
				// if( Math.abs( faces[i].vertexNormals[1].z ) > 0.9 ){
	
				// 	flags[ faces[i].b ] = true
				// 	faces[i].vertexColors[1] = palette[10]
	
				// }
				// else{
	
				// 	faces[i].vertexColors[1] = palette[10]
	
				// }
				// if( Math.abs( faces[i].vertexNormals[2].z ) > 0.9 ){
	
				// 	flags[ faces[i].c ] = true
				// 	faces[i].vertexColors[2] = palette[10]
	
				// }
				// else{
	
				// 	faces[i].vertexColors[2] = palette[10]
	
				// }
	
			}
		}
			

		for( let i = 0; i < flags.length; i++ ){


			for( let v = 0; v < segments.geometry.vertices.length; v++ ){

				if( terrain.geometry.vertices[i].distanceTo( segments.geometry.vertices[v] ) < 0.1 ){

					flags[i] = false

				}

			}


			if( flags[i] && scope.random() < 0.1 ){

				let a = terrain.geometry.vertices[ i ].clone()
				let t = tree()

				for( let k = 0; k < t.vertices.length; k++ ){

					trees.geometry.vertices.push( t.vertices[k].add(a) )

				}

			}

		}

		terrain.geometry.colorsNeedUpdate = true
		scene.add( trees )

		function tree( p ){

			const scale = 1
			const segments   = Math.floor(scope.random()*8)+6
			const branch = 6
			const angle = (Math.PI*2)/branch
			const weight = 0.3
			const base = 1

			const tree = new THREE.Geometry()

			tree.vertices.push(new THREE.Vector3(0,0,0))
			tree.vertices.push(new THREE.Vector3(0,0,segments*scale-scale/2+base))

			for ( let s = 1; s < segments; s++ ){
			for ( let b = 0; b < branch; b++ ){

				off = angle*((s%2)*0.5)

				tree.vertices.push(new THREE.Vector3(0,0,s*scale+base))
				tree.vertices.push(new THREE.Vector3((segments-s)*0.3,0,s*scale-weight+base))
				tree.vertices[tree.vertices.length-1].applyAxisAngle(up, angle*b+off)

			}
			}

			return(tree)

		} // End tree()

	} // End this.trees()

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
		
		scope.start.copy(geometry.vertices[offset-1])
		scope.start.sub(geometry.vertices[offset-1+1])
		scope.start.multiplyScalar(-0.75)
		scope.start.add(geometry.vertices[offset-1])

		for( let i in scope.checkpoints ){
		scene.add( scope.checkpoints[i] )
		scene.add( scope.checkpointsDisplay[i] )
		}

		let d1 = i
		let d2 = i*2
		let d3 = i*3
		let d4 = i*4

		for( let k = 0; k < 4; k++ ){

			if( CHALLENGE ){

				stage.best[k] = OBJECTIVES[k]

			}
			else{

				stage.best[k] = ( i*( k+1 ) )/( HEURISTIC )

			}

		}

		function checkpoint(v1, v2, i){

			const geometry = new THREE.Geometry()

			const d = new THREE.Vector3().copy(v1).sub(v2).multiplyScalar(0.25)

			const a = new THREE.Vector3().copy(v1).add(d)
			const b = new THREE.Vector3().copy(v2).sub(d)

			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z-1) )
			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z+3) )
			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z+3) )

			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z+3) )
			geometry.vertices.push( new THREE.Vector3(b.x,b.y,b.z-1) )
			geometry.vertices.push( new THREE.Vector3(a.x,a.y,a.z-1) )

			geometry.faces.push(new THREE.Face3(0,1,2))
			geometry.faces.push(new THREE.Face3(3,4,5))

			const lines = new THREE.Geometry()

			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z) )
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+4) )
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+4) )

			const vv1 = new THREE.Vector3().copy(d).multiplyScalar(-.666).add(v1)
			vv1.z += 4
			lines.vertices.push(vv1)

			vv2 = vv1.clone()
			vv2.z -= 1

			lines.vertices.push(vv2)
			lines.vertices.push(vv1)
			lines.vertices.push(vv2)
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+3) )

			const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, wireframe: false, fog: true })
			material.color = palette[5]
			const mesh = new THREE.Mesh(geometry, material)
			mesh.visible = false

			const display = new THREE.LineSegments(lines, material)

			mesh.name = 'Objective ' + i
			display.name = 'Checkpoint' + i

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


}