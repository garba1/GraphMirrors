(function($P) {
	'use strict';

	$P.Bubble.Search = $P.defineClass(
		$P.Bubble,
		function SearchBubble(config) {
			config = $.extend(config, {
				closeMenu: true,
				groupMenu: true});
			$P.Bubble.call(this, config);
			if (!this.name) {this.name = 'Search';}
			if (undefined !== config.text) {this.text = config.text;}},
		{
			get text() {return this.content && $(this.content.element).val();},
			set text(value) {
				if (this.content) {
					$(this.content.element).val(value);}
				else {
					this._readyText = value;}},

			onAdded: function(parent) {
				if ($P.BubbleBase.prototype.onAdded.call(this, parent) || this.content) {return;}
				var config = {};
				config = $.extend(config, this.getInteriorDimensions());
				config.x += 8;
				config.y += 8;
				config.w -= 16;
				config.h -= 16;
				config.parent = this;
				config.url = this.url;
				this.content = new $P.Bubble.SearchContent(config);
				/*
				if (this._readyText) {
					this.text = this._readyText;
					delete this._readyText;}
				 */
				 },

			saveKeys: [].concat($P.Bubble.prototype.saveKeys, ['text'])

		});
	$P.Bubble.Note.loader = function(load, id, data) {
		var config = {};
		$P.Bubble.Note.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});
		var bubble = new $P.Bubble.Note(config);
		load.objects[id] = bubble;

		return bubble;};

})(PATHBUBBLES);
