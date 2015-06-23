(function($P){
	'use strict';

	$P.Bubble.ForceContent = $P.defineClass(
		$P.HtmlObject,
		function  ForceBubbleContent(config) {
			$P.HtmlObject.call(this, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});

			this.svg = d3.select(this.element).append('svg').attr('class', 'svg');
			this.svg.main = this.svg.append('g');

			this.layout = config.layout || new $P.PathwayForceLayout();

			this.layout.registerTickListener(this.onTick.bind(this));
			this.layout.force.gravity(0);
			this.layout.gravity = 0.03;

			this.pathways = [];
			if (config.pathways) {
				this.setPathways(config.pathways);}


			this.legendWidth = config.legendWidth || 130;
			this.mode = config.mode || 'split';

			this.updateSvgPosition();

		},
		{
			getExpressionColor: function(pathwayIndex, symbol) {
				if ('up' === this.expression[symbol]) {return 'yellow';}
				if ('down' === this.expression[symbol]) {return 'cyan';}
				return 'white';},

			addPathway: function(pathway, mode, finish) {
				var self = this;

				if (undefined !== mode) {this.mode = mode;}

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
					self.onPathwaysChanged();
					if (finish) {finish();}}

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
						self.layout.positionNewNodes();
						onFinish();},
					{type: 'GET', data: {
						mode: 'reactome_pathway_id',
						id: pathway.pathwayId}});},

			setPathways: function(pathways, finish) {
				var self = this;
				self.onPathwaysChanged = function(){}; // temp disable redisplay.

				var index = 0;
				function add() {
					if (index < pathways.length) {
						self.addPathway(pathways[index], undefined, add);
						++index;}
					else {
						delete self.onPathwaysChanged;
						self.onPathwaysChanged();
						if (finish) {finish();}}}

				add();},

			onPathwaysChanged: function() {
				var self = this;
				if (self.svg) {self.svg.remove();}
				self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
				self.svg.main = self.svg.append('g').attr('id', 'main');
				self.svg.defs = self.svg.append('defs');

				self.layout.setPathways(self.pathways, function() {
					self.renewDisplay();
					self.updateSvgPosition();});},

			getPathwayColor: function(pathway) {
				var i;
				for (i = 0; i < this.pathways.length; ++i) {
					if (pathway.id === this.pathways[i].id) {
						return this.pathways[i].color;}}
				return pathway.color || pathway.strokeStyle || null;},

			renewDisplay: function() {
				if ('split' === this.mode) {this.layoutSplit();}
				else if ('soup' === this.mode) {this.layoutSoup();}
			},

			layoutPrep: function() {
				if (this.display) {this.display.delete();}
				if (this.display && this.display.viewCount > 0) {
					this.zoomBase = this.display.views[0].zoom.base;}},

			layoutFinish: function() {
				if (!this.display || !this.display.layout || !this.display.layout.force) {return;}
				this.onTick();
				this.updateLegend();},

			layoutSplit: function() {
				this.layoutPrep();
				if (1 === this.pathways.length) {this.layoutSingle();}
				if (2 === this.pathways.length) {this.layoutMirror();}
				if (2 < this.pathways.length) {this.layoutRadial();}
				this.layoutFinish();},

			layoutSingle: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					zoomBase: this.zoomBase,
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutMirror: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Mirror({w: this.w * 0.5, h: this.h, count: 2}),
					zoomBase: this.zoomBase,
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
					zoomBase: this.zoomBase,
					viewArgs: this.pathways,
					viewConstructor: $P.PathwayForceView});},

			layoutSoup: function() {
				this.layoutPrep();
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					zoomBase: this.zoomBase,
					viewArgs: [{type: 'pathways', list: this.pathways}],
					viewConstructor: $P.SoupForceView});
				this.layoutFinish();},

			onPositionChanged: function(dx, dy, dw, dh) {
				$P.HtmlObject.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
				//if ((dw && dw !== 0) || (dh && dh !== 0)) {this.layout.force.start();}
				this.updateSvgPosition();},

			updateLegend: function() {
				var self = this;
				if (self.legend) {self.legend.remove();}

				self.legend = self.display.viewConstructor.makeLegend(
					d3.select(self.element), self.legendWidth, self.h,
					function(id, state) {self.setVisibleFilter(id, state);});
			},

			setVisibleFilter: function(id, state) {
				this.display.views.forEach(function(view) {
					view.setVisibleFilter(id, state);});},

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

			onTick: function() {
				var self = this;

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

				// Pathway edge links
				this.svg.selectAll('.link .pathway-edge')
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
					});},

			saveKeys: [
				'legendWidth',
				'pathways',
				'layout'],

			saveCallback: function(save, id) {
				var self = this;
				var result = {};
				save.objects[id] = result;

				result.legendWidth = save.save(self.legendWidth);
				result.pathways = save.save(self.pathways);
				result.layout = save.save(self.layout);
				console.log('LAYOUT', result.layout);

				return id;}

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
