(function($P) {
	'use strict';

	$P.NoteFrame = $P.defineClass(
		$P.Frame,
		function NoteFrame(config) {
			var self = this;
			config.strokeStyle = config.strokeStyle || 'yellow';
			if (undefined == config.lineWidth) {config.lineWidth = 12;}
			config.resizeWidth = 20;
			$P.Frame.call(self, config);
			function set(key) {
				if (undefined !== config[key]) {
					self[key] = config[key];}}
			set('text');
			set('follow');
			set('followLayoutId');},
		{
			get text() {return this.content && $(this.content.element).val();},
			set text(value) {
				if (this.content) {
					$(this.content.element).val(value);}
				else {
					this._readyText = value;}},

			get follow() {return this._follow;},
			set follow(value) {
				if (value === this._follow) {return;}
				this._follow = value;},

			receiveEvent: function(event) {
				if (this.expandedContains(event.x, event.y, this.lineWidth)) {
					var a= 1;
				}
				return $P.Frame.prototype.receiveEvent.apply(this, arguments);},

			drawSelf: function() {
				if (this.follow) {
					var rect = this.follow.getBoundingClientRect();
					this.move($P.state.scrollX + rect.right, rect.bottom - 50);}
				if (this.parent.contains(this.x, this.y)) {
					$(this.content.element).show();
					$P.Frame.prototype.drawSelf.apply(this, arguments);}
				else {
					$(this.content.element).hide();}},

			onAdded: function(parent) {
				if ($P.Frame.prototype.onAdded.call(this, parent) || this.content) {return;}
				var config = {};
				config = $.extend(config, this.getInteriorDimensions());
				config.parent = this;
				this.content = new $P.HtmlNote(config);
				this.content.element.style.border = '1px solid black';

				d3.select(this.content.element)
					.on('mousedown', function() {
						var mouse = $P.state.mainCanvas.getMouseLocation(d3.event);
						$P.state.mainCanvas.mousedown(d3.event, mouse.x, mouse.y, this);})
					.on('mouseup', function() {
						var mouse = $P.state.mainCanvas.getMouseLocation(d3.event);
						$P.state.mainCanvas.mouseup(d3.event, mouse.x, mouse.y, this);})
					.on('mousemove', function() {
						var mouse = $P.state.mainCanvas.getMouseLocation(d3.event);
						$P.state.mainCanvas.mousemove(d3.event, mouse.x, mouse.y, this);});

				if (this._readyText) {
					this.text = this._readyText;
					delete this._readyText;}},

			//onParentPositionChanged: function() {},

			saveKeys: [].concat($P.Frame.prototype.saveKeys, ['text', 'followLayoutId'])


		});

	$P.NoteFrame.loader = function(load, id, data) {
		var config = {};
		$P.Frame.Note.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});
		var frame = new $P.NoteFrame(config);
		load.objects[id] = frame;

		return frame;};

})(PATHBUBBLES);
