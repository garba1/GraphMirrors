(function($P){
	'use strict';

	$P.PathwayForceView = $P.defineClass(
		$P.ForceView,
		function PathwayForceView(config) {
			var nodes, links,
					self = this;

			$P.ForceView.call(self, config);

			self.pathway = config.displayArgument || null;

			self.element.append('rect')
				.attr('fill', 'red')
				.attr('x', -20)
				.attr('y', -20)
				.attr('width', 40)
				.attr('height', 40)
				.attr('pointer-events', 'none');

			nodes = self.layout.nodes;
			// Filter nodes by pathway.
			if (self.pathway) {
				nodes = nodes.filter(function(node) {
					if ('entity' === node.klass) {
						return node.pathways[self.pathway];}
					if ('entityLabel' === node.klass) {
						return self.layout.getNode('entity:'+node.id).pathways[self.pathway];}
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
				.attr('r', 40);
			self.locations.append('text')
				.style('font-size', '15px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));
			self.reactionLinks = self.links.filter(
				function(d, i) {return 'reaction:entity' === d.klass;});
			self.reactionLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 2)
				.attr('fill', 'none');
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
				.attr('width', 5).attr('height', 5);
			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			// The big transparent background circles encoding location.
			self.entities.append('circle')
				.attr('stroke', 'none')
				.attr('fill', function(entity) {return self.layout.getNode('location:'+entity.location).color;})
				.attr('fill-opacity', 0.15)
				.attr('pointer-events', 'none') // Can't click on them.
				.attr('r', 60);
			// Nodes in the pathway.
			// An extra circle indicating crosstalk.
			self.entities
				.filter(function(d, i) {return nodes.indexed[d.layoutId];})
				.filter(function(d, i) {return d.crosstalkCount > 1;})
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', 'gray')
				.attr('r', 10);
			// The main circle.
			self.entities.filter(function(d, i) {return nodes.indexed[d.layoutId];})
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('r', 8)
				.attr('pointer-events', 'all')
				.on('click', function(d) {console.log(d);});
			// Nodes not in the pathway.
			self.entities.filter(function(d, i) {return !nodes.indexed[d.layoutId];})
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor)
				.attr('r', 2);
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
		},
		{
			getExpressionColor: function(node) {
				return 'white';
				if ('up' === this._expression[symbol]) {return 'yellow';}
				if ('down' === this._expression[symbol]) {return 'cyan';}
				return 'white';}
		});
})(PATHBUBBLES);
