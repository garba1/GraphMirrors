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
			root.css('display', 'flex');
			root.css('flex-flow', 'column');
			root.css('overflow', 'hidden');

			var header = $('<div></div>');
			header.css('flex', '0 0 auto');
			root.append(header);

			this.button = $('<button type="button" style="float: right;">Run</button>');
			this.button.click(function(event) {
				self.updateSearch();});
			header.append(this.button);

			this.textbox = $('<input type="text" style="width:100%;"/>');
			this.textbox.keypress(function(event) {
				if (13 === event.keyCode) {
					self.updateSearch();}});

			var container = $('<div style="overflow:hidden; padding-right:10px;"/>');
			container.append(this.textbox);
			header.append(container);

			header.append('<hr/>');

			this.results = $('<div id="results"></div>');
			this.results.css('flex', '1 0 0px');
			this.results.css('overflow-y', 'scroll');
			root.append(this.results);
		},
		{

			updateSearch: function() {
				var self = this;
				var key = self.textbox.val();

				var results = d3.select('#results');
				results.selectAll('*').remove();
				var bubbles = results.selectAll('*').data(
					self.parent.getAllNeighbors().filter(function(d, i) {
						return d.onSearch;}));
				bubbles.enter().append('div')
					.style('height', '100%')
					.text(function(bubble, i) {return bubble.name;})
					.selectAll('*').data(function(bubble, i) {
						var results = [];
						$.each(bubble.onSearch(key), function(k, v) {results.push(v);});
						return results;})
					.enter().append('div')
					.style('margin-left', '20px')
					.style('font-size', '12px')
					.style('overflow', 'hidden')
					.style('cursor', 'pointer')
					.style('pointer-event', 'all')
					.text(function(result, i) {
						var text = result.name;
						if (result.location) {
							text += ' [' + result.location + ']';}
						if ('reaction' === result.klass) {
							text += ' [reaction]';}
						return text;})
					.on('mouseover', function(d, i) {$(this).css('background', 'cyan');})
					.on('mouseout', function(d, i) {$(this).css('background', '');})
					.on('click', function(d, i) {
						var bubble = d3.select(this.parentNode).datum();
						if (bubble.zoomTo) {bubble.zoomTo(d);}
						$(this).fadeOut(200).fadeIn(200);});


				self.parent.getAllNeighbors().forEach(function(neighbor) {
					if (neighbor.onSearch) {
						var result = neighbor.onSearch(key);
						if ($.isEmptyObject(result)) {return;} // Don't append Bubble

					}});
			},

			onAdded: function(parent) {
				$P.HtmlObject.prototype.onAdded.call(this, parent);
			},


			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);}

		});

})(PATHBUBBLES);
