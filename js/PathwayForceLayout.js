(function($P){
	'use strict';

	$P.PathwayForceLayout = $P.defineClass(
		$P.ForceLayout,
		function PathwayForceLayout(config) {
			var self = this;
			$P.ForceLayout.call(this, config);
			this.reactionEdgeCount = 0;
			this._mode = 'none';
			this.drag = this.force.drag()
				.on('dragstart', function() {
					d3.event.sourceEvent.stopPropagation();})
				.on('drag.force', function(d) {
					d.px = d3.event.x;
					d.py = d3.event.y;
					self.force.alpha(0.05);
					self.force.tick();
					//self.force.alpha(0);
				});
			this.nextLocationColor = 0;
		},
		{
			locationColors: [
				'#8dd3c7',
				'#ffffb3',
				'#bebada',
				'#fb8072',
				'#80b1d3',
				'#fdb462',
				'#b3de69',
				'#fccde5',
				'#d9d9d9',
				'#bc80bd',
				'#ccebc5',
				'#ffed6f'],
			get mode() {return this._mode;},
			set mode(value) {
				if (value === this._mode) {return;}
				this._mode = value;},
			addNode: function(node, override) {
				if (!$P.ForceLayout.prototype.addNode.call(this, node, override)) {return null;}
				if ('entity' === node.klass) {this.onAddEntity(node);}
				if ('reaction' === node.klass) {this.onAddReaction(node);}
				if ('paper' === node.klass) {this.onAddPaper(node);}
				return node;},
			onAddPaper: function(paper) {

			},
			onAddEntity: function(entity) {
				var self = this, node, link;

				function nodeSize(target, d) {
					var size = 1;
					if (d.componentNodes && d.componentNodes.length) {
						size = Math.pow(d.componentNodes.length, 0.4);}
					return target * size;}

				entity.charge = nodeSize(-200, entity);
				entity.reactions = [];

				// Add label.
				node = this.addNode({
					name: entity.name,
					id: entity.id,
					klass: 'entitylabel',
					charge: 0});
				if (node) {
					this.addLink({
						source: entity, target: node,
						id: entity.id,
						klass: 'entity:label',
						linkDistance: 5,
						linkStrength: 1.0});}

				if (entity.location) {
					// Ensure Location.
					node = this.getNode('location:' + entity.location);
					if (!node) {
						node = {
							name: entity.location,
							id: entity.location,
							klass: 'location',
							entities: [],
							color: self.locationColors[self.nextLocationColor++ % self.locationColors.length],
							gravityMultiplier: 1.2,
							charge: -90};
						self.addNode(node);

						// Inter-location links for positioning.
						self.getNodes('location').forEach(function(location) {
							if (node === location) {return;}
							self.addLink({
								source: location,
								target: node,
								linkDistance: 1000,
								linkStrength: 0.02
							});
						});
					}

					node.entities.push(entity);

					// Add link from location to entity.
					link = {
						source: entity, target: node,
						id: entity.id,
						klass: 'entity:location',
						linkDistance: 40,
						linkStrength: 0.6};
					this.addLink(link);}},
			onAddReaction: function(reaction) {
				var self = this;
				reaction.charge = -90;
				if (reaction.entities) {
					// Add links to entities.
					$.each(reaction.entities, function(entityId, direction) {
						var link;
						var entity = self.getNode();
						self.applyToNode('entity:' + entityId, function(entity) {
							link = {
								source: direction === 'input' ? entity : reaction,
								target: direction === 'input' ? reaction : entity,
								reaction: reaction,
								entity: entity,
								klass: 'reaction:entity',
								linkDistance: 30,
								linkStrength: 1,
								id: self.reactionEdgeCount++};
							self.addLink(link);

							if (!entity.reactions) {entity.reactions = [];}
							entity.reactions.push(reaction);

							// Mark as being an input or output.
							if ('output' === direction) {entity.is_output = true;}
							if ('input' === direction) {entity.is_input = true;}
						});});}
				if (reaction.papers) {
					reaction.papers.forEach(function(paper_id) {
						var node, link;
						node = self.getNode('paper:' + paper_id);
						if (!node) {
							node = {
								name: paper_id,
								id: paper_id,
								klass: 'paper',
								charge: -50,
								reactions: [reaction]};
							self.addNode(node);}
						else {
							node.reactions.push(reaction);}
						link = {
							source: reaction,
							target: node,
							klass: 'reaction:paper',
							linkDistance: 40,
							linkStrength: 0.5,
							id: self.reactionEdgeCount++};
						self.addLink(link);
					});}
			},
			setPathways: function(pathways, finish) {
				this.getNodes('entity').forEach(function(entity) {
					var count = 0;
					pathways.forEach(function(pathway) {
						if (entity.pathways[pathway.pathwayId]) {++count;}});
					entity.crosstalkCount = count;
					entity.gravityMultiplier = Math.max(1, (count - 1) * 50);});
				if (finish) {finish();}},
			consolidateComposite: function() {
				var self = this;
				self.getNodes('entity').forEach(function(entity) {
					var components = [];
					if (entity.components) {
						$.each(entity.components, function(component_id, component_type) {
							components.push('entity:' + component_id);});
						self.groupNodes(entity, components, false);
						self.getLinks('entity:location')
							.filter(function(link) {return link.source === entity || link.target === entity;})
							.slice(1).forEach(function(link) {self.removeLink(link.layoutId);});}
				});},
			consolidateReactions: function() {
				var self = this,
						reactions = this.getNodes('reaction'),
						consolidated = $P.MultiMap();
				function hash(reaction) {
					var value = [];
					Object.keys(reaction.entities).sort().forEach(function(key) {
						value.push(key);
						value.push(reaction.entities[key]);});
					return value.join('|');}
				reactions.forEach(function(reaction) {
					consolidated.add(hash(reaction), reaction);});
				consolidated.forEach(function(hash, reactions) {
					var first = reactions.splice(0, 1)[0],
							rest = reactions.map($P.getter('layoutId'));
					self.groupNodes(first, rest, false);});
			},

			getAdjacentNodes: function(node, jumps) {
				var self = this;
				var data = {};

				function f(node, jumpsLeft) {
					if (undefined !== data[node.layoutId] && jumpsLeft <= data[node.layoutId]) {return;}

					data[node.layoutId] = jumpsLeft;

					if (jumpsLeft <= 0) {return;}

					if ('entity' === node.klass) {
						node.reactions.forEach(function(reaction) {
							f(reaction, jumpsLeft - 1);});}

					else if ('reaction' === node.klass) {
						Object.keys(node.entities).forEach(function(entityId) {
							f(self.getNode('entity:' + entityId), jumpsLeft - 1);});}
				}

				f(node, jumps);

				return data;}});

	$P.PathwayForceLayout.loader = function(load, id, data) {
		var config = {};
		config.size = load.loadObject(data.size);
		config.nodes = load.loadObject(data.nodes);
		config.links = load.loadObject(data.links);
		config.shape = load.loadObject(data.shape);
		config.alpha = data.alpha;

		var layout = new $P.PathwayForceLayout(config);

		return layout;};

})(PATHBUBBLES);
