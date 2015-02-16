/**
 * @author Alexander Garbarino
 * @name PathBubble_BubbleBase
 */

var $P = PATHBUBBLES;

$P.BubbleBase = $P.defineClass(
	$P.Shape.Rectangle,
	function BubbleBase(config) {
		var group;
		if (!config.strokeStyle) {config.strokeStyle = this.pickRandomStrokeStyle();}
		config.fillStyle = config.fillStyle || '#fff';
		config.w = config.w || 500;
		config.h = config.h || 500;
		config.cornerRadius = config.cornerRadius || 20;
		config.lineWidth = config.lineWidth || 10;

		this.links = [];
		this.neighbors = {left: null, right: null};
		$P.Shape.Rectangle.call(this, config);

		if (config.mainMenu || this.menu) {
			this.menuButton = $P.ActionButton.create('menu');
			this.add(this.menuButton);}
		if (config.closeMenu) {this.add($P.ActionButton.create('close'));}
		if (config.groupMenu) {
			this.groupButton = $P.ActionButton.create('group');
			this.add(this.groupButton);}
		if (config.resetMenu) {this.add($P.ActionButton.create('reset'));}

		this.repositionMenus();

		this.title = new $P.Title({parent: this, name: ''});
		this.name = config.name || '';
		if (this.name instanceof Function) {this.name = this.name.call(this);}},
	{
		get name() {return this._name;},
		set name(value) {
			this._name = value;
			if (this.title) {this.title.name = value;}},

		onRemoved: function(parent) {
			if (this.menu && this.menu.HighLight_State) {
				this.menu.Highlight_State = false;
				if (this.button) {this.button.hide();}}},

		onAdded: function(parent) {
			if (!(parent instanceof $P.BubbleGroup)) {
				this.parent.add(new $P.BubbleGroup(this));}},

		pickRandomStrokeStyle: function() {
			return $P.borderColors[
				Math.floor(Math.random() * PATHBUBBLES.borderColors.length)];
		},
		repositionMenus: function() {
			var i, offset, menu, unit;
			unit = this.cornerRadius * 0.5;
			offset = 0;
			this.children.forEach(function(child) {
				if (child instanceof $P.ActionButton) {
					child.move(this.x + this.w - unit * 2 - offset * (2 * unit + 5), this.y - unit * 0.2);
					++offset;}
			}.bind(this));
		},
		onDelete: function() {
			$P.Object2D.prototype.onDelete.call(this);
			this.links.slice(0)
				.forEach(function(link) {
					console.log(link);
					link.delete();});
			if (1 == this.parent.children.length) {
				this.parent.delete();}},
		/**
		 * Remove self from group.
		 */
		ungroup: function() {
			if (1 == this.parent.children.length) {return;}
			$P.state.scene.add(this, 0);
			this.groupButton.setHighlighted(false);
			this.setStrokeStyle(this.pickRandomStrokeStyle());},
		/*
		deleteBubble: function() {
			var i, html;
			if (this.button) {this.button.remove();}
			// Remove Links.
			for (i = PATHBUBBLES.bubbleLinks.length-1; i >= 0; --i)
			{
				if (PATHBUBBLES.bubbleLinks[i].startId == this.id)
				{
					PATHBUBBLES.bubbleLinks.splice(i, 1);
					continue;
				}
				if(PATHBUBBLES.bubbleLinks[i].endId ==this.id)
				{
					PATHBUBBLES.bubbleLinks.splice(i, 1);
				}
			}
			this.parent.remove(this);
			this.delete();
		},
		deleteThisBubble: function() {
			if (this.GROUP) {this.ungroup();}
			this.deleteBubble();
		},
		 */
		receiveEvent: function(event) {
			var result = $P.Object2D.prototype.receiveEvent.call(this, event);
			if (result) {return result;}
			return this.mousemove(event) ||
				this.mousedown(event);},

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
				// Interior Drag.
				return true;}
			else if (this.contains(x, y) || this.title.contains(x, y)) {
				this.parent.bringToFront();
				$P.state.mainCanvas.beginDrag(this.parent, x, y);
				return true;}
			else if (this.expandedContains(x, y, this.lineWidth)) {
				$P.state.mainCanvas.beginResize(this, this.getResizeDirection(x, y), x, y);
				return true;}

			return false;},

		/**
		 * For the given coordinates, which direction would we be resizing in?
		 * @param {number} x - the x coordinate
		 * @param {number} y - the y coordinate
		 * @returns {?String} - A direction string, like 'nw', or null for
		 * an invalid or unknown position. You should be able to append
		 * '-resize' to the string to get a valid cursor style.
		 */
		getResizeDirection: function(x, y) {
			var xl = this.x,
					xr = xl + this.w,
					yt = this.y,
					yb = yt + this.h;
			if (xl - x + yt - y > -this.lineWidth) {return 'nw';}
			if (x - xr + yt - y > -this.lineWidth) {return 'ne';}
			if (xl - x + y - yb > -this.lineWidth) {return 'sw';}
			if (x - xr + y - yb > -this.lineWidth) {return 'se';}
			if (x <= xl) {return 'w';}
			if (x >= xr) {return 'e';}
			if (y <= yt) {return 'n';}
			if (y >= yb) {return 's';}
			return null;},

		/**
		 * Resizes this object.
		 * @param {string} direction - the edge we're resizing from.
		 * @param {number} dx - the amount to alter the size by in the x direction
		 * @param {number} dy - the amount to alter the size by in the y direction
		 */
		resize: function(direction, dx, dy) {
			var horizontalMode, verticalMode,
					l = 0, r = 0, t = 0, b = 0,
					lr = 0, rl = 0;
			if (direction.indexOf('w') != -1) {
				l = -dx;
				lr = dx;}
			if (direction.indexOf('e') != -1) {
				r = dx;
				rl = -dx;}
			if (direction.indexOf('n') != -1) {t = -dy;}
			if (direction.indexOf('s') != -1) {b = dy;}
			this.expandEdges(r, t, l, b);
			if (this.neighbors.left) {
				this.neighbors.left.expandEdges(lr, 0, 0, 0);}
			if (this.neighbors.right) {
				this.neighbors.right.expandEdges(0, 0, rl, 0);}
		},

		/**
		 * Gets the interior dimensions of this object.
		 * @returns - an object containing x, y, w, and h matching this object's interior
		 */
		getInteriorDimensions: function() {
			var half = this.lineWidth * 0.5;
			return {x: this.x + half,
							y: this.y + half,
							w: this.w - this.lineWidth,
							h: this.h - this.lineWidth};},
		/**
		 * Expand the given edge by the given amount of pixels.
		 * @param {number} right - the amount to expand the right edge by
		 * @param {number} top - the amount to expand the top edge by
		 * @param {number} left - the amount to expand the left edge by
		 * @param {number} bottom - the amount to expand the bottom edge by
		 */
		expandEdges: function(right, top, left, bottom) {
			this.translate(-left, -top, left + right, top + bottom);},

		onPositionChanged: function(dx, dy, dw, dh) {
			$P.Shape.Rectangle.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
			this.repositionMenus();},

		/**
		 * Sets the stroke color for this bubble.
		 * @param {string} style - the new style
		 */
		setStrokeStyle: function(style) {
			this.strokeStyle = style;
			this.title.strokeStyle = style;
			this.title.fillStyle = style;
			$P.state.markDirty();}
	});