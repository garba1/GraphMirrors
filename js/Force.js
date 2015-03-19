/**
 * @author Alexander Garbarino
 * @version 1.0
 * @time 12/22/2014
 * @name Force
 */

var $P = PATHBUBBLES;

$P.Force = $P.defineClass(
	$P.BubbleBase,
	function Force(config) {
		config.name = config.name || 'Force';
		config.closeMenu = true;
		config.groupMenu = true;
		$P.BubbleBase.call(this, config);

		this.add($P.ActionButton.create('mirror'));
		this.repositionMenus();

		this.pathways = {};},
	{
		/**
		 * Adds a pathway to this diagram's registry.
		 * @param {(string|number)} id - The pathway id. Coerced to an integer.
		 * @param {string} name - the name of the pathway
		 * @param {string} preferredColor - the preferred color to assign to this pathway
		 */
		addPathway: function(id, name, preferredColor) {
			if ('string' === typeof id || id instanceof String) {id = parseInt(id);}
			if (this.pathways[id]) {
				console.error('Pathway already exists:', id);
				return;}
			if ('Force' === this.name) {this.name = name;}
			this.pathways[id] = {id: id, name: name, color: this.pickPathwayColor(preferredColor)};
			if (this.svg) {this.svg.onPathwayRegistered(id);}},
		/**
		 * Gets the color associated with a given pathway.
		 * @param {(string|number)} id - The pathway id. Coerced to an integer.
		 * @returns {string} - the pathway color
		 */
		getPathwayColor: function(id) {
			var pathway = this.pathways[id];
			if (pathway) {return pathway.color;}
			return null;},
		pickPathwayColor: function(preferredColor) {
			var colors = $P.BubbleBase.colors.slice(0),
					color, pathway;
			for (pathway in this.pathways) {
				$P.removeFromList(colors, this.pathways[pathway].color);}
			if (0 === colors.length) {return '#666';}
			if (-1 !== colors.indexOf(preferredColor)) {return preferredColor;}
			return colors[0];},
		onAdded: function(parent) {
			var config;
			$P.BubbleBase.prototype.onAdded.call(this, parent);

			if (!this.svg) {
				config = {parent: this};
				config = $.extend(config, this.getInteriorDimensions());
				this.svg = new $P.D3Force(config);}},
		receiveEvent: function(event) {
			var result;

			if ('reactionDrag' == event.name && this.contains(event.x, event.y)) {return this;}

			result = $P.BubbleBase.prototype.receiveEvent.call(this, event);
			if (result) {return result;}

			return false;}
	});
