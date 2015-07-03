(function($P) {
	'use strict';

	$P.D3.ReactionLink = $P.defineClass(
		$P.D3.Element,
		function D3ReactionLink(config) {
			if (!(this instanceof D3ReactionLink)) {return new D3ReactionLink(config);}
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

			this.selection.classed('link', true);

			set('source', config.datum.source);
			set('target', config.datum.target);

			// For some weird reason the stroke is being displayed as
			// white-ish, even though it's set to these values at the time
			// of display. As a temporary fix make opacity and width 0.
			set('stroke', 'black');
			set('strokeWidth', 0);
			set('strokeOpacity', 0);

			set('size', 20);
			this.size /= 20;

			set('fill', 'black');
			set('sourceWidth', 5);
			set('targetWidth', 1);
			set('opacity', 0.3);
			set('highlighted', false);

			this.mainSelection = this.selection.append('path')
				.attr('stroke', this.stroke)
				.attr('stroke-width', this.strokeWidth)
				.attr('stroke-opacity', this.strokeOpacity)
				.attr('fill', this.fill)
				.attr('opacity', this.opacity);

			if (undefined === config.datum.displays) {
				config.datum.displays = [];
				config.datum.displays.__no_save__ = true;}
			config.datum.displays.push(this);

			return this;},
		{
			update: function(layout) {
				var source = this.source, target = this.target;
				if (source.locationCollapsed) {source = layout.getNode('location:' + source.location);}
				if (target.locationCollapsed) {target = layout.getNode('location:' + target.location);}

				var dir = $P.Vector2D(target.x - source.x, target.y - source.y).normalized(),
						cross = dir.rotate90(),
						sourceVec = $P.Vector2D(source.x, source.y),
						targetVec = $P.Vector2D(target.x, target.y),
						sourceWidthVec = cross.times(this.sourceWidth * 0.5),
						targetWidthVec = cross.times(this.targetWidth * 0.5),
						p0 = sourceVec.minus(sourceWidthVec),
						p1 = sourceVec.plus(sourceWidthVec),
						p2 = targetVec.plus(targetWidthVec),
						p3 = targetVec.minus(targetWidthVec),
						d = 'M' + p0.x + ' ' + p0.y
							+ 'L' + p1.x + ' ' + p1.y
							+ 'L' + p2.x + ' ' + p2.y
							+ 'L' + p3.x + ' ' + p3.y
							+ 'Z';
				this.mainSelection.attr('d', d);

				if (this.highlightedSelection) {
					var edge = (5 + this.highlighted * 3) / 10;
					sourceWidthVec = cross.times(this.sourceWidth * edge),
					targetWidthVec = cross.times(this.targetWidth * edge),
					p0 = sourceVec.minus(sourceWidthVec),
					p1 = sourceVec.plus(sourceWidthVec),
					p2 = targetVec.plus(targetWidthVec),
					p3 = targetVec.minus(targetWidthVec),
					d = 'M' + p0.x + ' ' + p0.y
						+ 'L' + p1.x + ' ' + p1.y
						+ 'L' + p2.x + ' ' + p2.y
						+ 'L' + p3.x + ' ' + p3.y
						+ 'Z';
					this.highlightedSelection.attr('d', d);}},

			get highlighted() {return this._highlighted;},
			set highlighted(value) {
				if (value === this._highlighted) {return;}
				this._highlighted = value;
				if (!value && this.highlightedSelection) {
					this.highlightedSelection.remove();
					this.highlightedSelection = null;}
				if (value && !this.highlightedSelection) {
					this.highlightedSelection = this.selection.insert('path', ':first-child')
						.attr('class', 'highlight')
						.attr('stroke', 'none')
						.attr('stroke-width', 0)
						.attr('stroke-opacity', 0)
						.attr('fill', 'cyan')
						.attr('opacity', 0.7);}}

		});
	$P.D3.ReactionLink.appender = $P.D3.Element.appender.bind(undefined, $P.D3.ReactionLink);

})(PATHBUBBLES);
