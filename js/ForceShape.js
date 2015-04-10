// Manages ForceLayout and ForceView for being in a specific shape.

(function($P){

	$P.ForceShape = $P.defineClass(
		null,
		function ForceShape(config) {
			this.count = config.count || 1;
			this.translate = [0, 0];
			this.scale = 1;
			this.zooms = [];
			this.w = config.w || 500;
			this.h = config.h || 500;
		},
		{
			get size() {return [this.w, this.h];},
			set size(value) {
				if (this.w === value[0] && this.h === value[1]) {return;}
				this.w = value[0];
				this.h = value[1];
				this.zooms.forEach(function(zoom) {zoom.size([this.w, this.h]);});},
			get cx() {return this.w * 0.5;},
			get cy() {return this.h * 0.5;},

			makeZoom: function(layout, view) {
				var self = this, zoom, base;
				base = d3.behavior.zoom()
					.scaleExtent([0.1, 10])
					.size([self.w, self.h])
					.on('zoom', function() {
						self.translate = zoom.translate();
						self.scale = zoom.scale();
						self.zooms.forEach(function(zoom) {
							zoom.translate(self.translate);
							zoom.scale(self.scale);
							zoom.view.onZoom();});});
				zoom = d3.rebind(
					function(g) {
						base(g);
						g.on('dblclick.zoom', null);},
					base,
					'translate', 'scale', 'size', 'center');
				zoom.view = view;
				zoom.translate = function(arg) {
					if (!arguments.length) {return this.getTranslate(base.translate());}
					base.translate(this.setTranslate(arg));
					return this;};
				zoom.scale = function(arg) {
					if (!arguments.length) {return this.getScale(base.scale());}
					base.scale(this.setScale(arg));
					return this;};
				zoom.getTranslate = function(base) {return base;};
				zoom.getScale = function(base) {return base;};
				zoom.setTranslate = function(base) {return base;};
				zoom.setScale = function(base) {return base;};
				this.zooms.push(zoom);
				return zoom;},

			onTick: function(layout) {},
			updateClip: function(view) {},
			getDividers: function(count) {}
		});

	$P.ForceShape.Centered = $P.defineClass(
		$P.ForceShape,
		function ForceShapeCentered(config) {
			$P.ForceShape.call(this, config);},
		{
			transform: function(view) {
				return 'translate(' + this.cx + ',' + this.cy + ')';},
			textTransform: function(view) {return '';},
			onTick: function(layout) {
				var force = layout.force,
						alpha = force.alpha(),
						gravity = 0.03 * alpha;
				layout.nodes.forEach(function(node) {
					var power = gravity;
					if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
					node.x += -node.x * power;
					node.y += -node.y * power;});},
			updateClip: function(view) {
				view.clip.selectAll('*').remove();
				view.clip.append('rect')
					.attr('width', this.w)
					.attr('height', this.h);},
			getDividers: function() {return [];},
			makeZoom: function(layout, view) {
				var self = this,
						zoom = $P.ForceShape.prototype.makeZoom.call(this, layout, view);
				return zoom;},
			getZoomCenter: function(viewIndex, mousePosition) {
				return [mousePosition[0] - this.cx, mousePosition[1] - this.cy];}});

	$P.ForceShape.Mirror = $P.defineClass(
		$P.ForceShape,
		function ForceShapeMirror(config) {
			$P.ForceShape.call(this, config);
			this.width = config.width;
			this.height = config.height;
			if (config.flipX) {this.flipX = config.flipX;}},
		{
			flipX: function(index) {return index % 2 === 1;},
			transform: function(view) {
				var flipX = this.flipX(view.index);
				return 'translate(' + this.w * 0.5 + ',' + this.h * 0.5 + ')'
					+ 'scale(' + (flipX ? -1 : 1) + ', 1)'
					+ 'translate(' + this.w * -0.25 + ', 0)';},
			textTransform: function(view) {
				var flipX = this.flipX(view.index);
				return 'scale(' + (flipX ? -1 : 1) + ', 1)';},
			onTick: function(layout) {
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size(),
						gravity = 0.03 * alpha;
				layout.nodes.forEach(function(node) {
					var power = gravity;
					if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
					node.x += -node.x * power;
					node.y += -node.y * power;});},
			updateClip: function(view) {
				view.clip.selectAll('*').remove();
				view.clip.append('rect')
					.attr('x', view.index * this.w * 0.5)
					.attr('width', this.w * 0.5)
					.attr('height', this.h);},
			getDividers: function() {
				return [{x1: this.w * 0.5, y1: 0, x2: this.w * 0.5, y2: this.h}];},
			makeZoom: function(layout, view) {
				var self = this,
						flipX = self.flipX(view.index),
						zoom = $P.ForceShape.prototype.makeZoom.call(this, layout, view);
				zoom.getTranslate = function(base) {
					if (flipX) {base[0] *= -1;}
					return base;};
				zoom.setTranslate = zoom.getTranslate;
				return zoom;},
			getZoomCenter: function(viewIndex, mousePosition) {
				var x = mousePosition[0],
						y = mousePosition[1],
						flipX = this.flipX(viewIndex);
				if (flipX) {x *= -1;}
				return [mousePosition[0] - this.w * 0.25 * (1 + viewIndex * 2),
								mousePosition[1] - this.h * 0.5];}});

	$P.ForceShape.Radial = $P.defineClass(
		$P.ForceShape,
		function ForceShapeRadial(config) {
			$P.ForceShape.call(this, config);
			this.angle = config.angle || Math.PI * 2 / this.count;},
		{
			transform: function(view) {
				var angle = view.index * this.angle * 180 / Math.PI,
						half = this.angle * 90 / Math.PI,
						radius = Math.min(this.w, this.h) * 0.4;
				return 'translate(' + this.w * 0.5 + ',' + this.h * 0.5 + ')'
					+ 'rotate(' + angle + ')'
					+ 'rotate(' + half + ')translate(' + radius + ')rotate(' + (-half) + ')';},
			textTransform: function(view) {
				var angle = view.index * this.angle * 180 / Math.PI;
				return 'rotate(' + (-angle) + ')';},
			onTick: function(layout) {
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size(),
						gravity = 0.03 * alpha;
				layout.nodes.forEach(function(node) {
					var power = gravity;
					if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
					node.x += -node.x * power;
					node.y += -node.y * power;});},
			updateClip: function(view) {
				var startAngle = view.index * this.angle,
						midAngle = startAngle + this.angle * 0.5,
						endAngle = startAngle + this.angle,
						cx = this.cx,
						cy = this.cy,
						radius = Math.max(this.w, this.h),
						startX = cx + radius * Math.cos(startAngle),
						startY = cy + radius * Math.sin(startAngle),
						midX = cx + radius * Math.cos(midAngle),
						midY = cy + radius * Math.sin(midAngle),
						endX = cx + radius * Math.cos(endAngle),
						endY = cy + radius * Math.sin(endAngle);
				view.clip.selectAll('*').remove();
				view.clip.append('svg:path')
					.attr('d',
								'M ' + cx + ' ' + cy
								+ 'L ' + startX + ' ' + startY
								+ 'Q ' + midX + ' ' + midY + ' ' + endX + ' ' + endY
								+ 'L ' + cx + ' ' + cy);},
			getDividers: function() {
				var i,
						radius = Math.max(this.w, this.h),
						angle = 0,
						dividers = [];
				for (i = 0; i < this.count; ++i) {
					dividers.push({
						x1: this.cx,
						y1: this.cy,
						x2: this.cx + radius * Math.cos(angle),
						y2: this.cy + radius * Math.sin(angle)});
					angle += this.angle;}
				return dividers;},
			makeZoom: function(layout, view) {
				var self = this,
						zoom = $P.ForceShape.prototype.makeZoom.call(self, layout, view);
				zoom.getTranslate = function(base) {
					return new $P.Vector2D(base[0], base[1]).rotate(-self.angle * view.index).array();};
				zoom.setTranslate = function(base) {
					return new $P.Vector2D(base[0], base[1]).rotate(self.angle * view.index).array();};
				return zoom;},
			getZoomCenter: function(viewIndex, mousePosition) {
				var radius = Math.min(this.w, this.h) * 0.4,
						center = new $P.Vector2D(radius, 0)
							.rotate(this.angle * (viewIndex + 0.5))
							.plus(new $P.Vector2D(this.w * 0.5, this.h * 0.5));
				return [mousePosition[0] - center.x, mousePosition[1] - center.y];
			}
		});



	$P.ForceShape.Rect = $P.defineClass(
		$P.ForceShape,
		function ForceShapeRect(config) {
			$P.ForceShape.call(this, config);
			this.width = config.width;
			this.height = config.height;
			if (config.flipX) {this.flipX = config.flipX;}
			if (config.flipY) {this.flipY = config.flipY;}
			if (config.offset) {this.offset = config.offset;}},
		{
			set size(value) {
				if (this.w === value[0] && this.h === value[1]) {return;}
				this.w = value[0];
				this.h = value[1];},
			flipX: function(index) {return index % 2 === 1;},
			flipY: function(index) {return index % 4 > 1;},
			offset: function(index) {
			},
			transform: function(view) {
				var flipX = this.flipX(view.index),
						flipY = this.flipY(view.index);
				return 'scale(' + (flipX ? -1 : 1) + ',' + (flipY ? -1 : 1) + ')';},
			textTransform: function(view) {
				var flipX = this.flipX(view.index),
						flipY = this.flipY(view.index);
				return 'scale(' + (flipX ? -1 : 1) + ',' + (flipY ? -1 : 1) + ')';},
			onTick: function(layout) {
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size(),
						x = size[0] * 0.5,
						y = size[1] * 0.5,
						gravity = 0.03 * alpha;

				if (1 === this.count) {
					this.layout.nodes.forEach(function(node) {
						node.x += (x - node.x) * gravity;
						node.y += (y - node.y) * gravity;});}
			},
			updateClip: function(view) {
				view.clip.selectAll('*').remove();
				view.clip.append('rect')
					.attr('width', this.width)
					.attr('height', this.height);},
			getDividers: function() {
				var dividers;
				if (this.count != 1 && this.count != 2 && this.count != 4) {console.error('getDividers('+this.count+'): Illegal count');}

				dividers = [];
				if (this.count >= 2) {
					dividers.push({x1: 0, y1: this.height * 0.5, x2: 0, y2: this.height * -0.5});}

				if (this.count >= 4) {
					dividers.push({y1: 0, x1: this.width * 0.5, y2: 0, x2: this.width * -0.5});}

				return dividers;},
			makeZoom: function(layout, view) {
				var self = this, zoom, base,
						flipX = self.flipX(view.index),
						flipY = self.flipY(view.index);
				base = d3.behavior.zoom()
					.scaleExtent([0.1, 10])
					.size([self.width, self.height])
					.on('zoom', function() {
						self.translate = zoom.translate();
						self.scale = zoom.scale();
						self.zooms.forEach(function(zoom) {
							zoom.translate(self.translate);
							zoom.scale(self.scale);
							zoom.view.onZoom();});});
				zoom = d3.rebind(
					function(g) {
						base(g);
						g.on('dblclick.zoom', null);},
					base,
					'scale');
				zoom.view = view;
				zoom.translate = function(t) {
					var translate, x, y;
					if (!arguments.length) {
						translate = base.translate();
						if (flipX) {translate[0] *= -1;}
						if (flipY) {translate[1] *= -1;}
						return translate;}
					x = t[0];
					if (flipX) {x *= -1;}
					y = t[1];
					if (flipY) {y *= -1;}
					base.translate([x, y]);
					return this;};
				self.zooms.push(zoom);
				return zoom;},
			appendBackground: function(root, index) {
				if (1 === this.count) {
					return root.append('rect')
						.attr('fill', 'none')
						.attr('stroke', 'none')
						.attr('pointer-events', 'all')
						.attr('x', -this.width/2)
						.attr('y', -this.height/2)
						.attr('width', this.width)
						.attr('height', this.height);}
				if (2 === this.count) {
					return root.append('rect')
						.attr('fill', 'none')
						.attr('stroke', 'none')
						.attr('pointer-events', 'all')
						.attr('x', this.width * (index - 1))
						.attr('y', -this.height/2)
						.attr('width', this.width)
						.attr('height', this.height);}
				return null;}});

	$P.ForceShape.Arc = $P.defineClass(
		$P.ForceShape,
		function ForceShapeArc(config) {
			$P.ForceShape.call(this, config);
			this.angle = config.angle || Math.PI * 2 / this.count;
			this.radius = config.radius || 1000;},
		{
			transform: function(view) {
				var startAngle = view.index * this.angle * 180 / Math.PI;
				return 'rotate(' + startAngle + ')';},
			textTransform: function(view) {
				var startAngle = view.index * this.angle * 180 / Math.PI;
				return 'rotate(' + (-startAngle) + ')';},
			onTick: function(layout) {
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size();},
			updateClip: function(view) {
				var startAngle = view.index * this.angle,
						midAngle = startAngle + this.angle * 0.5,
						endAngle = startAngle + this.angle,
						startX = this.radius * Math.cos(this.startAngle),
						startY = this.radius * Math.sin(this.startAngle),
						midX = this.radius * Math.cos(midAngle),
						midY = this.radius * Math.sin(midAngle),
						endX = this.radius * Math.cos(this.endAngle),
						endY = this.radius * Math.Sin(this.endAngle);
				view.clip.selectAll('*').remove();
				view.clip.append('svg:path')
					.attr('d',
								'M 0 0'
								+ 'L ' + this.startX + ' ' + this.startY
								+ 'Q ' + this.midX + ' ' + this.midY + ' ' + this.endX + ' ' + this.endY
								+ 'L 0 0');},
			getDividers: function() {
				var i,
						radius = this.radius,
						angle = 0,
						dividers = [];

				for (i = 0; i < this.count; ++i) {
					dividers.push({
						x1: 0,
						y1: 0,
						x2: radius * Math.cos(angle),
						y2: radius * Math.sin(angle)});
					angle += this.angle;}

				return dividers;},
			makeZoom: function(layout, view) {
				var self = this, zoom, base,
						angle = view.index * this.angle;
				base = d3.behavior.zoom()
					.scaleExtent([0.1, 10])
					.size([self.width, self.height])
					.on('zoom', function() {
						self.translate = zoom.translate();
						self.scale = zoom.scale();
						self.zooms.forEach(function(zoom) {
							zoom.translate(self.translate);
							zoom.scale(self.scale);
							zoom.view.onZoom();});});
				zoom = d3.rebind(
					function(g) {
						base(g);
						g.on('dblclick.zoom', null);},
					base,
					'scale');
				zoom.view = view;
				zoom.translate = function(t) {
					var translate, x, y;
					if (!arguments.length) {
						translate = base.translate();
						return new $P.Vector2D(translate[x], translate[y]).rotate(-angle).array();}
					base.translate(new $P.Vector2D(t[0], t[1]).rotate(angle).array());
					return this;};
				self.zooms.push(zoom);
				return zoom;},
			appendBackground: function(root, index) {
				return root.append('path')
					.attr('fill', 'none')
					.attr('stroke', 'none')
					.attr('pointer-events', 'all')
					.attr('x', -this.width/2)
					.attr('y', -this.height/2)
					.attr('width', this.width)
					.attr('height', this.height);}
		});

})(PATHBUBBLES);
