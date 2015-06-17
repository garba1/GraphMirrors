(function($P){
	'use strict';

	$P.SoupForceLayout = $P.defineClass(
		$P.PathwayForceLayout,
		function SoupForceLayout(config) {
			var self = this;
			$P.ForceLayout.call(this, config);

		},
		{
			addNode: function(node) {
				if (!$P.PathwayForceLayout.prototype.addNode.call(this, node)) {return null;}
				if ('entity' === node.klass) {this.onAddEntity(node);}
				if ('reaction' === node.klass) {this.onAddReaction(node);}
				if ('paper' === node.klass) {this.onAddPaper(node);}
			},
		});

})(PATHBUBBLES);
