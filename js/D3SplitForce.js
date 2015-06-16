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

			this.legendWidth = config.legendWidth || 120;

			this.updateSvgPosition();
		},
		{
			getExpressionColor: function(pathwayIndex, symbol) {
				if ('up' === this.expression[symbol]) {return 'yellow';}
				if ('down' === this.expression[symbol]) {return 'cyan';}
				return 'white';},

			addPathway: function(pathway) {
				var self = this;
				function onFinish() {
					$P.state.scene.record({
						type: 'pathway-added',
						id: pathway.pathwayId,
						name: pathway.pathwayName,
						bubble: self});
					self.layout.consolidateComposite();
					//self.layout.consolidateReactions();

					pathway = $.extend({}, pathway, {type: 'pathway'});
					self.pathways.push(pathway);

					if (undefined === pathway.color) {
						var colors = $P.BubbleBase.colors.slice(0), color, p;
						for (p in self.pathways) {
							$P.removeFromList(colors, self.pathways[p].color);}
						if (0 === colors.length) {
							pathway.color = '#666';}
						else if (-1 !== colors.indexOf(pathway.strokeStyle)) {
							pathway.color = pathway.strokeStyle;}
						else {
							pathway.color = colors[0];}}

					if (self.svg) {self.svg.remove();}
					self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
					self.svg.main = self.svg.append('g').attr('id', 'main');
					self.svg.defs = self.svg.append('defs');

					if (self.legend) {self.legend.remove();}
					self.createLegend();

					self.layout.setPathways(self.pathways);
					self.layoutSplit();
					self.updateSvgPosition();
					console.log(self.layout.force);
					self.layout.force.start();
					//self.layout.doTicks(10, {no_display: true});
					// TODO: Auto zoom out?
					//self.layout.getBoundingBox();
					// expand each view out to see bounding box (circle, maybe?)
					// Since they're linked we'll get the maximal view.
				}
				$P.getJSON(
					'./php/get_entities.php',
					function (jsonData) {
						if (jsonData.entities) {
							$.each(jsonData.entities, function(entityId, entity) {
								entity.klass = 'entity';
								self.layout.addNode(entity);});}
						if (jsonData.reactions) {
							$.each(jsonData.reactions, function(reactionId, reaction) {
								reaction.klass = 'reaction';
								self.layout.addNode(reaction);});}
						onFinish();},
					{type: 'GET', data: {
						mode: 'reactome_pathway_id',
						id: pathway.pathwayId}});},

			layoutSplit: function() {
				if (this.display) {this.display.delete();}
				if (1 === this.pathways.length) {this.layoutSingle();}
				if (2 === this.pathways.length) {this.layoutMirror();}
				if (2 < this.pathways.length) {this.layoutRadial();}},

			layoutSingle: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutMirror: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Mirror({w: this.w * 0.5, h: this.h, count: 2}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutRadial: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Radial({
						count: this.pathways.length,
						radius: Math.max(this.w, this.h)}),
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutSoup: function() {
				if (this.display) {this.display.delete();}
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					viewArgs: [{type: 'pathways', list: this.pathways}],
					viewConstructor: $P.SoupForceView});},

			onPositionChanged: function(dx, dy, dw, dh) {
				$P.HtmlObject.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
				if ((dw && dw !== 0) || (dh && dh !== 0)) {this.layout.force.start();}
				this.updateSvgPosition();},

			createLegend: function() {
				this.legend = d3.select(this.element).append('svg').attr('class', 'legend');

				this.legend.append('line')
					.attr('stroke', 'black')
					.attr('stroke-width', 3)
					.attr('x1', 0).attr('y1', 0)
					.attr('x2', 0).attr('y2', this.h);

				var textX = 20;

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 20)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Protein');

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'white')
					.attr('x', 90).attr('y', 20 - 7)
					.attr('width', 18).attr('height', 12)
					.attr('rx', 4.5).attr('ry', 4.5);

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 44)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Small');

				this.legend.append('circle')
					.attr('stroke', 'black')
					.attr('fill', 'white')
					.attr('r', 7.5)
					.attr('transform', 'translate(98, 43)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 68)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Complex');

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'white')
					.attr('width', 15).attr('height', 15)
					.attr('transform', 'translate(98,57)rotate(45)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 92)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Other');

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'white')
					.attr('width', 15).attr('height', 15)
					.attr('transform', 'translate(90, 85)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 116)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Expression:');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX + 12)
					.attr('y', 135)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Up');

				this.legend.append('circle')
					.attr('stroke', 'black')
					.attr('fill', '#CCCC00')
					.attr('r', 7.5)
					.attr('transform', 'translate(98, 135)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX + 12)
					.attr('y', 154)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Down');

				this.legend.append('circle')
					.attr('stroke', 'black')
					.attr('fill', '#0000CC')
					.attr('r', 7.5)
					.attr('transform', 'translate(98, 154)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 174)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Reaction');

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'red')
					.attr('width', 7.5).attr('height', 7.5)
					.attr('transform', 'translate(94, 170)');

				this.legend.append('text')
					.style('font-size', '14px')
					.attr('x', textX)
					.attr('y', 194)
					.attr('fill', 'black')
					.attr('dominant-baseline', 'middle')
					.text('Crosstalk');

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'gray')
					.attr('width', 21).attr('height', 15)
					.attr('x', 88.5).attr('y', 186)
					.attr('rx', 4.5).attr('ry', 4.5);

				this.legend.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'white')
					.attr('x', 90).attr('y', 187.5)
					.attr('width', 18).attr('height', 12)
					.attr('rx', 4.5).attr('ry', 4.5);


			},

			updateSvgPosition: function() {
				if (this.svg) {
					this.svg.attr('width', this.w - this.legendWidth).attr('height', this.h);}
				if (this.display) {this.display.size = [this.w - this.legendWidth, this.h];}
				if (this.legend) {
					this.legend
						.attr('x', this.w - this.legendWidth)
						.attr('width', this.legendWidth)
						.attr('y', 0)
						.attr('height', this.h);}
			},

			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);},

			onTick: function(layout, args) {
				var self = this;
				args = args || {};
				if (args.no_display) {return;}

				this.svg.selectAll('.node').attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';});

				this.svg.selectAll('.follower').attr('transform', function(d) {
					var follow = d3.select(this).attr('follow-id');
					var node = self.layout.getNode(follow);
					return 'translate(' + node.x + ',' + node.y + ')';});

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

	/*
	$P.D3SplitForce.BubbleLinkEnd = $P.defineClass(
		$P.BubbleLink.End,
		function D3SplitForceBubbleLinkEnd(config) {
			this.view = config.view;
		},
		{
			get x() {
				var svg = this.view.svg;

			},
			get y() {}
		});
	 */
})(PATHBUBBLES);
