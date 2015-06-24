(function($P){
	'use strict';

	$P.ForceDisplay = $P.defineClass(
		null,
		function ForceDisplay(config) {
			var i, view;

			this.views = [];

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
			get parent() {return this._parent;},
			set parent(value) {
				if (value === this._parent) {return;}
				this._parent = value;
				this.views.forEach(function(view) {view.parent = value;});},
			get parentBubble() {return this._parentBubble;},
			set parentBubble(value) {
				if (value === this._parentBubble) {return;}
				this._parentBubble = value;
				this.views.forEach(function(view) {view.parentBubble = value;});},

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
				this.views.forEach(function(view) {view.delete();});},

			saveCallback: function(save, id) {
				var result = {};
				save.objects[id] = result;
				result.layout = save.save(this.layout);
				result.shape = save.save(this.shape);
				result.viewConstructor = this.viewConstructor.name;
				return id;},

			getZoomBase: function() {
				return this.views.length > 0 && this.views[0].zoom.base;}
		});

	$P.ForceDisplay.loader = function(load, id, data) {
		return new $P.ForceDisplay({
			layout: load.loadObject(data.layout),
			shape: load.loadObject(data.shape),
			viewConstructor: $P.classes[data.viewConstructor]});};

})(PATHBUBBLES);
