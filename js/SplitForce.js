(function($P){
	'use strict';

	$P.SplitForce = $P.defineClass(
		$P.BubbleBase,
		function SplitForce(config) {
			var self = this;
			config.closeMenu = true;
			config.groupMenu = true;
			$P.BubbleBase.call(this, config);

			this.mode = config.mode || 'split';
			this.pathways = [];

			this.add($P.ActionButton.create({
				name: 'switch',
				text: 'S',
				action: function(canvas, x, y) {
					self.mode = 'split' === self.mode ? 'soup' : 'split';
					if ('split' === self.mode) {self.svg.layoutSplit();}
					if ('soup' === self.mode) {self.svg.layoutSoup();}
					self.svg.updateSvgPosition();}
			}));
			this.repositionMenus();},
		{
			onAdded: function(parent) {
				$P.BubbleBase.prototype.onAdded.call(this, parent);
				this.ensureContent();},

			ensureContent: function() {
				var self = this;
				var config;
				if (!this.svg) {
					config = {
						parent: this
						//ids: this.ids,
						//leftPathway: this.leftPathway,
						//rightPathway: this.rightPathway
					};
					config = $.extend(config, this.getInteriorDimensions());
					this.svg = new $P.D3SplitForce(config);}},

			receiveEvent: function(event) {
				var result;

				if ('dragPathway' == event.name && this.contains(event.x, event.y)) {
					if (!this.name) {this.name = event.pathwayName;}
					else {this.name = 'Split Force Diagram';}
					event.name = event.pathwayName;
					event.id = event.pathwayId;
					this.pathways.push(event);
					this.svg.addPathway(event);
					return {target: this, name: 'addedPathway', pathwayId: event.pathwayId};}

				result = $P.BubbleBase.prototype.receiveEvent.call(this, event);
				if (result) {return result;}

				return false;}
		});

})(PATHBUBBLES);
