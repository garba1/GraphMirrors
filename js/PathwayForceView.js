(function($P){
	'use strict';

	$P.PathwayForceView = $P.defineClass(
		$P.ForceView,
		function PathwayForceView(config) {
			var nodes, links,
					self = this,
					textTransform;

			$P.ForceView.call(self, config);

			self.hiddenNodeTypes = {paper: true, small: true};
			self.highlights = {};
			self.notes = {};

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
				var title = [];
				function print(node, prefix) {
					if (!node || !node.name) {return;}
					title.push(prefix);
					title.push(node.name);
					if (node.components) {
						title.push(':\n');
						prefix = prefix + '  ';
						self.getComponents(node).forEach(function(node) {
							title.push(prefix);
							title.push(node.name);
							title.push('\n');});}}
				print(d, '');
				return title.join('');}

			function entityFilter1(node) {
				if ('entity' !== node.klass) {return false;}
				return true;}

			function entityFilter2(node) {
				if (self.inPathway(node)) {return true;}
				return false;}

			function diminishedEntityFilter(node) {
				return !entityFilter2(node);
				var reactions = self.layout.entityReactions.get(node.layoutId);
				var count = 0;
				reactions.forEach(function(reactionLayoutId) {
					if (self.visibleReactions.indexed[reactionLayoutId]) {count++;}});
				return !self.visibleEntities.indexed[node.layoutId] && count > 0;}

			function entitylabelFilter(node) {
				if ('entitylabel' !== node.klass) {return false;}
				return self.visibleEntities.indexed['entity:'+node.id];}

			function reactionFilter(node) {
				var i, entities;
				if ('reaction' !== node.klass) {return false;}
				return true;
				entities = self.layout.reactionEntities.get(node.layoutId);
				var count = 0;
				for (i = 0; i < entities.length; ++i) {
					if (self.visibleEntities1.indexed[entities[i]]) {
						count++;}}
				return count > 0;}

			function locationFilter(node) {
				if ('location' !== node.klass) {return false;}
				return $P.or(self.visibleEntities, function(entity) {
					return entity.locations.indexOf(node.id) != -1;});}

			function paperFilter(node) {
				var i;
				if ('paper' !== node.klass) {return false;}
				return true;
				//var reactions = self.layout.paperReactions.get(node.layoutId);
				//for (i = 0; i < reactions.length; ++i) {
				//	if (self.visibleReactions.indexed[reactions[i]]) {return true;}}
				return false;}

			function isNodeVisible(node) {
				if (!node) {return false;}
				var id = 'object' === typeof node && node.layoutId || node;
				return self.visibleEntities.indexed[id]
					|| self.visibleEntitylabels.indexed[id]
					|| self.visibleReactions.indexed[id]
					|| self.visibleLocations.indexed[id]
					|| self.diminishedEntities.indexed[id]
					|| self.visiblePapers.indexed[id];}

			self.visibleEntities1 = self.layout.nodeList.filter(entityFilter1);
			self.visibleEntities1.indexed = $P.indexBy(self.visibleEntities1, $P.getter('layoutId'));
			self.visibleReactions = self.layout.nodeList.filter(reactionFilter);
			self.visibleReactions.indexed = $P.indexBy(self.visibleReactions, $P.getter('layoutId'));
			self.visibleEntities = self.visibleEntities1.filter(entityFilter2);
			self.visibleEntities.indexed = $P.indexBy(self.visibleEntities, $P.getter('layoutId'));
			self.diminishedEntities = self.visibleEntities1.filter(diminishedEntityFilter);
			self.diminishedEntities.indexed = $P.indexBy(self.diminishedEntities, $P.getter('layoutId'));
			self.visibleEntitylabels = self.layout.nodeList.filter(entitylabelFilter);
			self.visibleEntitylabels.indexed = $P.indexBy(self.visibleEntitylabels, $P.getter('layoutId'));
			self.visibleLocations = self.layout.nodeList.filter(locationFilter);
			self.visibleLocations.indexed = $P.indexBy(self.visibleLocations, $P.getter('layoutId'));
			self.visiblePapers = self.layout.nodeList.filter(paperFilter);
			self.visiblePapers.indexed = $P.indexBy(self.visiblePapers, $P.getter('layoutId'));
			self.visibleNodes = [].concat(self.visibleEntities, self.visibleEntitylabels, self.visibleReactions, self.visibleLocations, self.visiblePapers, self.diminishedEntities);

			self.visibleLinks = self.layout.linkList.filter(function(link) {
				//if (link.klass === 'entity:label') {console.log(link, link.source, link.target, isNodeVisible(link.source),  isNodeVisible(link.target));}
				return link.source && link.target && isNodeVisible(link.source) && isNodeVisible(link.target);});

			self.drawBackground = self.element.append('g').attr('class', 'layer').attr('pointer-events', 'none');

			function elementLayoutId(element) {return element.__data__.layoutId;}
			var rightclickNote = self.rightclickNote.bind(self);

			self.element.selectAll('.crosshair').append('circle').attr('class', 'crosshair')
				.attr('r', 40)
				.attr('fill', 'yellow')
				.style('opacity', '0');

			self.links = self.element.selectAll('.link').data(self.visibleLinks)
				.enter().append('g').attr('class', 'link');
			self.nodes = self.element.selectAll('.node').data(self.visibleNodes)
				.enter().append('g').attr('class', 'node');
			self.nodes.indexed = $P.indexBy(self.nodes[0], elementLayoutId);
			self.links.indexed = $P.indexBy(self.links, $P.getter('layoutId'));
			self.nodes.call(self.layout.drag);

			self.locations = self.nodes.filter(function(d, i) {return 'location' === d.klass;});
			self.locations.indexed = $P.indexBy(self.locations[0], elementLayoutId);
			self.locations.append('circle')
				.attr('stroke', 'black')
				.attr('fill', $P.getter('color'))
				.attr('r', 40)
				.on('dblclick', function(d) {
					self.setLocationCollapse(d, !self.display.collapsedLocations[d.id]);})
				.append('title').text(function(d) {return d.name;});
			self.locations.append('text')
				.style('font-size', '15px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));
			self.reactionLinks = self.links.filter(
				function(d, i) {return 'reaction:entity' === d.klass;});
			self.linkBackgrounds();
			self.makeReactionLinks();

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
				function(d, i) {return 'entity->location' === d.klass && !d.source_subsumed && !d.target_subsumed;});
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
									self.parentBubble.parent.add(new $P.Bubble.IFrame({
										w: 1200,
										h: 600,
										url: 'http://research.bioinformatics.udel.edu/rlimsp/view.php?s=1225&abs=0#EvidenceView?pmid=' + d.id
									}));});}
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
					console.log(d);
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
			self.reactions.reactome = self.reactions.filter(function(d, i) {return 'reactome' === d.source;});
			self.reactions.igep = self.reactions.filter(function(d, i) {return 'iGep' === d.source;});
			self.reactions.reactome
				.each($P.D3.Reaction.appender({
					transform: self.textTransform,
					size: nodeSize(14)}))
				.selectAll('.reaction')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.reactions.igep
				.each($P.D3.Reaction.appender({
					transform: self.textTransform,
					size: nodeSize(14),
					fill: 'blue'}))
				.selectAll('.reaction')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
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
				return 'simple' === d.type
					|| 'rna' === d.type
					|| 'dna' === d.type;});
			self.entities.complex = self.entities.visible.filter(
				function(d, i) {return 'complex' == d.type;});
			self.entities.complex.composite = self.entities.complex.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.set = self.entities.visible.filter(
				function(d, i) {return 'set' == d.type;});
			/*self.entities.other = self.entities.visible.filter(
				function(d, i) {
					return 'complex' !== d.type
						&& 'simple' !== d.type && 'dna' !== d.type  && 'rna' !== d.type
						&& 'Protein' !== d.type && 'protein' !== d.type;});*/
			//self.entities.other.composite = self.entities.other.filter(
			//	function(d, i) {return d.componentNodes;});
			// The big transparent background circles encoding location.
			self.entities.proteins.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.locations[0]);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('follow-type', 'protein')
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			console.log(self.entities.small);
			self.entities.small.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.locations[0]);
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
				var location = self.layout.getNode('location:'+d.locations[0]);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.set.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.locations[0]);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.diminished.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.locations[0]);
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
				.each($P.D3.Diminished.appender({
					transform: self.textTransform,
					size: nodeSize(14)}))
				.selectAll('.diminished-entity')
				.attr('pointer-events', 'all')
				.attr('transform', self.textTransform)
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						diminished: true,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.proteins.objects = {};
			console.log('expression', self.hasExpression());
			self.entities.proteins
				.each($P.D3.Protein.appender({
					transform: self.textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.proteins.objects}))
				.selectAll('.protein')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
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
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Small Molecules.
			self.entities.small.objects = {};
			self.entities.small
				.each($P.D3.Small.appender({
					transform: self.textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.small.objects}))
				.selectAll('.small')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Complex.
			self.entities.complex
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', self.textTransform + 'rotate(45)')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
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
				.call(rightclickNote)
				.append('title').text(nodeTitle);

			// Sets
			self.entities.set.objects = {};
			self.entities.set
				.each($P.D3.Set.appender({
					transform: self.textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.set.objects}))
				.selectAll('.set')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
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
				.call(rightclickNote)
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

			if (self.pathway) {
				self.root.each($P.D3.PathwayLabel.appender(
					{text: self.pathway.name,
					 fill: self.pathway.color,
					 pathway: self.pathway,
					 view: self},
					function(label) {self.label = label;}));}
			else if (self.pathways) {
				var data = self.pathways.map(function(pathway) {
					return {
						name: pathway.name,
						pathwayId: pathway.pathwayId,
						color: pathway.color};});
				self.labels = self.root.selectAll('.pathway-label').data(data).enter().append('g')
					.each($P.D3.PathwayLabel.appender(
						function(d, i) {return {
							element: this,
							view: self,
							text: d.name,
							fill: d.color,
							pathway: d,
							index: i};}));}

			// build selections of all follower nodes for a given node.s
			self.followerNodes = self.element.selectAll('.follower');
			/*
			self.followerNodes.indexed = {};
			self.followerNodes.each(function(d, i) {
				var follow = d3.select(this).attr('follow-id');
				self.followerNodes.indexed[follow] = self.followerNodes.indexed[follow] || [];
				self.followerNodes.indexed[follow].push(this);});
			$.each(self.followerNodes.indexed, function(key, value) {
				self.followerNodes.indexed[key] = d3.selectAll(value);});
			 */


			// Highlighting
			function highlight(d, i) {
				self.highlights = self.layout.getAdjacentNodes(d, 3);
				self.updateNodes(self.nodes);
				self.updateLinks(self.links);
				//self.layout.updateDisplay();
			}
			function unhighlight(d, i) {
				self.highlights = {};
				self.updateNodes(self.nodes);
				self.updateLinks(self.links);
				//self.layout.updateDisplay();
			}

			self.reactions //.selectAll('*')
				.on('mouseover', highlight)
				.on('mouseout', unhighlight);
			self.entities //.selectAll('*')
				.on('mouseover', highlight)
				.on('mouseout', unhighlight);

			self.updateNodes(self.nodes);
			self.updateLinks(self.links);
			self.updateNodes(self.followerNodes);},
		{
			inPathway: function(node) {
				if (!this.pathway && !this.pathways) {return true;}

				if ('entity' === node.klass || 'reaction' === node.klass) {
					if (!node.pathways && !node.source_pathway) {return true;}
					function check(pathway) {
						if (node.source_pathway == parseInt(pathway.id)) {return true;}
						return node.pathways[parseInt(pathway.id)];}
					if (this.pathway && check(this.pathway)) {return true;}
					if (this.pathways && this.pathways.some(check)) {return true;}
					return false;}

				return false;},

			activePathways: function(component) {
				var pathways = [];
				if (!this.pathway && !this.pathways) {return pathways;}

				if ('reaction:entity' === component.klass) {
					return this.activePathways(component.entity);}

				if ('entity' === component.klass) {
					if (!component.pathways) {return pathways;}
					if (this.pathway && component.pathways[parseInt(this.pathway.id)]) {
						pathways.push(this.pathway);}
					if (this.pathways) {
						this.pathways.forEach(function(pathway) {
							if (component.pathways[parseInt(pathway.id)]) {
								pathways.push(pathway);}});}}

				return pathways;},

			hasExpression: function() {
				if (this.pathway) {
					return !$P.isEmpty(this.pathway.expression) && this.pathway.expression;}
				if (this.pathways) {
					return $P.or(this.pathways, function(pathway) {
						return !$P.isEmpty(pathway.expression) && pathway.expression;});}
				return false;},

			getExpression: function(node) {
				var self = this;
				function get(node, pathway) {
					var expression = pathway.expression;
					if (!expression) {return false;}
					console.log('  ', node.name);
					var value = expression[node.name];
					if (value) {return value;}
					if (!node.components) {return false;}
					for (var i = 0; i < node.components.length; ++i) {
						var component_id = node.components[i];
						var component = self.layout.getNode('entity:' + component_id);
						if (!component) {continue;}
						value = get(component, pathway);
						if (value) {return value;}}
					return false;}
				var g = get.bind(this, node);

				if (this.pathway) {
					return g(this.pathway);}
				if (this.pathways) {
					return $P.or(this.pathways, g);}
				return null;},

			getExpressionColor: function(node) {
				if (!this.hasExpression()) {return 'white';}
				console.log('GET EXPRESSION:');
				var expression = this.getExpression(node);
				if ('up' === expression) {return '#f00';}
				if ('down' === expression) {return '#0f0';}
				if ('neutral' === expression) {return '#fff';}
				return '#00f';},

			// Get the component nodes of a node.
			getComponents: function(node) {
				var self = this;
				return node.components.map(function(component_id) {
					return self.layout.getNode('entity:' + component_id);});},

			onShapeChange: function() {
				var self = this;
				$P.ForceView.prototype.onShapeChange.call(self);
				if (self.label) {
					self.label.onShapeChange(self.shape);}
				if (self.labels) {
					self.labels.each(function(d, i) {
						d.manager.onShapeChange(self.shape);});}},

			delete: function() {
				$P.ForceView.prototype.delete.call(this);
				if (this.label) {this.label.remove();}
				if (this.labels) {this.labels.remove();}},

			linkBackgrounds: function() {},

			entityBackgrounds: function() {},

			makeReactionLinks: function() {
				this.reactionLinks.each($P.D3.ReactionLink.appender());},

			isNodeVisible: function(node, element) {
				var self = this,
						selection, follow, key;

				if ('string' === typeof node) {
					node = self.layout.getNode(node);}

				if (element) {
					selection = d3.select(element);
					node = node || selection.datum();
					follow = selection.attr('follow-id');
					if (follow) {
						return self.isNodeVisible(self.layout.getNode(follow));}}

				if (undefined === node) {return false;}

				while (node.subsumed) {
					node = self.layout.getNode('entity:' + node.component_of);}

				if ('entitylabel' === node.klass) {
					return self.isNodeVisible(self.layout.getNode('entity:' + node.id));}

				if (self.display.collapsedLocations[node.location]) {return false;}

				// Hide reactions if all related are hidden.
				if ('reaction' === node.klass) {
					var count = 0;
					self.layout.reactionEntities.get(node.layoutId).forEach(function(entityId) {
						if (self.isNodeVisible(self.layout.getNode(entityId))) {count++;}});
					if (0 === count) {return false;}}

				if ('location' === node.klass) {key = 'location';}
				else if ('reaction' === node.klass && 'reactome' === node.source) {key = 'reaction:reactome';}
				else if ('reaction' === node.klass && 'iGep' === node.source) {key = 'reaction:igep';}
				else if ('paper' === node.klass) {key = 'paper';}
				else if (!this.inPathway(node)) {key = 'diminished';}
				else if ('protein' === node.type.toLowerCase()) {key = 'protein';}
				else if (-1 !== ['simple','rna','dna'].indexOf(node.type)) {key = 'small';}
				else if ('complex' === node.type) {key = 'complex';}
				else if ('set' == node.type) {key = 'set';}
				else if ('entity' === node.klass) {key = 'other';}

				if (self.hiddenNodeTypes[key]) {return false;}

				return true;},

			onSearch: function(key) {
				var i, regex, results = {};

				this.searchKey = key;
				if (key) {
					regex = key.split('').join('.*');}

				$.each(this.entities.proteins.objects, function(layoutId, protein) {
					var d = protein.datum;
					var target = d.name || d.id || layoutId;
					protein.searchMatch = key && target.match(regex) || false;});

				this.nodes.each(function(node) {
					var target = '' + (node.name || node.id || node.layoutId);
					node.searchMatch = target.match(regex);
					if (['entity', 'reaction'].indexOf(node.klass) != -1
							&& node.searchMatch) {
						results[node.layoutId] = node;}});

				return results;},

			zoomTo: function(entity) {
				var scale = this.zoom.scale();
				var translate = [-scale * entity.x, -scale * entity.y];
				console.log(scale, translate);
				this.zoom.scale(scale).translate(translate);
				var crosshair = $(this.element).find('.crosshair');
				crosshair.css('x', entity.x);
				crosshair.css('y', entity.y);
				crosshair.fadeIn(150).fadeOut(150);
				this.onZoom();},

			updateNodes: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					return self.isNodeVisible(d, this) ? '' : 'none';});

				selection.each(function(d, i) {
					if (!d) {return;}

					var selection = d3.select(this);

					if ('entity' === d.klass || 'reaction' === d.klass) {
						var highlights = self.highlights[d.layoutId];
						d.highlighted = highlights + 1;
						if (d.displays) {
							d.displays.forEach(function(display) {
								display.highlighted = highlights + 1;});}}

					if ('location' === d.klass) {
						selection.attr('stroke-width', self.display.collapsedLocations[d.id] ? 5 : 1);}});

			},

			updateLinks: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					function visible(node) {
						return node && (
							self.isNodeVisible(node)
								|| (node.locationCollapsed && 'reaction:entity' === d.klass));}
					return (visible(d.source) && visible(d.target)) ? '' : 'none';});

				selection.each(function(d, i) {
					var selection = d3.select(this);

					var highlighted =
								d.source.highlighted && d.target.highlighted
								&& Math.min(d.source.highlighted, d.target.highlighted);
					d.highlighted = highlighted;

					if (d.displays) {
						d.displays.forEach(function(display) {
							display.highlighted = highlighted + 1;});}});
			},

			setLocationCollapse: function(location, collapsed) {
				var self = this,
						locationNode;

				if (self.display.collapsedLocations[location.id] == collapsed) {return;}
				self.display.collapsedLocations[location.id] = collapsed;

				locationNode = self.locations.indexed[location.layoutId];
				self.updateNodes(d3.select(locationNode));

				location.links.forEach(function(link) {
					link.source.locationCollapsed = collapsed;
					var node = self.nodes.indexed[link.source.layoutId];
					self.updateNodes(d3.select(node));});

				self.updateNodes(self.entityLabels);
				self.updateLinks(self.reactionLinks);
				self.updateLinks(self.entityLabelLinks);
				self.updateLinks(self.locationLinks);
				self.updateNodes(self.followerNodes);

				self.layout.updateDisplay();},

			setNodeTypeHidden: function(nodeType, hidden) {
				var self = this,
						updateNode, updateLink;

				if (self.hiddenNodeTypes[nodeType] == hidden) {return;}
				self.hiddenNodeTypes[nodeType] = hidden;

				// Force update.
				self.lastUpdateCompleted = Date.now();

				if ('paper' === nodeType) {
					self.updateNodes(self.papers);
					self.updateLinks(self.paperLinks);}
				else if ('reaction:reactome' === nodeType) {
					self.updateNodes(self.reactions.reactome);
					self.updateLinks(self.paperLinks);
					self.updateLinks(self.reactionLinks);}
				else if ('reaction:igep' === nodeType) {
					self.updateNodes(self.reactions.igep);
					self.updateLinks(self.paperLinks);
					self.updateLinks(self.reactionLinks);}
				else {
					if ('diminished' === nodeType) {
						self.updateNodes(self.entities.diminished);
						self.updateNodes(self.reactions);}
					else if ('protein' === nodeType) {
						self.updateNodes(self.entities.proteins);
						self.updateNodes(self.reactions);}
					else if ('small' === nodeType) {
						self.updateNodes(self.entities.small);
						self.updateNodes(self.reactions);}
					else if ('complex' === nodeType) {
						self.updateNodes(self.entities.complex);
						self.updateNodes(self.reactions);}
					else if ('set' === nodeType) {
						self.updateNodes(self.entities.set);
						self.updateNodes(self.reactions);}
					self.updateNodes(self.entityLabels);
					self.updateLinks(self.reactionLinks);
					self.updateLinks(self.entityLabelLinks);
					self.updateLinks(self.locationLinks);}

				self.updateNodes(self.followerNodes);
			},

			rightclickNote: function(selection) {
				var self = this;
				selection.on('contextmenu', function(d, i) {
					d3.event.preventDefault();
					if (this.note) {
						this.note.delete();
						delete self.notes[this.note.id];
						this.note = null;}
					else {
						this.note = new $P.NoteFrame({
							w: 200, h: 100,
							follow: this, followLayoutId: d.layoutId,
							parent: self.parentBubble});
						self.notes[this.note.id] = this.note;}
				});
			}

		});

	$P.PathwayForceView.makeLegend = function(parentSelection, width, height, callback) {
		var legend = parentSelection.append('svg').attr('class', 'legend');

		legend.append('line')
			.attr('stroke', 'black')
			.attr('stroke-width', 3)
			.attr('x1', 0).attr('y1', 0)
			.attr('x2', 0).attr('y2', height);

		var leftX = width - 115;
		var textX = leftX + 20;
		var y = 20;

		var checkboxes = {};

		function checkbox(id, y) {
			var state = true;
			if (id == 'paper' || id == 'small') {state = false;}
			checkboxes[id] = new $P.D3.Checkbox({
				parentSelection: legend,
				x: leftX + 3, y: y - 1,
				state: state,
				callback: function(state) {
					callback(id, state);}
			});}

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', leftX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Entities:');

		y += 24;

		checkbox('protein', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Protein');

		legend.each($P.D3.Protein.appender({
			x: leftX + 99,
			y: y}));

		y += 30;
		checkbox('small', y);

		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y - 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('  Small  ');
		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y + 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Molecule');

		legend.each($P.D3.Small.appender({
			x: leftX + 99,
			y: y}));

		y += 28;
		checkbox('complex', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('complex');

		legend.append('rect')
			.attr('stroke', 'black')
			.attr('fill', 'white')
			.attr('width', 15).attr('height', 15)
			.attr('transform', 'translate('+(leftX+98)+','+(y-11)+')rotate(45)');

		y += 24;
		checkbox('set', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Set');

		legend.each($P.D3.Set.appender({
			x: leftX + 99,
			y: y}));

		y += 30;
		checkbox('diminished', y);
		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y - 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Not in');
		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y + 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Pathway');
		legend.each($P.D3.Diminished.appender({
			x: leftX + 98,
			y: y}));

		y += 24;
		checkbox('paper', y);
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Paper');

		legend.append('polygon')
			.attr('points', '7.5,6 -7.5,6 0,-8.25')
			.style('stroke', 'black')
			.style('fill', 'cyan')
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 24;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Crosstalk');

		legend.each($P.D3.Protein.appender({
			crosstalk: true,
			x: leftX + 98,
			y: y}));

		y += 24;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', leftX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Reactions:');

		y += 26;
		checkbox('reaction:reactome', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Reactome');

		legend.each($P.D3.Reaction.appender({
			x: leftX + 98,
			y: y}));

		y += 26;
		checkbox('reaction:igep', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('iGep');

		legend.each($P.D3.Reaction.appender({
			fill: 'blue',
			x: leftX + 98,
			y: y}));


		y += 24;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', leftX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Expression:');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Up');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#f00')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Neutral');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#fff')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Down');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#0f0')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Missing');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#00f')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		return legend;};
})(PATHBUBBLES);
