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
			get cornerAngles() {
				return [
					$P.Vector2D(this.w, this.h).angle(),
					$P.Vector2D(-this.w, this.h).angle(),
					$P.Vector2D(-this.w, -this.h).angle() + Math.PI * 2,
					$P.Vector2D(this.w, -this.h).angle() + Math.PI * 2];},

			makeZoom: function(layout, view, baseline) {
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
						g.on('dblclick.zoom', function() {
							var force = view.layout.force;
							if (force.alpha() > 0) {
								force.stop();}
							else {
								force.alpha(0.05);}
						});},
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
				zoom.base = base;
				this.zooms.push(zoom);
				return zoom;},

			onTick: function(layout, argument) {},
			updateClip: function(view) {},
			getDividers: function(count) {},

			saveKeys: [
				'count',
				'translate',
				'scale',
				'w', 'h']

		});

	$P.ForceShape.Centered = $P.defineClass(
		$P.ForceShape,
		function ForceShapeCentered(config) {
			$P.ForceShape.call(this, config);},
		{
			transform: function(view) {
				return 'translate(' + this.cx + ',' + this.cy + ')';},
			textTransform: function(view) {return '';},
			onTick: function(layout, argument) {
				if ('display' === argument) {return;}
				var force = layout.force,
						alpha = force.alpha(),
						gravity = layout.gravity * alpha;
				if (alpha > 0) {
					layout.nodeList.forEach(function(node) {
						var power = gravity;
						if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
						node.x += -node.x * power;
						node.y += -node.y * power;});}},
			updateClip: function(view) {
				view.clip.selectAll('*').remove();
				view.clip.append('rect')
					.attr('width', this.w)
					.attr('height', this.h);},
			getDividers: function() {return [];},
			getLabelPosition: function(view, size, index) {
				var self = this;
				if (undefined === index) {index = 0;}
				if (undefined === size) {size = 14;}
				return {x: self.w * 0.5, y: self.h - size * (0.5 + index) - (4 * index), length: self.w};},
			makeZoom: function(layout, view, baseline) {
				var self = this,
						zoom = $P.ForceShape.prototype.makeZoom.call(this, layout, view, baseline);
				if (baseline) {
					zoom.translate(baseline.translate());
					zoom.scale(baseline.scale());}
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
			onTick: function(layout, argument) {
				if ('display' === argument) {return;}
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size(),
						gravity = layout.gravity * alpha;
				layout.nodeList.forEach(function(node) {
					var power = gravity;
					if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
					node.x += -node.x * power;
					node.y += -node.y * power * 0.5;
				});},
			updateClip: function(view) {
				view.clip.selectAll('*').remove();
				view.clip.append('rect')
					.attr('x', view.index * this.w * 0.5)
					.attr('width', this.w * 0.5)
					.attr('height', this.h);},
			getDividers: function() {
				return [{x1: this.w * 0.5, y1: 0, x2: this.w * 0.5, y2: this.h}];},
			getLabelPosition: function(view, size) {
				var self = this;
				if (undefined === size) {size = 14;}
				return {x: self.w * (0.25 + 0.5 * view.index), y: self.h - size * 0.5, length: self.w * 0.5};},
			makeZoom: function(layout, view, baseline) {
				var self = this,
						flipX = self.flipX(view.index),
						zoom = $P.ForceShape.prototype.makeZoom.call(this, layout, view, baseline);
				zoom.getTranslate = function(base) {
					if (flipX) {base[0] *= -1;}
					return base;};
				zoom.setTranslate = zoom.getTranslate;
				if (baseline) {
					zoom.translate(baseline.translate());
					zoom.scale(baseline.scale());}
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
			onTick: function(layout, argument) {
				if ('display' === argument) {return;}
				var self = this;
				var force = layout.force,
						alpha = force.alpha(),
						size = force.size(),
						gravity = layout.gravity * alpha;
				layout.nodeList.forEach(function(node) {
					var power = gravity;
					if (node.gravityMultiplier) {power *= node.gravityMultiplier;}
					/*
					var nodeAngle = Math.atan2(-node.y, node.x);
					var midIn = self.angle * 0.5;
					var midOut = midIn + Math.PI;
					var dir, anglePower = 100;
					while (nodeAngle < 0) {nodeAngle += Math.PI * 2;}
					if (nodeAngle < midIn) {
						dir = nodeAngle + Math.PI * 0.5;
						anglePower *= (midIn - nodeAngle) / Math.PI;}
					else if (midIn <= nodeAngle && nodeAngle < midOut) {
						dir = nodeAngle - Math.PI * 0.5;
						anglePower *= (nodeAngle - midIn) / Math.PI;}
					else if (nodeAngle >= midOut) {
						dir = nodeAngle + Math.PI * 0.5;
						anglePower *= (midIn + Math.PI * 2 - nodeAngle) / Math.PI;}
					node.x += Math.cos(dir) * power * anglePower;
					node.y += -Math.sin(dir) * power * anglePower;
					 */
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
			makeZoom: function(layout, view, baseline) {
				var self = this,
						zoom = $P.ForceShape.prototype.makeZoom.call(self, layout, view, baseline);
				zoom.getTranslate = function(base) {
					return new $P.Vector2D(base[0], base[1]).rotate(-self.angle * view.index).array();};
				zoom.setTranslate = function(base) {
					return new $P.Vector2D(base[0], base[1]).rotate(self.angle * view.index).array();};
				if (baseline) {
					zoom.translate(baseline.translate());
					zoom.scale(baseline.scale());}
				return zoom;},
			getLabelPosition: function(view, size) {
				var minAngle = this.angle * view.index,
						angle = this.angle * (view.index + 0.5),
						maxAngle = this.angle * (view.index + 1),
						angles = this.cornerAngles,
						cx = this.cx, cy = this.cy, hs = size * 0.5,
						minIndex = 0,
						index = 0,
						maxIndex = 0,
						minX, maxX, minY, maxY;
				while (minAngle > angles[minIndex]) {++minIndex;}
				minIndex = minIndex % 4;
				while (angle > angles[index]) {++index;}
				index = index % 4;
				while (maxAngle > angles[maxIndex]) {++maxIndex;}
				maxIndex = maxIndex % 4;

				// Right Edge.
				if (index == 0) {
					if (minIndex === 0) {
						minY = cy + cx * Math.sin(minAngle);}
					else {
						minY = 0;}
					if (maxIndex === 0) {
						maxY = cy + cx * Math.sin(maxAngle);}
					else {
						maxY = this.h;}
					return {
						x: this.w - hs,
						y: (minY + maxY) * 0.5,
						length: Math.abs(maxY - minY),
						rotation: 90};}
				// Bottom Edge.
				if (index == 1) {
					if (minIndex === 1) {
						minX = cx + cy * Math.cos(minAngle);}
					else {
						minX = this.w;}
					if (maxIndex === 1) {
						maxX = cx + cy * Math.cos(maxAngle);}
					else {
						maxX = 0;}
					return {
						x: (minX + maxX) * 0.5,
						y: this.h - hs,
						length: Math.abs(maxX - minX),
						rotation: 0};}
				// Left Edge.
				if (index == 2) {
					if (minIndex === 2) {
						minY = cy + cx * Math.sin(minAngle);}
					else {
						minY = this.h;}
					if (maxIndex === 2) {
						maxY = cy + cx * Math.sin(maxAngle);}
					else {
						maxY = 0;}
					return {
						x: hs,
						y: (minY + maxY) * 0.5,
						length: Math.abs(maxY - minY),
						rotation: 90};}
				// Top Edge.
				if (index == 3) {
					if (minIndex === 3) {
						minX = cx + cy * Math.cos(minAngle);}
					else {
						minX = 0;}
					if (maxIndex === 3) {
						maxX = cx + cy * Math.cos(maxAngle);}
					else {
						maxX = this.w;}
					return {
						x: (minX + maxX) * 0.5,
						y: hs,
						length: Math.abs(maxX - minX),
						rotation: 0};}
				return {x: 0, y: 0, rotation: 0};
			},
			getZoomCenter: function(viewIndex, mousePosition) {
				var radius = Math.min(this.w, this.h) * 0.4,
						center = new $P.Vector2D(radius, 0)
							.rotate(this.angle * (viewIndex + 0.5))
							.plus(new $P.Vector2D(this.w * 0.5, this.h * 0.5));
				return [mousePosition[0] - center.x, mousePosition[1] - center.y];
			}

		});

})(PATHBUBBLES);
