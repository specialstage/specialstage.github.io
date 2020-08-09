function UI(){
  
  const scope = this
  this.load   = false

  const url = './js/ui.png'
  
  const canvas = document.createElement( 'canvas' )
  canvas.id = 'ui'

  document.body.appendChild( canvas )
  
  const context = canvas.getContext('2d')
  context.imageSmoothingEnabled = false;

  const sheet = document.createElement('img')
  sheet.src = url
  
  sheet.onload = function(){
    scope.load = true
  }
  
  const grid   = []
  this.xl = 0
  this.yl = 0
  const lookup = []
  const size  = 8
  const shift = 8
  
  let time    = window.performance.now() 
  let dt      = 1
  
  this.connect = function(){
    
    this.xl = Math.floor(window.innerWidth/size)/SCALE
    this.yl = Math.floor(window.innerHeight/size)/SCALE
    
    for( let x = 0; x < this.xl; x++ ){
      grid[x] = []
    for( let y = 0; y < this.yl; y++ ){
      grid[x][y] = { x: x*size, y: y*size }
    }
    }
    
    // Numbers
    lookup['0'] = { x:  0 * size, y: 0 }
    lookup['1'] = { x:  1 * size, y: 0 }
    lookup['2'] = { x:  2 * size, y: 0 }
    lookup['3'] = { x:  3 * size, y: 0 }
    lookup['4'] = { x:  4 * size, y: 0 }
    lookup['5'] = { x:  5 * size, y: 0 }
    lookup['6'] = { x:  6 * size, y: 0 }
    lookup['7'] = { x:  7 * size, y: 0 }
    lookup['8'] = { x:  8 * size, y: 0 }
    lookup['9'] = { x:  9 * size, y: 0 }
    lookup['.'] = { x: 10 * size, y: 0 }
    lookup['+'] = { x: 12 * size, y: 0 }
    lookup['-'] = { x: 13 * size, y: 0 }
    lookup['L'] = { x: 14 * size, y: 0 }
    lookup['R'] = { x: 15 * size, y: 0 }
    lookup['U'] = { x: 16 * size, y: 0 }
    lookup['D'] = { x: 17 * size, y: 0 }

    // Alphabet
    lookup['a'] = { x:  0 * size, y: shift }
    lookup['b'] = { x:  1 * size, y: shift }
    lookup['c'] = { x:  2 * size, y: shift }
    lookup['d'] = { x:  3 * size, y: shift }
    lookup['e'] = { x:  4 * size, y: shift }
    lookup['f'] = { x:  5 * size, y: shift }
    lookup['g'] = { x:  6 * size, y: shift }
    lookup['h'] = { x:  7 * size, y: shift }
    lookup['i'] = { x:  8 * size, y: shift }
    lookup['j'] = { x:  9 * size, y: shift }
    lookup['k'] = { x: 10 * size, y: shift }
    lookup['l'] = { x: 11 * size, y: shift }
    lookup['m'] = { x: 12 * size, y: shift }
    lookup['n'] = { x: 13 * size, y: shift }
    lookup['o'] = { x: 14 * size, y: shift }
    lookup['p'] = { x: 15 * size, y: shift }
    lookup['q'] = { x: 16 * size, y: shift }
    lookup['r'] = { x: 17 * size, y: shift }
    lookup['s'] = { x: 18 * size, y: shift }
    lookup['t'] = { x: 19 * size, y: shift }
    lookup['u'] = { x: 20 * size, y: shift }
    lookup['v'] = { x: 21 * size, y: shift }
    lookup['w'] = { x: 22 * size, y: shift }
    lookup['x'] = { x: 23 * size, y: shift }
    lookup['y'] = { x: 24 * size, y: shift }
    lookup['z'] = { x: 25 * size, y: shift }
    lookup[' '] = { x: 26 * size, y: 48 }
    
    lookup['U'] = { x: 0 * size, y: 24 }
    lookup['D'] = { x: 1 * size, y: 24 }
    lookup['L'] = { x: 2 * size, y: 24 }
    lookup['R'] = { x: 3 * size, y: 24 }
    lookup['Y'] = { x: 0 * size, y: 16 }

    window.addEventListener( 'mouseup'  , scope.mouseup )
    window.addEventListener( 'touchstart' , scope.touchsetup )

  }
  
  this.resize = function(){
    canvas.width  = window.innerWidth/SCALE;
    canvas.height = window.innerHeight/SCALE;

    this.xl = Math.floor(window.innerWidth/size)/SCALE
    this.yl = Math.floor(window.innerHeight/size)/SCALE
    
    for( let x = 0; x < this.xl; x++ ){
      grid[x] = []
    for( let y = 0; y < this.yl; y++ ){
      grid[x][y] = { x: x*size, y: y*size }
    }
    }
    
    if( MENU || PLAY ) vehicle.display()
  }
  
  this.clear = function(){
    context.clearRect( 0,0, canvas.width, canvas.height)
  }
  
  this.textbox = function( input, x_, y_ ){
  
    let x = grid[x_][y_].x
    let y = grid[x_][y_].y
    context.beginPath()
    context.clearRect( x, y, input.length * size+size, size )

    for( let i in input ){
      context.drawImage( sheet, lookup[input.charAt(i)].x, lookup[input.charAt(i)].y, size, size, x+i*size, y, size, size )
    }
    context.closePath()
  }
  
  this.button = function( label, action, x_, y_, w, h, TOGGLE, OUTLINE ){

  	if( TOGGLE == undefined ) TOGGLE = false
    if( OUTLINE == undefined ) OUTLINE = true

    const width = label.length * size
    
    let x = grid[x_][y_].x
    let y = grid[x_][y_].y
    
//     context.beginPath()
//     if( UPDATE ){
//     context.clearRect( x, y-size, size * w + size, size * h )
//     }

	if( OUTLINE ){
// 	context.clearRect( x, y, w*size, h*size+size )
// 	context.save()
// 	context.fillStyle = '#101010'
// 	context.globalAlpha = 0.5
// 	context.fillRect( x, y, w*size, h*size+size)
// 	context.restore()

    context.drawImage(
      sheet,
      0,
      64,
      1,
      1,
      x,
      y,
      ( size )*w,
      1
    )

    context.drawImage(
      sheet,
      0,
      64,
      1,
      1,
      x,
      y+size+size*h,
      size*w,
      1
    )

    context.drawImage(
      sheet,
      0,
      64,
      1,
      1,
      x,
      y,
      1,
      size+size*h+1
    )

    context.drawImage(
      sheet,
      0,
      64,
      1,
      1,
      x+w*size,
      y,
      1,
      size+size*h+1
    )
	}
    
    for( let i in label ){
      context.drawImage(
        sheet,
        lookup[label.charAt(i)].x,
        lookup[label.charAt(i)].y,
        size,
        size,
        Math.floor(w*size/2) + ( x+i*size ) - Math.floor(width/2) + size/2,
        y+(h*size)/2,
        size,
        size )
    }

    context.closePath()
    
    touches = control.touches 

	for( let i in touches ){
	if( touches[i].x/SCALE > x && touches[i].x/SCALE < x+size*w/SCALE && touches[i].y/SCALE > y && touches[i].y/SCALE < y + size*h+size ){

	  if( TOGGLE & touches[i].start === true ){
	  touches[i].start = false
	  action()
	  }
	  else if( !TOGGLE ){
	  action()
	  }
	}
	}

  }
  
  this.dpad = function(){

  	control.LEFT 	= false
	control.UP		= false
  	control.DOWN 	= false
  	control.RIGHT 	= false

  	let xl = Math.floor(scope.xl/3)
  	let right = scope.xl-2-xl*2

    this.button('L', function(){ control.LEFT = true  }, 1, scope.yl-24, xl-1,  8, false )
    this.button('R', function(){ control.RIGHT = true }, xl+1, scope.yl-24, xl-1, 8, false )

    this.button('U', function(){ control.UP = true    }, xl*2+1, scope.yl-24, right, 8, false )
    this.button('D', function(){ control.DOWN = true  }, xl*2+1, scope.yl-14, right, 8, false )
    
  }

this.getTextFloat = function( input, sign ){

	let text = Math.floor( Math.abs( input * 100 ) )
	text = text.toString()

	let integer = text.slice( 0,text.length-2 )
	let float 	= text.slice( text.length-2,text.length )

	if( input == 0 ){
	
		return( '0.00' )

	}
	else{

		if( integer.length == 0 ){
			integer = '0'
		}
		if( float.length < 2 ){
			float += '0'
		}

		if( sign && input > 0 ){
			integer = '+' + integer
		}
		else if( input < 0 ){
			integer = '-' + integer
		}

		text = integer + '.' + float

		return text

	}
}

}