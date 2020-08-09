function UI() {

	let url = './img/STAGE_8PX.png'
	const scope = this;

	this.renderer = document.createElement('canvas');
	this.renderer.id = 'ui';

	document.body.appendChild(this.renderer);

	const context = this.renderer.getContext('2d');
	this.context = context;

	const bitmap = document.createElement('img');
	bitmap.src = url;
	bitmap.onload = function() {
		scope.connect();
		scope.onload();
	}
	;

	const buffer = document.createElement('canvas');

	this.onload = function() {}

	const font = document.createElement('canvas');
	const filter = font.getContext('2d');

	// Renderer parameters.

	this.scale = 1;

	// Navigation parameters.

	this.col = 8;
	this.row = 8;

	this.width;
	this.height;

	const sheet = {

		unit: 8,
		width: 128,
		height: 128,
		cols: 16,
		rows: 16,

	}

	let dpad = {};

// 	dpad.d = { x: 128, y: 156, w: 128, h: 128 }
// 	dpad.a = { x: 128, y: 156, w: 128, h: 128 }
// 	dpad.b = { x: 0, y: 156, w: 128, h: 128 }

	// Redrawing variables

	let REDRAW = false;
	let redraw = [];
	let buttons = [];

	// Controls

	let analog = {

		value:		0,
		deadzone:	2,
		range: 64,
		active: false,
		x: 0,
		y: 0,
		start: { x: 0, y: 0 },
		touch: { x: 0, y: 0 },

	}

	this.connect = function() {

		context.imageSmoothingEnabled = false;

		font.width = bitmap.width;
		font.height = bitmap.height;

		// Copy font image to new canvas.

		filter.drawImage(
		bitmap, 0, 0, font.width, font.height, 0, 0, font.width, font.height
		);

	}

	this.resize = function( width, height, scale ) {

		// Round the devicePixelRatio and resize the viewport to prevent sub-pixel rendering.

		let meta = document.querySelector("meta[name=viewport]")
		let viewport = (1 / window.devicePixelRatio) * Math.round(window.devicePixelRatio);

		let w = Math.floor( window.innerWidth * viewport );

// 		if ( w > 720 ) w *= 2;

		meta.setAttribute('content', 'width=' + w + ', initial-scale=' + viewport + ',maximum-scale=' + '4.0' + ', user-scalable=0');

		// Create scaled width & height targets.

		scope.scale = scale;
		this.width = width;
		this.height = height;

		this.renderer.width = width;
		this.renderer.height = height;

		// Scale the context & disable smoothing.
		this.renderer.style.zoom = scale;
// 		context.scale( scope.scale, scope.scale );
		context.imageSmoothingEnabled = false;

		this.redraw();

		dpad.d = { x: 128, y: 160, w: 128, h: 128 }
		dpad.a = { x: 128, y: 160, w: 128, h: 128 }
		dpad.b = { x: 0, y: 160, w: 128, h: 128 }

		this.automate( width, height );

	}
	
	this.update = function( inputs ){

		for( let i in inputs ){

		for( let b in buttons ){

			if( inputs[i].x > buttons[b].x * scope.scale &&
			inputs[i].y > buttons[b].y * scope.scale &&
			inputs[i].x < buttons[b].w * scope.scale &&
			inputs[i].y < buttons[b].h * scope.scale &&
			inputs[i].start == true
			){

				buttons[b].funct();
				inputs[i].start = false;
				break;

			}

		}


		}


	}

	this.print = function( str, _x, _y, scale=1 ) {

		let i = 0;

		let x = scope.compile(_x, scope.width, scope.col);
		let y = scope.compile(_y, scope.height, scope.row);

		while (i < str.length) {

			scope.encode(str.charAt(i), x + (i * scope.col * scale), y, scale);
			i++;

		}

		if ( !REDRAW ) {

			redraw.push( function() {

				scope.print(str, _x, _y, scale);

			});

		}

	}

	this.text = function( str, _x, _y,  scale=1, length = 0 ){

// 		this.clear( _x, _y, str.length * scope.col, scope.row );

		let i = 0;

		while (i < str.length) {

			scope.encode( str.charAt(i), _x + (i * scope.col * scale), _y, scale );
			i++;

		}

	}

	this.button = function( str, _x, _y, _w, _h, funct, border=true, scale=1 ) {

		let x = scope.compile(_x, scope.width, scope.col);
		let y = scope.compile(_y, scope.height, scope.row);

		let w = scope.compile(_w, scope.width, scope.col);
		let h = scope.compile(_h, scope.height, scope.row);

		if (border) {

			context.drawImage(font, 0, 0, 1, 1, x, y+h/2, w+1, 1);
			context.drawImage(font, 0, 0, 1, 1, x, y-h/2, w+1, 1);
			context.drawImage(font, 0, 0, 1, 1, x, y-h/2, 1, h);
			context.drawImage(font, 0, 0, 1, 1, x+w, y-h/2, 1, h);

		}

		let i = 0;

		let center = w/2

		while (i < str.length) {

			scope.encode(str.charAt(i), x + (i * scope.col ) + w/2 - Math.round( str.length * scope.col )/2 + 2, y - scope.row/2, scale);
			i++;

		}

		buttons.push( { x: x, y: y-h/2, w: x+w, h: y+h/2, funct: function(){ funct() } } );

		if ( !REDRAW ) {

			redraw.push( function() {

				scope.button(str, _x, _y, _w, _h, funct, border, scale );

			});

		}

	}

	this.line = function( x, y, w, h,) {

		scope.sprite( 0, 0, 1, 1, x, y, w, h );

	}

	this.sprite = function( sx, sy, sw, sh, _x, _y, _w, _h ) {

		let x = scope.compile(_x, scope.width, scope.col);
		let y = scope.compile(_y, scope.height, scope.row);

		let w = scope.compile(_w, scope.width, scope.col);
		let h = scope.compile(_h, scope.height, scope.row);

// 		context.clearRect(x, y, w, h);
		context.drawImage(font, sx, sy, sw, sh, x, y, w, h);

		if (!REDRAW) {

			redraw.push( function() {

				scope.sprite(sx, sy, sw, sh, _x, _y, _w, _h);

			});

		}

	}

	this.getDrawList = function() {

		return redraw;

	}

	this.redraw = function() {

		REDRAW = true;

		scope.clear();

		for (let i = 0; i < redraw.length; i++) {

			redraw[i]();

		}

		REDRAW = false;

	}

	this.automate = function( w, h ){

		let x = Math.floor(w/3)-2
		let y = Math.floor(h/4)+64

		if( dpad.d.w > x ){

			dpad.d.w = x
			dpad.d.x = x

			dpad.a.w = x
			dpad.a.x = x

		}

		if( dpad.d.y > y ){

			dpad.a.y = y
			dpad.d.y = y

		}

	}

	this.pad = function( c, x, y, w, h, hold, release ){

		let i = 0;

		release();

		while( i < control.touches.length ){;

			if( control.touches[i].x > x * scope.scale &&
			control.touches[i].y > y * scope.scale &&
			control.touches[i].x < (x+w) * scope.scale &&
			control.touches[i].y < (y+h) * scope.scale
			){

				hold();

			}

		i++;

		}

		// PAD HITBOX DEBUG

// 		context.drawImage( font, 0, 0, 1, 1, x, y, w, 1 );
// 		context.drawImage( font, 0, 0, 1, 1, x, y+h-1, w, 1 );

// 		context.drawImage( font, 0, 0, 1, 1, x, y+h/2, 6, 1 );
// 		context.drawImage( font, 0, 0, 1, 1, x, y+h/2, 1, 6 );

// 		context.drawImage( font, 0, 0, 1, 1, x+8, y+36, w-16, 1 );
// 		context.drawImage( font, 0, 0, 1, 1, x+8, y+h-1-36, w-16, 1 );

// 		context.drawImage( font, 0, 0, 1, 1, x+8, y+36, 1, h-72 );
// 		context.drawImage( font, 0, 0, 1, 1, x+w-8, y+36, 1, h-72 );

		scope.encode( c, x + w/2 - scope.col/2, y+h/2 - scope.row/2 );


	}

	this.dpad = function(){


		let w = dpad.d.w/2-56/2-2

		context.drawImage( font, 88, 88, 40, 40, scope.width-dpad.a.x+44, scope.height-dpad.a.y+44, 40, 40 );

// 		context.drawImage( font, 0, 96, 16, 5, dpad.d.x-5, window.innerHeight-dpad.d.y+dpad.d.h/2+32, 16, 5 );
// 		context.drawImage( font, 0, 100, 16, 6, dpad.d.x-5, window.innerHeight-dpad.d.y+dpad.d.h/2-32, 16, 6 );

// 		context.drawImage( font, 0, 100, 6, 6, dpad.d.x+dpad.d.w-4, window.innerHeight-dpad.d.y+dpad.d.h/2-32, 6, 6 );
// 		context.drawImage( font, 5, 100, 6, 6, dpad.d.x-dpad.d.w+4, window.innerHeight-dpad.d.y+dpad.d.h/2-32, 6, 6 );

// 		context.drawImage( font, 0, 96, 16, 16, dpad.d.x-5, window.innerHeight-dpad.d.y+dpad.d.h/2-5, 16, 16 );

		scope.pad( '<', dpad.d.x-dpad.d.w-1, scope.height-dpad.d.y, dpad.d.w, dpad.d.h,

			function(){ control.LEFT = true },
			function(){ control.LEFT = false }

		);

		scope.pad( '>', dpad.d.x+1, scope.height-dpad.d.y, dpad.d.w, dpad.d.h,

			function(){ control.RIGHT = true },
			function(){ control.RIGHT = false }

		);
		
		scope.pad( '^', scope.width-dpad.a.x, scope.height-dpad.a.y, 128, 128,

			function(){ control.UP = true },
			function(){ control.UP = false }

		);
	}

	this.clear = function() {

		if ( !REDRAW ){ redraw = []; }

		buttons = []; 

		context.clearRect(0, 0, scope.width, scope.height);
		context.beginPath();

	}

	this.delete = function(x=0, y=0, w=renderer.width, h=renderer.height) {

		context.clearRect(x, y, w, h);

	}

	this.encode = function(char, x, y, scale=1) {

		let n = char.charCodeAt(0);

		let sx = (n * sheet.unit) % sheet.width;
		let sy = Math.floor(n / sheet.cols) * sheet.unit;

		context.clearRect(x, y, sheet.unit, sheet.unit);
		context.drawImage(font, sx, sy, sheet.unit, sheet.unit, x, y, sheet.unit * scale, sheet.unit * scale);

	}

	this.float = function( input, sign ){

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

	this.compile = function(input, range, unit) {

		let out = 0;

		switch (typeof input) {

		case ('number'):

			out = input;

			break;

		case ('function'):

			out = input();

			break;

		case ('string'):

			let float = false;
			let sign = 1.0;
			let i = 0;
			let n = '';

			while (i < input.length) {

				let c = input.charAt(i);

				if (c === '.') {

					n += c;
					float = true;

				} else if (c === '+') {

					n = (float) ? Number(n) * range : Number(n) * unit;
					n *= sign;
					sign = 1.0;
					out += n;
					float = false;
					n = ''

				} else if (c === '-') {

					n = (float) ? Number(n) * range : Number(n) * unit;
					n *= sign;
					sign = -1.0
					out += n;
					float = false;
					n = ''

				} else if (c === 'p') {

					n = Number(n)
					n *= sign;
					out += n;
					n = ''

				} else if (i === input.length - 1) {

					n += c;
					n = (float) ? Number(n) * range : Number(n) * unit;
					n *= sign;
					out += n;
					n = ''

				} else {

					n += c;

				}

				i++;

			}

			break;

		}

		return out;

	}
}
