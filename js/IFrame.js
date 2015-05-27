(function($P) {
	'use strict';

	$P.IFrame = $P.defineClass(
		$P.HtmlObject,
		function IFrame(config) {
			$P.HtmlObject.call(this, {
				parent: '#bubble',
				before: '#overlayCanvas',
				type: 'iframe',
				pointer: 'all',
				objectConfig: config});
			this.element.setAttribute('src', config.url);},
		{
		});

})(PATHBUBBLES);
