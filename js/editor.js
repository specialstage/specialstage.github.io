function Editor() {

  // Data structure
  // Declaration
  // TRACK_SIZE, MAX_STRAIGHT, MAX_TURN, MAX_REPEAT_TURN, NOISE_SEED
  // ANGLE, SLOPE, CAMBER, LANE_WIDTH_A, LANE_WIDTH_B, LANE_FEATURE, FEATURE_LANE_A, FEATURE_LANE_B,   
  const scope = this
  const NODES = []

  const UP = new THREE.Vector3(0, 0, 1)
  const PITCH = new THREE.Vector3(1, 0, 0)
  const LANE_A = new THREE.Vector3(4, 3, 0)
  const LANE_B = new THREE.Vector3(-4, 3, 0)
  const DIRECTION = new THREE.Vector3(0, 3, 0)
  const POSITION = new THREE.Vector3().add(DIRECTION)
  const LAST = new THREE.Vector3()

  const RIG = new THREE.Vector3()

  let VIEW = false
  const lookAt = new THREE.Vector3()

  let ANGLE = 0
  let ANGLE_STEP = Math.PI / 32
  let SLOPE = 0
  let SLOPE_STEP = Math.PI / 64

  this.ANGLE = ANGLE
  this.SLOPE = SLOPE
  this.VIEW = VIEW

  let lane_width_a = 1
  let lane_width_b = 1

  const PERIMETER_MATERIAL = new THREE.LineBasicMaterial({
    color: 0xffffff
  })
  const SEGMENT_MATERIAL = new THREE.LineBasicMaterial({
    color: 0x333333
  })
  const CURSOR_MATERIAL = new THREE.LineBasicMaterial({
    color: 0x42f486
  })
  const SURFACE_MATERIAL = new THREE.MeshBasicMaterial({
    color: 0x101010,
    wireframe: false,
    side: THREE.FrontSide
  })
  const GRASS_MATERIAL = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0xffffff,
    side: THREE.DoubleSide
  })

  const cursorGeometry = new THREE.Geometry()

  cursorGeometry.vertices[0] = LANE_A.clone()
  cursorGeometry.vertices[1] = LANE_B.clone()
  cursorGeometry.vertices[2] = new THREE.Vector3()
  cursorGeometry.vertices[3] = DIRECTION.clone()

  this.cursor = new THREE.LineSegments(cursorGeometry.clone(), CURSOR_MATERIAL)
  this.cursor.position.add(DIRECTION)

  const segmentsGeometry = new THREE.Geometry()
  this.segments = new THREE.LineSegments(segmentsGeometry, SEGMENT_MATERIAL)
  this.segments.position.z += 0.25

  const perimeterGeometry = new THREE.Geometry()

  perimeterGeometry.vertices.push(cursorGeometry.vertices[0].clone())
  perimeterGeometry.vertices.push(cursorGeometry.vertices[1].clone())

  this.perimeter = new THREE.LineSegments(perimeterGeometry, PERIMETER_MATERIAL)
  this.perimeter.position.z += 0.5
  this.perimeter.name = 'Perimeter'

  const surfaceGeometry = new THREE.Geometry()
  this.surface = new THREE.Mesh(surfaceGeometry, SURFACE_MATERIAL)
  this.surface.name = 'Surface'

  const terrainGeometry = new THREE.Geometry()
  this.terrain = new THREE.Mesh(terrainGeometry, GRASS_MATERIAL)
  this.terrain.name = 'Terrain'
  let lights = new THREE.HemisphereLight(0x3cffe4, 0xffffff)
  lights.name = 'Lights'

  scene.add(this.cursor)
  scene.add(this.perimeter)
  scene.add(this.segments)
//   scene.add(this.terrain)
  scene.add(this.surface)
//   scene.add(lights)

  this.connect = function() {
    
//     this.updateCamera()
//     camera.position.z += 600
//     camera.position.y -= 20

	TEST = false

	scene.fog = new THREE.FogExp2(BG, 0);

  }

  this.disconnect = function(){
        
	 scene.fog = new THREE.FogExp2(BG, 0.02);

     TEST = true
  }

  this.control = function(event) {

	if( control.SPACE )	{ scope.extrude() }
	if( control.UP )	{ SLOPE = 1 }
	if( control.DOWN )	{ SLOPE = -1 }
	if( control.LEFT )	{ ANGLE = 1 }
	if( control.RIGHT )	{ ANGLE = -1 }

  }

  this.update = function() {

// 	this.control()
    this.VIEW = VIEW

    if (!VIEW) {
      PITCH.applyAxisAngle(UP, ((Math.PI * 2) / 64) * ANGLE)
      for (let i in this.cursor.geometry.vertices) {
        this.cursor.geometry.vertices[i].applyAxisAngle(UP, ANGLE_STEP * ANGLE)
      }

      for (let i in this.cursor.geometry.vertices) {
        this.cursor.geometry.vertices[i].applyAxisAngle(PITCH, SLOPE_STEP * SLOPE)
      }

      this.cursor.geometry.verticesNeedUpdate = true
      this.perimeter.geometry.verticesNeedUpdate = true

      this.ANGLE += ANGLE
      this.SLOPE += SLOPE

    }

//     this.updateCamera()

    SLOPE = 0
    ANGLE = 0

  }

 this.reset = function(){

	DIRECTION.set( 0, 3, 0 )
	PITCH.set( 1, 0, 0 )
	POSITION.copy( DIRECTION )

	scene.remove( this.cursor )
  	this.cursor = new THREE.LineSegments(cursorGeometry.clone(), CURSOR_MATERIAL)

	this.cursor.geometry.copy( cursorGeometry )
	this.cursor.position.add(DIRECTION)

	scene.add( this.cursor )
    scene.remove(this.perimeter)
    this.perimeter.geometry.dispose()
    this.perimeter.geometry.copy( new THREE.Geometry )

	this.perimeter.geometry.vertices.push(cursorGeometry.vertices[0].clone())
	this.perimeter.geometry.vertices.push(cursorGeometry.vertices[1].clone())

    scene.add(this.perimeter)

    scene.remove(this.segments)
    this.segments.geometry.dispose()
    this.segments.geometry.copy( new THREE.Geometry )
    scene.add(this.segments)

    scene.remove(this.surface)
    this.surface.geometry.copy( new THREE.Geometry )
    this.surface.geometry.dispose()
    scene.add(this.surface)

    scene.remove(this.terrain)
    this.terrain.geometry.copy( new THREE.Geometry )
    this.terrain.geometry.dispose()

  }
  
  this.import = function(){ 
 
 	let step = 0

 	let straight = true
 	let count = 0
 	let rn = 20
 	let turn = 0
 	let sign = 1
 	let slope = 0
 	let max_turn

 	let trackLength = Math.random()*400+500

 	while( step < 20 ){
      scope.update()
      scope.extrude()
      renderer.render(scene, camera)

      step++
    }

	step = 0

 	while( step < trackLength ){

 	if( count === rn ){
 		if( straight ){
			turn = Math.floor( Math.random()*2 )+2
			max_turn = Math.floor( 32 / turn )-2

 			rn = Math.floor( Math.random()*max_turn )+3

 			straight = false
 			count = 0
 		}
 		else{
 			ANGLE = 0
 			sign *= -1
 			rn = Math.floor( Math.random()*20 )+3
 			count = 0
 			straight = true
 		}
 	}
 	if( !straight ){
		ANGLE = turn*sign
 	}
 	if( count == 0 && straight ){
 		slope = -Math.floor( Math.random()*3+1 )
 		SLOPE = slope
 	}
 	else if( count == 0 ){
 		SLOPE = -slope
 	}
      scope.update()
      scope.extrude()
      renderer.render(scene, camera)

      count++
      step++
    }

	SLOPE = -slope
	ANGLE = 0
	step = 0
 	while( step < 30 ){
      scope.update()
      scope.extrude()
      renderer.render(scene, camera)

      step++
    }
    
  }

  this.extrude = function() {

    const extruder        = this.perimeter.geometry.clone()
    const segmentsBuffer  = this.segments.geometry.clone()
    const surfaceBuffer   = this.surface.geometry.clone()

    const buffer = this.cursor.geometry.vertices
    const target = this.perimeter.geometry.vertices

    const a = this.cursor.geometry.vertices[0].clone()
    const b = this.cursor.geometry.vertices[1].clone()
    const c = this.cursor.geometry.vertices[3].clone()

    a.applyMatrix4(this.cursor.matrix)
    b.applyMatrix4(this.cursor.matrix)
    c.applyMatrix4(this.cursor.matrix)

    let n = 0
    if (extruder.vertices.length > 2) {
      n = 3
    } else {
      n = 2
    }

    if (segmentsBuffer.vertices.length > 0) {

      let d = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 1].clone()
      let e = segmentsBuffer.vertices[segmentsBuffer.vertices.length - 2].clone()

      surfaceBuffer.vertices.push(a)
      surfaceBuffer.vertices.push(b)
      surfaceBuffer.vertices.push(e)

      surfaceBuffer.vertices.push(b)
      surfaceBuffer.vertices.push(d)
      surfaceBuffer.vertices.push(e)

      let length = surfaceBuffer.vertices.length

      surfaceBuffer.faces.push(new THREE.Face3(length - 1, length - 2, length - 3))
      surfaceBuffer.faces.push(new THREE.Face3(length - 4, length - 5, length - 6))

    }

    extruder.vertices.push(target[target.length - n].clone())
    extruder.vertices.push(a)

    extruder.vertices.push(target[target.length - 1].clone())
    extruder.vertices.push(b)

    segmentsBuffer.vertices.push(a)
    segmentsBuffer.vertices.push(b)

    this.updateMesh(extruder, segmentsBuffer, surfaceBuffer)
    
    DIRECTION.copy(c).sub( this.cursor.position )
    this.cursor.position.add( DIRECTION )
//     camera.position.add(DIRECTION)

    this.ANGLE = 0
  }

  this.updateMesh = function(extruder, segmentsBuffer, surfaceBuffer) {

    scene.remove(this.perimeter)

    this.perimeter.geometry.dispose()
    this.perimeter.geometry = extruder.clone()
    this.perimeter.geometry.computeBoundingSphere()

    scene.add(this.perimeter)

    scene.remove(this.segments)

    this.segments.geometry.dispose()
    this.segments.geometry = segmentsBuffer.clone()
    this.segments.geometry.computeBoundingSphere()

    scene.add(this.segments)

    scene.remove(this.surface)

    this.surface.geometry.dispose()
    this.surface.geometry = surfaceBuffer.clone()
    this.surface.geometry.computeBoundingSphere()

    scene.add(this.surface)

  }

  this.generateMesh = function(){

  	let time = performance.now()

	const geometry = new THREE.Geometry()
    const debug_a           = new THREE.Geometry()
    const debug_a_material  = new THREE.PointsMaterial({color: 0xf44245, size: 0.25 })

    const debug_b           = new THREE.Geometry()
    const debug_b_material  = new THREE.PointsMaterial({color: 0xffffff, size: 0.25 })

	const edges = []
	edges[0] = new THREE.Geometry()
	edges[1] = new THREE.Geometry()

	const target = []
	target[0] = new THREE.Geometry()
	target[1] = new THREE.Geometry()

	const faces = []

	const partition = []

	// Generate initial extrusion targets
	for( let i = 0; i < scope.segments.geometry.vertices.length; i++ ){

		const n = ( i%2 == 0 ) ? 1 : -1

		const a = scope.segments.geometry.vertices[i].clone()
		const b = scope.segments.geometry.vertices[i+n].clone()

		edges[i%2].vertices.push(a)

		b.sub(a)
// 		b.normalize()
		b.multiplyScalar(-1)

		target[i%2].vertices.push( b.clone() )
		
	}

	for( let i = 0; i < 4; i ++ ){

	const edgesBuffer  = []
	const targetBuffer = []

	edgesBuffer[0] = new THREE.Geometry()
	edgesBuffer[1] = new THREE.Geometry()

	targetBuffer[0] = new THREE.Geometry()
	targetBuffer[1] = new THREE.Geometry()

	geometry.mergeVertices()
	console.log('Terrain Generation Iteration ' + i)

	for( let s = 0; s < 2; s++ ){	

	for( let v = 0; v < edges[s].vertices.length-1; v++ ){

		const a = edges[s].vertices[v].clone()
		const b = edges[s].vertices[v+1].clone()
		const c = a.clone()

		const d = target[s].vertices[v].clone()
		const e = target[s].vertices[v+1].clone()

		const dist = a.distanceTo(b)
		e.add(d)
		e.normalize()
		e.multiplyScalar(2)

		c.lerp(b, 0.5)
		c.add(e)
		
		// c must be decimated during creation
// 		debug_b.vertices.push(c)

		geometry.vertices.push( a.clone() )
		geometry.vertices.push( b.clone() )
		geometry.vertices.push( c.clone() )

		const length = geometry.vertices.length

		if( v > 1 ){
		let ignore = false

		const f = edgesBuffer[s].vertices[edgesBuffer[s].vertices.length-1]

		if( f.distanceTo(c) > 0 ){
		for( let r in geometry.vertices ){
			const c2d = new THREE.Vector2(c.x, c.y)
			const g2d = new THREE.Vector2(geometry.vertices[r].x, geometry.vertices[r].y)
			const dist = c2d.distanceToSquared( g2d )
				if( dist < 2 && dist > 0 ){
					ignore = true
				}
		}

// 		for( let r in edgesBuffer[s].vertices ){
// 			const c2d = new THREE.Vector2(c.x, c.y)
// 			const g2d = new THREE.Vector2(edgesBuffer[s].vertices[r].x, edgesBuffer[s].vertices[r].y)
			
// 			const dist = c2d.distanceTo( g2d )
// 				if( dist < 1 && dist > 0 ){
// 					ignore = true
// 				}
// 		}

		if( !ignore || i === 0 ){

			geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )
			geometry.vertices.push( f.clone() )
			geometry.faces.push( new THREE.Face3( length-1, length-3, length ) )

		edgesBuffer[s].vertices.push(c)
		targetBuffer[s].vertices.push(e)
		}
		else if( v < edges[s].vertices.length-2 ){
		edgesBuffer[s].vertices.push( edges[s].vertices[v+1] )	
		targetBuffer[s].vertices.push( target[s].vertices[v+1] ) 
		}
		}
		}
		else{
		edgesBuffer[s].vertices.push(c)
		targetBuffer[s].vertices.push(e)
		}

// 		geometry.faces.push( new THREE.Face3( length-1, length-2, length-3 ) )
		
// 		edgesBuffer[s].vertices.push(c)
// 		targetBuffer[s].vertices.push(e)

	}

		edges[s].copy(edgesBuffer[s])
		target[s].copy(targetBuffer[s])

	}

	}

	console.log('Generating Noise...')
	scope.generateNoise( geometry )
	geometry.verticesNeedUpdate = true
	geometry.elementsNeedUpdate = true
	geometry.computeFaceNormals()
	geometry.mergeVertices()

	this.terrain.geometry.copy( geometry )

	scene.add( this.terrain )

	console.log('Terrain Generation Completed in ' + ( ( performance.now() - time)/1000 )  )
//     const points_a = new THREE.Points( debug_a, debug_a_material )
//     const points_b = new THREE.Points( debug_b, debug_b_material )

//     scene.add( points_a )
//     scene.add( points_b )

  }

  this.generateNoise = function( geometry ){
    const perlin = new ImprovedNoise()
    const noise = []
//     noise.length = geometry.vertices.length
    let quality = 20

    let hi = 0
    let lo = 0
    const z = Math.random()*1000

    for (let i = 0; i < geometry.vertices.length; i++) {
      noise[i] = 0
    }

    for (let r = 0; r < 1; r++) {
    for (let i = 0; i < geometry.vertices.length; i++) {

        let lock = false
        let factor = 0.2

        let x = geometry.vertices[i].x
        let y = geometry.vertices[i].y

        noise[i] += Math.floor(perlin.noise(x / (quality), y / (quality), z) * quality * factor)

        if( noise[i] > hi ) hi = noise[i]
        if( noise[i] < lo ) lo = noise[i]

    }
    
    quality *= 2

    }

    for (let i = 0; i < noise.length; i++) {

    	let factor = 5

        for (let k in this.perimeter.geometry.vertices) {
          const dist = geometry.vertices[i].distanceTo(this.perimeter.geometry.vertices[k])

          if( dist/2 < factor ){
          	 factor = dist/2
          }

        }

      geometry.vertices[i].z += Math.floor( ( noise[i] )*factor )
    }
  }

}