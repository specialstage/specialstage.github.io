function Stage() {
	
		const scope = this

		this.start		 = new THREE.Vector3()
		this.generate    = new Generate()
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
		

	this.connect = function( reset = false ){
		
// 		ui.clear();

		camera.position.set( 0, 400, 300 );
		camera.far = 2000;
		camera.updateProjectionMatrix();
		camera.lookAt( new THREE.Vector3() )
		renderer.render( scene, camera )

		if( ! reset ){

			this.name = this.generate.name();
			let c = '';

			for( let i in this.name ){

			c += ( this.name.charCodeAt( i ) ).toString();

			}

			SEED = c;

		}

		this.generate.connect()
		COUNTER++

	}

	this.disconnect = function(){

		this.generate.disconnect()
		this.generate.reset()
		
	}

	this.reset = function( reset = false ){

		SEED++;
		this.disconnect()
		this.generate = new Generate()
		this.connect( reset );
		
	}

	this.preview = function(){

		window.setTimeout( 0, 0, )
	}

}