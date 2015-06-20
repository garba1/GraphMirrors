(function($P) {
	'use strict';

	// A consistent way to append to d3 elements.
	$P.D3.Element = $P.defineClass(
		null,
		function D3Element(config) {
			this.selection = d3.select(config.parent).append(config.elementType);
		},
		{

		});

	$P.D3.Element.appender = function(constructor, config, callback) {
		return function(d, i) {
			if (config instanceof Function) {
				config = config.call(this, d, i);}
			else if (!config) {
				config = {};}

			config.parent = this;
			config.datum = d;
			config.index = i;

			var object = new constructor(config);
			if (callback) {callback(object);}};};


})(PATHBUBBLES);
