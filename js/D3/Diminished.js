(function($P) {
	'use strict';

	$P.D3.Diminished = $P.defineClass(
		$P.D3.Element,
		function D3Diminished(config) {
			if (!(this instanceof D3Diminished)) {return new D3Diminished(config);}
			config.elementType = 'g';
			$P.D3.Element.call(this, config);
			var self = this;

			function set(key, normal) {
				if (undefined !== config[key]) {
					self[key] = config[key];}
				else {
					self[key] = normal;}

				if (self[key] instanceof Function) {
					self[key] = self[key].call(config.parent, config.datum, config.index);}}

			set('stroke', 'black');
			set('fill', 'gray');
			set('size', 20);
			this.size /= 20;
			this.crosstalk = config.crosstalk;
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')')
				.attr('class', 'diminished-entity');
			this.rectSelection = this.selection.append('rect')
				.attr('class', 'protein')
				.attr('stroke', this.stroke)
				.attr('fill', this.fill)
				.attr('x', -this.size * 10 + 5)
				.attr('y', -this.size * 10 + 5)
				.attr('width', this.size * 8)
				.attr('height', this.size * 8)
				.attr('rx', this.size * 2)
				.attr('ry', this.size * 2);

			return this;},
		{
		});
	$P.D3.Diminished.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Diminished);

})(PATHBUBBLES);
