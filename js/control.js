function Control(){

  var scope = this

  this.UP     = false
  this.DOWN   = false
  this.LEFT   = false
  this.RIGHT  = false
  
  this.TOUCHUP    = 0
  this.TOUCHLEFT  = 0
  this.TOUCHRIGHT = 0
    
  this.connect = function(){

    window.addEventListener('keydown', scope.key, false)
    window.addEventListener('keyup',   scope.key, false)
    
    window.addEventListener('touchstart', scope.touch, false)
    window.addEventListener('touchmove',  scope.touch, false)
    window.addEventListener('touchend',   scope.touch, false)

  }

  this.disconnect = function(){

    window.removeEventListener('keydown', scope.key, false)
    window.removeEventListener('keyup',   scope.key, false)
    
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
  
  this.touch = function( event ){
  var w = window.innerWidth/4
  
    switch( event.type ){
        case( 'touchstart' ):
        
        for ( var i in event.touches ){
          var x = event.touches[i].clientX 
          if( x > w*2 ){
          scope.UP = true
          scope.TOUCHUP = i
          }
          if ( x > w && x < w*2 ) {
          scope.RIGHT = true
          scope.LEFT  = false
          }
          if ( x < w ) {
          scope.RIGHT = false
          scope.LEFT  = true
          }
        }
        
        break
        case( 'touchend' ):
        console.log(event)
        for ( var i in event.changedTouches ){
          var x = event.changedTouches[i].clientX 
          if( x > w*2 ){
          scope.UP = false
          }
          if ( x > w && x < w*2 ) {
          scope.RIGHT = false
          }
          if ( x < w ) {
          scope.LEFT  = false
          }
        }
        
        break
        case( 'touchmove' ):
        
        break
    }
  }
}