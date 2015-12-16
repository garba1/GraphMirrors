(function($P){
	'use strict';

	$P.ForceLayout = $P.defineClass(
		null,
		function ForceLayout(config) {
			config = config || {};

			/** layoutId -> node */
			this.nodes = {};
			/** layoutId -> count */
			this.nodeCounts = {};
			/** layoutId -> link */
			this.links = {};
			/** class -> [node] */
			this.nodesByClass = $P.MultiMap();
			/** class -> [link] */
			this.linksByClass = $P.MultiMap();
			/** nodeLayoutId -> [linkLayoutId] */
			this.nodeLinks = $P.MultiMap();

			/** Actual list of nodes used by the force layout. */
			this.nodeList = null;
			/** Actual list of links used by the force layout. */
			this.linkList = null;

			this.size = config.size || [config.width || 500, config.height || 500];
			this.nodeAddTriggers = {};
			this.linkAddTriggers = {};
			if (config.nodes) {this.addNodes(config.nodes, true);}
			if (config.links) {this.addLinks(config.links, true);}

			this.tickListeners = config.tickListeners || [];

			/** timestamp for last change to the layout. */
			this.lastChanged = Date.now();

			/**
			 * Listeners for any kind of change to the layout. Called by
			 * listener(this, this.lastChanged) whenever the timestamp is
			 * updated.
			 */
			this.listeners = config.listeners || [];

			this.shape = config.shape || null;
		},
		{
			/** Grab or create the cached d3 force layout. */
			get force() {
				if (this._force) {return this._force;}
				this.createForce();
				return this._force;},

			/** Filter for nodes to display. */
			nodeFilter: function(node) {return true;},

			/** (Re)Creates the force layout. Use when the underlying data has changed. */
			createForce: function() {
				var self = this;

				// Stop previous force if it exists.
				if (self._force) {self._force.stop();}

				// Create node list.
				self.nodeList = [];
				$.each(self.nodes, function(layoutId, node) {
					if (!self.nodeFilter || self.nodeFilter(node)) {
						self.nodeList.push(node);}});

				if (self.onNodesCreated) {self.onNodesCreated();}

				// Create link list.
				self.linkList = [];
				$.each(self.links, function(layoutId, link) {
					var source = self.getNode(link.sourceId);
					while (source && source.component_of && source.subsumed) {
						link.source_subsumed = true;
						source = self.getNode('entity:' + source.component_of);}
					var target = self.getNode(link.targetId);
					while (target && target.component_of && target.subsumed) {
						link.target_subsumed = true;
						target = self.getNode('entity:' + target.component_of);}
					if (source && target) {
						link.source = source;
						link.target = target;
						self.linkList.push(link);}});

				if (self.onLinksCreated) {self.onLinksCreated();}

				// Create force layout.
				self._force = d3.layout.force();

				// Hack force.alpha to use setTimeout instead of displayCallback
				/*
				var old_alpha = self._force.alpha;
				self._force.alpha = function(x) {
					if (!arguments.length) {return old_alpha.call(this);}

					var old_timer = d3.timer;
					d3.timer = function(callback) {
						function loop() {
							if (!callback()) {
								window.setTimeout(loop, 0);}}
						loop();};
					old_alpha.call(this, x);
					d3.timer = old_timer;
					return this;};
				 */

				self._force
					.nodes(self.nodeList)
					.links(self.linkList)
					.gravity(0)
					.charge(function(node) {
						if (node.charge) {return node.charge;}
						return -30;})
					.on('tick.layout', this.onTick.bind(this))
					.linkStrength(function(link) {
						if (link.linkStrength) {return link.linkStrength;}
						return 1;})
					.linkDistance(function(link) {
						if (link.linkDistance) {return link.linkDistance;}
						return 50;});
				self._force.start();
				self._force.alpha(0);

				var stop = self._force.stop;
				self._force.stop = function() {
					stop.call(this);
					self.onForceStop();};

				self.markChanged();},

			// The [width, height] of the force layout.
			get size() {return this._size;},
			set size(value) {
				if (value === this._size) {return;}
				this._size = value;
				if (this._force) {
					this.force.size(value);}},

			get: function(type, id) {
				if ('node' === type) {return this.getNode(id);}
				if ('link' === type) {return this.getLink(id);}
				return null;},
			add: function(element, override) {
				if ('node' === element.layoutType) {return this.addNode(element, override);}
				if ('link' === element.layoutType) {return this.addLink(element, override);}
				return null;},

			/** Gives an element a layoutId if it needs one. */
			ensureLayoutId: function(element) {
				if (element.layoutId) {return;}
				if ('node' === element.layoutType) {
					element.layoutId = (element.klass || '') + ':' + (element.id || element.name || '');}
				if ('link' === element.layoutType) {
					element.layoutId = element.sourceId + '->' + element.targetId;}},

			getNode: function(layoutId) {return this.nodes[layoutId];},

			/** Get the list of nodes of a given class. */
			getNodesInClass: function(klass) {
				return this.nodesByClass.get(klass);},

			/**
			 * Adds <node> to the layout. If the node already exists and
			 * <override> is true, then it is updated with the new
			 * values. Returns the resulting node object.
			 **/
			addNode: function(node, override) {
				node.layoutType = 'node';
				this.ensureLayoutId(node);
				if (undefined === this.nodeCounts[node.layoutId]) {this.nodeCounts[node.layoutId] = 0;}
				this.nodeCounts[node.layoutId]++;
				var original = this.getNode(node.layoutId);
				if (original) {
					if (override) {
						$.extend(original, node);}
					return original;}

				this.nodes[node.layoutId] = node;
				if (node.klass) {this.nodesByClass.add(node.klass, node);}
				return node;},

			/** add an array of nodes */
			addNodes: function(nodes, override) {
				var self = this;
				nodes.forEach(
					function(node) {self.addNode(node, override);});},

			/** Removes the specified node. Returns the node if it was removed, else null. */
			removeNode: function(layoutId) {
				this.nodeCounts[layoutId]--;
				if (this.nodeCounts[layoutId] > 0) {return null;}
				var node = this.getNode(layoutId);
				if (!node) {return null;}

				delete this.nodes[layoutId];
				if (node.klass) {this.nodesByClass.remove(node.klass, node);}
				return node;},

			getLink: function(layoutId) {return this.links[layoutId];},

			getLinksOfClass: function(klass) {
				return this.linksByClass.get(klass);},

			/**
			 * Adds <link> to the layout. If the link already exists and
			 * <override> is true, then it is updated with the new
			 * values. Returns the resulting link.
			 **/
			addLink: function(link, override) {
				link.layoutType = 'link';
				this.ensureLayoutId(link);
				var original = this.getLink(link.layoutId);
				if (original) {
					if (override) {
						$.extend(original, override);}
					return original;}

				if (!link.sourceId) {throw console.error('Link has no source: ', link);}
				if (!link.targetId) {throw console.error('Link has no target: ', link);}

				this.links[link.layoutId] = link;
				this.nodeLinks.add(link.sourceId, link.layoutId);
				this.nodeLinks.add(link.targetId, link.layoutId);

				if (link.klass) {this.linksByClass.add(link.klass, link);}
				return link;},

			addLinks: function(links, override) {
				var self = this;
				links.forEach(
					function(link) {self.addLink(link, override);});},

			/** Removes the specified link. */
			removeLink: function(layoutId) {
				var link = this.getLink(layoutId);
				if (!link) {return;}

				delete this.links[layoutId];
				this.nodeLinks.remove(link.sourceId, layoutId);
				this.nodeLinks.remove(link.targetId, layoutId);
				if (link.klass) {this.linksByClass.remove(link.klass, link);}},

			// only gets existing neighbors
			getNeighbors: function(nodeLayoutId) {
				var self = this;
				var neighbors = [];
				self.nodeLinks.get(nodeLayoutId).forEach(function(linkLayoutId) {
					var link = self.getLink(linkLayoutId);
					var other = nodeLayoutId === link.sourceId ? link.targetId : link.sourceId;
					if (self.getNode(other)) {neighbors.push(other);}});
				return neighbors;},

			/**
			 * Mark that the layout has changed and notify listeners.
			 */
			markChanged: function() {
				var self = this;
				self.lastChanged = Date.now();
				self.listeners.forEach(function(listener) {listener(self, self.lastChanged);});},

			onTick: function() {
				var self = this;
				self.stretchLinks();
				if (self.force.alpha() < 0.02) {
					self.force.stop();
					self.markChanged();
					return;}

				// Stuck nodes
				self.nodeList.forEach(function(node) {
					if (!node.px2) {node.px2 = node.x;}
					if (!node.py2) {node.py2 = node.x;}
					if (node.stuck <= 0 || !node.stuck) {return;}
					var inv_stuck = 1 - node.stuck;
					node.x = node.stuck * node.px2 + inv_stuck * node.x;
					node.y = node.stuck * node.py2 + inv_stuck * node.y;});

				self.nodeList.forEach(function(node) {
					node.px2 = node.x;
					node.py2 = node.y;
					if (node.stuck > 0) {
						node.stuck -= 0.001;}});

				if (self.shape) {self.shape.onTick(self, self.tickArgument);}
				self.tickListeners.forEach(function(listener) {listener(self, self.tickArgument);});
				self.markChanged();},

			onForceStop: function() {
				var self = this;
				//self.nodeList.forEach(function(node) {node.stuck = 0.0;});
			},

			registerTickListener: function(listener) {
				this.tickListeners.push(listener);},

			registerListener: function(listener) {
				this.listeners.push(listener);},

			// Used to save this object.
			saveCallback: function(save, id) {
				var self = this;
				var result = {};
				save.objects[id] = result;

				result.size = save.save(self.size);
				result.nodes = save.save(self.nodes);
				result.nodeData = save.save(self.nodeData);
				result.links = save.save(self.links);
				result.linkData = save.save(self.linkData);
				result.shape = save.save(self.shape);
				result.alpha = this.force.alpha();

				return id;},

			stretchLinks: function() {
				this.linkList.forEach(function(link) {
					var dx = link.target.x - link.source.x;
					var dy = link.target.y - link.source.y;
					var distance = Math.sqrt(dx*dx+dy*dy);
					if (distance > link.linkDistance * 1.1) {link.linkDistance *= 1.05;}
					if (distance < link.linkDistance * 0.9) {link.linkDistance *= 0.95;}
				});
			}
		});

})(PATHBUBBLES);
