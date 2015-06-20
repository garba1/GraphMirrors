(function($P){
	'use strict';

	$P.FileLoader = $P.defineClass(
		null,
		function (config) {
			this.type = config.type;
			this.loadstart = config.loadstart || null;
			this.loadstart = config.loadend || null;
			this.progress = config.progress || null;
		},
		{
			load: function (url, callback) {
				var _this = this;
				if (typeof url === 'undefined') {
					alert("Please Choose the data which needs to load!");
					return;
				}
				var reader = new FileReader();
				//        this.statusDomElement = this.addStatusElement();
				//        $("#bubble")[0].appendChild(this.statusDomElement);
				reader.onloadstart = this.loadstart;
				reader.onloadend = this.loadend;
				reader.onprogress = this.progress;
				reader.onerror = function () {
					//            _this.statusDomElement.innerHTML = "Could not read file, error code is " + reader.error.code;
				};

				reader.onload = function () {
					var result = [];
					var tempdata = "";
					tempdata = reader.result;
					if (tempdata != null) {
						if (_this.type == "Ortholog") {
							tempdata = tempdata.replace(/\r\n/g, '\n');
							tempdata = tempdata.replace(/\r/g, '\n');
							var orthology = tempdata.split("\n");

							for (var j = 0; j < orthology.length; ++j) {
								if (orthology[j] == ""||orthology[j] == " ") {
									continue;
								}

								var obj = {};
								var temps = orthology[j].split("\t");
								if(temps.length!==2)
								{
									alert("Please check your ortholog data format.!");
									return;
								}
								if (temps[0] == "symbol" && temps[1] == "dbId") {
									continue;
								}
								if(typeof temps[0] !=="string")
									continue;
								obj.symbol = temps[0].toUpperCase();
								obj.dbId = temps[1];
								result.push(obj);
							}
						}
						else if (_this.type == "Expression") {
							tempdata = tempdata.replace(/\r\n/g, '\n');
							tempdata = tempdata.replace(/\r/g, '\n');
							var lines = tempdata.split('\n');

							lines.forEach(function(line) {
								var tokens = line.split('\t');
								if (tokens.length < 2
										|| 'gene_id' === tokens[0]
										|| 'Infinity' === tokens[2]) {
									return;}
								else if ('up_name' === tokens[0]) {
									result.upName = tokens[1];}
								else if ('down_name' === tokens[0]) {
									result.downName = tokens[1];}
								else if ('up_cutoff' === tokens[0]) {
									result.upCutoff = Math.log(parseFloat(tokens[1]))/Math.log(2);}
								else if ('down_cutoff' === tokens[0]) {
									result.downCutoff = Math.log(parseFloat(tokens[1]))/Math.log(2);}
								else if ('up_cutoff_log2' === tokens[0]) {
									result.upCutoff = parseFloat(tokens[1]);}
								else if ('down_cutoff_log2' === tokens[0]) {
									result.downCutoff = parseFloat(tokens[1]);}
								else if (!isNaN(parseFloat(tokens[2]))) {
									result.push({
										gene_id: tokens[0],
										symbol: tokens[1].toUpperCase(),
										ratio: Math.log(parseFloat(tokens[2]))/Math.log(2)});}});}
						callback(result);
					}
				};
				reader.readAsText(url, "UTF-8");
			}
		});
})(PATHBUBBLES);
