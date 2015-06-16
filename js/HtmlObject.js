var $P = PATHBUBBLES;

$P.HtmlObject = $P.defineClass(
	$P.Object2D,

	/**
	 * @classdesc A wrapper for an html object to be displayed on the screen.
	 * @constructor
	 * @param {!string} config.parent - the parent tag selector
	 * @param {!string} config.type - the type of the tag
	 * @param {object} config.objectConfig - config object to pass to
	 * the [Object2D]{@link $P.Object2D} constructor.
	 */
	function HtmlObject(config) {
		$P.Object2D.call(this, config.objectConfig);
		var id = 'object' + $P.HtmlObject.nextId++;
		/** @member {HTMLElement} element - the actual html element */
		this.element = document.createElement(config.type);
		if (config.before) {
			$(config.parent).find(config.before).before(this.element);}
		else {
			$(config.parent).append(this.element);}
		if (config.class) {
			this.element.setAttribute('class', config.class);}
		this.element.setAttribute('id', id);
		this.element.style.position = 'absolute';
		if (undefined === config.pointer) {config.pointer = 'none';}
		if (null !== config.pointer) {this.element.style['pointer-events'] = config.pointer;}
		this.onPositionChanged();
	},
	{
		onAdded: function(parent) {
			$P.Object2D.prototype.onAdded.call(this, parent);
			$P.state.scene.registerHtmlObject(this);},
		onRemoved: function(parent) {
			$P.Object2D.prototype.onRemoved.call(this, parent);
			$P.state.scene.unregisterHtmlObject(this);},
		onDelete: function() {
			this.element.parentNode.removeChild(this.element);},
		drawSelf: function() {
			$(this.element).css({left: (this.x - $P.state.scrollX) + 'px'});},
		onPositionChanged: function(dx, dy, dw, dh) {
			var e = $(this.element);
			$P.Object2D.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
			e.css({
				left: (this.x -$P.state.scrollX) + 'px',
				top: (this.y + $P.state.mainCanvas.getLocation().y) + 'px'});
			if (this.w && !this.ignoreW) {e.css('width', this.w + 'px');}
			else {e.css('width', 'auto');}
			if (this.h && !this.ignoreH) {e.css('height', this.h + 'px');}
			else {e.css('height', 'auto');}},
		/**
		 * If the element can receieve pointer events.
		 * @returns {boolean} - if it is enabled
		 */
		arePointerEventsEnabled: function() {
			return this.element.style['pointer-events'] !== 'none';},

		/**
		 * Set whether or not pointer events are enabled.
		 * @param {boolean} enabled - if the events are enabled
		 */
		setPointerEventsEnabled: function(enabled) {
			this.element.style['pointer-events'] = enabled ? 'visiblePainted' : 'none';}
	});

/** The next id number to use */
$P.HtmlObject.nextId = 0;
