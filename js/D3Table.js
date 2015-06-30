/**
 * @author      Yongnan
 * @version     1.0
 * @time        10/18/2014
 * @name        PathBubble_D3Table
 */

(function($P){
	'use strict';

	function sort(a,b){
		if ('object' === typeof a) {return sort(a.value, b.value);}
		if(typeof a == 'string'){
			if(typeof parseFloat(a) == 'number' && typeof parseFloat(b) == 'number' )
			{
				if(!isNaN( parseFloat(a) ) && !isNaN (parseFloat(b) )  )
					return parseFloat(a) > parseFloat(b) ? 1 : parseFloat(a) == parseFloat(b) ? 0 : -1;
				else
					return a.localeCompare(b);
			}
			else
				return a.localeCompare(b);
		}
		else if(typeof a == 'number'){
			return a > b ? 1 : a == b ? 0 : -1;
		}
		else if(typeof a == 'boolean'){
			return b ? 1 : a ? -1 : 0;
		}
		return null;}

	$P.D3Table = $P.defineClass(
		$P.HtmlObject,
		function D3Table(config) {
			$P.HtmlObject.call(this, {
				parent: '#bubble',
				before: '#overlayCanvas',
				type: 'div',
				pointer: 'auto',
				objectConfig: config});
			this.maxHeight = this.h;
			this.dbId = config.dbId || null;
			this.querySymbol = config.querySymbol || null;
			this.keepQuery = undefined === config.keepQuery ? true : config.keepQuery;
			this._symbols2Pathways = this.parent.crosstalking;
			this.data = config.data || null;
		},
		{
			onPositionChanged: function(dx, dy, dw, dh) {
				$P.HtmlObject.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
				this.maxHeight += dh;},
			get data() {return this._data;},
			set data(data) {
				if (!data) {return;}

				var self = this;
				self._data = data;

				var oldH = self.h,
						newH = Math.min(data.length * 12 + 100, self.maxHeight);
				self.parent.translate(0, 0, 0, newH - oldH);
				//self.move(null, null, null, newH);

				var container = d3.select(self.element)
							.style('width', self.w)
							.style('height', self.h)
							.style('border', '2px solid #000')
							.style('overflow', 'scroll');

				container.select('table').remove();
				var table = container.append('table')
							.style('width', self.w)
							.style('height', self.h);
				var thead = table.append('thead');
				table.append('tbody');

				var keys = d3.keys(data[0]).filter(function(key) {return 'disabled' !== self.cellFormatters[key];});
				this.keys = keys;
				function hasKey(key) {return -1 !== keys.indexOf(key);}

				var sortToggle = new Array(keys.length);
				// create the table header
				thead.selectAll('th')
					.data(keys)
					.enter().append('th')
					.style('padding', '5px')
					.text(function (d) {
						if ('ratio' === d) {return 'ratio(log2 based)';}
						return d;})
					.on('click', function(d, i) {
						var sorter;
						sortToggle[i] = !sortToggle[i];
						if (sortToggle[i]) {
							sorter = function(a, b) {return sort(a[d], b[d]);};}
						else {
							sorter = function(a, b) {return sort(b[d], a[d]);};}
						container.select('tbody').selectAll('tr').sort(sorter);});

				// fill the table
				// create rows
				var tr = container.select('tbody').selectAll('tr').data(data);
				tr.enter().append('tr');

				var tableStats = self.tableStats(keys, data);

				// create cells
				var td = tr.selectAll('td').data(function (d) {
					var data = d3.entries(d).filter(function(entry) {
						return 'disabled' !== self.cellFormatters[entry.key];});
					if (d.symbol) {
						data.forEach(function(datum) {datum.symbol = d.symbol;});}
					return data;});
				var cellTd = td.enter().append('td');

				cellTd
					.on('click', function (d, i){return self.onClickCell('left', d, i);})
					.on('contextmenu', function (d, i){return self.onClickCell('right', d, i);})
					.each(function(d, i) {
						var formatter = self.cellFormatters[d.key] || self.cellFormatters.default;
						if (formatter) {formatter.call(null, this, d, i, tableStats);}});

			},
			init: function (config) {
				if (undefined === config) {config = {};}
				if (undefined !== config.dbId) {this.dbId = config.dbId;}
				if (undefined !== config.querySymbol) {this.querySymbol = config.querySymbol;}

				var self = this;

				refreshTable(null);
				function refreshTable(sortOn){
					if (!self.data) {
						if (self.querySymbol) {
							$P.getJSON('./php/querybyPathwayIdSymbol.php', function(data) {self.data = data;}, {
								type: 'GET',
								data: {pathwaydbId: self.dbId, symbol: self.querySymbol}});}
						else {
							$P.getJSON('./php/querybyPathwayId.php', function(data) {self.data = data;}, {
								type: 'GET',
								data: {pathwaydbId: self.dbId}});
						}
					}
				}},

			/**
			 * Run callback with data as the first argument.
			 */
			withData: function(callback) {
				var self = this, ajax;
				if (this.data) {
					callback(this.data);
					return;}

				ajax = {
					type: 'GET',
					data: {pathwaydbId: this.dbId},
					success: function (data) {
						self.data = data;
						callback(data);},
					error: function () {
						console.error('D3Table#withData(', callback, '): Could not retrieve data.');}};

				if (this.querySymbol) {
					ajax.url = './php/querybyPathwayIdSymbol.php';
					ajax.data.symbol = this.querySymbol;}
				else {
					ajax.url = './php/querybyPathwayId.php';}

				$.ajax(ajax);
			},

			tableStats: function(keys, data) {
				var stats = {};

				function hasKey(key) {return -1 !== keys.indexOf(key);}
				function max(key) {return d3.max(data, $P.getter(key));}
				function min(key) {return d3.min(data, $P.getter(key));}

				if (hasKey('count')) {stats.maxCount = max('count');}
				if (hasKey('crosstalk')) {stats.maxCrosstalk = max('crosstalk');}
				if (hasKey('crossTalk')) {stats.maxCrosstalk = max('crossTalk');}
				if (hasKey('ratio')) {
					stats.maxRatio = max('ratio');
					stats.minRatio = min('ratio');}
				if (hasKey('fisher')) {
					stats.maxFisher = Math.log(d3.max(data, function(d) {return d.fisher.value;})) / $P.ln10;
					stats.minFisher = Math.log(d3.min(data, function(d) {return d.fisher.value;})) / $P.ln10;}

				return stats;},

			onClickCell: function(button, datum, index) {
				var i, treeRing, table, symbolIndex, pathways;
				var self = this;
				if('symbol' === datum.key) {
					if ('left' === button) {
						this.parent.parent.add(new $P.Bubble.IFrame({
							w: 560,
							h: 500,
							url: 'http://www.ncbi.nlm.nih.gov/gquery/?term=' + datum.value}));
						d3.event.stopPropagation();
						d3.event.preventDefault();
						return true;}
					if ('right' === button) {
						if ('string' === typeof datum.value) {
							table = new $P.Table({
								name: datum.value,
								queryObject: {dbId: this.dbId, symbol: datum.value}});
							self.parent.parent.add(table);
							d3.event.stopPropagation();
							d3.event.preventDefault();
							return true;}}}
				else if('crosstalk' === datum.key || 'crossTalk' === datum.key) {
					if ('left' === button) {
						if (0 === datum.value) {
							alert('It does not have cross-talking pathways!');}
						else {
							treeRing = self.parent.sourceRing;
							symbolIndex = this._symbols2Pathways.symbols.indexOf(datum.symbol);
							if (-1 !== symbolIndex) {
								pathways = self._symbols2Pathways.pathwayNames[symbolIndex].slice(0);
								for (i = 0; i < pathways.length; ++i) {
									pathways[i] = $.trim(pathways[i]);}
								if (!treeRing) {return true;}
								treeRing.createSvg({highlightPathways: pathways});}}
						d3.event.stopPropagation();
						d3.event.preventDefault();
						return true;}}
				return false;},

			exportData: function() {
				var self = this;
				if (!self.data) {return null;}
				var data = [];
				data.push(self.keys.slice());
				self.data.forEach(function(row) {
					var dataRow = [];
					data.push(dataRow);
					self.keys.forEach(function(key) {
						var exporter = self.exportFormatters[key] || self.exportFormatters.default;
						dataRow.push(exporter(row[key]));});});
				return data;},

			exportFormatters: {
				default: function(datum) {
					while ('object' === typeof datum) {datum = datum.value;}
					return datum;}
			},

			cellFormatters: {
				default: function(element, datum, index, stats) {
					d3.select(element).append('text')
						.style('margin', '0px 5px')
						.attr('class', 'normalCell')
						.text($P.getter('value'));},

				symbol: function(element, datum, index, stats) {
					d3.select(element).append('text')
						.style('margin', '0px 5px')
						.attr('class', 'hyper')
						.text($P.getter('value'));},

				crossTalk: function(element, datum, index, stats) {
					var selection = d3.select(element);
					selection.append('text')
						.style('margin', '0px 5px')
						.attr('class', 'hyper')
						.text($P.getter('value'));

					var max = stats.maxCrosstalk;
					if (!max) {return;}

					selection.append('span')
						.attr('class', 'meter')
						.style('width', (datum.value / max * 20) + 'px')
						.style('height', '10px');},

				count: 'disabled',

				rateLimit: function(element, datum, index, stats) {
					var selection = d3.select(element);
					selection.append('text')
						.style('margin', '0px 5px')
						.attr('class', 'hyper')
						.text($P.getter('value'));

					selection.append('span')
						.attr('class', 'meter')
						.style('width', (datum.value ? 20 : 0) + 'px')
						.style('height', '10px');},

				ratio: function(element, datum, index, stats) {
					var selection = d3.select(element);
					selection.append('text')
						.style('margin', '0px 5px')
						.attr('class', 'hyper')
						.text($P.getter('value'));

					var min = stats.minRatio;
					var max = stats.maxRatio;
					if (!min || !max) {return;}
					var range = max - min;

					selection.append('span')
						.attr('class', 'meter')
						.style('width', ((parseFloat(datum.value) - min) / range * 20) + 'px')
						.style('height', '10px');},

				fisher: function(element, datum, index, stats) {
					var selection = d3.select(element);
					selection.append('text')
						.style('margin', '0px 5px')
						.attr('class', 'normalCell')
						.text(datum.value.value);
					selection.style('background-color', datum.value.color);}

			}
		});
})(PATHBUBBLES);
