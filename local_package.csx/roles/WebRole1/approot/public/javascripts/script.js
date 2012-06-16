+function () {
	var pagina, // #pagina
		item_actual, // div.current
		bloques, // arrary of div.bloque
		barrita, // div#barrita
		barrita_last_state, // if div#barrita was visible when going to the home/contact section
		barrita_visible, // div#barrita visible or hidden
		controles, // div#controles
		info, // div#info
		DIRECCION_LEFT = 'Left',
		DIRECCION_RIGHT = 'Right',
		WIDTH = 1024,
		HEIGHT = 672,
		BARRITA_OFFSET = 570,
		CANVAS_SIZE = 440,
		actual 	 = 0 // current section index
		inicio   = true, // is this the first time?
		esIOS 	 = !!navigator.userAgent.match(/iPad/i) || !!navigator.userAgent.match(/iPod/i)
			|| !!navigator.userAgent.match(/iPhone/i); // webkit iOS based browsers
		esAndroid = !!navigator.userAgent.match(/Android/i);
		
	/*
		setup keyboard listeners for
		desktop browsers and touch/gesture eventos for
		mobile touch enabled browsers
	*/
	jQuery(function ($) {
		// poner imagen alternativa de home en ie menor a 9
		if(!$.browser.msie || ($.browser.msie && $.browser.version >= 9)) 
			$('#home').find('img[src*="home.png"]').hide();
		else
			$('#home').attr('id', '');
				
		// elementos principales
		pagina	  = $('#pagina').removeClass('disabled');
		info 	  = $('#info');		
		barrita   = $('#barrita');
		controles = $('#controles');
		bloques   = $('.bloque');
		maintitle = $('div#main h2#titulo');
		maindescr = $('div#main p#des');
		
		$(window).resize(checkSize);
		checkSize();
		
		// div#barrita initial state is hidden
		barrita_visible = false;
		
		// setup controls (links to sections)
		var tmp = '';
		bloques.each(function(i, el) { tmp += '<span data-indice="'+i+'"></span>';  });
		controles.html(tmp);
		
		// setup the current items
		item_actual = bloques.first().addClass('current');
		controles.find('span[data-indice=""]').addClass('actual');
		
		
		// Trafico externo en analytics
		$('a').live('click', function () {
			var $self = $(this);
			
			if($self.is('[href^="http://"]') && $self.is('a:not([href^="http://'+window.location.host+'"])')) {
				_gaq.push(['_trackEvent', 'Outbound Traffic', $(this).attr('href').replace('http://', '')]);
			}
		});
		
		//animacion_inicio();
		
/*		$("h1").click(function(){
			animacion_inicio();
		}); */
		
		// start listening for input
		setupListeners();		
	});
	
	// previous section
	function anterior()
	{
		actual--;
		
		// back to 0
		if(actual == -1) actual = bloques.size()-1;
		
		common(DIRECCION_RIGHT);
	}
	
	// next section
	function siguiente()
	{
		actual++;
		
		// to the last section ( contacto)
		if(actual == bloques.size()) actual = 0;
	
		common(DIRECCION_LEFT);
	}
	
	// show/hide div#barrita depengin on its current state
	function toggle_barrita()
	{
		// if in home or last section(contact )
		if(actual == 0 || actual == bloques.size()-1) return;
		
		// toggle visibility
		if(barrita_visible)
		{
			if(esIOS) {
				barrita.removeClass('slided');
			} else {
				barrita.animate({top: HEIGHT+'px'});
			}
			barrita_visible = false;
		} else
		{
			if(esIOS) {
				barrita.addClass('slided');
			} else {
				barrita.animate({top:BARRITA_OFFSET+'px'});
			}
			
			barrita_visible = true;
		}
	}
	
	// main function for switching sections
	function common(direccion)
	{
		// cube animation only works on webkit (3d transforms
		var animacion = esIOS ? 'reveal' : 'slide';
		
		// slide on webkit when in home/contact section
/*		if((direccion == DIRECCION_LEFT && (actual <= 1 || actual == bloques.length-1)) ||
			(direccion == DIRECCION_RIGHT && (actual == 0 || actual >= bloques.length-2))) 
			animacion = 'slide';
		*/
		// previous section transition/switching
		if(esIOS) {
			item_actual.removeClass('current').addClass(animacion+direccion+'Previous').bind('webkitAnimationEnd', function () { $(this).unbind('webkitAnimationEnd').removeClass(animacion+direccion+'Previous'); });
		} else {
			var leftIn = WIDTH+'px';
			if(direccion == DIRECCION_LEFT) leftIn = '-'+WIDTH+'px';
			
			item_actual.addClass('animatedOut').removeClass('current').animate({left:leftIn}, function () { $(this).removeClass('animatedOut');  });
		}
				
		item_actual = $(bloques.get(actual)).addClass('current');
		
		if(esIOS) {
			item_actual.addClass(animacion+direccion+'Current').bind('webkitAnimationEnd', function () { $(this).unbind('webkitAnimationEnd').removeClass(animacion+direccion+'Current'); });
		} else {
			// new section ( transition)
			var leftOut = '-'+WIDTH+'px'
			if(direccion == DIRECCION_LEFT) leftOut = WIDTH+'px';
			item_actual.addClass('animatedIn').css('left', leftOut).animate({left:0}, function () { $(this).removeClass('animatedIn');  });
		}
		
		// div#controles span.actual > off
		controles.find('.actual').first().removeClass('actual');
	
		// switch on new div#controles span (link)
		controles.find('span[data-indice="'+actual+'"]').addClass('actual');
		
		// if it's not the home/contact section put
		//	in the info/link to the site
		if(actual > 0 && actual < bloques.size()-1)
		{
			// <h2>link</h2><p>description</p>
			info.html('<h2><a href="http://'+item_actual.attr('data-url')+'" target="_blank">'+
				item_actual.attr('data-url')+'</a></h2>'+'<p>'+item_actual.attr('data-info')+'</p>');
			maintitle.html(item_actual.attr('data-title'));
			maindescr.html(item_actual.attr('data-info'));
		}
		
		// show div#barrita on startup and first section (not home)
		if(actual == 1 && inicio)
		{
			inicio = false;
			toggle_barrita();
		}
		
		// if going to home/contacto save
		// the current state of div#barrita and hide it
		if(actual == 0 || actual == bloques.length-1)
		{
			if(!barrita_last_state) {
				barrita_last_state = barrita_visible;
				if(esIOS) {
					barrita.removeClass('slided');
				} else {
					barrita.animate({top:HEIGHT+'px'});
				}
				barrita_visible = false;
			}
		// returngin from home/contact
		// if div#barrita was visible 
		} else {
			if(barrita_last_state) {
				barrita_last_state = false;
				toggle_barrita();
			}
		}

		now.fbObject=item_actual.attr('fbObject');
		now.speaker =item_actual.attr('data-title'); 
		now.checkValue();
	}
	
	// input
	function setupListeners() {
		// click on the image toggles div#barrita
		$('#bloques').click(toggle_barrita);
		//document.getElementById('bloques').addEventListener('click', toggle_barrita, false);
		
		// next/previous keys and space for show/hide div#barrita
		$(document).keyup(function (e) {
			if(e.keyCode != 39 && e.keyCode != 37 && e.keyCode != 32) return;
			
			var $texts = $('input:focus, textarea:focus');
			
			if(!$.browser.msie) {
				if($texts.size() > 0 && $texts.get(0).selectionStart > 0) return;
			}	
			
			if(e.keyCode == 39) siguiente();
			else if(e.keyCode == 37) anterior();
			else if(e.keyCode == 32) toggle_barrita();	
		});
		
		// links to sections events
		controles.click(function (e) {
			var target = $(e.target);

			// solo si fue en un span (bolita)
			if(!target.is('span')) return;
			
			var anterior = actual;	
			
			// leer el indice guardado en data-indice
			actual = parseInt(target.attr('data-indice'));	
	
			// do the switch
			common(actual > anterior ? DIRECCION_LEFT : DIRECCION_RIGHT);
		});
		
		$(".vertical-carousel-list li").click(function (e) {
			actual = parseInt($(this).attr("data_index"));	
	
			// do the switch
			common(actual > anterior ? DIRECCION_LEFT : DIRECCION_RIGHT);
		});
		
		// if iPhone/iPad/iPod
		if('ontouchstart' in document.documentElement)
		{	
			// prevent safari mobile from default scrolling
			document.addEventListener('touchmove', function (e) {
				e.preventDefault();
			}, false);
			
			// x coordinate of the touch start/end events
			 var startX, endX;
			 
			 // remove listeners and info on touch end or invalidation
			 function cancelTouch()
			 {
				  document.removeEventListener('touchend', onTouchEnd);
				  document.removeEventListener('touchmove', onTouchMove);
				  
				  startX = endX = null;
			 }
			 
			 // save the last touch x coordinate
			 function onTouchMove(e)
			 {
				  if (e.touches.length > 1) cancelTouch();
				  else
				  {
					  endX = e.touches[0].pageX;
				  }
			 }
			
			 function onTouchEnd(e)
			 {
				 // it was a click
				 if(!endX) 
				 {
					 cancelTouch();
					 return;
				 }
				 
				 // there was no movement
				if(startX == endX || Math.abs(startX-endX) < 100)
				 {
					 cancelTouch();
					 return;
				 }
				 
				 // swipe right
				 if(startX > endX) siguiente();
				 // swipe left
				 else anterior();
				 
				 // clear data/listeners
				 cancelTouch();
			 }
					 
			// on finger down
			 document.addEventListener('touchstart', function (e)
			 {
				 // just one finger
				  if (e.touches.length == 1)
				  {
					  // keep this for later
					   startX = e.touches[0].pageX;
					   
					   document.addEventListener('touchmove', onTouchMove, false);
					   document.addEventListener('touchend', onTouchEnd, false);
				  }
			 }, false);
		}
	}
	
	function animacion_inicio() {

		if($.browser.msie && $.browser.version < 9) return;
		
		var circulo = document.querySelector('#home canvas'), // canvas
			ctx = circulo.getContext('2d'), 
			actual = Math.PI*2, // hasta donde va a llegar
			incremento = .1; // de cuanto en cuanto

		+function ()
		{
			// cuando se completa
			if(actual <= .01) 
			{
				ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
			
				ctx.beginPath();
				ctx.arc(CANVAS_SIZE/2,CANVAS_SIZE/2,CANVAS_SIZE/2,0,.001,true);
				ctx.stroke();
				
				bloques.first().find('p:first-child').fadeIn(function () {
					bloques.first().find('p + p').fadeIn(function () {
						bloques.first().find('h1').addClass('roll-in');
						setTimeout(function () {
							circulo.style.display = 'none';
							$('.awwwards').fadeIn();
						}, 1000);
					});
				});
				
				return;
			}
			
			// dibujar y dibujar
			ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
			ctx.strokeStyle = '#625D5B';
			
			ctx.beginPath();
			ctx.arc(CANVAS_SIZE/2,CANVAS_SIZE/2,CANVAS_SIZE/2,0,actual,true);
			ctx.stroke();
			
			actual -= incremento;
			
			setTimeout(arguments.callee, 10);
		}();
		
		bloques.first().find('p').hide();
		$('.awwwards').hide();

	}
	
	function checkSize() {
		var wHeight = $(window).height(), wWidth = $(window).width();
		
		// centrar y poner outline
		if(wHeight > 672)
			pagina.css({/*'outline':'1px solid #840a19',*/ });
		else 
			pagina.css({'margin-top': 0});
		
		if(wHeight < 672|| wWidth < 1024)
		{
			$('body').addClass('reduced');
			WIDTH = 716;
			HEIGHT = 483;
			BARRITA_OFFSET = 380;
			CANVAS_SIZE = 308;
			pagina.css({});
		} else {
			$('body').removeClass('reduced');
			
			WIDTH = 1024;
			HEIGHT = 672;
			BARRITA_OFFSET = 570;
			CANVAS_SIZE = 440;
		}
		
		// reposition #barrita
		if(barrita_visible)
		{
			if(!esIOS)
				barrita.css({top: BARRITA_OFFSET+'px'});
		} else
		{
			if(!esIOS)
				barrita.css({top:HEIGHT+'px'});
		}
	}
	

	
}();