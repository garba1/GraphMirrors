(function($P) {
	'use strict';

	$P.HtmlNote = $P.defineClass(
		$P.HtmlObject,
		function HtmlNote(config) {
			$P.HtmlObject.call(this, {
				parent: '#bubble',
				before: '#overlayCanvas',
				class: 'note',
				type: 'textarea',
				pointer: 'all',
				objectConfig: config});},
		{});
})(PATHBUBBLES);
