(function($P){
	'use strict';

	$P.ForceDisplay = $P.defineClass(
		null,
		function ForceDisplay(config) {
			var i, view;

			this.svg = config.svg;
			if (!this.svg) {
				console.error('ForceDisplay(', config, '): Missing svg.');
				return;}

			this.parent = config.parent || this.svg;
			this.parentBubble = config.parentBubble || null;

			this.layout = config.layout;
			if (!this.layout) {
				console.error('ForceDisplay(', config, '): Missing layout.');
				return;}

			this.shape = config.shape;
			if (!this.shape) {
				console.error('ForceDisplay(', config, '): Missing shape.');
				return;}
			this.layout.shape = this.shape;

			this.viewConstructor = config.viewConstructor;
			if (!this.viewConstructor) {
				console.error('ForceDisplay(', config, '): Missing viewConstructor.');
				return;}

			this.viewCount = config.viewCount || this.shape.count || 1;
			this.w = config.w || this.svg.attr('width');
			this.h = config.h || this.svg.attr('height');

			this.zoomBase = config.zoomBase;
			if (this.zoomBase) {
				console.log(this.zoomBase, this.zoomBase.translate(), this.zoomBase.scale());}

			this.views = [];
			for (i = 0; i < this.viewCount; ++i) {
				view = new this.viewConstructor({
					svg: this.svg,
					parent: this.parent,
					parentBubble: this.parentBubble,
					layout: this.layout,
					shape: this.shape,
					displayArgument: config.viewArgs[i],
					viewCount: this.viewCount,
					zoomBase: this.zoomBase,
					index: i});
				this.views.push(view);}

			this.parent.selectAll('.divider').data(this.shape.getDividers(this.viewCount)).enter()
				.append('line').attr('class', 'divider')
				.attr('stroke', 'black')
				.attr('stroke-width', 8)
				.attr('x1', function(d) {return d.x1;})
				.attr('y1', function(d) {return d.y1;})
				.attr('x2', function(d) {return d.x2;})
				.attr('y2', function(d) {return d.y2;});
		},
		{
			set size(value) {
				if (this.w === value[0] && this.h === value[1]) {return;}
				this.w = value[0];
				this.h = value[1];
				this.shape.size = value;
				this.views.forEach(function(view) {view.onShapeChange();});

				this.parent.selectAll('.divider').data(this.shape.getDividers(this.viewCount))
					.attr('x1', function(d) {return d.x1;})
					.attr('y1', function(d) {return d.y1;})
					.attr('x2', function(d) {return d.x2;})
					.attr('y2', function(d) {return d.y2;});},

			delete: function() {
				this.parent.selectAll('.divider').remove();
				this.views.forEach(function(view) {view.delete();});}
		});

})(PATHBUBBLES);
