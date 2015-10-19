(function($P){
	'use strict';

	$P.BubbleBase = $P.defineClass(
		$P.Frame,
		function BubbleBase(config) {
			//if (!(this instanceof BubbleBase)) {return new BubbleBase(config);}

			var group;
			if (!config.strokeStyle) {
				config.strokeStyle = $P.BubbleBase.getUnusedColor();}
			config.cornerRadius = config.cornerRadius || 20;
			if (undefined === config.lineWidth) {config.lineWidth = 12;}

			this.links = [];
			this.neighbors = {left: null, right: null};
			var parent = config.parent;
			config.parent = null;

			$P.Frame.call(this, config);

			if (config.closeMenu) {this.add($P.ActionButton.create('close'));}
			if (config.mainMenu || this.menu) {
				this.menuButton = $P.ActionButton.create('menu');
				this.add(this.menuButton);}
			if (config.groupMenu) {
				this.groupButton = $P.ActionButton.create('group');
				this.add(this.groupButton);}
			if (config.resetMenu) {this.add($P.ActionButton.create('reset'));}

			this.repositionMenus();

			this.title = new $P.Title({parent: this, name: '', strokeStyle: this.strokeStyle});
			this.name = config.name || '';
			if (this.name instanceof Function) {this.name = this.name.call(this);}
			return this;},
		{
			get name() {return this._name;},
			set name(value) {
				this._name = value;
				if (this.title) {this.title.name = value;}},

			get strokeStyle() {return this._strokeStyle;},
			set strokeStyle(value) {
				if (this._strokeStyle) {$P.BubbleBase.adjustColorCount(this._strokeStyle, -1);}
				this._strokeStyle = value;
				if (this.title) {
					this.title.strokeStyle = value;
					this.title.fillStyle = value;}
				$P.state.markDirty();
				if (this._strokeStyle) {$P.BubbleBase.adjustColorCount(this._strokeStyle, 1);}},

			onRemoved: function(parent) {
				if (this.menu && this.menu.HighLight_State) {
					this.menu.Highlight_State = false;
					if (this.button) {this.button.hide();}}},

			onAdded: function(parent) {
				if (!(parent instanceof $P.BubbleGroup)) {
					this.parent.add(new $P.BubbleGroup({children: [this]}));
					return true;}
				return false;},

			repositionMenus: function() {
				var i, offset, menu, unit;
				unit = this.cornerRadius * 0.5;
				offset = 0;
				this.children.forEach(function(child) {
					if (child instanceof $P.ActionButton) {
						child.move(this.x + this.w - unit * 2 - offset * (2 * unit + 1), this.y - unit * 0.2);
						++offset;}
				}.bind(this));
			},
			onDelete: function() {
				this.strokeStyle = null;
				$P.Frame.prototype.onDelete.call(this);
				this.links.slice(0)
					.forEach(function(link) {
						link.delete();});
				if (1 == this.parent.children.length) {
					this.parent.delete();}},
			/**
			 * Remove self from group.
			 */
			ungroup: function() {
				if (1 == this.parent.children.length) {return;}
				this.strokeStyle = $P.BubbleBase.getUnusedColor();
				$P.state.scene.add(this, 0);
				this.groupButton.setHighlighted(false);},

			receiveEvent: function(event) {
				var result;
				if (('bubbleCreated' == event.name || 'bubbleMoved' == event.name)
						&& this.parent && event.bubble && event.bubble.parent
						&& event.bubble !== this && event.bubble.parent !== this.parent
						&& !this.inMotion && !event.bubble.inMotion
						&& !this.parent.inMotion && !event.bubble.parent.inMotion
						&& this.intersects(event.bubble)) {
					if (event.bubble.parent.centerX <= this.parent.centerX) {
						this.parent.move(event.bubble.parent.x + event.bubble.parent.w + 1);
						return true;}
					else {
						this.parent.move(event.bubble.parent.x - this.parent.w - 1);
						return true;}}

				return $P.Frame.prototype.receiveEvent.call(this, event);},

			/**
			 * Handle the mousemove event.
			 * @param {*} event - The actual event.
			 * @returns {boolean} - if the event should stop propagating
			 */
			mousemove: function(event) {
				var direction, cursor;
				if (event.name !== 'mousemove') {return false;}

				if (this.contains(event.x, event.y) || this.title.contains(event.x, event.y)) {
					return false;}

				direction = this.getResizeDirection(event.x, event.y);
				if (direction && this.expandedContains(event.x, event.y, this.lineWidth)) {
					if ('e' === direction && this.neighbors.right) {cursor = 'col-resize';}
					else if ('w' === direction && this.neighbors.left) {cursor = 'col-resize';}
					else {cursor = direction + '-resize';}
					$P.state.mainCanvas.setCursor(cursor);
					return true;}

				return false;},

			/**
			 * Handle the mousedown event.
			 * @param {*} event - The actual event.
			 * @returns {boolean} - if the event should stop propagating
			 */
			mousedown: function(event) {
				var x, y;
				if ('mousedown' !== event.name) {return false;}
				x = event.x;
				y = event.y;

				if (this.expandedContains(x, y, -this.lineWidth)) {
					return true;}
				else if (this.contains(x, y) || this.title.contains(x, y)) {
					this.parent.bringToFront();
					$P.state.mainCanvas.beginDrag(this.parent, x, y);
					return true;}
				else if (this.expandedContains(x, y, this.lineWidth)) {
					$P.state.mainCanvas.beginResize(this, this.getResizeDirection(x, y), x, y);
					return true;}

				return false;},

			getAllNeighbors: function() {
				var list = [], neighbor;

				neighbor = this.neighbors.left;
				while (neighbor) {
					list.push(neighbor);
					neighbor = neighbor.neighbors.left;}

				neighbor = this.neighbors.right;
				while (neighbor) {
					list.push(neighbor);
					neighbor = neighbor.neighbors.right;}

				return list;},

			/**
			 * Resizes this object.
			 * @param {string} direction - the edge we're resizing from.
			 * @param {number} dx - the amount to alter the size by in the x direction
			 * @param {number} dy - the amount to alter the size by in the y direction
			 * @returns - the {l, r, t, b} that was unused.
			 */
			resize: function(direction, dx, dy) {
				var horizontalMode, verticalMode, other,
						l = 0, r = 0, t = 0, b = 0,
						lr = 0, rl = 0,
						newW, newH, multW = 1, multH = 1;
				if (direction.indexOf('w') != -1) {
					l = -dx;
					lr = dx;}
				if (direction.indexOf('e') != -1) {
					r = dx;
					rl = -dx;}
				if (direction.indexOf('n') != -1) {t = -dy;}
				if (direction.indexOf('s') != -1) {b = dy;}

				if (this.minSize && this.minSize.w) {
					newW = this.w + l + r;
					if (newW < this.minSize.w) {
						multW = (this.minSize.w - this.w) / (l + r);}}

				if (this.minSize && this.minSize.h) {
					newH = this.h + t + b;
					if (newH < this.minSize.h) {
						multH = (this.minSize.h - this.h) / (t + b);}}

				if (this.neighbors.left) {
					other = this.neighbors.left;
					if (other.minSize && other.minSize.w) {
						newW = other.w + lr * multW;
						if (newW < other.minSize.w) {
							multW = (other.minSize.w - other.w) / lr;}}}
				if (this.neighbors.right) {
					other = this.neighbors.right;
					if (other.minSize && other.minSize.w) {
						newW = other.w + rl * multW;
						if (newW < other.minSize.w) {
							multW = (other.minSize.w - other.w) / rl;}}}

				this.expandEdges(r * multW, t * multH, l * multW, b * multH);
				if (this.neighbors.left) {
					this.neighbors.left.expandEdges(lr * multW, 0, 0, 0);}
				if (this.neighbors.right) {
					this.neighbors.right.expandEdges(0, 0, rl * multW, 0);}

				return {
					l: l * (1 - multW),
					r: r * (1 - multW),
					t: t * (1 - multH),
					b: b * (1 - multH)};},

			onPositionChanged: function(dx, dy, dw, dh) {
				var self = this;
				if (self.x < 0) {
					$P.state.scene.children.forEach(function(child) {
						if (child instanceof $P.BubbleGroup) {
							child.translate(-self.x);}});}
				$P.Frame.prototype.onPositionChanged.call(self, dx, dy, dw, dh);
				self.repositionMenus();
				if (!self.inMotion) {
					$P.state.scene.sendEvent({
						name: 'bubbleMoved',
						bubble: self});}},

			saveKeys: [].concat($P.Frame.prototype.saveKeys, ['name'])
		});
	// Gradually shifting to this name:
	$P.Bubble = $P.BubbleBase;

	/**
	 * List of colors that the borders can take.
	 * @type {String[]}
	 * @static
	 */
	$P.Bubble.colors = [
		'#E69F00',
		'#56B4E9',
		'#F0E442',
		'#0072B2',
		'#D55E00',
		'#2B9F78',
		'#CC79A7',];

	/**
	 * Table of color to number of bubbles using that color.
	 */
	$P.Bubble.colorUseCounts = {};

	$P.Bubble.getUnusedColor = function() {
		var color, i, count;
		for (i = 0; i < $P.Bubble.colors.length; ++i) {
			color = $P.Bubble.colors[i];
			count = $P.Bubble.colorUseCounts[color];
			if (!count || count == 0) {return color;}}
		return '#666';};

	$P.Bubble.adjustColorCount = function(color, count) {
		$P.Bubble.colorUseCounts[color] = ($P.Bubble.colorUseCounts[color] || 0) + count;};

})(PATHBUBBLES);
