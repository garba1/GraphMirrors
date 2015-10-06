(function($P){
	$P.Image = {};

	$P.Image.Svg = $P.defineClass(
		null,
		function SVG(svgElement) {
			if (!(this instanceof SVG)) {return new SVG(svgElement);}

			this.root = svgElement.cloneNode(true);
			var root = this.root;

			// Grab inherited style elements.
			var forEach = function(pseudoArray, f) {Array.prototype.slice.call(pseudoArray).forEach(f);};
			var stylesText = '';
			forEach(document.styleSheets, function(sheet) {
				forEach(sheet.cssRules, function(rule) {
					if ('undefined' !== typeof(rule.style)) {
						if (svgElement.querySelectorAll(rule.selectorText).length > 0) {
							stylesText += rule.selectorText + ' { ' + rule.style.cssText + ' }\n';}}});});
			// Apply inherited style elements directly to svg.
			var stylesElement = document.createElement('style');
			stylesElement.setAttribute('type', 'text/css');
			stylesElement.innerHTML = '<![CDATA[\n' + stylesText + '\n]]>';
			var defs = document.createElement('defs');
			defs.appendChild(stylesElement);
			root.insertBefore(defs, root.firstChild);

			root.setAttribute('version', '1.1');
			root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
			return this;},
		{
			// Must be called from user thread.
			saveToSvg: function(filename) {
				var data = [
					'<?xml version="1.0" standalone="no"?>\n',
					'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"\n',
					'  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n',
					this.root.outerHTML];
				var blob = new Blob(data, {type: 'text/svg'});
				$P.saveBlob(blob, filename);}
		});

})(PATHBUBBLES);
