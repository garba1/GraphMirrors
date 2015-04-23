(function($P){
	'use strict';

	$P.D3SplitForce = $P.defineClass(
		$P.HtmlObject,
		function D3SplitForce(config) {
			$P.HtmlObject.call(this, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});

			this.svg = d3.select(this.element).append('svg').attr('class', 'svg');
			this.svg.main = this.svg.append('g');

			this.layout = new $P.PathwayForceLayout();

			this.layout.registerTickListener(this.onTick.bind(this));
			this.layout.force.gravity(0);
			this.layout.gravity = 0.03;
			this.pathways = [];

			this.updateSvgPosition();
		},
		{
			getExpressionColor: function(pathwayIndex, symbol) {
				if ('up' === this.expression[symbol]) {return 'yellow';}
				if ('down' === this.expression[symbol]) {return 'cyan';}
				return 'white';},

			addPathway: function(pathwayId, pathwayName, expressions) {
				var self = this;
				function onFinish() {
					self.layout.consolidateConverted();
					//self.layout.consolidateReactions();
					self.pathways.push({id: pathwayId, name: pathwayName, expressions: expressions});
					self.svg.remove();
					self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
					self.svg.main = self.svg.append('g').attr('id', 'main');
					self.svg.defs = self.svg.append('defs');
					self.layout.setPathways(self.pathways);
					if (1 === self.pathways.length) {self.layoutSingle();}
					if (2 === self.pathways.length) {self.layoutMirror();}
					if (2 < self.pathways.length) {self.layoutRadial();}
					self.updateSvgPosition();
					self.layout.force.start();
					//self.layout.doTicks(10, {no_display: true});
					// TODO: Auto zoom out?
					//self.layout.getBoundingBox();
					// expand each view out to see bounding box (circle, maybe?)
					// Since they're linked we'll get the maximal view.
				}
				$P.getJSON(
					'./php/querybyPathwayId.php',
					function (jsonData) {
						self.addEntities(jsonData.map($P.getter('reactomeID')), onFinish);
					},
					{type: 'GET', data: {pathwaydbId: pathwayId}});},

			layoutSingle: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutMirror: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					layout: this.layout,
					shape: new $P.ForceShape.Mirror({w: this.w * 0.5, h: this.h, count: 2}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutRadial: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					layout: this.layout,
					shape: new $P.ForceShape.Radial({
						count: this.pathways.length,
						radius: Math.max(this.w, this.h)}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			onPositionChanged: function(dx, dy, dw, dh) {
				$P.HtmlObject.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
				if ((dw && dw !== 0) || (dh && dh !== 0)) {this.layout.force.start();}
				this.updateSvgPosition();},

			updateSvgPosition: function() {
				if (!this.svg) {return;}
				this.svg.attr('width', this.w).attr('height', this.h);
				//this.svg.main.attr('transform', 'translate('+this.w/2+','+this.h/2+')');
				if (this.display) {this.display.size = [this.w, this.h];}},

			// by reactome id
			addEntities: function(ids, callback) {
				var self = this;
				$.getJSON('php/getEntitiesById.php?ids=' + ids.join(','), null, function(data) {
					if (data.entities) {
						$.each(data.entities, function(entityId, entity) {
							entity.klass = 'entity';
							self.layout.addNode(entity);});}
					if (data.reactions) {
						$.each(data.reactions, function(reactionId, reaction) {
							reaction.klass = 'reaction';
							self.layout.addNode(reaction);});}
					callback();
				});
			},

			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);},

			onTick: function(layout, args) {
				args = args || {};
				if (args.no_display) {return;}

				this.svg.selectAll('.node').attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';});

				// Undirected Links.
				this.svg.selectAll('.link line')
					.attr('x1', function(link) {return link.source.x;})
					.attr('y1', function(link) {return link.source.y;})
					.attr('x2', function(link) {return link.target.x;})
					.attr('y2', function(link) {return link.target.y;});

				// Directed Links.
				this.svg.selectAll('.link path')
					.attr('d', function(link) {
						var element = d3.select(this),
								dir = $P.Vector2D(link.target.x - link.source.x, link.target.y - link.source.y).normalized(),
								cross = dir.rotate90(),
								sourceVec = $P.Vector2D(link.source.x, link.source.y),
								targetVec = $P.Vector2D(link.target.x, link.target.y),
								sourceWidth = parseFloat(element.attr('source-width')),
								targetWidth = parseFloat(element.attr('target-width')),
								sourceWidthVec = cross.times(sourceWidth * 0.5),
								targetWidthVec = cross.times(targetWidth * 0.5),
								p0 = sourceVec.minus(sourceWidthVec),
								p1 = sourceVec.plus(sourceWidthVec),
								p2 = targetVec.plus(targetWidthVec),
								p3 = targetVec.minus(targetWidthVec);
						return 'M' + p0.x + ' ' + p0.y
							+ 'L' + p1.x + ' ' + p1.y
							+ 'L' + p2.x + ' ' + p2.y
							+ 'L' + p3.x + ' ' + p3.y
							+ 'Z';
					});}

		});
})(PATHBUBBLES);
