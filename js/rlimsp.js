PATHBUBBLES.rlimsp = (function($P, d3){
	'use strict';

	function getTextEvidence(pmid, onFinish) {

		$.ajax({
			type: 'GET',
			dataType: 'text',
			url: './php/getUrl.php',
			data: {
				url: 'http://research.bioinformatics.udel.edu/rlimsp'
					+ '/server/middle_layer/RlimsJson.php?rid=63&pmid='
					+ pmid},
			error: function(jqXHR, textStatus, errorThrown) {
				console.error(textStatus, errorThrown);
				onFinish(null);},
			success: function(data) {
				var rows = d3.csv.parseRows(data),
						sentenceRows = [],
						sentenceArray = [],
						authors = rows[2][2],
						publication = rows[2][3],
						link = rows[2][4],
						proteins = {},
						sentences = {},
						i, protein;

				for (i = 5; rows[i][0] !== '#Gene Normalization'; ++i) {
					sentenceRows.push(rows[i]);}

				for (i += 2; i < rows.length; ++i) {
					protein = rows[i][1];
					if (!proteins[protein]) {
						proteins[protein] = {
							name: protein,
							uniprotKB_AC: [rows[i][2]]};}
					else {
						proteins[protein].uniprotKB_AC.push(rows[i][2]);}}

				sentenceRows.forEach(function(sentenceRow) {
					var kinase = sentenceRow[1],
							substrate = sentenceRow[2],
							site = sentenceRow[3],
							sentence = sentenceRow[4],
							entry = {
								kinase: kinase,
								substrate: substrate,
								sentence: sentence,
								site: site};
					if (undefined === sentences[kinase]) {
						sentences[kinase] = {};}
					if (undefined === sentences[kinase][substrate]) {
						sentences[kinase][substrate] = [];}
					sentences[kinase][substrate].push(entry);
					sentenceArray.push(entry);
				});

				onFinish({
					authors: authors,
					publication: publication,
					link: link,
					proteins: proteins,
					sentences: sentences,
					sentenceArray: sentenceArray});}});}

	return {
		getTextEvidence: getTextEvidence
	};

})(PATHBUBBLES, d3);
