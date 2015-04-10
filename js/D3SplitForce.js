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
			get zoom() {
				var self = this;
				if (undefined === this._zoom) {
					(function() {
						var base = d3.behavior.zoom().scaleExtent([0.1, 10])
									.size([500, 500]).center([0, 0])
									.on('zoom', self.onZoom.bind(self));
						self._zoom = function(g) {
							base(g);
							g.on('dblclick.zoom', null);
						};
					})();}
				return this._zoom;},

			get expression() {return this._expression;},
			set expression(value) {
				if (this._expression === value) {return;}
				this._expression = value;
				if (!value) {return;}},

			getExpressionColor: function(symbol) {
				if ('up' === this._expression[symbol]) {return 'yellow';}
				if ('down' === this._expression[symbol]) {return 'cyan';}
				return 'white';},

			addPathway: function(pathwayId) {
				var self = this;
				function onFinish() {
					self.zoomMod = null;
					self.pathways.push(pathwayId);
					self.svg.remove();
					self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
					self.svg.main = self.svg.append('g').attr('id', 'main');
					self.svg.defs = self.svg.append('defs');
					if (1 === self.pathways.length) {self.layoutSingle();}
					if (2 === self.pathways.length) {self.layoutMirror();}
					if (2 < self.pathways.length) {self.layoutRadial();}
					self.updateSvgPosition();
					self.display.layout.setPathways(self.pathways);
					self.layout.force.start();}
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

			onTick: function() {
				this.svg.selectAll('.node').attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';});

				this.svg.selectAll('.link line')
					.attr('x1', function(link) {return link.source.x;})
					.attr('y1', function(link) {return link.source.y;})
					.attr('x2', function(link) {return link.target.x;})
					.attr('y2', function(link) {return link.target.y;});}

		});
})(PATHBUBBLES);
