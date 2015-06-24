(function($P){
	'use strict';

	$P.Load = $P.defineClass(
		null,
		function Load(file) {
			if (!(this instanceof Load)) {return new Load(file);}
			var self = this;

			self.objects = {};

			var reader = new FileReader();
			reader.onload = function() {
				self.data = JSON.parse(reader.result);
				console.log('LOAD', self.data);
				var result = self.loadObject(self.data.root);
				console.log(result);};
			reader.readAsText(file);
			return this;},
		{
			loadObject: function(id) {
				var self = this;
				var classname, loader;

				if (!self.data.objects[id]) {return id;}

				var object = self.objects[id];
				if (!object) {
					classname = id.split(':')[0];

					if ('Array' === classname) {
						object = [];
						self.objects[id] = object;
						self.data.objects[id].forEach(function(value) {
							if (self.data.objects[value]) {
								object.push(self.loadObject(value));}
							else {
								object.push(value);}});}

					else {
						loader = 'Object' !== classname && $P.classes[classname].loader;
						if (loader) {
							object = loader(self, id, self.data.objects[id]);}
						else {
							object = {};
							self.objects[id] = object;
							$.each(self.data.objects[id], function(key, value) {
								if (self.data.objects[value]) {
									object[key] = self.loadObject(value);}
								else {
									object[key] = value;}});}}}


				return object;}});

})(PATHBUBBLES);
