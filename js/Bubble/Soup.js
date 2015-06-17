(function($P) {
	'use strict';

	$P.Bubble.Soup = $P.defineClass(
		$P.Bubble,
		function SoupBubble(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			this.content = config.content;
			$P.Bubble.call(this, config);},
		{
			onAdded: function(parent) {
				if ($P.Bubble.prototype.onAdded.call(this, parent) || this.content) {return;}

				var config = {parent: this};
				$.extend(config, this.getInteriorDimensions());
				this.content = new $P.D3.Soup(config);}
		});

})(PATHBUBBLES);
