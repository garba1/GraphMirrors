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

			nodes = self.layout.nodes;
			// Filter nodes by pathway.
			if (self.pathway) {
				nodes = nodes.filter(function(node) {
					if ('entity' === node.klass) {
						return node.pathways[self.pathway.id];}
					if ('entityLabel' === node.klass) {
						return self.layout.getNode('entity:'+node.id).pathways[self.pathway.id];}
					return true;});}

			// Filter links by exsiting nodes.
			nodes.indexed = $P.indexBy(nodes, $P.getter('layoutId'));
			console.log(nodes.indexed);
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
				.attr('width', 5).attr('height', 5)
				.attr('x', -2.5).attr('y', -2.5)
				.attr('pointer-events', 'all')
				.on('click', function(d) {console.log(d);})
				.append('title').text(function(d) {return d.name;});
			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			self.entities.proteins = self.entities.filter(function(d, i) {return 'Protein' == d.type;});
			self.entities.proteins.focused = self.entities.proteins.filter(
				function(d, i) {return nodes.indexed[d.layoutId];});
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
				.attr('width', 14).attr('height', 10)
				.attr('x', -7).attr('y', -5)
				.attr('rx', 3).attr('ry', 3);
			// The main circle.
			self.entities.proteins.focused
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('width', 12).attr('height', 8)
				.attr('x', -6).attr('y', -4)
				.attr('rx', 3).attr('ry', 3)
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {console.log(d);})
				.append('title').text(function(d) {return d.name;});
			// Nodes not in the pathway.
			self.entities.proteins.unfocused
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('width', 6).attr('height', 3)
				.attr('x', -3).attr('y', -1.5)
				.attr('rx', 1).attr('ry', 1)
				.attr('transform', textTransform)
				.on('click', function(d) {console.log(d);})
				.append('title').text(function(d) {return d.name;});
			// Small Molecules.
			self.entities.small
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('r', 5)
				.attr('x', -2.5)
				.attr('y', -2.5)
				.attr('pointer-events', 'all')
				.on('click', function(d) {console.log(d);})
				.append('title').text(function(d) {return d.name;});
			// Complex.
			self.entities.complex
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('width', 10).attr('height', 10)
				.attr('x', -5).attr('y', -5)
				.attr('transform', textTransform + 'rotate(45)')
				.attr('pointer-events', 'all')
				.on('click', function(d) {console.log(d);})
				.append('title').text(function(d) {return d.name;});
			self.entityLabels = self.nodes.filter(
				function(d, i) {return 'entitylabel' === d.klass
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
				return 'white';
				if ('up' === this._expression[symbol]) {return 'yellow';}
				if ('down' === this._expression[symbol]) {return 'cyan';}
				return 'white';}
		});
})(PATHBUBBLES);
