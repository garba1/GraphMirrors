(function($P){
	'use strict';

	$P.PathwayForceView = $P.defineClass(
		$P.ForceView,
		function PathwayForceView(config) {
			var nodes, links,
					self = this,
					textTransform;

			$P.ForceView.call(self, config);

			textTransform = self.shape.textTransform(self);

			self.pathway = config.displayArgument || null;

			// Center Mark.
			/*self.element.append('rect')
				.attr('fill', 'red')
				.attr('x', -20)
				.attr('y', -20)
				.attr('width', 40)
				.attr('height', 40)
				.attr('pointer-events', 'none');*/

			function nodeSize(target) {
				return function(d) {
					var size = 1;
					if (d.componentNodes && d.componentNodes.length) {
						size = Math.pow(d.componentNodes.length, 0.4);}
					return target * size;};}

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

			nodes = self.layout.nodes;
			console.log(self.pathway);
			// Filter nodes by pathway.
			if (self.pathway) {
				nodes = nodes.filter(function(node) {
					if ('entity' === node.klass) {
						return node.pathways[parseInt(self.pathway.id)];}
					if ('entityLabel' === node.klass) {
						return self.layout.getNode('entity:'+node.id).pathways[parseInt(self.pathway.id)];}
					return true;});}

			// Filter links by exsiting nodes.
			nodes.indexed = $P.indexBy(nodes, $P.getter('layoutId'));
			links = self.layout.links.filter(function(link) {
				return nodes.indexed[link.source.layoutId]
					|| nodes.indexed[link.target.layoutId];});

			self.links = self.element.selectAll('.link').data(links)
				.enter().append('g').attr('class', 'link');
			// Display /all/ nodes, not just filtered ones. They're just displayed differently.
			self.nodes = self.element.selectAll('.node').data(self.layout.nodes)
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
				.attr('source-width', 8)
				.attr('target-width', 1)
				.attr('opacity', 0.5);
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
			self.locationLinks = self.links.filter(
				function(d, i) {return 'entity:location' === d.klass;});
			self.locationLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 0.5)
				.attr('fill', 'none');
			self.reactions = self.nodes.filter(function(d, i) {return 'reaction' === d.klass;});
			self.reactions.append('rect')
				.attr('stroke', 'black')
				.attr('fill', 'red')
				.attr('width', nodeSize(5)).attr('height', nodeSize(5))
				.attr('x', nodeSize(-2.5)).attr('y', nodeSize(-2.5))
				.attr('pointer-events', 'all')
				.on('click', function(d) {console.log(d);})
				.append('title').text(nodeTitle);
			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			self.entities.proteins = self.entities.filter(function(d, i) {return 'Protein' == d.type;});
			self.entities.proteins.focused = self.entities.proteins.filter(
				function(d, i) {return nodes.indexed[d.layoutId];});
			self.entities.proteins.composite = self.entities.proteins.filter(
				function(d, i) {return d.componentNodes;});
			console.log('COMPOSITE', self.entities.proteins.composite);
			self.entities.proteins.unfocused = self.entities.proteins.filter(
				function(d, i) {return !nodes.indexed[d.layoutId];});
			self.entities.proteins.crosstalking = self.entities.proteins.filter(
				function(d, i) {return d.crosstalkCount > 1;});
			self.entities.small = self.entities.filter(
				function(d, i) {return 'SmallMolecule' == d.type;});
			self.entities.complex = self.entities.filter(
				function(d, i) {return 'Complex' == d.type;});
			// The big transparent background circles encoding location.
			self.entities.proteins.focused.append('circle')
				.attr('stroke', 'none')
				.attr('fill', function(entity) {return self.layout.getNode('location:'+entity.location).color;})
				.attr('fill-opacity', 0.15)
				.attr('pointer-events', 'none') // Can't click on them.
				.attr('r', 60);
			self.entities.proteins.unfocused.append('circle')
				.attr('stroke', 'none')
				.attr('fill', function(entity) {return self.layout.getNode('location:'+entity.location).color;})
				.attr('fill-opacity', 0.05)
				.attr('pointer-events', 'none') // Can't click on them.
				.attr('r', 60);
			self.entities.small
				.attr('stroke', 'none')
				.attr('fill', function(entity) {return self.layout.getNode('location:'+entity.location).color;})
				.attr('fill-opacity', 0.15)
				.attr('pointer-events', 'none') // Can't click on them.
				.attr('r', 60);
			self.entities.complex
				.attr('stroke', 'none')
				.attr('fill', function(entity) {return self.layout.getNode('location:'+entity.location).color;})
				.attr('fill-opacity', 0.15)
				.attr('pointer-events', 'none') // Can't click on them.
				.attr('r', 60);
			// Nodes in the pathway.
			// An extra box indicating crosstalk.
			self.entities.proteins.crosstalking
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', 'gray')
				.attr('transform', textTransform)
				.attr('width', nodeSize(14)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-7)).attr('y', nodeSize(-5))
				.attr('rx', nodeSize(3)).attr('ry', nodeSize(3));
			// The main circle.
			self.entities.proteins.focused
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(12)).attr('height', nodeSize(8))
				.attr('x', nodeSize(-6)).attr('y', nodeSize(-4))
				.attr('rx', nodeSize(3)).attr('ry', nodeSize(3))
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {console.log(d);})
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
				.on('click', function(d) {console.log(d);})
				.append('title').text(nodeTitle);
			// Nodes not in the pathway.
			self.entities.proteins.unfocused
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', 6).attr('height', 3)
				.attr('x', -3).attr('y', -1.5)
				.attr('rx', 1).attr('ry', 1)
				.attr('transform', textTransform)
				.on('click', function(d) {console.log(d);})
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
				.on('click', function(d) {console.log(d);})
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
				.on('click', function(d) {console.log(d);})
				.append('title').text(nodeTitle);

			self.entityLabels = self.nodes.filter(
				function(d, i) {return 'entitylabel' === d.klass
								 && self.layout.getNode('entity:'+d.id)
								 && nodes.indexed[self.layout.getNode('entity:'+d.id).layoutId];});
			self.entityLabels.append('text')
				.style('font-size', '12px')
				.attr('text-anchor', 'middle')
				.attr('fill', 'black')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));
			self.entityLabelLinks = self.links.filter(
				function(d, i) {return 'entity:label' === d.klass && nodes.indexed[d.source.layoutId];});
			self.entityLabelLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.2)
				.attr('fill', 'none');

			self.element.append('text')
				.style('font-size', '24px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('opacity', 0.6)
				.attr('transform', self.shape.textTransform(self))
				.text(self.pathway.name);

		},
		{
			getExpressionColor: function(node) {
				if ('up' === this.pathway.expressions[node.name]) {return 'yellow';}
				if ('down' === this.pathway.expressions[node.name]) {return 'cyan';}
				return 'white';}
		});
})(PATHBUBBLES);
