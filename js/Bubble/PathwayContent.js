(function($P){
	'use strict';

	$P.Bubble.PathwayContent = $P.defineClass(
		$P.HtmlObject,
		function  PathwayBubbleContent(config) {
			var self = this;

			$P.HtmlObject.call(self, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});

			var root = $(this.element);
			root.append('<div id="drag" style="width: 50px; height: 50px; background-color: red;"/>');
			root.append('TEST');
			root.append('<hr/>');

			root.find('#drag').draggable({
				revert: true,
				revertDuration: 0,
				scroll: false,
				stop: function(event, ui) {
					var mouse = $P.state.mainCanvas.getMouseLocation(event);
					mouse.x += $P.state.scrollX;
					console.log(mouse);
			}});

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
