(function($P) {
	'use strict';

	$P.Bubble.Html = $P.defineClass(
		$P.Bubble,
		function HtmlBubble(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			this.content = config.content;
			$P.Bubble.call(this, config);},
		{
			onAdded: function(parent) {
				if ($P.BubbleBase.prototype.onAdded.call(this, parent) || this.content) {return;}
				var config, objectConfig;
				objectConfig = {parent: this};
				objectConfig = $.extend(objectConfig, this.getInteriorDimensions());
				objectConfig.x += 8;
				objectConfig.y += 8;
				objectConfig.w -= 16;
				objectConfig.h -= 16;
				config = {
					parent: '#bubble',
					before: '#overlayCanvas',
					type: 'div',
					class: 'content',
					objectConfig: objectConfig};
				this.content = new $P.HtmlObject(config);}
		});

})(PATHBUBBLES);
