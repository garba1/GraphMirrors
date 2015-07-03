(function($P) {
	'use strict';

	// A consistent way to append to d3 elements.
	$P.D3.Element = $P.defineClass(
		null,
		function D3Element(config) {
			if (config.element) {
				this.selection = d3.select(config.element);}
			else {
				this.selection = d3.select(config.parent).append(config.elementType);}
			this.selection.classed('update-displays', true);
		},
		{
			update: function() {},
			remove: function() {this.selection.remove();}
		});

	$P.D3.Element.appender = function(constructor, config, callback) {
		return function(d, i) {
			var c = config;
			if (c instanceof Function) {
				c = c.call(this, d, i);}
			else if (!config) {
				c = {};}

			c.parent = this;
			c.datum = d || {};
			c.index = i;

			var object = new constructor(c);
			if (callback) {callback(object);}
			return object;};};


})(PATHBUBBLES);
