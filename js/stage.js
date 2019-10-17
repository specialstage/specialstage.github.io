function Stage() {
	
		const scope = this

		this.start		 = new THREE.Vector3()
		this.generate    = new Generate()
// 		this.nodes		 = new THREE.Line( new THREE.Geometry() )
// 		this.perimeter   = new THREE.LineSegments( new THREE.Geometry() )
// 		this.segments    = new THREE.Mesh( new THREE.Geometry() )
// 		this.surface     = new THREE.Mesh( new THREE.Geometry() )
// 		this.terrain     = new THREE.Mesh( new THREE.Geometry() )
// 		this.background  = new THREE.Mesh( new THREE.Geometry() )
// 		this.features	 = new THREE.Mesh( new THREE.Geometry() )
// 		this.checkpoints = new THREE.Mesh( new THREE.Geometry() )
		this.checkpoint = []
		this.objectives = []
		this.best = []
		this.grid = []
		this.dimension = 2400
		this.partitionDimension = 16
		this.partionDivision = this.dimension/this.partitionDimension


		for( let i = 0; i < 4; i++ ) {
			this.checkpoint[ this.checkpoint.length ] = new THREE.Mesh( new THREE.Geometry() )
		}

	this.connect = function(){
		
		ui.clear()
		camera.position.set(0,0,1600)
		camera.lookAt( new THREE.Vector3() )
		renderer.render( scene, camera )
		this.generate.connect()
		COUNTER++

	}

	this.disconnect = function(){

		this.generate.disconnect()
		this.generate.reset()
		
	}

	this.reset = function(){
		
		SEED = Math.floor( Math.random()*999999 )
		this.disconnect()
		this.generate = new Generate()
		this.connect()
		
	}

}