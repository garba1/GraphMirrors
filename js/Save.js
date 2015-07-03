(function($P){
	'use strict';

	$P.Save = $P.defineClass(
		null,
		function Save(root) {
			if (!(this instanceof Save)) {return new Save(root);}
			this.classCounts = {};
			this.objects = {};
			this.data = this.save(root);
			$.each(this.objects, function(_, object) {
				delete object.saveId;});

			console.log('SAVE', this);

			return this;},
		{
			getSaveId: function(object) {
				if ('object' !== typeof object || null === object) {return null;}
				var classname = object.classname;
				if (!classname && Array.isArray(object)) {classname = 'Array';}
				if (!classname) {classname = 'Object';}
				if (undefined === object.saveId) {
					this.classCounts[classname] = this.classCounts[classname] || 0;
					object.saveId = classname + ':' + this.classCounts[classname];
					++this.classCounts[classname];}
				return object.saveId;},

			// Save object and descendants to this.objects if needed.
			// Returns the final save version of the object.
			save: function(object) {
				var self = this;
				var id = self.getSaveId(object);
				var save;

				if (self.objects[id]) {
					return id;}

				if ('object' !== typeof object || null === object) {
					return object;}

				if (object.__no_save__) {return undefined;}

				if (Array.isArray(object)) {
					save = [];
					self.objects[id] = save;
					object.forEach(function(subobject) {
						save.push(self.save(subobject));});
					return id;}

				if (object.saveCallback) {
					return object.saveCallback(self, id);}

				if (object.saveKeys) {
					save = {};
					self.objects[id] = save;
					object.saveKeys.forEach(function(key) {
						save[key] = self.save(object[key]);});
					return id;}

				// Basic Object.
				save = {};
				self.objects[id] = save;
				console.log('Saving:', object);
				$.each(object, function(key, value) {
					save[key] = self.save(value);});
				return id;},

			write: function() {
				var data = ['{"root":"', this.data, '","objects":{'];
				$.each(this.objects, function(key, value) {
					data.push('"' + key + '":');
					data.push(JSON.stringify(value));
					data.push(',');});
				data.splice(data.length - 1, 1);
				data.push('}}');

				$P.saveArray(data, 'session.json');}
		});

})(PATHBUBBLES);
