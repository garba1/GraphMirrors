(function($P){
	'use strict';

	$P.ForceLayout = $P.defineClass(
		null,
		function ForceLayout(config) {
			config = config || {};
			this.force = d3.layout.force();
			this.nodes = this.force.nodes();
			this.nodes.indexed = {};
			this.links = this.force.links();
			this.links.indexed = {};
			this.size = [config.width || 500, config.height || 500];
			this.force.on('tick', this.onTick.bind(this));
			if (config.nodes) {this.addNodes(config.nodes);}
			if (config.links) {this.addLinks(config.links);}
			this.tickListeners = config.tickListeners || [];
			this.changeListeners = config.changeListeners || [];
			this.needsUpdate = false;
			this.shape = config.shape || null;
			this.nodeAddTriggers = {};
			this.linkAddTriggers = {};

			this.force
				.gravity(0)
				.charge(function(node) {
					if (node.charge) {return node.charge;}
					return -30;})
				.linkStrength(function(link) {
					if (link.linkStrength) {return link.linkStrength;}
					return 1;})
				.linkDistance(function(link) {
					if (link.linkDistance) {return link.linkDistance;}
					return 50;});
		},
		{
			get size() {return this._size;},
			set size(value) {
				if (value === this._size) {return;}
				this._size = value;
				this.force.size(value);},
			addNode: function(node) {
				this.needsUpdate = true;
				node.layoutId = node.layoutId || ((node.klass || '') + ':' + (node.id || node.name || ''));
				if (this.nodes.indexed[node.layoutId]) {return false;}
				node.links = [];
				this.nodes.push(node);
				this.nodes.indexed[node.layoutId] = node;
				if (node.klass) {
					this.nodes[node.klass] = this.nodes[node.klass] || [];
					this.nodes[node.klass].push(node);}
				if (this.nodeAddTriggers[node.layoutId]) {
					this.nodeAddTriggers[node.layoutId].forEach(function(callback) {callback(node);});
					delete this.nodeAddTriggers[node.layoutId];}
				return true;},
			getNode: function(layoutId) {return this.nodes.indexed[layoutId];},
			addNodes: function(nodes) {this.nodes.forEach(this.addNode.bind(this));},
			getNodes: function(klass) {
				if (klass) {return this.nodes[klass];}
				return this.nodes;},
			// Applies function to the node immediately if it's present,
			// otherwise it is applied when the node is added.
			applyToNode: function(layoutId, callback) {
				var triggers, node;

				node = this.getNode(layoutId);
				if (node) {
					callback(node);
					return;}

				triggers = this.nodeAddTriggers[layoutId];
				if (undefined === triggers) {
					triggers = [];
					this.nodeAddTriggers[layoutId] = triggers;}
				triggers.push(callback);},
			removeNode: function(layoutId) {
				var node = this.getNode(layoutId), index;
				if (!node) {return;}
				delete this.nodes.indexed[layoutId];
				index = this.nodes.indexOf(node);
				this.nodes.splice(index, 1);
				if (node.klass) {
					index = this.nodes[node.klass].indexOf(node);
					this.nodes[node.klass].splice(index, 1);}},
			groupNodes: function(group, layoutIds) {
				var self = this,
						indexed = $P.indexBy(layoutIds, $P.F.Identity),
						links;
				group.componentNodes = [];
				self.links.forEach(function(link) {
					if (indexed[link.source.layoutId]) {
						$P.removeFromList(link.source.links, link);
						link.source = group;}
					if (indexed[link.target.layoutId]) {
						$P.removeFromList(link.target.links, link);
						link.target = group;}
					if (group === link.source && group === link.target) {
						self.removeLink(link);}
				});
				layoutIds.forEach(function(layoutId) {
					self.applyToNode(layoutId, function(node) {
						node.grouped_in = group;
						group.componentNodes.push(node);
						self.removeNode(layoutId);});});
				//self.addNode(group);
			},
			addLink: function(link) {
				if (this.links.indexed[link.id]) {return false;}
				this.needsUpdate = true;
				link.layoutId = link.layoutId || ((link.klass || '') + ':' + (link.id || link.name || ''));
				this.links.push(link);
				this.links.indexed[link.layoutId] = link;
				if (link.klass) {
					this.links[link.klass] = this.links[link.klass] || [];
					this.links[link.klass].push(link);}
				if (link.source && link.source.layoutId) {
					this.applyToNode(link.source.layoutId, function(node) {node.links.push(link);});}
				if (link.target && link.target.layoutId) {
					this.applyToNode(link.target.layoutId, function(node) {node.links.push(link);});}
				if (this.linkAddTriggers[link.layoutId]) {
					this.linkAddTriggers[link.layoutId].forEach(function(callback) {callback(link);});
					delete this.linkAddTriggers[link.layoutId];}
				return true;},
			removeLink: function(layoutId) {
				var link = this.getLink(layoutId), index;
				if (!link) {return;}
				delete this.links.indexed[layoutId];
				index = this.links.indexOf(link);
				this.links.splice(index, 1);
				if (link.klass) {
					index = this.links[link.klass].indexOf(link);
					this.links[link.klass].splice(index, 1);}},
			getLink: function(layoutId) {return this.links.indexed[layoutId];},
			addLinks: function(links) {this.links.forEach(this.addLink.bind(this));},
			getLinks: function(klass) {
				var links;
				if (klass) {
					links = this.links[klass];
					if (!links) {
						links = [];
						this.links[klass] = links;}
					return links;}
				return null;},
			// Applies function to the link immediately if it's present,
			// otherwise it is applied when the link is added.
			applyToLink: function(layoutId, callback) {
				var triggers, link;

				link = this.getLink(layoutId);
				if (link) {
					callback(link);
					return;}

				triggers = this.linkAddTriggers[layoutId];
				if (undefined === triggers) {
					triggers = [];
					this.linkAddTriggers[layoutId] = triggers;}
				triggers.push(callback);},
			doTicks: function(count, listenerArg) {
				var i;
				this.tickArgument = listenerArg;
				for (i = 0; i < count; ++i) {this.force.tick();}
				this.tickArgument = null;},
			onTick: function() {
				var self = this;
				if (this.shape) {this.shape.onTick(this);}
				this.tickListeners.forEach(function(listener) {listener(self, self.tickArgument);});},
			registerTickListener: function(listener) {
				this.tickListeners.push(listener);}
		});

})(PATHBUBBLES);
