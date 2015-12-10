(function($P) {
	'use strict';

	$P.Bubble.Table = $P.defineClass(
		$P.Bubble,
		function PathwayBubbl(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			$P.Bubble.call(this, config);
			if (undefined !== config.text) {this.text = config.text;}},
		{
			onAdded: function(parent) {
				if ($P.BubbleBase.prototype.onAdded.call(this, parent) || this.content) {return;}
				var config = {};
				config = $.extend(config, this.getInteriorDimensions());
				config.x += 8;
				config.y += 8;
				config.w -= 16;
				config.h -= 16;
				config.parent = this;
				this.content = new $P.Bubble.PathwayContent(config);}

		});

})(PATHBUBBLES);
