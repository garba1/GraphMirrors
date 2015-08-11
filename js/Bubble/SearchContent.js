(function($P){
	'use strict';

	$P.Bubble.SearchContent = $P.defineClass(
		$P.HtmlObject,
		function  SearchBubbleContent(config) {
			var self = this;

			$P.HtmlObject.call(self, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});

			var root = $(this.element);
			root.append('Search: ');
			root.append('<input id="search_text" type="text"/>');
			root.append('<button id="search_run" type="button">Run</button>');
			root.append('<hr/>');

			root.find('#search_run').click(function(event) {
				self.updateSearch();});
		},
		{

			updateSearch: function() {
				var key = $(this.element).find('#search_text').val();

				this.parent.getAllNeighbors().forEach(function(neighbor) {
					if (neighbor.onSearch) {
						neighbor.onSearch(key);}});},

			onAdded: function(parent) {
				$P.HtmlObject.prototype.onAdded.call(this, parent);
			},


			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);}

		});

})(PATHBUBBLES);
