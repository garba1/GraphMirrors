var $P = PATHBUBBLES;

$P.Vector2D = $P.defineClass(
	null,
	function Vector2D(x, y) {
		if (!(this instanceof Vector2D)) {return new Vector2D(x, y);}
		$P.readonly(this, 'x', x);
		$P.readonly(this, 'y', y);
		return this;},
	{
		get length() {
			if (!this._length) {
				Object.defineProperty(this, '_length', {
					value: Math.pow(Math.pow(this.x, 2) + Math.pow(this.y, 2), 0.5)});}
			return this._length;},
		angle: function() {return Math.atan2(this.y, this.x);},
		plus: function(vector) {return new $P.Vector2D(this.x + vector.x, this.y + vector.y);},
		minus: function(vector) {return new $P.Vector2D(this.x - vector.x, this.y - vector.y);},
		times: function(scalar) {return new $P.Vector2D(this.x * scalar, this.y * scalar);},
		normalized: function() {
			return new $P.Vector2D(this.x / this.length, this.y / this.length);},
		rotate90: function() {return new $P.Vector2D(-this.y, this.x);},
		rotate270: function() {return new $P.Vector2D(this.y, -this.x);},
		rotate: function(angle) {
			var cos = Math.cos(angle),
					sin = Math.sin(angle);
			return new $P.Vector2D(
				this.x * cos - this.y * sin,
				this.x * sin + this.y * cos);},
		array: function() {return [this.x, this.y];}
	});

$P.Vector2D.ofAngle = function(angle) {
	return $P.Vector2D(Math.cos(angle), Math.sin(angle));};
