function VHS( camera ){

  const scope = this
  this.PLAY = false
  this.RECORD = true

  this.tape = []
  this.timer = 0

  let frame = 0
  let capacity = 18000

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

    this.tape[frame] = vehicle.record();
    frame ++
    frame %= capacity

    if ( frame == capacity - 1 ){
      console.log('VHS OVERWRITE')
    }

  }

  this.play = function( vehicle ){

	if( this.RECORD ){

		this.RECORD = false
		frame = 0
		TIMEOUT = 0
		
	}

	if( frame === 0 ){

		stage.generate.resetCheckpoints()

	}

    vehicle.replay( this.tape[frame] );

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

    	stage.generate.resetCheckpoints();

    }
  }

  this.reset = function(){

    frame = 0
    stage.generate.resetCheckpoints()

      scope.PLAY = false
      scope.RECORD = true
      scope.tape = []
    
  }

  this.export = function(){
  	
	let output = ''
  	for( let i = 0; i < scope.tape.length; i++ ){

  		let position = scope.tape[i].position.x + ' ' + scope.tape[i].position.y + ' ' + scope.tape[i].position.z
  		output += position
  		output += '/n'

  	}

  	return output

  }

}