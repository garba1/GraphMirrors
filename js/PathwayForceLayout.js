(function($P){
	'use strict';

	$P.PathwayForceLayout = $P.defineClass(
		$P.ForceLayout,
		function PathwayForceLayout(config) {
			var self = this;
			config = config || {};

			$P.ForceLayout.call(this, config);

			/** pathwayId -> [nodeLayoutId] */
			this.pathwayNodes = $P.MultiMap();
			/** entityLayoutId -> [reactionLayoutId] */
			this.entityReactions = $P.MultiMap();
			/** reactionLayoutId -> [entityLayoutId] */
			this.reactionEntities = $P.MultiMap();
			/** paperLayoutId -> [reactionLayoutId] */
			this.paperReactions = $P.MultiMap();

			this.gravity = config.gravity || 0.07;

			this.reactionEdgeCount = 0;
			this._mode = 'none';
			this.drag = this.force.drag()
				.on('dragstart.pathway', function() {
					d3.event.sourceEvent.stopPropagation();})
				.on('drag.pathway', function(d) {
					d.px = d3.event.x;
					d.py = d3.event.y;
					d.stuck = 0.0;
					self.force.alpha(0.05);
					self.force.tick();})
				.on('dragend.pathway', function(d) {
					d.stuck = 1.0;});
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
				if (Array.isArray(node.pathways)) {
					node.pathways = $P.listToSet(node.pathways);}

				var exists = this.getNode(node.layoutId);
				var added = $P.ForceLayout.prototype.addNode.call(this, node, override);
				// If there was an original, update the pathways.
				if (added !== node) {
					$.extend(added.pathways, node.pathways);}
				if (node.sourcePathway) {
					this.pathwayNodes.add(node.sourcePathway, node.layoutId);}
				if (exists) {return exists;}


				if ('entity' === node.klass) {this.onAddEntity(node);}
				if ('reaction' === node.klass) {this.onAddReaction(node);}
				if ('location' === node.klass) {this.onAddLocation(node);}
				if ('paper' === node.klass) {this.onAddPaper(node);}
				return node;},


			onAddEntity: function(entity) {
				var self = this, node, link;

				function nodeSize(target, d) {
					var size = 1;
					return target * size;}

				entity.charge = nodeSize(-200, entity);

				// Add label.
				node = self.addNode({
					name: entity.name,
					id: entity.id,
					klass: 'entitylabel',
					charge: -1});
				self.addLink({
					sourceId: entity.layoutId, targetId: node.layoutId,
					id: entity.id,
					klass: 'entity:label',
					linkDistance: 5,
					linkStrength: 2});

				entity.locations.forEach(function(location) {
					self.addNode({
						name: location,
						id: location,
						klass: 'location',
						color: self.locationColors[self.nextLocationColor++ % self.locationColors.length],
						gravityMultiplier: 0.8,
						charge: -120});
					self.addLink({
						klass: 'entity->location',
						sourceId: entity.layoutId,
						targetId: 'location:' + location,
						linkDistance: 260,
						linkStrength: 1});});},

			onAddReaction: function(reaction) {
				var self = this;
				reaction.charge = -90;

				// Add links to the reaction's entities.
				$.each(reaction.entities || {}, function(entityId, direction) {
					entityId = 'entity:' + entityId;
					var link = self.addLink({
						sourceId: 'input' === direction ? entityId : reaction.layoutId,
						targetId: 'output' === direction ? entityId : reaction.layoutId,
						entity: entityId, reaction: reaction.layoutId,
						klass: 'reaction:entity',
						linkDistance: 30,
						linkStrength: 1,
						id: reaction.id + ':' + entityId});

					self.entityReactions.add(entityId, reaction.layoutId);
					self.reactionEntities.add(reaction.layoutId, entityId);});

				// Add papers to the reaction's entities.
				(reaction.papers || []).forEach(function(paperId) {
					var paperLayoutId = 'paper:' + paperId;
					var paper = self.getNode(paperId);
					if (!paper) {
						paper = self.addNode({
							name: paperId,
							id: paperId,
							klass: 'paper',
							charge: -50});}
					self.addLink({
						sourceId: reaction.layoutId,
						targetId: paperLayoutId,
						klass: 'reaction:paper',
						linkDistance: 40,
						linkStrength: 0.5,
						id: reaction.id + ':' + paperId});
					self.paperReactions.add(paperId, reaction.layoutId);});},

			onAddLocation: function(location) {
				var self = this;
				self.getNodesInClass('location').forEach(function(location2) {
					if (location === location2) {return;}
					/*self.addLink({
						sourceId: location.layoutId,
						targetId: location2.layoutId,
						linkDistance: 500,
						linkStrength: 0.02});*/
				});},

			onAddPaper: function(paper) {},

			removePathwayNodes: function(pathwayId) {
				var self = this;
				console.log('Removing pathway: ', pathwayId);
				self.pathwayNodes.get(pathwayId).forEach(function(nodeLayoutId) {
					console.log('  Removing node: ', nodeLayoutId);
					self.removeNode(nodeLayoutId);});
				self.pathwayNodes.clear(pathwayId);},

			removeNode: function(layoutId) {
				var node = this.getNode(layoutId);
				if (!node) {return null;}
				$P.ForceLayout.prototype.removeNode.call(this, layoutId);
				if (this.getNode(layoutId)) {return null;}

				if ('entity' === node.klass) {this.onRemoveEntity(node);}
				if ('reaction' === node.klass) {this.onRemoveReaction(node);}
				if ('location' === node.klass) {this.onRemoveLocation(node);}
				if ('paper' === node.klass) {this.onRemovePaper(node);}

				return node;},

			onRemoveEntity: function(entity) {
				// Remove Label.
				this.removeNode('entitylabel:' + entity.id);
				this.removeLink('entity:label:' + entity.id);
				// Remove location ?
				if (entity.location) {
					this.removeNode('location:' + entity.location);
					this.removeLink('entity:location:' + entity.location);}},

			onRemoveReaction: function(reaction) {
				var self = this;
				// Remove reaction links.
				$.each(reaction.entities || {}, function(entityId, direction) {
					self.removeLink('reaction:entity:' + reaction.id + ':' +  entityId);
					self.entityReactions.remove('entity:' + entityId, reaction.layoutId);
					self.reactionEntities.remove(reaction.layoutId, 'entity:' + entityId);});
				// Remove paper links.
				(reaction.papers || []).forEach(function(paperId) {
					self.removeNode('paper:' + paperId);
					self.removeLink('reaction:paper:' + reaction.id + ':' +  paperId);
					self.paperReactions.remove(paperId, reaction.layoutId);});},

			onRemoveLocation: function(location) {
				var self = this;
				self.getNodesInClass('location').forEach(function(location2) {
					self.removeLink(location.layoutId + '->' + location2.layoutId);
					self.removeLink(location2.layoutId + '->' + location.layoutId);});},

			onRemovePaper: function(paper) {},

			nodeFilter: function _filter(node) {
				var self = this;
				if ('entity' == node.klass) {
					return !node.subsumed;}
				if ('reaction' == node.klass) {
					var neighbors = self.getNeighbors(node.layoutId).filter(function(layoutId) {
						var neighbor = self.getNode(layoutId);
						if (!neighbor) {return false;}
						return ['entity', 'reaction', 'paper'].indexOf(neighbor.klass) != -1;});
					return neighbors.some(_filter, self);}
				return true;},

			setPathways: function(pathways, finish) {
				this.getNodesInClass('entity').forEach(function(entity) {
					var count = 0;
					pathways.forEach(function(pathway) {
						if (entity.pathways[pathway.pathwayId]) {++count;}});
					entity.crosstalkCount = count;
					entity.gravityMultiplier = Math.max(1, (count - 1) * 3);});
				this.createForce();
				if (finish) {finish();}},

			consolidateReactions: function() {
				var self = this,
						reactions = this.getNodesInClass('reaction'),
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
					if (undefined === node) {return;}
					if (undefined !== data[node.layoutId] && jumpsLeft <= data[node.layoutId]) {return;}

					data[node.layoutId] = jumpsLeft;

					if (jumpsLeft <= 0) {return;}

					if ('entity' === node.klass) {
						self.entityReactions.get(node.layoutId).forEach(function(reaction) {
							f(reaction, jumpsLeft - 1);});}

					else if ('reaction' === node.klass) {
						self.reactionEntities.get(node.layoutId).forEach(function(entityId) {
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
