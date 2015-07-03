(function($P) {
	'use strict';

	$P.D3.SoupReactionLink = $P.defineClass(
		$P.D3.Element,
		function D3SoupReactionLink(config) {
			if (!(this instanceof D3SoupReactionLink)) {return new D3SoupReactionLink(config);}
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

			self.selection.classed('link', true);

			set('view');

			set('source', config.datum.source);
			set('target', config.datum.target);

			// For some weird reason the stroke is being displayed as
			// white-ish, even though it's set to these values at the time
			// of display. As a temporary fix make opacity and width 0.
			set('stroke', 'black');
			set('strokeWidth', 0);
			set('strokeOpacity', 0);

			set('size', 20);
			self.size /= 20;

			set('sourceWidth', 5);
			set('targetWidth', 1);
			set('opacity', 0.9);
			set('highlighted', false);

			self.mainSelection = self.selection.append('g')
				.selectAll('path').data(function(d, i) {
					var data = [];
					var pathways = self.view.activePathways(d);
					pathways.forEach(function(pathway, i) {
							data.push({
								crossOffsetSource: (i - (pathways.length * 0.5) + 0.5) * 5,
								crossOffsetTarget: (i - (pathways.length * 0.5) + 0.5) * 1,
								color: pathway.color,
								source: d.source,
								target: d.target});});
						if (0 === data.length) {
							data.push({
								crossOffsetSource: 0,
								crossOffsetTarget: 0,
								color: 'gray',
								source: d.source,
								target: d.target});}
					return data;})
				.enter().append('path')
				.attr('stroke', this.stroke)
				.attr('stroke-width', this.strokeWidth)
				.attr('stroke-opacity', this.strokeOpacity)
				.attr('fill', function(d, i) {return d.color;})
				.attr('opacity', this.opacity);

			if (undefined === config.datum.displays) {
				config.datum.displays = [];
				config.datum.displays.__no_save__ = true;}
			config.datum.displays.push(this);

			return this;},
		{
			update: function(layout) {
				var self = this;
				self.mainSelection.attr('d', function(d, i) {
					var source = self.source, target = self.target;
					if (source.locationCollapsed) {source = layout.getNode('location:' + source.location);}
					if (target.locationCollapsed) {target = layout.getNode('location:' + target.location);}

					var dir = $P.Vector2D(target.x - source.x, target.y - source.y).normalized(),
							cross = dir.rotate90(),
							crossOffsetSourceVec = cross.times(d.crossOffsetSource),
							crossOffsetTargetVec = cross.times(d.crossOffsetTarget),
							sourceVec = $P.Vector2D(source.x, source.y).plus(crossOffsetSourceVec),
							targetVec = $P.Vector2D(target.x, target.y).plus(crossOffsetTargetVec),
							sourceWidthVec = cross.times(self.sourceWidth * 0.5),
							targetWidthVec = cross.times(self.targetWidth * 0.5),
							p0 = sourceVec.minus(sourceWidthVec),
							p1 = sourceVec.plus(sourceWidthVec),
							p2 = targetVec.plus(targetWidthVec),
							p3 = targetVec.minus(targetWidthVec);
					return 'M' + p0.x + ' ' + p0.y
						+ 'L' + p1.x + ' ' + p1.y
						+ 'L' + p2.x + ' ' + p2.y
						+ 'L' + p3.x + ' ' + p3.y
						+ 'Z';});

				if (self.highlightedSelection) {
					self.highlightedSelection.attr('d', function(d, i) {
						var source = self.source, target = self.target;
						if (source.locationCollapsed) {source = layout.getNode('location:' + source.location);}
						if (target.locationCollapsed) {target = layout.getNode('location:' + target.location);}

						var edge = (self.mainSelection.size() * 5 + self.highlighted * 3) / 10,
								dir = $P.Vector2D(target.x - source.x, target.y - source.y).normalized(),
								cross = dir.rotate90(),
								sourceVec = $P.Vector2D(source.x, source.y),
								targetVec = $P.Vector2D(target.x, target.y),
								sourceWidthVec = cross.times(self.sourceWidth * edge),
								targetWidthVec = cross.times(self.targetWidth * edge),
								p0 = sourceVec.minus(sourceWidthVec),
								p1 = sourceVec.plus(sourceWidthVec),
								p2 = targetVec.plus(targetWidthVec),
								p3 = targetVec.minus(targetWidthVec);
						return 'M' + p0.x + ' ' + p0.y
							+ 'L' + p1.x + ' ' + p1.y
							+ 'L' + p2.x + ' ' + p2.y
							+ 'L' + p3.x + ' ' + p3.y
							+ 'Z';});};},

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
	$P.D3.SoupReactionLink.appender = $P.D3.Element.appender.bind(undefined, $P.D3.SoupReactionLink);

})(PATHBUBBLES);
