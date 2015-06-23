(function($P){
	'use strict';

	$P.SoupForceView = $P.defineClass(
		$P.PathwayForceView,
		function SoupForceView(config) {
			var self = this;
			$P.PathwayForceView.call(self, config);
		},
		{

			entityBackgrounds: function() {
				var self = this;
				self.entities.pathways = self.entities.append('g');
				self.entities.pathways
					.selectAll('.pathway-section')
					.data(function(d, i) {
						var pathways = self.activePathways(d);
						pathways.forEach(function(pathway) {
							pathway.entity = d;
							pathway.angle = Math.PI * 2 / pathways.length;});
						return pathways;})
					.enter().append('path')
					.attr('d', function(d, i) {
						return (d3.svg.arc()
										.innerRadius(0)
										.outerRadius(self.nodeSize(8))
										.startAngle(d.angle * i)
										.endAngle(d.angle * (i + 1)))();})
					.attr('stroke', 'black')
					.attr('stroke-width', self.nodeSize(0.5))
					.attr('fill', function(d, i) {return d.color;});},

			linkBackgrounds: function() {
				var self = this;


				/*
				self.reactionLinks.pathways = self.reactionLinks.append('g').attr('class', 'pathway-edge');
				self.reactionLinks.pathways.selectAll('.pathway-section')
					.data(function(d, i) {
						var pathways = self.activePathways(d);
						return pathways;})
					.enter().append('line').attr('class', 'pathway-section')


				if (this.svg.pathway_edges) {this.svg.pathway_edges.remove();}
				this.svg.pathway_edges = this.svg.normal_layer.selectAll('.pathway-edge')
					.data(this.edges.reactions.filter($P.getter('activePathways')), $P.getter('id')).enter()
					.append('g')
					.attr('class', 'pathway-edge');
				this.svg.pathway_edges.each(function(edge) {
					d3.select(this).selectAll('.pathway-edge-part').data(edge.activePathways).enter()
						.append('line')
						.attr('class', 'pathway-edge-part')
						.attr('stroke', function(pathwayId) {return bubble.pathways[pathwayId].color;})
						.attr('stroke-width', self.size * self.scale * self.pathway_link_width)
						.attr('stroke-opacity', self.pathway_link_opacity)
						.attr('fill', 'none');});
				 */

			}

		});

	$P.SoupForceView.makeLegend = function(parentSelection, width, height, callback) {
		return $P.PathwayForceView.makeLegend(parentSelection, width, height, callback);};

})(PATHBUBBLES);
