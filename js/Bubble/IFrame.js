(function($P) {
	'use strict';

	$P.Bubble.IFrame = $P.defineClass(
		$P.Bubble,
		function IFrameBubble(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			$P.Bubble.call(this, config);
			this.url = config.url;},
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
				this.iframe = new $P.IFrame(config);},

			saveKeys: [].concat($P.Bubble.prototype.saveKeys, ['url'])

		});

	$P.Bubble.IFrame.loader = function(load, id, data) {
		var config = {};
		$P.Bubble.IFrame.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});
		var bubble = new $P.Bubble.IFrame(config);
		load.objects[id] = bubble;

		return bubble;};

})(PATHBUBBLES);
