function State() {
	
	const scope = this;
	let RAFID = 0;

	this.connect = function(){

	}

	this.update = function(){

	}

	this.start = function(){

		RAFID = window.requestAnimationFrame( scope.start );
		let START = false
		let SETTINGS = false

		title();

		ui.textbox( BUILD, ui.xl-8, 4 );

		let ln = 8;

		ui.textbox( 'sponsored by www.ginko.ltd', 2, ln+=2 );
		ui.textbox( '- ', 2, ln+=3 );

		ui.textbox( 'update ' + BUILD, 2, ln+=3 );
		ui.textbox( '- reworked vehicle handling and inputs', 2, ln+=4 );
		ui.textbox( '- added vehicle settings menu', 2, ln+=4 );

		ui.button('start', function(){

			START = true;
			ui.clear();
			title();
			stage.connect();
			window.cancelAnimationFrame( RAFID );
			RAFID = window.requestAnimationFrame( main );
			document.body.removeChild( document.getElementById('sponsor'))
			firebase.analytics().logEvent('game_start');

		}, 2, ui.yl-12, ui.xl-4, 6, true );

		if( !START ){

		fullscreen( ui.yl-21 );

		}

		renderer.render( scene, camera )

	}

	this.pause = function(){

		let ln = 0
		ui.clear()

		if( DNF ){

			ui.textbox( 'dnf', 2, 3 )
			ui.textbox( 'reason        ' + REASON, 2, 28 )
			ui.textbox( 'repair cost   Y100', 2, 30 )

		}
		else if( !vehicle.START ) {
			
			scope.settings();
// 			ln += 24;

		}

		if( MENU && ( DNF || vehicle.START ) ){
			ui.button('restart stage', function(){

				MENU = false
				vehicle.reset()
				ui.clear()
				MENU = false
				firebase.analytics().logEvent('stage_restart', { status: 'dnf' });

			}, 2, ln+=8, ui.xl-4, 6, true )

		}

		if( MENU && ( vehicle.START || DNF ) ){

// 			scope.settings();
			fullscreen( ln+=9 );

		}

	}

	this.load = function(){

	}

	this.results = function(){

		let display = true

		ui.clear()
		ui.textbox( vehicle.TEXTTIME, 2, 3 )
		vehicle.display()
		ui.textbox( '-', 2, 15 )

		let ln = 15

		let results = vehicle.results();

		if( results.reward > 0 ){

			ui.textbox('new record', 2, ln+=2 )
			ln+=2
			ui.textbox( 'reward    Y' + results.reward, 2, ln+=2 )

		}

		ui.textbox( 'total     Y' + results.yen, 2, ln+=2 )

		 ui.button('next stage', function(){

			MENU = false;
			PLAY = false;
			vhs.PLAY = false;
			ui.clear();
			renderer.clear();
			title();
			vehicle.reset();
			vehicle.disconnect();
			stage.reset();
			RESULTS = false;
			CHALLENGE = false;
			firebase.analytics().logEvent('next_stage');

		}, 2, ln += 4, ui.xl-4, 6, true)

		if( PLAY || vhs.PLAY ){

		if( display ) ui.button('restart stage', function(){

			MENU = false
			PLAY = true
			vehicle.reset()
			ui.clear()
			display = false
			firebase.analytics().logEvent('stage_restart', { status: 'complete' });

		}, 2, ln+=9, ui.xl-4, 6, true )

		if( display ) ui.button('view replay', function(){

			vhs.PLAY = true
			PLAY = false
			MENU = false
			display = false
			ui.clear()

		}, 2, ln+=9, ui.xl-4, 6, true)

		if( display ) ui.button('copy challenge url', function(){

			encodeURL()
			firebase.analytics().logEvent('url_challenge_created');

		}, 2, ln+=9, ui.xl-4, 6, true)

		}

	};

	this.readycheck = function(){

		if( !MOBILE ) ui.textbox('keyboard controls - arrow keys - wasd - r restart', 2, ui.yl-16 )

		ui.button( 'ready', function(){

			vehicle.connect( stage.start, stage.surface );
			stage.generate.END = false;
			READY = true;
			PLAY = true;
			TIMER = 0;
			ui.clear();
			firebase.analytics().logEvent('stage_start');

		}, 2, ui.yl-12, ui.xl-4, 6, true );
				
	};

	this.instruments = function(){

		ui.textbox( vehicle.TEXTTIME, 2, 3 );
		ui.textbox( 'fps ' + FPS, 2, ui.yl-4);
		ui.textbox( 'vel' + ' ' + vehicle.SPEED, 2, ui.yl-6 );

	};


	this.settings = function(){


		const param = vehicle.getParam();

		let ln = ui.yl - 24;

		// Power

		ui.textbox( 'power', 2, ln );

		ui.textbox( ui.getTextFloat( param.power ), ui.xl-24, ln );

		ui.button( '+', function(){

			vehicle.tune({ power: param.power + 0.1 } );

		}, ui.xl-8, ln-3, 6, 5, true );

		ui.button( '-', function(){

			vehicle.tune({ power: param.power - 0.1 } );

		}, ui.xl-16, ln-3, 6, 5, true );

		ln += 8;

		// Drag

		ui.textbox( 'drag', 2, ln );

		ui.textbox( ui.getTextFloat( param.drag ), ui.xl-24, ln );

		ui.button( '+', function(){

			vehicle.tune({ drag: param.drag + 0.1 } );

		}, ui.xl-8, ln-3, 6, 5, true );

		ui.button( '-', function(){

			vehicle.tune({ drag: param.drag - 0.1 } );

		}, ui.xl-16, ln-3, 6, 5, true );

		// Sensitivity

		ln += 8;

		ui.textbox( 'sensitivity', 2, ln );

		ui.textbox( ( ui.getTextFloat( (param.sensitivity) ) ).toString(), ui.xl-24, ln );

		ui.button( '+', function(){

			vehicle.tune({ sensitivity: param.sensitivity + 0.1 } );

		}, ui.xl-8, ln-3, 6, 5, true );

		ui.button( '-', function(){

			vehicle.tune({ sensitivity: param.sensitivity - 0.1 } );

		}, ui.xl-16, ln-3, 6, 5, true );

	};

	function fullscreen( y ){

		if (document.body.requestFullscreen) {

		let label = ( FULLSCREEN ) ? 'exit fullscreen' : 'enter fullscreen'
		ui.button(label, function() {
			ui.clear()
			if( !FULLSCREEN ){
			document.body.requestFullscreen()
			FULLSCREEN = true
			}
			else{
			document.exitFullscreen()
			FULLSCREEN = false
			}

		}, 2, y, ui.xl-4, 6, true)

		}
	}

	function title(){

		ui.textbox('special stage', 2, 4)
		ui.textbox('-', 2, 7 )
		if( CHALLENGE ){
			ui.textbox('rival challenge',2,10)
			ui.textbox('seed ' + SEED, 2,14)
			ui.textbox('time ' + ui.getTextFloat( OBJECTIVES[3] ),2,16)
		}

	}

	function start(){

	};
}