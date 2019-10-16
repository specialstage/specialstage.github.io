function VHS( camera ){

  var scope = this
  this.PLAY = false
  this.RECORD = true

  this.tape = []
  this.timer = 0

  var frame = 0
  var capacity = 18000

  this.capture = function(v){

    return {
    position:	new THREE.Vector3().copy( v.position ),
    normal:		new THREE.Vector3().copy( v.normal ),
    direction:	new THREE.Vector3().copy( v.dir ),
    lookAt:		v.lookAt.clone(),
    rotation:	v.rotation,
    timer:		v.getTime(),
    objective:	v.getObjective(),
    check:		v.check,
    UP:			v.UP
    }


  }

  this.record = function( vehicle ){

    this.tape[frame] = this.capture(vehicle)
    frame ++
    frame %= capacity

    if ( frame == capacity - 1 ){
      console.log('VHS OVERWRITE')
    }

  }

  this.play = function( vehicle ){

    vehicle.position.copy( this.tape[frame].position )
    vehicle.mesh.position.copy( vehicle.position )

    vehicle.dir.copy(this.tape[frame].direction)
    vehicle.normal.copy(this.tape[frame].normal)
    vehicle.lookAt.copy( this.tape[frame].lookAt)

    vehicle.UP			= this.tape[frame].UP
	vehicle.rotation	= this.tape[frame].rotation
	vehicle.objective	= this.tape[frame].objective

	vehicle.mesh.lookAt( vehicle.lookAt )
	vehicle.mesh.rotateOnAxis( vehicle.up, vehicle.rotation)

    vehicle.rig( vehicle.up )
    vehicle.emit()

    if( this.tape[frame].check ){

    	let n = 0
    	if( this.tape[frame].objective === 0 ){
    	n = 4
    	}
    	else{
		n = this.tape[frame].objective-1
    	}
		stage.generate.checkpoints[n].display.material.color = palette[4]
    }

    this.timer = this.tape[frame].timer
    frame ++
    frame %= this.tape.length

    if( frame === 0 ){
    	stage.generate.resetCheckpoints()
    }
  }

  this.reset = function(){

    frame = 0
    stage.generate.resetCheckpoints()

      scope.PLAY = false
      scope.RECORD = true
      scope.tape = []
    
  }

  this.update = function(){

    if( this.PLAY ){
      if( this.RECORD ){
      	frame = 0
      	this.RECORD = false

      }
      if( frame === 0 ){
		stage.generate.resetCheckpoints()
      }
      this.play( vehicle )
    }
    else if( this.RECORD ){
      this.record( vehicle )
    }

  }

}