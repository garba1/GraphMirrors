(function($P){
	'use strict';

	$P.Bubble.Force = $P.defineClass(
		$P.Bubble,
		function ForceBubble(config) {
			var self = this;
			config.closeMenu = true;
			config.groupMenu = true;
			$P.BubbleBase.call(this, config);

			self.mode = config.mode || 'soup';
			self.pathways = config.pathways || [];

			self.contentConfig = config.contentConfig || {};
			self.contentConfig.pathways = self.pathways.slice();

			self.add($P.ActionButton.create({
				name: 'switch',
				text: 'S',
				action: function(canvas, x, y) {
					self.mode = 'split' === self.mode ? 'soup' : 'split';
					if ('split' === self.mode) {self.content.layoutSplit();}
					if ('soup' === self.mode) {self.content.layoutSoup();}
					self.content.updateSvgPosition();}}));
			self.repositionMenus();},
		{
			onAdded: function(parent) {
				$P.BubbleBase.prototype.onAdded.call(this, parent);
				this.ensureContent();},

			ensureContent: function() {
				var self = this;
				var config;
				if (!this.content) {
					config = this.contentConfig || {};
					config.parent = this;
					config.mode = this.mode;
					config = $.extend(config, this.getInteriorDimensions());
					this.content = new $P.Bubble.ForceContent(config);
				}},

			addPathway: function(pathway) {
				this.pathways.push(pathway);
				if (this.content) {
					this.content.addPathway(pathway, this.mode);}},

			receiveEvent: function(event) {
				var result;

				if ('dragPathway' == event.name && this.contains(event.x, event.y)) {
					if (!this.name) {this.name = event.pathwayName;}
					else {this.name = 'Split Force Diagram';}
					event.name = event.pathwayName;
					event.id = event.pathwayId;
					this.addPathway(event);
					this.content.layout.force.start();
					return {target: this, addLink: {color: this.content.getPathwayColor(event)},
									name: 'addedPathway', pathwayId: event.pathwayId};}

				result = $P.BubbleBase.prototype.receiveEvent.call(this, event);
				if (result) {return result;}

				return false;},

			onDelete: function() {
				$P.Bubble.prototype.onDelete.call(this);
				if (this.content) {
					this.content.layout.force.stop();}},

			saveCallback: function(save, id) {
				var self = this;
				var result = {};
				save.objects[id] = result;

				$P.Bubble.prototype.saveKeys.forEach(function(key) {
					result[key] = save.save(self[key]);});

				result.mode = save.save(self.mode);
				result.pathways = save.save(self.pathways);
				result.contentConfig = save.save(self.content);

				return id;},


			saveKeys: [].concat($P.Bubble.prototype.saveKeys, [
				'mode', 'pathways', 'contentConfig'])
		});

	$P.Bubble.Force.loader = function(load, id, data) {
		var config = {};
		$P.Bubble.Force.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});

		return new $P.Bubble.Force(config);};

})(PATHBUBBLES);
