(function($P) {
	'use strict';

	$P.D3.Note = $P.defineClass(
		$P.D3.Element,
		function D3Note(config) {
			if (!(this instanceof D3Note)) {return new D3Note(config);}
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

			set('transform', '');
			set('stroke', 'black');
			set('fill', 'white');
			set('highlight', 'cyan');
			set('size', 20);
			this.size /= 20;
			set('crosstalk', (config.datum.crosstalkCount || 0) > 1);
			set('highlighted', false);
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')');
			this.rectSelection = this.selection.append('rect')
				.attr('class', 'protein')
				.attr('stroke', this.stroke)
				.attr('fill', this.fill)
				.attr('x', -this.size * 9)
				.attr('y', -this.size * 5)
				.attr('width', this.size * 18)
				.attr('height', this.size * 10)
				.attr('rx', this.size * 4)
				.attr('ry', this.size * 3)
				.attr('transform', this.transform);

			config.datum.proteinDisplay = this;
			config.datum.displays = config.datum.displays || [];
			config.datum.displays.push(this);

			return this;},
		{
			get crosstalk() {return this._crosstalk;},
			set crosstalk(value) {
				if (value === this._crosstalk) {return;}
				this._crosstalk = value;
				if (!value && this.crosstalkSelection) {
					this.crosstalkSelection.remove();
					this.crosstalkSelection = null;}
				if (value && !this.crosstalkSelection) {
					this.crosstalkSelection = this.selection.insert('rect', '.protein')
						.attr('class', 'crosstalk')
						.attr('stroke', this.stroke)
						.attr('fill', this.stroke)
						.attr('x', -this.size * 11)
						.attr('y', -this.size * 6)
						.attr('width', this.size * 22)
						.attr('height', this.size * 12)
						.attr('rx', this.size * 4)
						.attr('ry', this.size * 3);}},
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
						.attr('x', -this.size * (12 + value * 1.5))
						.attr('y', - this.size * (8 + value * 1.5))
						.attr('width', this.size * (24 + value * 3))
						.attr('height', this.size * (16 + value * 3))
						.attr('rx', this.size * 4)
						.attr('ry', this.size * 3);}
			}
		});
	$P.D3.Protein.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Protein);

})(PATHBUBBLES);
