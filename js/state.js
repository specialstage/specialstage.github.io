function State() {
	
	const scope = this

	this.connect = function(){

	}

	this.update = function(){

	}

	this.start = function(){

	const id = window.requestAnimationFrame( scope.start )
	let START = false
	title()

	ui.button('start', function(){
		START = true
		ui.clear()
		title()
		stage.connect()
		window.cancelAnimationFrame( id )
		window.requestAnimationFrame( main )

	}, 2, ui.yl-12, ui.xl-4, 6, true )

	if( !START ){

	fullscreen( ui.yl-21 )

	}

	renderer.render( scene, camera )

	}

	this.pause = function(){

		let ln = 0
		ui.clear()

		if( DNF ){

			ui.textbox('dnf', 2, ln+=3)
			ui.textbox('reason        ' + REASON, 2, ln +=2)
			ui.textbox('repair cost   Y100', 2, ln +=2)

		}
		else{ ln += 2 }

		if( MENU ){
			ui.button('restart stage', function(){

				MENU = false
				vehicle.reset()
				ui.clear()
				MENU = false

			}, 2, ln+=4, ui.xl-4, 6, true )

		}

		if( MENU ){

			fullscreen( ln+=9 )

		}

	}

	this.settings = function(){
		
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

		if( vehicle.getReward() > 0 ){

			ui.textbox('new record', 2, ln+=2 )
			ln+=2
			ui.textbox( 'reward    Y' + vehicle.getReward(), 2, ln+=2 )

		}

		ui.textbox( 'total     Y' + vehicle.getYen(), 2, ln+=2 )

		 ui.button('next stage', function(){

			MENU = false
			PLAY = false
			vhs.PLAY = false
			ui.clear()
			renderer.clear()
			title()
			vehicle.disconnect()
			vehicle.reset()
			stage.reset()
			RESULTS = false
			CHALLENGE = false

		}, 2, ln += 4, ui.xl-4, 6, true)

		if( PLAY || vhs.PLAY ){

		if( display ) ui.button('restart stage', function(){

			MENU = false
			PLAY = true
			vehicle.reset()
			ui.clear()
			display = false

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

		}, 2, ln+=9, ui.xl-4, 6, true)

		}

	}

	this.readycheck = function(){

		if( !MOBILE ) ui.textbox('keyboard controls - arrow keys', 2, ui.yl-16 )

		ui.button( 'ready', function(){

			vehicle.connect( stage.start, stage.surface )
			stage.generate.END = false
			READY = true
			PLAY = true
			TIMER = 0
			ui.clear()
		}, 2, ui.yl-12, ui.xl-4, 6, true )
				
	}

	this.instruments = function(){

  			ui.textbox( vehicle.TEXTTIME, 2, 3 )
			ui.textbox( 'fps ' + FPS, 2, ui.yl-4)
			ui.textbox( 'vel' + ' ' + vehicle.VELOCITY, 2, ui.yl-6 )

	}

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

		ui.textbox('special stage',  2, 3 )
		ui.textbox('-', 2, 6 )

		if( CHALLENGE ){
			ui.textbox('rival challenge',2,10)
			ui.textbox('seed ' + SEED, 2,14)
			ui.textbox('time ' + ui.getTextFloat( OBJECTIVES[3] ),2,16)
		}

	}

}