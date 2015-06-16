(function($P){
	'use strict';

	$P.D3.Soup = $P.defineClass(
		$P.D3SplitForce,
		function D3Soup(config) {
			$P.D3SplitForce.call(this, config);},
		{
			setupViews: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					viewArgs: [{type: 'pathways', list: this.pathways}],
					viewConstructor: $P.SoupForceView});}
		});

})(PATHBUBBLES);
