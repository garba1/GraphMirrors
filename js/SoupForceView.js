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
				self.entities.selectAll('.pathway-arcs').remove();
				self.entities.pathways = self.entities.append('g').attr('class', 'pathway-arcs');
				self.entities.pathways
					.selectAll('.pathway-section')
					.data(function(d, i) {
						d.pathwayArc = this;
						var pathways = self.activePathways(d);
						if (d.id == 7021){console.log(d, pathways);}
						var result = [];
						pathways.forEach(function(pathway) {
							var r = Object.create(pathway);
							r.entity = d;
							r.angle = Math.PI * 2 / pathways.length;
							result.push(r);});
						return result;})
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

			makeReactionLinks: function() {
				this.reactionLinks.each($P.D3.SoupReactionLink.appender({view: this}));}

		});

	$P.SoupForceView.makeLegend = function(parentSelection, width, height, callback) {
		return $P.PathwayForceView.makeLegend(parentSelection, width, height, callback);};

})(PATHBUBBLES);
