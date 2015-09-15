(function($P){
	'use strict';

	$(document).ready(function() {
		$P.tooltip = new $P.HtmlObject({
			parent: '#bubble',
			type: 'div',
			class: 'tooltip',
			objectConfig: {
				ignoreW: true,
				ignoreH: true}
		});

		$P.tooltip.hideTimer = null;

		$P.tooltip.show = function(contents) {
			this.element.innerHTML = contents;
			d3.select(this.element).transition().duration(50).style('opacity', 0.9);
			this.updatePosition();};

		$P.tooltip.updatePosition = function() {
			this.move(d3.event.pageX + 10  + $P.state.scrollX,
								d3.event.pageY - 80);};

		$P.tooltip.hide = function() {
			d3.select(this.element).style('opacity', 0);};

		d3.select(document).on('mouseover.tooltip', function(d, i) {$P.tooltip.hide();});

		$P.tooltip.add = function(tooltip) {
			return function(selection) {
				if (undefined === tooltip) {tooltip = function(d, i) {return d.tooltip || d.name || '';};}
				selection
					.on('mouseenter.tooltip', function(d, i) {
						var contents = tooltip.call(this, d, i);
						if (contents) {$P.tooltip.show(contents);}})
					.on('mousemove.tooltip', function(d, i) {
						$P.tooltip.updatePosition();
						return true;});};};
	});

})(PATHBUBBLES);
