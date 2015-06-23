/**
 * @author      Yongnan
 * @version     1.0
 * @time        10/18/2014
 * @name        PathBubble_Table
 */

(function($P){
	'use strict';

	$P.Table = $P.defineClass(
		$P.BubbleBase,
		function Table(config) {
			if (!(this instanceof Table)) {return new Table(config);}
			this.class = 'Table';

			var self = this;

			self.dbId = config.dbId;
			self.dataName = config.name || null;
			self.name = config.name || config.dataName || 'Table';
			self.selectedFile = null;
			self.data = config.data || null;
			self.queryObject = config.queryObject || null;
			self.crosstalking = config.crosstalking || null;
			self.experimentType = config.experimentType || 'Ortholog';
			self.preHierarchical = config.preHierarchical || '';
			self.keepQuery = config.keepQuery || null;
			self.sourceRing = config.sourceRing || null;

			$.extend(config, {closeMenu: true, groupMenu: true});
			$P.BubbleBase.call(self, config);

			self.add($P.ActionButton.create({
				name: 'export',
				text: 'E',
				action: self.exportData.bind(self)}));
			self.repositionMenus();

			return self;},
		{
			onAdded: function(parent) {
				var config;

				$P.BubbleBase.prototype.onAdded.call(this, parent);

				if (!this.svg) {
					config = {parent: this, data: this.data};
					$.extend(config, this.getInteriorDimensions());
					if (this.queryObject) {
						config.dbId = this.queryObject.dbId;
						config.querySymbol = this.queryObject.symbol;}
					else {
						config.dbId = this.dbId;}
					this.svg = new $P.D3Table(config);
					if (!config.data) {this.svg.init();}}

			},

			exportData: function() {
				if (!this.svg) {return false;}
				var data = this.svg.exportData();
				var text = data.map(function(row) {return row.join(',');}).join('\n');
				$P.saveString(text, this.name + '.csv');
				return true;},

			saveKeys: [].concat($P.Bubble.prototype.saveKeys, [
				'dbId',
				'dataName',
				'name',
				'data',
				'queryObject',
				// grab crosstalking from parent
				'experimentType',
				'keepQuery',
				'sourceRing'])
		});

	$P.Table.loader = function(load, id, data) {
		var config = {};
		$P.Table.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});

		var bubble = new $P.Table(config);
		load.objects[id] = bubble;

		return bubble;};


})(PATHBUBBLES);
