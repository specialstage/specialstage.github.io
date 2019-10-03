function Generate(){

	scope = this

	let iterator  = 0

// 	const mesh = new THREE.Line( new THREE.Geometry() )
// 	mesh.name = 'Generative Mesh'

// 	const buffer = new THREE.Line( new THREE.Geometry() )
// 	buffer.name = 'Generative Buffer'

	const nodes = new THREE.Line( new THREE.Geometry() )
	nodes.name = 'Generative Nodes'
	nodes.visible = false
	nodes.material.color = new THREE.Color( palette[4] )
	nodes.material.name = 'Node Material'

	const extruder = new THREE.Points( new THREE.Geometry() )
	extruder.name = 'Generative Extruder'
	extruder.visible = false

	const surface = new THREE.Mesh( new THREE.Geometry() )
	surface.name = 'Generative Surface'
	surface.visible = false
	surface.material.color = new THREE.Color( palette[0] )
	surface.material.name = 'Surface Material'

	const perimeter = new THREE.LineSegments( new THREE.Geometry() )
	perimeter.name = 'Generative Perimeter'
	perimeter.material.color = new THREE.Color( 0xffffff )
	perimeter.material.name  = 'Perimeter Material'

	const segments  = new THREE.LineSegments( new THREE.Geometry() )
	segments.name = 'Generative Segments'
	segments.visible = true
	segments.material.color = new THREE.Color( palette[3] )
	segments.material.name = 'Segments Material'

	const collision = new THREE.Mesh( new THREE.Geometry() )
	collision.name = 'Collision Mesh'
	collision.visible = true
	collision.material.color = new THREE.Color( palette[3] )
	collision.material.name = 'Collision Material'
	collision.material.side = THREE.BackSide

	const terrain = new THREE.Mesh( new THREE.Geometry() )
	terrain.name = 'Generative Terrain'
	terrain.material.color = new THREE.Color( palette[8] )
	terrain.material.name = 'Terrain Material'
	terrain.material.wireframe = true
	terrain.material.side = THREE.DoubleSide
	terrain.visible = true

	const trees = new THREE.LineSegments( new THREE.Geometry() )
	trees.name = 'Trees'
	trees.material.color = new THREE.Color( palette[9] )

	const background = new THREE.Mesh( new THREE.Geometry(), new THREE.MeshBasicMaterial() )
	background.name = 'Generative Background'
	background.material.color = new THREE.Color( palette[0] )
	background.material.name = 'Background Material'
	background.material.wireframe = false
	background.material.side = THREE.FrontSide
	background.material.opacity = 0.5
	background.material.blending = 'Custom Blending'
	background.material.blendMode = THREE.MultiplyBlending
	background.material.transparent = true

	let edges = []
	this.targets = []

	this.checkpoints = []

	const direction = new THREE.Vector3( 0, 3, 0 )
	const pitch		= new THREE.Vector3( 1, 0, 0 )
	const normal	= new THREE.Vector3( 0, 0, 1 )

	const nodesBuffer     = nodes.geometry.clone()
	const surfaceBuffer   = surface.geometry.clone()
	const segmentsBuffer  = segments.geometry.clone()
	const perimeterBuffer = perimeter.geometry.clone()

	const lane = []
	const lane_normal = []
	lastNormal = new THREE.Vector3()

	lane[0] = new THREE.Vector3(  4, 3, 0 )
	lane[1] = new THREE.Vector3( -4, 3, 0 )

	lane_normal[0] = lane[0].clone()
	lane_normal.z += 1

	lane_normal[1] = lane[1].clone()
	lane_normal.z += 1

	let slope	  = 0
	let angle	  = 0
	let slope_sum = 0
	let angle_sum = 0

	const slope_step = Math.PI/64
	const angle_step = Math.PI/32

	let position = 0
	let length = 666
	let section = 0
	let section_angle = 0
	let section_slope = 0
	let section_start = 50
	let section_end = 9999

	let up = new THREE.Vector3( 0, 0, 1 )

	let backtrack = false
	let history = []
	let instructions = []
	let timer   = 0
	let timeout = 50000
	let loadtime = 0
	let turn = true
	let sign = -1

	let translate = new THREE.Vector3()
	this.start	= new THREE.Vector3()

	let END			= false
	let PATH		= false
	let GENERATE	= false
	let IMPORT		= false
	let HEURISTIC	= ( 36+Math.random()-0.5 )/2

	let interval = 0

	const raycaster = new THREE.Raycaster()
	raycaster.far = 1000
	
	this.END = false
	this.IMPORT = false

	extruder.geometry.vertices[0] = direction.clone()
	extruder.geometry.vertices[1] = up.clone().add(direction)
	extruder.geometry.vertices[2] = lane[0].clone()
	extruder.geometry.vertices[3] = lane[1].clone()
	extruder.geometry.vertices[4] = lane_normal[0].clone()
	extruder.geometry.vertices[5] = lane_normal[1].clone()

	this.connect = function(){

		scene.add( extruder )
		scene.add( nodes )
		scene.add( segments )
		scene.add( perimeter )
		scene.add( surface )
		scene.add( terrain )
		scene.add( background )

		ui.clear()
		ui.textbox('generating stage please wait...', 2, 3)
		if( !MOBILE ) ui.textbox('keyboard controls - arrow keys', 2, ui.yl-4 )
		loadtime = window.performance.now()
		interval = window.setInterval( this.generate, 16 )

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
		
		for( let i in scope.checkpoints ){

			scene.remove( scope.checkpoints[i].display )

			scope.checkpoints[i].display.geometry.dispose()
			scope.checkpoints[i].collision.geometry.dispose()

		}

	}

	this.complete = function(){

		scope.terrain()

// 		terrain.geometry.computeFaceNormals()
// 		terrain.geometry.computeVertexNormals()
		collision.geometry.mergeVertices()
		collision.geometry.verticesNeedUpdate = true
		collision.geometry.elementsNeedUpdate = true
		collision.geometry.computeFaceNormals()
		collision.geometry.computeBoundingSphere()

		scope.checkpoints = scope.checkpoint()

		for( let i in this.checkpoints ){

			scene.add( scope.checkpoints[i].display )

		}

// 		scene.add( collision )
		background.geometry.copy( collision.geometry )
		background.position.z -= 1

		scene.add( background )

// 		var helper = new THREE.VertexNormalsHelper( terrain, 2, 0x00ff00, 1 );
// 		scene.add( helper )
// 		console.log( helper )

		stage.surface = collision.clone()
		stage.start   = scope.start.clone()
		loadtime = loadtime - window.performance.now()
		console.log( 'Load Time: ' + loadtime/1000 )
		ui.textbox( '-', 2, 5)
		ui.textbox('target times', 2, 9)

		for( let i = 0; i < stage.best.length; i++ ){

		let n = i+1
		let text = 'cp' + n
		let cp = ui.getTextFloat( stage.best[i] )

		while( text.length < 16-cp.length ){
			
			text += ' '

		}
		text += cp

		ui.textbox( text , 2, 13+i*2 )
		}

	}

	this.reset = function(){

	HEURISTIC	= ( 36+Math.random()-0.5 )/2
	iterator = 0
	timer = 0

		nodes.geometry.dispose()
		segments.geometry.dispose()
		surface.geometry.dispose()
		extruder.geometry.dispose()
		perimeter.geometry.dispose()
		terrain.geometry.dispose()
		collision.geometry.dispose()
		trees.geometry.dispose()

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
		sign = Math.random()*0.5
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
		extruder.geometry.vertices[4] = lane_normal[0].clone()
		extruder.geometry.vertices[5] = lane_normal[1].clone()

		extruder.geometry.verticesNeedUpdate = true

	}

	this.generate = function(){

		if( !PATH ){
			
			scope.path()

			nodes.geometry.dispose()
			nodes.geometry = nodesBuffer.clone()
			nodes.geometry.computeBoundingSphere()
			nodes.geometry.center()

		if( nodes.geometry.vertices.length > 0 ){
					translate.copy( nodes.geometry.vertices[0] )
					translate.sub( nodesBuffer.vertices[0] )
		}
			renderer.render(scene, camera)

		}
		else if( PATH && !IMPORT ){
			
			window.clearInterval( interval )
			scope.reset()
			collision.geometry.elementsNeedUpdate = true

			interval = window.setInterval( scope.import, 16 )
			
		}

	}

	this.import = function(){

		let dt = 0
		let time = window.performance.now()

		while( dt < 16 && !IMPORT ){

		if( iterator <= instructions.length ){
			
			angle = instructions[iterator].angle

			if( iterator > 30 && angle === 0 && instructions[iterator-1].angle != 0 ){
			 slope = scope.randomInt(3,4)
			 let random = Math.random()

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

			renderer.render(scene, camera)

			iterator++

		}

		dt = window.performance.now() - time

		if( iterator > 0 && iterator >= instructions.length ){

			ui.clear()
			ui.textbox('stage generation complete.', 2, 3)

			scope.complete()

			IMPORT = true
			END = true
			scope.END = true
			
			window.clearInterval( interval )
			
		}

		}


	}

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

// 		normal.multiplyScalar(0.25)

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

			lastNormal = normal.clone()
		}

		else{

		nodesBuffer.vertices.push( a.clone() )

		}

		direction.copy(a).sub( extruder.position )
		extruder.position.add(direction)

// 		slope = -slope
		angle = 0

		renderer.render(scene,camera)

	}

	this.path = function(){

		let dt = 0
		let time = window.performance.now()

		while( dt < 16 && !PATH ){

		let decisions = []

		if( backtrack && history.length > 1 ){
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
			renderer.render(scene, camera)

			turn = !parameter.turn
			sign = parameter.sign
			backtrack = false

		}
		else if( position === 0 ){

			decisions.push({ angle: 0, section: 40 })

		}
		else if( position === section && position > length && turn ){

			decisions.push({ angle: 0, section: 40 })
			section_end = position + decisions[0].section

		}
		else {

			for( let n = 0; n < 3; n++ ){
			if( turn ){
				for( let i = 2; i < 4; i++ ){
// 				decisions.push({ angle: i*sign, section: scope.randomInt(8,20) * scope.randomInt(1,3) })
				decisions.push({ angle: i*sign, section: scope.randomInt(3,7) * scope.randomInt(1,4) })

				}
			} else{
				decisions.push({ angle: 0, section: scope.randomInt(3,10) * scope.randomInt(1,4) })
			}
			}
		}

		if( decisions.length == 0 ){
			backtrack = true
		} else{

		if( position === section ){

			turn = !turn
			if ( turn ) { sign *= -1 }
		
			let decision = scope.randomInt(0,decisions.length)			
			section = position+decisions[ decision ].section

			section_angle = decisions[ decision ].angle
			decisions.splice( decision, 1 )

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
		instructions.push( { angle: angle, slope: slope } )
		
		this.extrude()

		for( let j = 0; j < nodesBuffer.vertices.length; j++ ){

			let distance = nodesBuffer.vertices[position-1].distanceTo( nodesBuffer.vertices[j] )
			let factor   = Math.abs( (position-1) - j )*0.065
			if ( factor > 20 ) factor = 20

			if( distance < 10*factor && Math.abs( ( position-1 ) - j ) > 8 ){

			backtrack = true

			}
		}

		}

		nodesBuffer.verticesNeedUpdate = true
		dt = window.performance.now()-time
		timer += dt

		if( timer > timeout ){
			stage.reset()
// 			ui.clear()
// 			ui.textbox('re-attemping path generation',2, 4)
			timer = 0
			TIMEOUTS ++
		}

		if( position >= section_end ){
			PATH = true
		}

		}

	}

	this.terrain = function(){

	// Needed
	terrain.geometry.dispose()
	terrain.geometry.copy( new THREE.Geometry() )

	let index = 0
	let buffer   = []
	let vertices = []
	let target   = []

	//Initialize Targets

	for( let s = 0; s < 2; s++ ){

		target[s] = []
		buffer[s] = []
		vertices[s] = []

	}

	for( let v = 0; v < segments.geometry.vertices.length; v++ ){

		let s = v%2
		vertices[s].push( segments.geometry.vertices[v] )

	}

	for( let s = 0; s < 2; s++ ){

	for( let i = 0; i < vertices[s].length; i++ ){

		let n = ( s === 0 ) ? 1 : -1

			let t = vertices[s][i].clone()
			t.sub( vertices[s+n][i] )

			t.normalize().multiplyScalar(3)

		target[s][i] = (t.clone())

	}
	}

	// Begin Mesh Growth

	for( let i = 0; i < 5; i++ ){
	console.log('Terrain Level ' + i + ' / ' + 5)

		terrain.geometry.verticesNeedUpdate = true
		terrain.geometry.elementsNeedUpdate = true
		terrain.geometry.computeBoundingSphere()
		terrain.geometry.computeFaceNormals()
		terrain.updateMatrixWorld()

// 		const partition = stage.spatialPartition( terrain )

	for( let s = 0; s < 2; s++ ){
			
		if( i > 0 ){

		vertices[s] = []

		for( let v = 0; v < buffer[s].length; v++ ){

			vertices[s][v] = terrain.geometry.vertices[buffer[s][v]]

		}

		}

		target[s] = Array.from( target[s] )
		buffer[s] = []

		vertices[s].length

		for( let v = 0; v < vertices[s].length; v++ ){

			target[s][v].z -= i/5

		let flag = false
		let ignore = false

		if( vertices[s][v] !== undefined && vertices[s][v-1] !== undefined ){

			if( target[s][v] === undefined ){
			
				target[s][v] = target[s][v-1].clone()

			}

			else{


			terrain.geometry.computeBoundingSphere()

			let location = vertices[s][v].clone().add( target[s][v] )
			location.z -= 100
			let up = new THREE.Vector3(0,0,1)
			raycaster.set( location, up )

			location.z += 100

			let intersects = raycaster.intersectObjects( [ terrain ], true )

			if( intersects.length > 0 ){

				for( let intersect in intersects ){

// 				const mesh = new THREE.Mesh( new THREE.IcosahedronGeometry( 1, 0) )
// 				mesh.material.color = new THREE.Color( palette[Math.floor(i)] )
// 				mesh.position.copy( intersects[intersect].point )
// 				mesh.position.z += intersect*2
// 				scene.add( mesh )

					if( intersects[intersect].point.distanceTo( location ) > 0.01 ){

					buffer[s][v] = undefined
					flag = true

					}
				}
			}

			}

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
					if( s === 1 ){

					terrain.geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )

					}

				}
			}
		}
		}

		for( let v = 1; v < buffer[s].length; v++ ){

			if( buffer[s][v] !== undefined && buffer[s][v-1] !== undefined ){

				let a = terrain.geometry.vertices[ buffer[s][v] ]
				let b = terrain.geometry.vertices[ buffer[s][v-1] ]

				if ( a.distanceTo(b) < 2.8 ){

					a.copy(b)
					buffer[s][v] = buffer[s][v-1]
					target[s][v].copy( target[s][v-1] )
	// 				target[s][v] = undefined
	// 				buffer[s][v] = buffer[s][v-1]
	// 					target[s].slice( v-1, 1 )
	// 					buffer[s].slice( v-1, 1 )

				}
				else if ( v > 1 ){

					terrain.geometry.vertices.push( vertices[s][v-1] )

					if( s === 0 ){

					terrain.geometry.faces.push(

						new THREE.Face3( buffer[s][v], buffer[s][v-1], terrain.geometry.vertices.length-1 )

					)

					}
					else{

					terrain.geometry.faces.push(

						new THREE.Face3( buffer[s][v-1], buffer[s][v], terrain.geometry.vertices.length-1 )

					)

					}

					terrain.geometry.elementsNeedUpdate = true

				}
			}

		}
	// End Side Checks
	}

	// End Iterations
	}

	// Final Decimation
// 	console.log( 'Final Decimation')

// 	terrain.geometry.verticesNeedUpdate = true
// 	terrain.geometry.elementsNeedUpdate = true
// 	terrain.geometry.computeFaceNormals()
// 	terrain.geometry.mergeVertices()
// 	terrain.geometry.computeBoundingSphere()

// 	raycaster.far = 100

// 		for( let v = 0; v < terrain.geometry.vertices.length; v++ ){			

// 			let location = terrain.geometry.vertices[v].clone()
// 			location.z -= 100
// 			let up = new THREE.Vector3(0,0,1)

// 			raycaster.set( location, up )

// 			let intersects = raycaster.intersectObjects( [ terrain ], true )

// 			if ( intersects.length > 0 ){

// 				for( intersect in intersects ){
				
// 				if( intersects[intersect].face.a !== v
// 					&& intersects[intersect].face.b !== v
// 					&& intersects[intersect].face.c !== v ){
						
// 					test = true
// 					const mesh = new THREE.Mesh( new THREE.IcosahedronGeometry( 1, 0) )
// 					mesh.material.color = new THREE.Color( palette[Math.floor(0)] )
// 					mesh.position.copy( intersects[intersect].point )
// 					mesh.position.z += intersect
// 					scene.add( mesh )

// // 					terrain.geometry.faces.splice[intersects[intersect].faceIndex, 1]
// // 					terrain.geometry.elementsNeedUpdate

// 				}

// 				}

// 			}
// 		}

	console.log('Apply Noise')
	terrain.geometry.verticesNeedUpdate = true
	terrain.geometry.elementsNeedUpdate = true
	terrain.geometry.computeFaceNormals()
	terrain.geometry.computeVertexNormals()
	terrain.geometry.mergeVertices()
	terrain.geometry.computeBoundingSphere()
	this.noise( terrain.geometry )

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

	this.trees()

	}

	this.trees = function(){

		const flags = []

		const faces = terrain.geometry.faces
		for( let i = 0; i < faces.length; i++ ){
		
			flags[ faces[i].a ] = ( Math.abs( faces[i].vertexNormals[0].z ) > 0.5 )
			flags[ faces[i].b ] = ( Math.abs( faces[i].vertexNormals[1].z ) > 0.5 )
			flags[ faces[i].c ] = ( Math.abs( faces[i].vertexNormals[2].z ) > 0.5 )

		}

		for( let i = 0; i < flags.length; i++ ){

			for( let v = 0; v < segments.geometry.vertices.length; v++ ){

				if( terrain.geometry.vertices[i].distanceTo( segments.geometry.vertices[v] ) < 0.1 ){
					flags[i] = false
				}
			}
			if( flags[i] && Math.random() > 0.9 ){
				let a = terrain.geometry.vertices[ i ].clone()
				let t = tree()

				for( let k = 0; k < t.vertices.length; k++ ){

					trees.geometry.vertices.push( t.vertices[k].add(a) )
				}
			}
		}


		scene.add( trees )

		function tree( p ){

		  var scale = 1
		  var segments   = Math.floor(Math.random()*8)+6
		  var branch = 6
		  var angle = (Math.PI*2)/branch
		  var weight = 0.3
		  var base = 1

		  var tree = new THREE.Geometry()

		  tree.vertices.push(new THREE.Vector3(0,0,0))
		  tree.vertices.push(new THREE.Vector3(0,0,segments*scale-scale/2+base))

		  var up = new THREE.Vector3(0,0,1)

		  for ( var s = 1; s < segments; s++ ){
		  for ( var b = 0; b < branch; b++ ){

			off = angle*((s%2)*0.5)

			tree.vertices.push(new THREE.Vector3(0,0,s*scale+base))
			tree.vertices.push(new THREE.Vector3((segments-s)*0.3,0,s*scale-weight+base))
			tree.vertices[tree.vertices.length-1].applyAxisAngle(up, angle*b+off)

		  }
		  }

		  return(tree)
		}
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

			stage.best[k] = ( i*( k+1 ) )/( HEURISTIC )

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
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+3) )
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+3) )

			const vv1 = new THREE.Vector3().copy(d).multiplyScalar(-0.5).add(v1)
			vv1.z += 3
			lines.vertices.push(vv1)

			vv2 = vv1.clone()
			vv2.z -= 0.5

			lines.vertices.push(vv2)
			lines.vertices.push(vv1)
			lines.vertices.push(vv2)
			lines.vertices.push( new THREE.Vector3(v1.x,v1.y,v1.z+2.5) )

			const material = new THREE.MeshBasicMaterial({ color: palette[5], side: THREE.DoubleSide, wireframe: false, fog: true })
			const mesh = new THREE.Mesh(geometry, material)
			mesh.visible = false

			const display = new THREE.LineSegments(lines, material)

			mesh.name = 'Objective ' + i
			display.name = 'Checkpoint' + i

			return { display: display, collision: mesh }

		}

		return array

	}

	this.resetCheckpoints = function(){
		
		for( let i in scope.checkpoints ){
			scope.checkpoints[i].display.material.color.setHex( palette[5] )
		}

	}

	this.randomInt = function( lo, hi ){
	
		return Math.floor( Math.random()*( hi-lo ))+lo

	}

  this.noise = function( geometry ){

    const perlin = new ImprovedNoise()
    const noise = []
    let quality = 8

    let hi = 0
    let lo = 0
    const z = Math.random()*1000
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
  }

    this.searchSpace = function(p){

      var array = []
      var x = p.x
      var y = p.y

      if ( x > 0 && y > 0 ){
        array.push({x: x-1, y: y  })
        array.push({x: x-1, y: y-1})
        array.push({x: x,   y: y-1})
      }
      if ( x < stage.partitionSize-1 && y < stage.partitionSize-1 ){
        array.push({x: x,   y: y+1})
        array.push({x: x+1, y: y  })
        array.push({x: x+1, y: y+1})
      }
      if( x < stage.partitionSize-1 && y > 0 ){
        array.push({x: x+1, y: y-1})
      }
      if( y < stage.partitionSize-1 && x > 0 ){
        array.push({x: x-1, y: y+1})
      }

      return array
    }

}