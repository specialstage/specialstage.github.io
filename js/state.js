function State() {
	
	const scope = this;

	let width;
	let height;

	let prompt = '';
	let frame = 0;

	this.resize = function( w, h ){

		width = w;
		height = h;

	}

	this.wallet = function(){

		let yen = vehicle.yen();

		ui.print( '$ ' + yen.toString(), '2', '1.0-4-4p' );

	}

	this.nav = function( state = function(){ ui.clear() }){

		ui.sprite( 8, 64, 8, 8, '1.0-4+2p', '2', 8, 8 );

		ui.button( '', '1.0-7', '2+4p', '7', '5', function(){ scope.menu( state ) },

		false );

	}

	this.title = function( state, breadcrumb ){

		// BREADCRUMB

		scope.breadcrumb( state, breadcrumb );

		// EXIT

		ui.sprite( 16, 64, 8, 8, '1.0-4+2p', '2', 8, 8 );
		ui.button( '', '1.0-7', '2+4p', '7', '5', function(){ state(); MENU = false }, false );

// 		if( document.fullscreenEnabled ){

// 			// DIVIDER

// 			ui.sprite( 0,0, 1,1, '1.0-5', '2+1p-4p', 1, 7+8 );

// 			// FULLSCREEN

// 	// 		ui.print('fullscreen', '1.0-10-9', '2')

// 			ui.sprite( 32, 64, 8, 8, '1.0-8', '2', 8, 8 );

// 			ui.button( '', '1.0-10', '2+4p', '5', '5', function(){ scope.fullscreen() },

// 			false );

// 		}

		scope.wallet();

	}

	this.breadcrumb = function( state, breadcrumb ){

		let funct = ( breadcrumb === undefined ) ? function(){ state() }
		: function(){ scope.menu( state ); MENU = false };

		ui.print( '< menu / vehicle', '2', '2' );
		ui.button( '', '2', '2+4p', '7', '8', funct, false );

	}

// 	this.menu = function( state ){
	
// 		MENU = true;
// 		window.cancelAnimationFrame( RAFID );
// 		RAFID = window.requestAnimationFrame( main );

// 		ui.clear();

// 		this.title( state );

// 		// MENU

// 		ui.button( 'vehicle', '2', '10', '1.0-4', '6', function(){ scope.vehicle( state ); }, true );
// 		ui.button( 'controls', '2', '18', '1.0-4', '6', function(){ scope.controls( state ); }, true );

// 		scope.discord();

// 	}

	this.intro = function(){

		ui.clear();

		ui.print( 'specialstage.io', '2', '2' );
		ui.print( '-', '2', '4' );
		ui.print( 'sakura biome test', '2', '6' );

		ui.print( 'A _ ' + BUILD, '2', '1.0-4-4p');

 		ui.button( 'gen', '2', '12', '8', '5', function(){

			scene.remove( sakura );
			sakura.geometry.dispose();
			sakura.geometry = stage.generate.sakura()
			scene.add( sakura );

		} );
		
		scope.nav( function(){ scope.intro() } );
		
		ui.print( 'menu', '1.0-9', '2' );
		ui.button('', '1.0-9', '2+4p', '4', '5', function(){ scope.menu( scope.intro ) }, false);

		scope.discord();

		ui.print('developed by', '2', '1.0-26')
		ui.print('www.procedural.ca', '2', '1.0-23')
		ui.print('www.ginko.ltd', '2', '1.0-21')

		ui.button( 'start', '2', '1.0-12', '1.0-4', '8', function(){

			scene.remove( sakura );

			ui.clear();
			START = true;
			stage.connect();
// 			firebase.analytics().logEvent('game_start');
			scope.load();
		
		} );

	}

	this.discord = function(){

		ui.sprite( 2, 83, 16, 12, '1.0-12', '1.0-5+4p', 16, 12 );
		ui.button( 'discord', '1.0-11', '1.0-4', '10', '4', function(){ window.open( 'https://discord.gg/ACewNWH'); }, false );

	}

	this.load = function(){

		ui.clear();

		LOADING = true

		scope.nav( scope.load );

		ui.print( 'seed : ', '2', '2' );

		let name = stage.name;

		ui.print( name, '2', '5-1p', 2);

		frame = 0;
		
	}

	this.ready = function(){

		ui.clear();

		LOADING = false;

		scope.nav( scope.ready );

		ui.print( 'stage generated.', '2', '2');

		ui.print( stage.name, '2', '5-1p', 2);
		
		scope.target();

		ui.button( 'ready', '2', '1.0-12', '1.0-4', '8', function(){

			stage.generate.END = false;

			ui.clear();
			scope.play();

			PLAY = true;
			
			vehicle.connect( stage.start, stage.surface );

// 			firebase.analytics().logEvent('stage_start');

		});

		scope.wallet();
	};

	this.play = function(){

		ui.clear();
		scope.nav( scope.play );
		MENU = false;

	}

	this.complete = function(){

		MENU = true;

		ui.clear();

		scope.nav( scope.complete );

		ui.print( 'stage complete!', '0.5-15', '0.3-1', 2 );

		window.setTimeout( scope.results, 2000 );

	}

	this.results = function(){

		ui.clear();

		MENU = true;

		let AT = ui.float( vehicle.AT() );
		
		scope.nav( scope.results );

		ui.print('stage complete : ' + stage.name, '2', '2' );

		ui.print( AT, '2', '5', 2 );

		if( vehicle.AT() < stage.best[3] ){

			ui.print('new record!', ( AT.length * 2 )+'+3'.toString(), '5+4p' );
			
		}
// 		let d = vehicle.AT() - stage.best[3];

// 		let s = ( d > 0 ) ? '(-' + ui.float( d ) + ')'
// 			: '(+' + ui.float( Math.abs(d) ) + ')';

// 		ui.print( s, '4+' + ( AT.length * 2 ).toString(), '4', 2 );

		let ln = 9;

		let cp = vehicle.CP();

		if( height > 340 ){

			for( let i = 0; i < cp.length; i++ ){

				ui.print( 'cp ' + (i+1).toString(), '2', ln + '+' + (i).toString() );

				let n = i+1;
				let c = ui.float( cp[i] );
				let d = cp[i] - stage.best[i];

				ui.print( c.toString(), '0.5 -1-' + c.length.toString(), ln + '+' + (i).toString() );

				let s = ( d > 0 ) ? '( - ' + ui.float( d ) + ' )'
					: '( + ' + ui.float( Math.abs(d) ) + ' )';

				ui.print( s, '0.5+1', ln + '+' + (i).toString() );

// 				let emoji = ( d < 0 ) ? ':)' : ( d > 0 ) ? ':(' : ':|';

// 				ui.print( emoji, '1.0-6', ln + '+' + (i).toString() );

				ln += 1;

			}

			ln += 5;

		}

		ui.print('reward', '2', ln.toString() );
		ln += 3
		ui.print('$' + vehicle.results().reward, '2', ln.toString(), 2 );

		ui.button( 'next stage', '2', '1.0-12', '1.0-4', '8', function(){

			scope.next();

			}

		);

		ui.button( 'restart stage', '2', '1.0-4', '0.5-3', '4', function(){

			scope.reset();

			}

		);

		ui.button( 'view replay', '0.5+1', '1.0-4', '0.5-3', '4', function(){

			scope.replay();

			}

		);

		ui.button( '', '0', (ln+11).toString(), '1.0', '1.0-'+(ln+11).toString()+'-10', function(){ scope.replay() }, false )

		window.setTimeout( function(){ PLAY = false; vhs.PLAY = true; }, 0 );

	}

	this.replay = function(){

		ui.clear();
		scope.nav( scope.results );

		for( let i = 0; i < 4; i++ ){

		ui.button( '[ ' + (i+1).toString() + ' ]', (i*7).toString(), '1.0-3', '7', '5', function(){

			vehicle.CAMERA = i+1;
// 			renderer.render( scene, camera );

		}, false );

		}
		ui.button( '', '0', '0.5', width, height, function(){ scope.results( scope.replay ) }, false )

	}

	this.next = function(){

			ui.clear();

			renderer.clear();

			vehicle.reset();
			vehicle.disconnect();
			
			stage.reset();

			MENU = false;
			PLAY = false;
			vhs.PLAY = false;

			scope.load();
// 			firebase.analytics().logEvent('next_stage');

	}

	this.dnf = function(){

		ui.clear();

		scope.nav( scope.dnf );
		
		ui.print( 'dnf', '0.5-3+3p', '0.25', 2)


		ui.button( 'restart stage', '2', '1.0-14', '1.0-4', '8', function(){

			scope.reset();

			}

		);

	}

	this.reset = function(){

		ui.clear();
		scope.nav( scope.play );
		PLAY = true;
		MENU = false;
		vehicle.reset()
// 		firebase.analytics().logEvent('stage_restart', { status: 'complete' });

	}

	this.update = function(){

		if( !MENU && PLAY && !DNF ) ui.text( ui.float( vehicle.AT() ), 16, 16 );

	}

	this.loading = function(){

		let x = 2*8;
		let y = 2*8;

		prompt = ( frame %16 !== 0 ) ? prompt :( prompt.length >= 3 ) ? '' : prompt + '.';
			
		ui.delete( x, y, 20*8, 8 );

		ui.text( 'stage generating' + prompt, x, y );

		renderer.render( scene, camera );

		frame++;

	}

	this.target = function(){

		let name = stage.name;

		ui.print( name, '2', '5-1p', 2);
		
		ui.print( 'target:', '2', '9');

		ui.print( ui.float( stage.best[3] ), '2', '12-1p', 2 )
		
		if( height > 340 ){

			for( let i = 0; i < stage.best.length; i++ ){

				let str = ui.float( stage.best[i] )

				ui.print( 'cp ' + (i+1).toString(), '2', '16+' + (i*2).toString() );

				ui.print( str , '0.5-1-' + str.length.toString(), '16+' + (i*2).toString() );

			}

		}
				
	}

	this.menu = function( state ){

		MENU = true;

		ui.clear();

		scope.title( state );

		let param = [];
		let p = vehicle.param();

		let model = {

			id: 'model',
			value: 0,

		}

		param.push({

			id: 'power',
			value: p.power,
			funct: function(n){ vehicle.tune.power(n) }

			});

		param.push({

			id: 'drag',
			value: p.drag,
			funct: function(n){ vehicle.tune.drag(n) }

			});

		param.push({

			id: 'sensitivity',
			value: p.sensitivity,
			funct: function(n){ vehicle.tune.sensitivity(n) }

			});

// 		param.push({

// 			id: 'easing',
// 			value: p.ease,
// 			funct: function(n){ vehicle.tune.ease(n) }
// 			});

// 		params.push({ id: 'curve', value: 0, });

		let ln = '8+'
		let x = '2';

		// MODEL SELECTION

		ui.sprite( 0,0, 1,1, x, ln + '-5+3', '1.0-' + x + '-' + x, 1 );

		ui.print( model.id, x, ln );

		ui.print( vehicle.models()[ vehicle.MODEL ].name, x + '+8', ln );

		ui.sprite( 0,0, 1,1, x, ln + '+3', '1.0-' + x + '-' + x, 1 );

		ui.button('>', '1.0-6', ln + '+4p', '4', '4', function(){

			vehicle.MODEL += 1;
			if( vehicle.MODEL > 1 ) vehicle.MODEL = 0;
			scope.menu( state );
			},false );

		ui.button('<', '1.0-12', ln + '+4p', '4', '4', function(){

			vehicle.MODEL -= 1;
			if( vehicle.MODEL < 0 ) vehicle.MODEL = 1;
			scope.menu( state );

			},false );

		ln += '5+';

// 		ui.sprite( 0,0, 1,1, x, ln + '-5+3', '1.0-' + x + '-' + x, 1 );

		for( let i = 0; i < param.length; i++ ){

			let y = ln + ( i*5 ).toString()

			ui.print( param[i].id, x, y );

			ui.sprite( 0,0, 1,1, x, y + '+3', '1.0-' + x + '-' + x, 1 );

			

			for( let n = 0; n < 6; n++ ){

				let xx = '1.0-18+' + ( n * 3 ).toString();

				let sx = ( n <= param[i].value ) ? ( 48 ) : 40;

				ui.button('', xx + '-10p', y + '+4p', '3', '4', function(){

					param[i].funct(n); scope.menu( state )

					},false );

				ui.sprite( sx, 64, 8, 8, xx, y, 8, 8 );

			}

		}
		

	}

	this.controls = function( state ){

		ui.clear();
		scope.title( state, true );

	}


	this.fullscreen = function(){

		  if (!document.fullscreenElement) {

			  document.documentElement.requestFullscreen();

		  } else {

			if (document.exitFullscreen) {

			  document.exitFullscreen(); 

			}
			
		  }
		
	}

	this.prompt = function(){

		ui.clear();

		ui.print('specialstage.io', '4', '4', 2);

		ui.print('-', '4', '8', 2);

	}

	this.credits = function(){

		

	}

} 