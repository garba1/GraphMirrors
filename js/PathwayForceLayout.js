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
					console.log('DRAGSTART');
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
			locationColors: ['red', 'green', 'blue', 'orange', 'yellow', 'purple', 'teal', 'gray'],
			get mode() {return this._mode;},
			set mode(value) {
				if (value === this._mode) {return;}
				this._mode = value;},
			addNode: function(node) {
				$P.ForceLayout.prototype.addNode.call(this, node);
				if ('entity' === node.klass) {this.onAddEntity(node);}
				if ('reaction' === node.klass) {this.onAddReaction(node);}
				return node;},
			onAddEntity: function(entity) {
				var self = this, node, link;

				entity.charge = -100;

				// Add label.
				node = this.addNode({
					name: entity.name,
					id: entity.id,
					klass: 'entitylabel',
					x: 0, y: 0,
					charge: 0});

				this.addLink({
					source: entity, target: node,
					id: entity.id,
					klass: 'entity:label',
					linkDistance: 5,
					linkStrength: 1.0});

				if ('Complex' === entity.type) {
					entity.components.forEach(function(component) {
						self.applyToNode('entity:' + component, function(component) {
							self.addLink({
								source: entity, target: component,
								id: entity.id + ':' + component.id,
								klass: 'entity:component',
								linkDistance: 30,
								linkStrength: 0.2});});});}

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
							charge: -25,
							x: 0, y: 0};
						this.addNode(node);

						// Add links between locations to separate them.
						this.getNodes('location').forEach(function(other) {
							if (node === other) {return;}
							self.addLink({
								source: node, target: other,
								id: node.id + '|' + other.id,
								klass: 'location:location:',
								linkDistance: 200,
								linkStrength: 0.05});});}
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

							// Mark as being an input or output.
							if ('output' === direction) {entity.is_output = true;}
							if ('input' === direction) {entity.is_input = true;}
						});});}
			},
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
				});
			}
		});
})(PATHBUBBLES);
