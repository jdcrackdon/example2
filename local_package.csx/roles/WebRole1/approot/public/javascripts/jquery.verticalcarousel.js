(function($) {  
	$.fn.verticalCarousel = function(options) {  
  
		var defaults = { nSlots: 2, speed: 300 };  
		var options = $.extend(defaults, options); 
		var wSlotsht;
		var wSlotsht_scr;
		var nofs;
		var curfs = 1;
		var scrollDirection;
		var selector;
		
		return this.each(function() {  
			selector = this.id;
			$("#" + selector + " div.vertical-carousel-container").height(($("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list li").outerHeight(true) * options.nSlots)).css('overflow','hidden');
			$("#" + selector + " a.scru").click(function() {scrollDirection="up";calcspots();});
			$("#" + selector + " a.scrd").click(function() {scrollDirection = "down";calcspots();});
		});
		
		function calcspots()
		{
			if ($("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").is(":animated")) {return;}
			wSlotsht = $("#" + selector + " div.vertical-carousel-container").height() + 10;
			wSlotsht_scr = $("#" + selector + " div.vertical-carousel-container").height();
			nofs = Math.ceil($("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").height() / wSlotsht_scr);
			curtop = parseInt($("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").css('top'));
			curfs = $("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").height() - Math.abs(curtop);
			curfs = Math.ceil(curfs / (wSlotsht_scr+5)); 
			curfs = nofs - curfs + 1;
			if(curfs > 1 && scrollDirection == "up")
			{
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '+=' + wSlotsht}, options.speed, function() {});
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '-=10'}, options.speed + 100, function() {});
			}
			else if(curfs <= 1 && scrollDirection == "up")
			{
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '+=10'}, 100, function() {});
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '-=10'}, 200, function() {});
			}
			else if(curfs < nofs && scrollDirection == "down")
			{
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '-=' + wSlotsht}, options.speed, function() {});
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '+=10'}, options.speed + 100, function() {});
			}
			else if(scrollDirection == "down")
			{
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '-=10'}, 100, function() {});
				$("#" + selector + " div.vertical-carousel-container ul.vertical-carousel-list").animate({top: '+=10'}, 200, function() {});
			}
		}
		  
	};  
})(jQuery);