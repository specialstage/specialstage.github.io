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

			window.addEventListener( 'touchstart', scope.touch, false);
			window.addEventListener( 'touchmove',  scope.touch, false);
			window.addEventListener( 'touchend',   scope.touch, false);

		}
		else{

			window.addEventListener( 'keydown',    scope.key, false );
			window.addEventListener( 'keyup',      scope.key, false );
			window.addEventListener( 'mousedown',  scope.mousedown );
			window.addEventListener( 'mouseup',    scope.mouseup, false );
			window.addEventListener( 'touchstart', scope.touchSetup, false );

		}

	}

	this.disconnect = function(){

		window.removeEventListener('keydown',   scope.key, false);
		window.removeEventListener('keyup',     scope.key, false);
		window.removeEventListener('mousedown', scope.mousedown, false );
		window.removeEventListener('mouseup',   scope.mouseup, false );

		window.removeEventListener('touchstart', scope.touchSetup, false);
		window.removeEventListener('touchstart', scope.touch, false);
		window.removeEventListener('touchmove',  scope.touch, false);
		window.removeEventListener('touchend',   scope.touch, false);

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
      case('w'):
        scope.UP = input
      break
      case('s'):
        scope.DOWN = input
      break
      case('a'):
        scope.LEFT = input
      break
      case('d'):
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

		event.preventDefault();

		scope.touches[0] = { x: event.clientX, y: event.clientY, start: true } 

	}

	this.mouseup = function( event ){

		event.preventDefault();

		scope.touches[0] = { x: event.clientX, y: event.clientY, start: false }

	}

	this.touchSetup = function( event ){

		window.removeEventListener( 'keydown',   scope.key, false );
		window.removeEventListener( 'keyup',     scope.key, false );
		window.removeEventListener( 'keyup',     scope.key, false );
		window.removeEventListener('mousedown', scope.mousedown, false );
		window.removeEventListener('mouseup',   scope.mouseup, false );

		window.removeEventListener('touchstart', scope.touchSetup, false);

		window.addEventListener('touchstart', scope.touchstart, false);
		window.addEventListener('touchmove',  scope.touchmove, false);
		window.addEventListener('touchend',   scope.touchend, false);

		scope.touchstart( event )

	}

	this.clear = function(){

	scope.touches = [];

		this.UP     = false;
		this.DOWN   = false;
		this.LEFT   = false;
		this.RIGHT   = false;
		this.ENTER  = false;

	}

	this.touchstart = function( event ){

		const touches = event.touches

		scope.touches = []

		for( let i = 0; i < touches.length; i++ ){

			scope.touches[i] = { x: touches[i].clientX, y: touches[i].clientY, start: true }

		}

	}

	this.touchmove = function( event ){

		scope.touches = []

		const touches = event.touches

		for( let i = 0; i  < touches.length; i++ ){

			scope.touches[i] = { x: touches[i].clientX, y: touches[i].clientY, start: false };

		}

	}

	this.touchend = function( event ){

		scope.touches = []

		const touches = event.touches

		for( let i = 0; i < touches.length; i++ ){

			scope.touches[i] = { x: touches[i].clientX, y: touches[i].clientY, start: false };

		}

	}

	}