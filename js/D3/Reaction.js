(function($P) {
	'use strict';

	$P.D3.Reaction = $P.defineClass(
		$P.D3.Element,
		function D3Reaction(config) {
			if (!(this instanceof D3Reaction)) {return new D3Reaction(config);}
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
			set('fill', 'red');
			set('highlight', 'cyan');
			set('size', 20);
			this.size /= 20;
			set('highlighted', false);
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')');
			this.rectSelection = this.selection.append('rect')
				.attr('class', 'reaction')
				.attr('stroke', this.stroke)
				.attr('fill', this.fill)
				.attr('x', -this.size * 4)
				.attr('y', -this.size * 4)
				.attr('width', this.size * 8)
				.attr('height', this.size * 8);

			if (undefined === config.datum.displays) {
				config.datum.displays = [];
				config.datum.displays.__no_save__ = true;}
			config.datum.displays.push(this);

			return this;},
		{
			get highlighted() {return this._highlighted;},
			set highlighted(value) {
				if (value === this._highlighted) {return;}
				this._highlighted = value;
				if (!value && this.highlightedSelection) {
					this.highlightedSelection.remove();
					this.highlightedSelection = null;}
				if (value && !this.highlightedSelection) {
					this.highlightedSelection = this.selection.insert('rect', ':first-child')
						.attr('class', 'highlight')
						.attr('stroke', 'none')
						.attr('fill', this.highlight)
						.attr('opacity', 0.7)
						.attr('x', -this.size * (5 + value * 1.5))
						.attr('y', - this.size * (5 + value * 1.5))
						.attr('width', this.size * (10 + value * 3))
						.attr('height', this.size * (10 + value * 3));}}
		});
	$P.D3.Reaction.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Reaction);

})(PATHBUBBLES);
