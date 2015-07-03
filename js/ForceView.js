(function($P){

	$P.ForceView = $P.defineClass(
		null,
		function ForceView(config) {
			var self = this, defs, clipId;
			self.id = $P.ForceView.nextId++;
			clipId = 'forceview' + self.id + '_clip';

			self.index = config.index || 0;

			self.svg = config.svg;
			if (!self.svg) {
				console.error('ForceView('+config+'): missing svg');
				return;}

			self.parent = config.parent || self.svg;
			self.parentBubble = config.parentBubble || null;
			self.display = config.display || null;

			self.layout = config.layout;
			if (!self.layout) {
				console.error('ForceView('+config+'): missing layout');
				return;}
			self.layout.registerTickListener(self.onTick.bind(self));

			self.shape = config.shape;
			if (!self.shape) {
				console.error('ForceView('+config+'): missing shape');
				return;}

			defs = self.svg.select('defs');
			if (!defs) {defs = self.svg.append('defs');}
			self.clip = defs.append('svg:clipPath').attr('id', clipId);

			self.zoom = self.shape.makeZoom(self.layout, self, config.zoomBase);
			self.root = self.parent.append('g')
				.attr('class', 'view')
				.attr('clip-path', 'url(#' + clipId + ')');

			self.background = self.root.append('rect')
				.attr('class', 'background')
				.attr('fill', 'none')
				.attr('stroke', 'none')
				.attr('pointer-events', 'all')
				.style('cursor', 'inherit')
				.call(self.zoom)
				.on('mousemove', function() {
					self.zoom.center(
						self.shape.getZoomCenter(self.index, d3.mouse(this)));});

			self.element = self.root.append('g');
			window.setTimeout(
				function() {
					self.onShapeChange();},
				0);},
		{
			onShapeChange: function() {
				this.background
					.attr('width', this.shape.w)
					.attr('height', this.shape.h);
				this.shape.updateClip(this);
				this.onZoom();},
			onZoom: function() {
				this.element.attr('transform',
													this.shape.transform(this)
													+ 'translate(' + this.zoom.translate() + ')'
													+ 'scale(' + this.zoom.scale() + ')');
				this.onTick();},
			onTick: function() {
				this.element.selectAll('.node')
					.attr('transform', function(d, i) {
						return 'translate(' + d.x + ',' + d.y + ')';});

				this.element.selectAll('.link line')
					.attr('x1', function (link) {return link.source.x;})
					.attr('y1', function(link) {return link.source.y;})
					.attr('x2', function(link) {return link.target.x;})
					.attr('y2', function(link) {return link.target.y;});

				this.element.selectAll('*').each(function(d, i) {
					if (this.onTick) {this.onTick(d, i);}});},

			delete: function() {
				this.element.remove();
				this.background.remove();}

		});

	$P.ForceView.nextId = 0;

})(PATHBUBBLES);
