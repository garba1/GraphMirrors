(function($P){
	'use strict';

	$P.PathwayForceView = $P.defineClass(
		$P.ForceView,
		function PathwayForceView(config) {
			var nodes, links,
					self = this,
					textTransform;

			$P.ForceView.call(self, config);

			self.textTransform = self.shape.textTransform(self);

			if (config.displayArgument) {
				if ('pathway' === config.displayArgument.type) {
					self.pathway = config.displayArgument;}
				else if ('pathways' === config.displayArgument.type) {
					self.pathways = config.displayArgument.list;}}

			function nodeSize(target) {
				return function(d) {return target * 1.5;};
				return function(d) {
					var size = 1;
					if (d.componentNodes && d.componentNodes.length) {
						size = Math.pow(d.componentNodes.length, 0.4);}
					return target * size;};}
			self.nodeSize = nodeSize;

			function nodeTitle(d) {
				var title = d.name;
				if (d.componentNodes) {
					title = [d.name, ':'];
					d.componentNodes.forEach(function(node) {
						if (!node || !node.name) {return;}
						title.push('\n');
						title.push(node.name);});
					title = title.join('');}
				return title;}

			function entityFilter1(node) {
				if ('entity' !== node.klass) {return false;}
				if (node.reactions && node.reactions.length > 0) {return true;}
				if (node.componentNodes && $P.or(node.componentNodes, entityFilter1)) {return true;}
				return false;}

			function entityFilter2(node) {
				var i, j, reaction, entities, entity;
				if (node.reactions) {
					for (i = 0; i < node.reactions.length; ++i) {
						reaction = node.reactions[i];
						entities = Object.keys(reaction.entities);
						for (j = 0; j < entities.length; ++j) {
							entity = self.visibleEntities1.indexed['entity:'+entities[j]];
							if (entity && self.inPathway(entity)) {return true;}}}}
				if (!node.pathways || node.pathways[parseInt(self.pathway.id)]) {return true;}
				return false;}

			function diminishedEntityFilter(node) {
				return !self.visibleEntities.indexed[node.layoutId];}

			function entitylabelFilter(node) {
				if ('entitylabel' !== node.klass) {return false;}
				return self.visibleEntities.indexed['entity:'+node.id];}

			function reactionFilter(node) {
				var i, entities;
				if ('reaction' !== node.klass) {return false;}
				entities = Object.keys(node.entities);
				for (i = 0; i < entities.length; ++i) {
					if (self.visibleEntities1.indexed['entity:'+entities[i]]) {
						return true;}}
				return false;}

			function locationFilter(node) {
				if ('location' !== node.klass) {return false;}
				return $P.or(self.visibleEntities, function(entity) {return entity.location === node.id;});}

			function paperFilter(node) {
				var i;
				if ('paper' !== node.klass) {return false;}
				for (i = 0; i < node.reactions.length; ++i) {
					if (self.visibleReactions.indexed[node.reactions[i].layoutId]) {return true;}}
				return false;}

			function isNodeVisible(node) {
				if (!node) {return false;}
				var id = node.layoutId;
				return self.visibleEntities.indexed[id]
					|| self.visibleEntitylabels.indexed[id]
					|| self.visibleReactions.indexed[id]
					|| self.visibleLocations.indexed[id]
					|| self.visiblePapers.indexed[id];}

			$P.a=self;

			self.visibleEntities1 = self.layout.nodes.filter(entityFilter1);
			self.visibleEntities1.indexed = $P.indexBy(self.visibleEntities1, $P.getter('layoutId'));
			self.visibleReactions = self.layout.nodes.filter(reactionFilter);
			self.visibleReactions.indexed = $P.indexBy(self.visibleReactions, $P.getter('layoutId'));
			self.visibleEntities = self.visibleEntities1.filter(entityFilter2);
			self.visibleEntities.indexed = $P.indexBy(self.visibleEntities, $P.getter('layoutId'));
			self.diminishedEntities = self.visibleEntities1.filter(diminishedEntityFilter);
			self.diminishedEntities.indexed = $P.indexBy(self.diminishedEntities, $P.getter('layoutId'));
			self.visibleEntitylabels = self.layout.nodes.filter(entitylabelFilter);
			self.visibleEntitylabels.indexed = $P.indexBy(self.visibleEntitylabels, $P.getter('layoutId'));
			self.visibleLocations = self.layout.nodes.filter(locationFilter);
			self.visibleLocations.indexed = $P.indexBy(self.visibleLocations, $P.getter('layoutId'));
			self.visiblePapers = self.layout.nodes.filter(paperFilter);
			self.visiblePapers.indexed = $P.indexBy(self.visiblePapers, $P.getter('layoutId'));
			self.visibleNodes = [].concat(self.visibleEntities, self.visibleEntitylabels, self.visibleReactions, self.visibleLocations, self.visiblePapers, self.diminishedEntities);

			self.visibleLinks = self.layout.links.filter(function(link) {
				//if (link.klass === 'entity:label') {console.log(link, link.source, link.target, isNodeVisible(link.source),  isNodeVisible(link.target));}
				return link.source && link.target && isNodeVisible(link.source) && isNodeVisible(link.target);});

			self.drawBackground = self.element.append('g').attr('class', 'layer').attr('pointer-events', 'none');

			self.links = self.element.selectAll('.link').data(self.visibleLinks)
				.enter().append('g').attr('class', 'link');
			self.nodes = self.element.selectAll('.node').data(self.visibleNodes)
				.enter().append('g').attr('class', 'node');
			self.nodes.call(self.layout.drag);

			self.locations = self.nodes.filter(function(d, i) {return 'location' === d.klass;});
			self.locations.append('circle')
				.attr('stroke', 'black')
				.attr('fill', $P.getter('color'))
				.attr('r', 40)
				.append('title').text(function(d) {return d.name;});
			self.locations.append('text')
				.style('font-size', '15px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));
			self.reactionLinks = self.links.filter(
				function(d, i) {return 'reaction:entity' === d.klass;});
			// For some weird reason the stroke is being displayed as
			// white-ish, even though it's set to these values at the time
			// of display. As a temporary fix make opacity and width 0.
			self.reactionLinks.append('path')
				.attr('stroke', 'black')
				.attr('stroke-width', 0)
				.attr('stroke-opacity', 0)
				.attr('fill', 'black')
				.attr('source-width', 5)
				.attr('target-width', 1)
				.attr('opacity', 0.3);
			/*
			self.componentLinks = self.links.filter(
				function(d, i) {return 'entity:component' === d.klass;});
			self.componentLinks.notOutput = self.componentLinks.filter(
				function(d, i) {return !d.is_output;});
			self.componentLinks.output = self.componentLinks.filter(
				function(d, i) {return d.is_output;});
			self.componentLinks.notOutput.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 2);
			self.componentLinks.output.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1);
			 */
			self.locationLinks = self.links.filter(
				function(d, i) {return 'entity:location' === d.klass;});
			self.locationLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 0.5)
				.attr('fill', 'none');
			self.paperLinks = self.links.filter(
				function(d, i) {return 'reaction:paper' === d.klass;});
			self.paperLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 0.9)
				.attr('fill', 'none');
			self.papers = self.nodes.filter(function(d, i) {return 'paper' === d.klass;});
			self.papers.append('polygon')
				.attr('points', '5,4 -5,4 0,-5.5')
				.style('stroke', 'black')
				.style('fill', 'cyan')
				.attr('pointer-events', 'all')
				.on('mouseover', function(d) {
					var node = this;
					node.text = node.text || 'Loading PMID ' + d.id + ' ...';

					node.onTick = function(d, i) {
						if (!this.displayElement) {return;}
						var rect = this.getBoundingClientRect();
						this.displayElement.move(
							(rect.left + rect.right) * 0.5 + $P.state.scrollX + 5,
							(rect.top + rect.bottom) * 0.5 - 50 + 5,
							350,
							300);
						if (self.parentBubble.contains(this.displayElement.x, this.displayElement.y)) {
							$(this.displayElement.element).show();}
						else {
							$(this.displayElement.element).hide();}};

					if (!node.sentences) {
						node.sentences = true;
						$P.rlimsp.getTextEvidence(d.id, function(data) {
							if (null === data) {
								node.sentences = false;
								return;}
							var text = '';
							text += '<ol>';
							data.sentenceArray.forEach(function(sentence) {
								text += '<li>' + sentence.sentence + '</li>';});
							text += '</ol>';
							text += '<b>Authors:</b> ' + data.authors + '<br/>';
							text += '<b>Publication:</b> ' + data.publication + '<br/>';
							node.text = text;
							if (node.displayElement) {
								node.displayElement.element.innerHTML = node.text;}});}

					if (!node.displayElement) {
						function display() {
							var rect = node.getBoundingClientRect();
							node.displayElement = new $P.HtmlObject({
								parent: '#bubble',
								before: '#overlayCanvas',
								type: 'div',
								class: 'frame',
								pointer: null,
								objectConfig: {
									x: (rect.left + rect.right) * 0.5 + $P.state.scrollX + 5,
									y: (rect.top + rect.bottom) * 0.5 - 50 + 5,
									w: 300,
									h: 300}});
							if (node.lockTooltip) {
								$(node.displayElement.element).addClass('pinned');}
							node.displayElement.ignoreH = true;
							node.displayElement.translate();
							node.displayElement.element.innerHTML = node.text;
							self.parentBubble.add(node.displayElement);
							d3.select(node.displayElement.element)
								.on('click', function() {
									node.displayElement.delete();
									d3.event.preventDefault();})
								.on('contextmenu', function() {
									d3.event.preventDefault();
									self.parentBubble.parent.add(new $P.IFrameBubble({
										w: 1200,
										h: 600,
										url: 'http://research.bioinformatics.udel.edu/rlimsp/view.php?s=1225&abs=0#EvidenceView?pmid=' + d.id
									}));});
						}
						node.displayTimer = window.setTimeout(display, 150);}})
				.on('mouseleave', function(d, i) {
					if (this.lockTooltip) {return;}
					if (this.displayTimer) {
						window.clearTimeout(this.displayTimer);
						this.displayTimer = null;}
					if (this.displayElement) {
						this.displayElement.delete();
						this.displayElement = null;}
				})
				.on('click', function(d, i) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					this.lockTooltip = !this.lockTooltip;
					if (this.displayElement) {
						if (this.lockTooltip) {
							$(this.displayElement.element).addClass('pinned');}
						else {
							$(this.displayElement.element).removeClass('pinned');}}})
				.on('contextmenu', function(d) {
					$P.state.scene.record({
						type: 'force-right-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);
					self.parentBubble.parent.add(new $P.IFrameBubble({
						w: 1200,
						h: 600,
						url: 'http://research.bioinformatics.udel.edu/rlimsp/view.php?s=1225&abs=0#EvidenceView?pmid=' + d.id
					}));
				});
				//.append('title').text(function(d) {
				//	return 'PMID: ' + d.id + '  (loading...)';});
			self.reactions = self.nodes.filter(function(d, i) {return 'reaction' === d.klass;});
			self.reactions.standard = self.reactions.filter(function(d, i) {return 'standard' === d.type;});
			self.reactions.phosphorylated = self.reactions.filter(function(d, i) {return 'phosphorylation' === d.type;});
			self.reactions.standard.append('rect')
				.attr('stroke', 'black')
				.attr('fill', 'red')
				.attr('width', nodeSize(5)).attr('height', nodeSize(5))
				.attr('x', nodeSize(-2.5)).attr('y', nodeSize(-2.5))
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.reactions.phosphorylated.append('rect')
				.attr('stroke', 'black')
				.attr('fill', 'blue')
				.attr('width', nodeSize(5)).attr('height', nodeSize(5))
				.attr('x', nodeSize(-2.5)).attr('y', nodeSize(-2.5))
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			self.entities.diminished = self.entities.filter(function(d, i) {
				return !self.inPathway(d);});
			self.entities.visible = self.entities.filter(function(d, i) {
				return self.inPathway(d);});
			self.entities.proteins = self.entities.visible.filter(function(d, i) {
				var type = d.type && d.type.toLowerCase();
				return 'protein' == type;});
			self.entities.proteins.composite = self.entities.proteins.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.crosstalking = self.entities.proteins.filter(
				function(d, i) {return d.crosstalkCount > 1;});
			self.entities.small = self.entities.visible.filter(function(d, i) {
				return 'SmallMolecule' === d.type
					|| 'Rna' === d.type
					|| 'Dna' === d.type;});
			self.entities.complex = self.entities.visible.filter(
				function(d, i) {return 'Complex' == d.type;});
			self.entities.complex.composite = self.entities.complex.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.other = self.entities.visible.filter(
				function(d, i) {
					return 'Complex' !== d.type
						&& 'SmallMolecule' !== d.type
						&& 'Protein' !== d.type && 'protein' !== d.type;});
			// The big transparent background circles encoding location.
			self.entities.other.composite = self.entities.other.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.small.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.complex.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.other.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			// Nodes in the pathway.
			// An extra box indicating crosstalk.
			self.entityBackgrounds();
			// The main circle.
			self.entities.diminished
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', 'gray')
				.attr('width', nodeSize(4)).attr('height', nodeSize(4))
				.attr('x', nodeSize(-1.5)).attr('y', nodeSize(-1.5))
				.attr('rx', nodeSize(3)).attr('ry', nodeSize(3))
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						diminished: true,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.entities.proteins
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(12)).attr('height', nodeSize(8))
				.attr('x', nodeSize(-6)).attr('y', nodeSize(-4))
				.attr('rx', nodeSize(3)).attr('ry', nodeSize(3))
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.entities.proteins.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';
				})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			// Small Molecules.
			self.entities.small
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', nodeSize(5))
				.attr('x', nodeSize(-2.5))
				.attr('y', nodeSize(-2.5))
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			// Complex.
			self.entities.complex
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform + 'rotate(45)')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);

			// Other
			self.entities.other
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform)
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.append('title').text(nodeTitle);

			self.entityLabels = self.nodes.filter(
				function(d, i) {return 'entitylabel' === d.klass;});
			self.entityLabels.append('text')
				.style('font-size', '12px')
				.attr('text-anchor', 'middle')
				.attr('fill', 'black')
				.attr('transform', self.shape.textTransform(self))
				.attr('pointer-events', 'none')
				.text($P.getter('name'));
			self.entityLabelLinks = self.links.filter(
				function(d, i) {return 'entity:label' === d.klass;});
			self.entityLabelLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.2)
				.attr('fill', 'none');

			self.nameLabel = self.pathway ? self.pathway.name : '';
			self.label = self.root.append('g');
			self.label.back = self.label.append('rect')
				.style('stroke', 'black')
				.style('stroke-width', 2)
				.style('opacity', self.pathway ? 0.6 : 0)
				.style('fill', self.pathway && self.pathway.color);
			self.label.text = self.label.append('text')
				.style('font-size', '14px')
				.style('font-weight', 'bold')
				.style('stroke-width', 1)
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('opacity', 1.0)
				.text(self.nameLabel);
		},
		{
			inPathway: function(node) {
				if (!this.pathway && !this.pathways) {return true;}

				if ('entity' === node.klass) {
					if (!node.pathways) {return true;}
					function check(pathway) {
						return node.pathways[parseInt(pathway.id)];}
					if (this.pathway && check(this.pathway)) {return true;}
					if (this.pathways && this.pathways.some(check)) {return true;}
					return false;}

				else if ('reaction' === node.klass) {
					// TODE implement
					return true;}

				return false;},

			activePathways: function(node) {
				var pathways = [];
				if (!this.pathway && !this.pathways) {return pathways;}

				if ('entity' === node.klass) {
					if (!node.pathways) {return pathways;}
					if (this.pathway && node.pathways[parseInt(this.pathway.id)]) {
						pathways.push(this.pathway);}
					if (this.pathways) {
						this.pathways.forEach(function(pathway) {
							if (node.pathways[parseInt(pathway.id)]) {
								pathways.push(pathway);}});}}

				return pathways;},

			getExpression: function(node) {
				if (this.pathway) {
					return this.pathway.expression[node.name];}
				if (this.pathways) {
					return $P.or(this.pathways, function(pathway) {
						return pathway.expression[node.name];});}
				return null;},

			getExpressionColor: function(node) {
				var expression = this.getExpression(node);
				if ('up' === expression) {return '#CCCC00';}
				if ('down' === expression) {return '#0000CC';}
				return 'white';},
			onShapeChange: function() {
				$P.ForceView.prototype.onShapeChange.call(this);
				if (this.label) {
					var center = this.shape.getLabelPosition(this, 14),
							angle = center.rotation || 0,
							font = Math.min(14, center.length / this.nameLabel.length * 1.5);

					this.label.attr('transform', 'translate(' + center.x + ',' + center.y + ')rotate(' + angle + ')');
					this.label.back
						.attr('width', (center.length + 4) + 'px')
						.attr('x', (-center.length / 2 - 2) + 'px')
						.attr('height', (font + 4) + 'px')
						.attr('y', (-font / 2 - 2) + 'px');
					this.label.text.style('font-size', font + 'px');}
			},

			delete: function() {
				$P.ForceView.prototype.delete.call(this);
				this.label.remove();
			},

			entityBackgrounds: function() {
				this.entities.proteins.crosstalking
					.append('rect')
					.attr('stroke', 'black')
					.attr('fill', 'gray')
					.attr('transform', this.textTransform)
					.attr('width', this.nodeSize(14)).attr('height', this.nodeSize(10))
					.attr('x', this.nodeSize(-7)).attr('y', this.nodeSize(-5))
					.attr('rx', this.nodeSize(3)).attr('ry', this.nodeSize(3));}

		});
})(PATHBUBBLES);
