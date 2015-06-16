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

			this.dbId = config.dbId;
			this.dataName = config.name || null;
			if (this.dataName) {this.name = this.dataName;}
			else {this.name = 'Table';}
			this.selectedFile = null;
			this.data = config.data || null;
			this.queryObject = config.queryObject || null;
			this.crosstalking = config.crosstalking || null;
			this.experimentType = config.experimentType || 'Ortholog';
			this.preHierarchical = config.preHierarchical || '';
			this.keepQuery = config.keepQuery || null;
			this.sourceRing = config.sourceRing || null;

			$.extend(config, {closeMenu: true, groupMenu: true});
			$P.BubbleBase.call(this, config);
			return this;},
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
					this.svg.init();}

			},

			getPersistObject: function(info) {
				var persist = $P.BubbleBase.prototype.getPersistObject.call(this, info);
				delete persist.config.sourceRing;
				return persist;}

		});
})(PATHBUBBLES);
