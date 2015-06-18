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
			if (self.dataName) {self.name = self.dataName;}
			else {self.name = 'Table';}
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

			getPersistObject: function(info) {
				var persist = $P.BubbleBase.prototype.getPersistObject.call(this, info);
				delete persist.config.sourceRing;
				return persist;},

			exportData: function() {
				if (!this.svg) {return false;}
				var data = this.svg.exportData();
				var a = document.createElement('a');
				var text = data.map(function(row) {return row.join(',');}).join('\n');
				a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
				a.setAttribute('download', this.name + '.csv');
				a.style.display = 'none';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				return true;}
		});
})(PATHBUBBLES);
