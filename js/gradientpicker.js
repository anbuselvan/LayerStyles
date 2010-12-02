/*
 *     _                                       ________                  _
 *    | |                                     |  ______|                | |
 *    | |                                     | |          _            | |
 *    | |       _____ ___  ___ _____  _____   | |______  _| |_ ___  ___ | |     _____  _____
 *    | |      |  _  |\  \/  /|  _  ||   __|  |______  ||_   _|\  \/  / | |    |  _  ||  ___|
 *    | |_____ | |_| | /   /  |  ___||  |      ______| |  | |   /   /   | |___ |  ___||___  |
 *    |_______||___,\|/___/   |_____||__|     |________|  |_|  /___/    |_____||_____||_____|
 *    
 *    Copyright (c) 2010 Felix Niklas
 *    This script is freely distributable under the terms of the MIT license.
 */

var gradientpicker = {
	$gradientPresets: $('#gradient_presets'),
	$gradientName: $('#gradient_name'),
	$gradientHolder: $('#gradient_holder'),
	$gradient: $('#gradient'),
	$stopColor: $('#stop_color'),
	$stopLocation: $('#stop_location'),
	$removeStop: $('#remove_stop'),
	currentGradient: null,
	currentPick: null,
	currentPosition: null,
	currentColorField: null,
	gradients: [
	    {'name': "Plain Gray", 'stops': [[191, 191, 191], 11, [[242, 242, 242], 88], 77, [252, 252, 252]]},
	    {'name': "Be Water", 'stops': [[0, 191, 162], 11, [[177, 228, 220], 88], 77, [209, 237, 233]]},
	    {'name': "Rainbow", 'stops': [[255, 0, 0], [[255, 0, 255], 15], [[0, 0, 255], 33], [[0, 255, 255], 49], [[0, 255, 0], 67], [[255, 255, 0], 84], [255, 0, 0]]},
	    {'name': "Teal, Magenta, Yellow", 'stops': [[0, 153, 128], [[204, 0, 69], 50], [255, 185, 13]]},
	    {'name': "Peach", 'stops': [[225, 123, 25], [242, 171, 43]]},
	    {'name': "Yellow, Orange", 'stops': [[228, 42, 50], [[233, 93, 59], 11], [[241, 141, 70], 33], [[252, 199, 54], 72], [255, 238, 88]]}
	],
	addPicker: function(position, color){
	    this.$gradient.append(
	        $('<div class="picker bottom" />')
	        .css({ 'left': position+'%' })
			.attr('data-color', color)
	        .bind({
	            click: function(e){ 
					jQuery.proxy(this, "selectStop");
					jQuery.proxy(this, "showMiddlepoints");
				},
	            dblclick: function(e){
					gradientpicker.currentPick = this;
					var currentColor = $(this).attr('data-color');
					gradientpicker.selectPicker(position);
					colorpicker.pick(currentColor, function(rgb){ gradientpicker.updatePicker(rgb); });
				}
	        })
	        .append($('<div class="arrow" />'))
	        .append($('<div class="box" />')
	            .append($('<div class="color_field" />').css({ 'background': color }))
	        )
	    );
	},
	selectPicker: function(pos){
		this.currentColorField = $(this.currentPick).find('.color_field');
		var stops = this.currentGradient.stops;
		switch(pos){
			case 0:
				this.currentPosition = 0;
				break;
			case 100:
				this.currentPosition = stops.length-1;
				break;
			default:
				for(var i = 1, l = stops.length-1; i<l; i++){
					var stop = stops[i];
					if(typeof stop === 'object'){
						if(stop[1] === pos){
							this.currentPosition = i;
						}
					}
				}
		}
	},
	updatePicker: function(rgb){
		// color = rgb {object}
		var newColor = [rgb.r,rgb.g,rgb.b];
		var colorString = tools.toColor(newColor);
		$(this.currentPick).attr('data-color', colorString);
		this.currentColorField.css("background", colorString);
		var stops = this.currentGradient.stops;
		// search for the position and inject new color
		if(this.currentPosition > 0 && this.currentPosition < stops.length-1){
			stops[this.currentPosition][1] = newColor;
		}
		else {
			stops[this.currentPosition] = newColor;
		}
		this.updateGradient(stops);
	},
	addMiddlepoint: function(position, realpos){
	    this.$gradient.append(
	        $('<span class="middlepoint bottom"><span /></span>')
	        .attr('data-realpos', realpos)
	        .css({ 'left': position+'%' })
	        .bind({
	            mousedown: function(e){ jQuery.proxy(this, "selectStop"); }
	        })
	    );
	},
	updateGradient: function(stops){
	    tools.drawGradient($layer, 'linear', 'bottom', stops);
	    tools.drawGradient(this.$gradient, 'linear', 'left', stops);
	},
	setGradient: function(gradient){
	    this.hideStop();
	    this.currentGradient = gradient;
	    this.$gradientName.val(gradient.name);
	    this.$gradient.children().remove();
	    for(var i=0,length = gradient.stops.length; i<length; i++){
	        var stop = gradient.stops[i];
	        var pos, color;
	        switch(typeof stop){
	        case 'object': // => [255,255,255] or [[255,255,255], 33]
	            if(stop.length === 3){ // => [255,255,255]
	                color = stop;
	                pos = i === 0 ? 0 : 100;
	            }
	            else {
	                color = stop[0];
	                pos = stop[1];                  
	            }
	            this.addPicker(pos, tools.toColor(color));
	            if(typeof gradient.stops[i+1] !== 'number' && i !== length-1){
	                var nextStop = gradient.stops[i+1];
	                var nextPos = nextStop.length !== 3 ? nextStop[1] : 100;
	                this.addMiddlepoint(tools.getCenter(pos, nextPos), 50);
	            }
	            break;
	        case 'number':
	            var middlepoint = tools.getMiddlepoint(gradient.stops[i-1], stop, gradient.stops[i+1]);
	            this.addMiddlepoint(middlepoint[1], middlepoint[1]);
	            break;
	        }
	    }
	    this.updateGradient(gradient.stops);
	},
	addGradientPreset: function(name, stops){
	    this.$gradientPresets.append(
	            $('<div />')
	            .attr({'title': name})
	            .css({
	                'background': tools.cssGradient({
	                    'type': 'linear',
	                    'position':'left top',
	                    'steps': tools.decodeStops(stops)
	                    })
	            })
				.bind('click', {self: this}, this.handlePreset)
	        );
	},
	handlePreset: function(e){
        e.stopPropagation();
		var self = e.data.self;
        // find out the gradients position in the gradient array
        var pos = 0;
        var family = $(this).parent().children();
        var pos = family.index(this);
        // if alt is pressed while clicking: remove gradient
        if(e.altKey){
            // slice out the gradient from the gradient array (method by John Resig)
            var rest = self.gradients.slice(pos + 1);
            self.gradients.length = pos;
            self.gradients.push.apply(self.gradients, rest);
            $(this).remove();
        }
        else {
            // else get the gradient
            self.setGradient(self.gradients[pos]);
       	}
	},
	showStop: function(pos, color){
	    this.$stopLocation.removeAttr("disabled").val(pos).parent().removeClass("disabled");
	    if (color !== null) {
	        this.$removeStop.removeAttr("disabled");
	        this.$stopColor.css({'background-color': color}).parent().removeClass("disabled");
	    }
	    else {
	        this.$removeStop.attr("disabled", "disabled");
	        this.$stopColor.css({'background-color': 'transparent'}).parent().addClass("disabled");
	    }
	},
	updateStopColor: function(color){
	    this.$stopColor.css({'background-color': color});
	},
	hideStop: function(){
	    this.$removeStop.attr("disabled", "disabled");
	    this.$stopLocation.attr("disabled", "disabled").val("").parent().addClass("disabled");
	    this.$stopColor.css({'background-color': 'transparent'}).parent().addClass("disabled");
	},
	selectStop: function(object){
	    var $o = $(object);
	    var pos = $o.css('left').slice(0,-1);
	    var $field = $o.hasClass('color_field') ? $o : $o.find('.color_field');
	    var color = $field.css('background-color') || null;
	    var realpos = $o.attr('data-realpos');
	    if (realpos) { pos = realpos; }
	    this.showStop(pos, color);
	    $o.siblings().removeClass('selected');
	    $o.addClass('selected');
	},
	showMiddlepoints: function(object){
	    $(object).siblings('span').removeClass('visible');
	    $(object).next('span').add($(object).prev('span')).addClass('visible');
	},
	init: function(){
		this.setGradient(this.gradients[0]);
		
		// draw gradients
	    for(var i = 0, length = this.gradients.length; i<length; i++){
	        this.addGradientPreset(this.gradients[i].name, this.gradients[i].stops);
	    }
	}
};