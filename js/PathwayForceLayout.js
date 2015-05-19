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
			//locationColors: ['red', 'green', 'blue', 'orange', 'yellow', 'purple', 'teal', 'gray'],
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
			addNode: function(node) {
				if (!$P.ForceLayout.prototype.addNode.call(this, node)) {return null;}
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

				entity.charge = nodeSize(-100, entity);
				entity.reactions = [];

				// Add label.
				node = this.addNode({
					name: entity.name,
					id: entity.id,
					klass: 'entitylabel',
					x: 0, y: 0,
					charge: 0});
				if (node) {
					this.addLink({
						source: entity, target: node,
						id: entity.id,
						klass: 'entity:label',
						linkDistance: 5,
						linkStrength: 1.0});}

				/*
				if ('Complex' === entity.type) {
					entity.components.forEach(function(component) {
						self.applyToNode('entity:' + component, function(component) {
							self.addLink({
								source: entity, target: component,
								id: entity.id + ':' + component.id,
								klass: 'entity:component',
								linkDistance: 30,
								linkStrength: 0.2});});});}
				 */

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
							gravityMultiplier: 3,
							charge: -120,
							x: 0, y: 0};
						this.addNode(node);

						// Add links between locations to separate them.
						/*
						this.getNodes('location').forEach(function(other) {
							if (node === other) {return;}
							self.addLink({
								source: node, target: other,
								id: node.id + '|' + other.id,
								klass: 'location:location:',
								linkStrength: 0.01});});
						var count = this.getNodes('location').length;
						this.getLinks('location:location').forEach(function(link) {
							link.linkDistance = 50 + 15 * count;});
						 */
					}

					node.entities.push(entity);

					// Add link from location to entity.
					link = {
						source: entity, target: node,
						id: entity.id,
						klass: 'entity:location',
						linkDistance: 40,
						linkStrength: 0.2};
					this.addLink(link);}},
			onAddReaction: function(reaction) {
				var self = this;
				reaction.charge = -40;
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
								reactions: [reaction],
								x: 0, y: 0};
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
			/*removeNode: function(layoutId) {
				var node = this.getNode(layoutId);
				if (!$P.ForceLayout.prototype.removeNode.call(this, layoutId)) {return;};
				if ('entity' === node.klass) {
					this.removeNode('entitylabel:' + this.id);
					this.removeLink('entity:location:' + this.id);
					this.removeLink('entity:label:' + this.id);}},*/
			addLink: function(link) {
				$P.ForceLayout.prototype.addLink.call(this, link);
				return link;},
			setPathways: function(pathways) {
				this.getNodes('entity').forEach(function(entity) {
					var count = 0;
					pathways.forEach(function(pathway) {
						if (entity.pathways[pathway.id]) {++count;}});
					entity.crosstalkCount = count;
					entity.gravityMultiplier = Math.max(1, (count - 1) * 5);
				});},
			consolidateComposite: function() {
				var self = this;
				self.getNodes('entity').forEach(function(entity) {
					var components = [];
					if (entity.components) {
						$.each(entity.components, function(component_id, component_type) {
							components.push('entity:' + component_id);});
						self.groupNodes(entity, components);
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
					self.groupNodes(first, rest);});
			}
		});
})(PATHBUBBLES);
