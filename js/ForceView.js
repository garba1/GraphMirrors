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

			/**
			 * Last timestamp for the update loop completing
			 */
			self.lastUpdateCompleted = Date.now();

			/** current update stage. */
			self.updateStage = 'node';
			self.updateIndex = 0;

			/** max updates per redisplay. */
			self.updatesPerDisplay = config.updatesPerDisplay || 220;

			/**
			 * If we are currently updating.
			 */
			self.updating = false;

			self.layout.registerListener(function(layout, lastChanged) {
				if (self.updating) {return;}
				self.startUpdating();});

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
				.attr('pointer-events', 'visibleFill')
				.style('cursor', 'inherit')
				.call(self.zoom)
				.on('mousemove', function() {
					self.zoom.center(
						self.shape.getZoomCenter(self.index, d3.mouse(this)));});

			/** Timestamp for the start of the last display loop. */
			this.displayLoopStart = Date.now();

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
				this.startUpdating();},

			startUpdating: function() {
				var self = this;
				self.updating = true;
				d3.timer(self.update.bind(self));},

			update: function() {
				var self = this;
				var displays;

				var updates = 0;

				if ('node' === self.updateStage) {
					var nodes = self.element.selectAll('.node')[0];
					while (self.updateIndex < nodes.length) {
						d3.select(nodes[self.updateIndex])
							.attr('transform', function(d, i) {
								return 'translate(' + d.x + ',' + d.y + ')';});
						(nodes[self.updateIndex].__data__.displays || []).forEach(function(display) {
							display.update(self.layout);});

						self.updateIndex++;
						updates++;
						if (updates >= self.updatesPerDisplay) {return false;}}

					self.updateStage = 'follow';
					self.updateIndex = 0;}

				if ('follow' === self.updateStage) {
					var followers = self.element.selectAll('.follower')[0];
					while (self.updateIndex < followers.length) {
						d3.select(followers[self.updateIndex])
							.attr('transform', function(d, i) {
								var follow = d3.select(this).attr('follow-id');
								var node = self.layout.getNode(follow);
								return 'translate(' + node.x + ',' + node.y + ')';});
						self.updateIndex++;
						updates++;
						if (updates >= self.updatesPerDisplay) {return false;}}

					self.updateStage = 'link-line';
					self.updateIndex = 0;}

				if ('link-line' === self.updateStage) {
					var linkls = self.element.selectAll('.link line')[0];
					while (self.updateIndex < linkls.length) {
						d3.select(linkls[self.updateIndex])
							.attr('x1', function (link) {return link.source.x;})
							.attr('y1', function(link) {return link.source.y;})
							.attr('x2', function(link) {return link.target.x;})
							.attr('y2', function(link) {return link.target.y;});
						self.updateIndex++;
						updates++;
						if (updates >= self.updatesPerDisplay) {return false;}}

					self.updateStage = 'link-g';
					self.updateIndex = 0;}

				if ('link-g' === self.updateStage) {
					var linkgs = self.element.selectAll('.link g')[0];
					while (self.updateIndex < linkgs.length) {
						d3.select(linkgs[self.updateIndex])
							.attr('x1', function (link) {return link.source.x;})
							.attr('y1', function(link) {return link.source.y;})
							.attr('x2', function(link) {return link.target.x;})
							.attr('y2', function(link) {return link.target.y;});
						(linkgs[self.updateIndex].__data__.displays || []).forEach(function(display) {
							display.update(self.layout);});
						self.updateIndex++;
						updates++;
						if (updates >= self.updatesPerDisplay) {return false;}}

					self.updateStage = 'finish';
					self.updateIndex = 0;}

				if ('finish' === self.updateStage) {
					self.updateStage = 'node';
					var lastComplete = self.lastUpdateCompleted;
					self.lastUpdateCompleted = Date.now();
					if (lastComplete > self.layout.lastChanged) {
						self.updating = false;
						return true;}}

				return false;},

			delete: function() {
				this.element.remove();
				this.background.remove();}

		});

	$P.ForceView.nextId = 0;

})(PATHBUBBLES);
