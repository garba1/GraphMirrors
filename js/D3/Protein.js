(function($P) {
	'use strict';

	$P.D3.Protein = $P.defineClass(
		$P.D3.Element,
		function D3Protein(config) {
			if (!(this instanceof D3Protein)) {return new D3Protein(config);}
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
			set('fill', 'white');
			set('size', 20);
			this.size /= 20;
			this.crosstalk = config.crosstalk;
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')');
			this.rectSelection = this.selection.append('rect')
				.attr('class', 'protein')
				.attr('stroke', this.stroke)
				.attr('fill', this.fill)
				.attr('x', -this.size * 10)
				.attr('y', -this.size * 10)
				.attr('width', this.size * 18)
				.attr('height', this.size * 10)
				.attr('rx', this.size * 4)
				.attr('ry', this.size * 3);

			return this;},
		{
			get crosstalk() {return this._crosstalk;},
			set crosstalk(value) {
				this._crosstalk = value;
				if (!value && this.crosstalkSelection) {
					this.crosstalkSelection.remove();}
				if (value && !this.crosstalkSelection) {
					this.crosstalkSelection = this.selection.insert('rect', '.protein')
						.attr('stroke', this.stroke)
						.attr('fill', this.stroke)
						.attr('x', -this.size * 12)
						.attr('y', -this.size * 11)
						.attr('width', this.size * 22)
						.attr('height', this.size * 12)
						.attr('rx', this.size * 4)
						.attr('ry', this.size * 3);}
			}
		});
	$P.D3.Protein.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Protein);

})(PATHBUBBLES);
