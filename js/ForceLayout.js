(function($P){
	'use strict';

	$P.ForceLayout = $P.defineClass(
		null,
		function ForceLayout(config) {
			config = config || {};
			this.force = d3.layout.force();
			this.nodes = this.force.nodes();
			this.nodeData = config.nodeData || {};
			this.nodeData.indexed = this.nodeData.indexed || {};
			this.links = this.force.links();
			this.linkData = config.linkData || {};
			this.linkData.indexed = this.linkData.indexed || {};
			this.size = config.size || [config.width || 500, config.height || 500];
			this.force.on('tick', this.onTick.bind(this));
			this.nodeAddTriggers = {};
			this.linkAddTriggers = {};
			if (config.nodes) {this.addNodes(config.nodes, true);}
			if (config.links) {this.addLinks(config.links, true);}
			this.tickListeners = config.tickListeners || [];
			this.displayListeners = config.displayListeners || [];
			this.unpositionedNodes = false;
			this.shape = config.shape || null;

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
			this.force.start();
			this.force.alpha(0);
		},
		{
			get size() {return this._size;},
			set size(value) {
				if (value === this._size) {return;}
				this._size = value;
				this.force.size(value);},
			get: function(type, id) {
				if ('node' === type) {return this.getNode(id);}
				if ('link' === type) {return this.getLink(id);}
				return null;},
			add: function(element, override) {
				if ('node' === element.layoutType) {return this.addNode(element, override);}
				if ('link' === element.layoutType) {return this.addLink(element, override);}
				return null;},
			addNode: function(node, override) {
				node.layoutId = node.layoutId || ((node.klass || '') + ':' + (node.id || node.name || ''));
				if (this.nodeData.indexed[node.layoutId]) {
					if (override) {
						this.updateElement(node);}
					return null;}
				this.unpositionedNodes = true;
				node.links = [];
				node.layoutType = 'node';
				this.nodes.push(node);
				this.nodeData.indexed[node.layoutId] = node;
				if (node.klass) {
					this.nodeData[node.klass] = this.nodeData[node.klass] || [];
					this.nodeData[node.klass].push(node);}
				if (this.nodeAddTriggers[node.layoutId]) {
					this.nodeAddTriggers[node.layoutId].forEach(function(callback) {callback(node);});
					delete this.nodeAddTriggers[node.layoutId];}
				return node;},
			updateElement: function(element) {
				var self = this;
				var original = self.get(element.layoutType, element.layoutId);
				if (original === element) {return;}

				function update(target, key, value) {
					if (Array.isArray(value)) {
						target[key] = [];
						value.forEach(function(subvalue, i) {
							update(target[key], i, subvalue);});}
					else if (value && 'object' === typeof value) {
						if (value.layoutType && value.layoutId) {
							var existing = self.get(value.layoutType, value.layoutId);
							if (existing) {
								value = existing;}
							else {
								self.add(value);}
							target[key] = value;}
						else {
							target[key] = {};
							$.each(value, function(subkey, subvalue) {
								update(target[key], subkey, subvalue);});}}
					else {
						target[key] = value;}}

				$.each(element, function(key, value) {
					update(original, key, value);});},
			getNode: function(layoutId) {return this.nodeData.indexed[layoutId];},
			addNodes: function(nodes, override) {
				var self = this;
				nodes.forEach(
					function(node) {self.addNode(node, override);});},
			getNodes: function(klass) {
				if (klass) {
					var list = this.nodeData[klass];
					if (!list) {
						list = [];
						this.nodeData[klass] = list;}
					return list;}
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
				var self = this, node = this.getNode(layoutId), index;
				if (!node) {return false;}
				delete this.nodeData.indexed[layoutId];
				index = this.nodes.indexOf(node);
				this.nodes.splice(index, 1);
				if (node.klass) {
					index = this.nodeData[node.klass].indexOf(node);
					this.nodeData[node.klass].splice(index, 1);}
				node.links.forEach(function(link) {
					if (link && link.layoutId) {
						self.removeLink(link.layoutId);}});
				return true;},
			groupNodes: function(group, layoutIds, remove) {
				var self = this,
						indexed = $P.indexBy(layoutIds, $P.F.Identity);
				if (undefined === remove) {remove = true;}
				group.componentNodes = [];
				self.links.forEach(function(link) {
					self.modifyLink(
						link,
						link.source && indexed[link.source.layoutId] && group,
						link.target && indexed[link.target.layoutId] && group);
					if (group === link.source && group === link.target) {
						self.removeLink(link);}
				});
				layoutIds.forEach(function(layoutId) {
					self.applyToNode(layoutId, function(node) {
						node.grouped_in = group;
						group.componentNodes.push(node);
						if (remove) {self.removeNode(layoutId);}
					});});
				//self.addNode(group);
			},
			modifyLink: function(link, source, target) {
				if (!source && !target) {return;}
				if (source) {
					$P.removeFromList(link.source.links, link);
					link.source = source;
					source.links.push(link);}
				if (target) {
					$P.removeFromList(link.target.links, link);
					link.target = target;
					target.links.push(link);}},
			addLink: function(link, override) {
				if (!link.source || !link.target) {console.error('Illegal Link');}
				link.layoutId = link.layoutId || ((link.klass || '') + ':' + (link.id || link.name || ''));
				link.layoutType = 'link';
				if (this.linkData.indexed[link.layoutId]) {
					if (override) {
						this.updateElement(link);}
					return null;}
				this.links.push(link);
				this.linkData.indexed[link.layoutId] = link;

				if (link.klass) {
					this.linkData[link.klass] = this.linkData[link.klass] || [];
					this.linkData[link.klass].push(link);}
				if (link.source && link.source.layoutId) {
					// Make sure we're not duplicating the node
					if (this.nodeData.indexed[link.source.layoutId]) {
						link.source = this.getNode(link.source.layoutId);}
					// Add this link to the node.
					this.applyToNode(link.source.layoutId, function(node) {node.links.push(link);});}
				if (link.target && link.target.layoutId) {
					if (this.nodeData.indexed[link.target.layoutId]) {
						link.target = this.getNode(link.target.layoutId);}
					this.applyToNode(link.target.layoutId, function(node) {node.links.push(link);});}
				if (this.linkAddTriggers[link.layoutId]) {
					this.linkAddTriggers[link.layoutId].forEach(function(callback) {callback(link);});
					delete this.linkAddTriggers[link.layoutId];}
				return true;},
			removeLink: function(layoutId) {
				var link = this.getLink(layoutId), index;
				if (!link) {console.error('xxxxx'); return;}
				delete this.linkData.indexed[layoutId];
				index = this.links.indexOf(link);
				this.links.splice(index, 1);
				if (link.klass) {
					index = this.linkData[link.klass].indexOf(link);
					this.linkData[link.klass].splice(index, 1);}
				if (link.source && link.source.layoutId) {
					this.applyToNode(link.source.layoutId, function(node) {
						$P.removeFromList(node.links, link);});}
				if (link.target && link.target.layoutId) {
					this.applyToNode(link.target.layoutId, function(node) {
						$P.removeFromList(node.links, link);});}
			},
			getLink: function(layoutId) {return this.linkData.indexed[layoutId];},
			addLinks: function(links, override) {
				var self = this;
				links.forEach(
					function(link) {self.addLink(link, override);});},
			getLinks: function(klass) {
				var links;
				if (klass) {
					links = this.linkData[klass];
					if (!links) {
						links = [];
						this.linkData[klass] = links;}
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
			positionNewNodes: function() {
				if (this.unpositionedNodes) {
					var alpha = this.force.alpha();
					this.force.start();
					this.force.alpha(alpha);
					this.unpositionedNodes = false;}},
			onTick: function() {
				var self = this;
				this.positionNewNodes();
				if (this.shape) {this.shape.onTick(this, self.tickArgument);}
				this.tickListeners.forEach(function(listener) {listener(self, self.tickArgument);});
				this.updateDisplay();},
			registerTickListener: function(listener) {
				this.tickListeners.push(listener);},
			registerDisplayListener: function(listener) {
				this.displayListeners.push(listener);},

			updateDisplay: function() {
				this.displayListeners.forEach(function(listener) {listener(self);});},

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

				return id;}
		});

})(PATHBUBBLES);
