(function($P) {
	'use strict';

	$P.D3.Set = $P.defineClass(
		$P.D3.Element,
		function D3Set(config) {
			if (!(this instanceof D3Set)) {return new D3Set(config);}
			config.elementType = 'g';
			$P.D3.Element.call(this, config);
			var self = this;

			this.datum = config.datum;

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
			set('highlighted', false);
			set('x', 0);
			set('y', 0);
			this.selection.attr('transform', 'translate('+this.x+','+this.y+')');
			this.rectSelection = this.selection.append('rect')
				.attr('class', 'set')
				.attr('stroke', this.stroke)
				.attr('fill', this.fill)
				.attr('x', -this.size * 7)
				.attr('y', -this.size * 7)
				.attr('width', this.size * 14)
				.attr('height', this.size * 14)
				.attr('rx', this.size * 3)
				.attr('ry', this.size * 3);

			if (config.collector) {
				config.collector[config.datum.layoutId] = self;}

			if (undefined === config.datum.displays) {
				config.datum.displays = [];
				config.datum.displays.__no_save__ = true;}
			config.datum.displays.push(this);

			return this;},
		{
			update: function(layout) {
				this.selection.attr('transform', 'translate('+this.x+','+this.y+')' + this.transform);},

			get searchMatch() {return this._searchMatch;},
			set searchMatch(value) {
				if (value === this._searchMatch) {return;}
				this._searchMatch = value;
				if (value && !this.searchSelection) {
					this.searchSelection = this.selection.insert('rect', '.protein')
						.attr('class', 'search')
						.attr('stroke', null)
						.attr('fill', 'yellow')
						.attr('opacity', 0.7)
						.attr('x', -this.size * 14)
						.attr('y', -this.size * 14)
						.attr('width', this.size * 28)
						.attr('height', this.size * 28)
						.attr('rx', this.size * 6)
						.attr('ry', this.size * 6);}
				if (!value && this.searchSelection) {
					this.searchSelection.remove();
					this.searchSelection = null;}
			},
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
						.attr('x', -this.size * (10 + value * 1.5))
						.attr('y', - this.size * (10 + value * 1.5))
						.attr('width', this.size * (20 + value * 3))
						.attr('height', this.size * (20 + value * 3))
						.attr('rx', this.size * 3)
						.attr('ry', this.size * 3);}
			}
		});
	$P.D3.Set.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Set);

})(PATHBUBBLES);
