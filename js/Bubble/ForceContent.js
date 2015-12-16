(function($P){
	'use strict';

	$P.Bubble.ForceContent = $P.defineClass(
		$P.HtmlObject,
		function  ForceBubbleContent(config) {
			var self = this;

			$P.HtmlObject.call(self, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});

			self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
			self.svg.main = self.svg.append('g');
			self.layout = config.layout || new $P.PathwayForceLayout();

			if (config.translate || config.scale) {
				self.zoomBase = {
					translate: function() {return config.translate || [0, 0];},
					scale: function() {return config.scale || 1;}};}

			self.pathways = [];
			if (config.pathways) {
				self.setPathways(config.pathways, function() {}, config.viewNotes);}

			self.legendWidth = config.legendWidth || 130;
			self.mode = config.mode || 'split';

			self.updateSvgPosition();

		},
		{
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

				self.layout.nodeList.forEach(function(node) {delete node.displays;});

				function onFinish() {
					$P.state.scene.record({
						type: 'pathway-added',
						id: pathway.pathwayId,
						name: pathway.pathwayName,
						bubble: self});

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
								entity.sourcePathway = pathway.pathwayId;
								if (entity.component_of) {
									entity.subsumed = true;
								}
								self.layout.addNode(entity);});}
						if (jsonData.reactions) {
							$.each(jsonData.reactions, function(reactionId, reaction) {
								reaction.klass = 'reaction';
								reaction.sourcePathway = pathway.pathwayId;
								self.layout.addNode(reaction);});}
						self.layout.data = jsonData;
						self.layout.createForce();
						onFinish();},
					{type: 'GET', data: {
						mode: 'reactome_pathway_id',
						id: pathway.pathwayId}});},

			removePathway: function(pathway) {
				this.pathways = this.pathways.filter(function(element) {
					return element.id != pathway.id;});

				console.log(pathway);
				this.layout.removePathwayNodes(pathway.pathwayId);

				this.onPathwaysChanged();},

			setPathways: function(pathways, finish, viewNotes) {
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
						if (viewNotes) {self.addViewNotes(viewNotes);}
						if (finish) {finish();}}}

				add();},

			onPathwaysChanged: function() {
				var self = this;
				if (self.svg) {self.svg.remove();}
				self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
				self.svg.main = self.svg.append('g').attr('id', 'main');
				self.svg.main.append('rect')
					.attr('width', '100%')
					.attr('height', '100%')
					.attr('fill', 'white');
				self.svg.defs = self.svg.append('defs');

				self.layout.setPathways(self.pathways, function() {
					self.renewDisplay();
					self.updateSvgPosition();});
				self.layout.force.alpha(0.3);},

			addViewNotes: function(viewNotes) {
				var i, layoutId, notes, view, self = this;
				for (i = 0; i < viewNotes.length; ++i) {
					view = this.display.views[i];
					for (layoutId in viewNotes[i]) {
						var text = viewNotes[i][layoutId];
						var element = $P.findFirst(view.entities[0], function(entity) {
							return entity.__data__.layoutId == layoutId;});
						console.log('LAYOUT-ID', layoutId);
						console.log('ELEMENT', element);
						console.log('DATA', element.__data__);
						var note = new $P.NoteFrame({
							w:200, h:100,
							follow: element, followLayoutId: layoutId,
							text: text,
							parent: self.parent});
						view.notes[note.id] = note;}}},

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

			onSearch: function(key) {
				return this.display.onSearch(key);},

			zoomTo: function(entity) {
			  return this.display.zoomTo(entity);},

			layoutPrep: function() {
				if (this.display) {this.display.delete();}
				if (this.display && this.display.viewCount > 0) {
					this.zoomBase = this.display.getZoomBase();}},

			layoutFinish: function() {
				if (!this.display || !this.display.layout || !this.display.layout.force) {return;}
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
					collapsedLocations: this.display && this.display.collapsedLocations,
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
					collapsedLocations: this.display && this.display.collapsedLocations,
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
					collapsedLocations: this.display && this.display.collapsedLocations,
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
					collapsedLocations: this.display && this.display.collapsedLocations,
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
					function(id, state) {self.setNodeTypeHidden(id, !state);});
			},

			setNodeTypeHidden: function(nodeType, hidden) {
				this.display.views.forEach(function(view) {
					view.setNodeTypeHidden(nodeType, hidden);});},

			updateSvgPosition: function() {
				if (this.svg) {
					this.svg.attr('width', this.w - this.legendWidth || 1).attr('height', this.h);}
				if (this.display) {this.display.size = [this.w - this.legendWidth, this.h];}
				if (this.legend) {
					this.legend.select('line').attr('y2', this.h);
					this.legend
						.attr('x', this.w - this.legendWidth)
						.attr('width', this.legendWidth)
						.attr('y', 0)
						.attr('height', this.h);}
			},

			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);},

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

				result.viewNotes = [];
				self.display.views.forEach(function(view) {
					var byLayoutId = {};
					$.each(view.notes, function(_, note) {
						byLayoutId[note.followLayoutId] = note.text;});
					result.viewNotes.push(byLayoutId);});

				var zoomBase = this.display && this.display.getZoomBase();
				if (zoomBase) {
					result.translate = zoomBase.translate();
					result.scale = zoomBase.scale();}

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
