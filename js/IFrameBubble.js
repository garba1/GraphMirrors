(function($P) {
	'use strict';

	$P.IFrameBubble = $P.defineClass(
		$P.BubbleBase,
		function IFrameBubble(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			$P.BubbleBase.call(this, config);
			this.url = config.url;
		},
		{
			onAdded: function(parent) {
				if ($P.BubbleBase.prototype.onAdded.call(this, parent) || this.iframe) {return;}
				var config = {};
				config = $.extend(config, this.getInteriorDimensions());
				config.x += 8;
				config.y += 8;
				config.w -= 16;
				config.h -= 16;
				config.parent = this;
				config.url = this.url;
				this.iframe = new $P.IFrame(config);}

		});

})(PATHBUBBLES);
