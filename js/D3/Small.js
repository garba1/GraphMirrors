(function($P) {
	'use strict';

	$P.D3.Small = $P.defineClass(
		$P.D3.Element,
		function D3Small(config) {
			if (!(this instanceof D3Small)) {return new D3Small(config);}
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
			self.size /= 20;
			set('crosstalk', false);
			set('highlighted', false);
			set('x', 0);
			set('y', 0);

			self.selection.attr('transform', 'translate('+self.x+','+self.y+')');
			self.circleSelection = self.selection.append('circle')
				.attr('class', 'small')
				.attr('stroke', self.stroke)
				.attr('fill', self.fill)
				.attr('x', -self.size * 8)
				.attr('y', -self.size * 8)
				.attr('r', self.size * 8)
				.attr('transform', self.transform);

			if (config.collector) {
				config.collector[config.datum.layoutId] = self;}

			if (undefined === config.datum.displays) {
				config.datum.displays = [];
				config.datum.displays.__no_save__ = true;}
			config.datum.displays.push(self);

			return this;},
		{
			get searchMatch() {return this._searchMatch;},
			set searchMatch(value) {
				if (value === this._searchMatch) {return;}
				this._searchMatch = value;
				if (value && !this.searchSelection) {
					this.searchSelection = this.selection.insert('circle', '.small')
						.attr('class', 'search')
						.attr('stroke', null)
						.attr('fill', 'yellow')
						.attr('opacity', 0.7)
						.attr('x', -this.size * 14)
						.attr('y', -this.size * 14)
						.attr('r', this.size * 14);}
				if (!value && this.searchSelection) {
					this.searchSelection.remove();
					this.searchSelection = null;}},
			get crosstalk() {return this._crosstalk;},
			set crosstalk(value) {
				if (value === this._crosstalk) {return;}
				this._crosstalk = value;
				if (!value && this.crosstalkSelection) {
					this.crosstalkSelection.remove();
					this.crosstalkSelection = null;}
				if (value && !this.crosstalkSelection) {
					this.crosstalkSelection = this.selection.insert('circle', '.small')
						.attr('class', 'crosstalk')
						.attr('stroke', this.stroke)
						.attr('fill', this.stroke)
						.attr('x', -this.size * 11)
						.attr('y', -this.size * 11)
						.attr('r', this.size * 11);}},
			get highlighted() {return this._highlighted;},
			set highlighted(value) {
				if (value === this._highlighted) {return;}
				this._highlighted = value;
				if (!value && this.highlightedSelection) {
					this.highlightedSelection.remove();
					this.highlightedSelection = null;}
				if (value && !this.highlightedSelection) {
					this.highlightedSelection = this.selection.insert('circle', ':first-child')
						.attr('class', 'highlight')
						.attr('stroke', 'none')
						.attr('fill', this.highlight)
						.attr('opacity', 0.7)
						.attr('x', -this.size * (9 + value * 1.5))
						.attr('y', - this.size * (9 + value * 1.5))
						.attr('r', this.size * (9 + value * 1.5));}}
		});
	$P.D3.Small.appender = $P.D3.Element.appender.bind(undefined, $P.D3.Small);

})(PATHBUBBLES);
