(function($P) {
	'use strict';

	$P.D3.PathwayLabel = $P.defineClass(
		$P.D3.Element,
		function D3PathwayLabel(config) {
			if (!(this instanceof D3PathwayLabel)) {return new D3PathwayLabel(config);}
			config.elementType = 'g';
			$P.D3.Element.call(this, config);
			var self = this;

			self.selection.classed('pathway-label', true);

			function set(key, normal) {
				if (undefined !== config[key]) {
					self[key] = config[key];}
				else {
					self[key] = normal;}

				if (self[key] instanceof Function) {
					self[key] = self[key].call(config.parent, config.datum, config.index);}}

			set('text');
			set('index');
			set('view');
			set('pathway');

			set('fontSize', 14);
			set('fontWeight', 'bold');
			set('strokeWidth', 1);
			set('fill', 'white');
			set('opacity', 0.6);
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')')
				.on('click', self.onClick.bind(self));
			this.selection.background = this.selection.append('rect')
				.attr('stroke', 'black')
				.attr('stroke-width', 2)
				.attr('fill', this.fill)
				.attr('opacity', this.opacity);
			this.selection.text = this.selection.append('text')
				.style('font-size', this.fontSize + 'px')
				.style('font-weight', this.fontWeight)
				.style('stroke-wdith', this.strokeWidth)
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.text(this.text);

			config.datum.manager = this;

			return this;},
		{
			onShapeChange: function(shape) {
				var center = shape.getLabelPosition(this.view, 14, this.index),
						angle = center.rotation || 0,
						font = Math.min(14, center.length / this.text.length * 1.5);

				this.selection.attr('transform', 'translate(' + center.x + ',' + center.y + ')rotate(' + angle + ')');
				this.selection.background
					.attr('width', (center.length + 4) + 'px')
					.attr('x', (-center.length / 2 - 2) + 'px')
					.attr('height', (font + 4) + 'px')
					.attr('y', (-font / 2 - 2) + 'px');
				this.selection.text.style('font-size', font + 'px');},

			onClick: function() {
				this.view.parentBubble.content.removePathway(this.pathway);}

		});
	$P.D3.PathwayLabel.appender = $P.D3.Element.appender.bind(undefined, $P.D3.PathwayLabel);

})(PATHBUBBLES);
