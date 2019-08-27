function Control(){

  var scope = this

  this.MOBILE = false

  this.UP     = false
  this.DOWN   = false
  this.LEFT   = false
  this.RIGHT  = false
  this.ENTER  = false

  this.touches = []
    
  this.connect = function(){
    
    if( this.MOBILE ){
		window.addEventListener('touchstart', scope.touch, false)
		window.addEventListener('touchmove',  scope.touch, false)
		window.addEventListener('touchend',   scope.touch, false)
    }
    else{
		window.addEventListener('keydown',    scope.key, false)
		window.addEventListener('keyup',      scope.key, false)
		window.addEventListener('mousedown',  scope.mousedown )
		window.addEventListener('mouseup',    scope.mouseup, false )
    	window.addEventListener('touchstart', scope.touchSetup, false)
    }

  }

  this.disconnect = function(){

    window.removeEventListener('keydown',   scope.key, false)
    window.removeEventListener('keyup',     scope.key, false)
	window.removeEventListener('mousedown', scope.mousedown, false )
	window.removeEventListener('mouseup',   scope.mouseup, false )

    window.removeEventListener('touchstart', scope.touchSetup, false)
    window.removeEventListener('touchstart', scope.touch, false)
    window.removeEventListener('touchmove',  scope.touch, false)
    window.removeEventListener('touchend',   scope.touch, false)
    
  }

  this.key = function(event){

    var input = ( event.type == 'keydown' )

    switch( event.key ){
      case('ArrowUp'):
        scope.UP = input
      break
      case('ArrowDown'):
        scope.DOWN = input
      break
      case('ArrowLeft'):
        scope.LEFT = input
      break
      case('ArrowRight'):
        scope.RIGHT = input
      break
      case('r'):
        scope.RESET = input
      break
      case(' '):
      	scope.SPACE = input
      break
      case('Enter'):
        scope.ENTER = input
      break
    }
  }

  this.mousedown = function( event ){
  	scope.touches[0] = { x: event.clientX, y: event.clientY, active: true } 
	console.log( scope.touches )
  }

  this.mouseup = function( event ){
	
  	scope.touches[0] = { x: event.clientX, y: event.clientY, active: false } 
	console.log( scope.touches )

  }

  this.touchSetup = function( event ){

  	window.removeEventListener( 'keydown',   scope.key, false )
  	window.removeEventListener( 'keyup',     scope.key, false )
  	window.removeEventListener( 'keyup',     scope.key, false )
	window.removeEventListener('mousedown', scope.mousedown, false )
	window.removeEventListener('mouseup',   scope.mouseup, false )

    window.removeEventListener('touchstart', scope.touchSetup, false)

    window.addEventListener('touchstart', scope.touchstart, false)
    window.addEventListener('touchmove',  scope.touchmove, false)
    window.addEventListener('touchend',   scope.touchend, false)

	scope.touches.length = event.touches.length

// 	console.log( event.touches.length )
//   	for( let i in event.touches ){
//   		scope.touches[i] = { x: event.touches[i].clientX, y: event.touches[i].clientY }
//   	}

	scope.touchstart( event )

  }

  this.touchstart = function( event ){
// 	event.preventDefault()

	const touches = event.changedTouches

	scope.touch = []

  	for( let i = 0; i < touches.length; i++ ){
  		scope.touches[i] = { x: touches[i].clientX, y: touches[i].clientY, active: true }
  	}

  }

  this.touchmove = function( event ){

	scope.touch = []

	const touches = event.changedTouches

  	for( let i = 0; i < touches.length; i++ ){

		const id = touches[i].identifier

  		scope.touches[i] = { x: touches[id].clientX, y: touches[id].clientY, active: true }
  	}

  }

  this.touchend = function( event ){

	scope.touch = []
	
	const touches = event.changedTouches
	
  	for( let i = 0; i < touches.length; i++ ){

		const id = touches[i].identifier

  		scope.touches[i] = { x: touches[id].clientX, y: touches[id].clientY, active: false }
  	}

  }
  
}