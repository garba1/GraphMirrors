/**
 * @author Alexander Garbarino
 * @name util
 */

var PATHBUBBLES = PATHBUBBLES || {};
var $P = PATHBUBBLES;

/**
 * Simple class inheritance.
 * Does not handle calling the superclass constructor.
 * Defines superclass on the prototype.
 * @param {?Function} superclass - the parent class
 * @param {!Function} init - the initialization function
 * @param {Object} prototype - the prototype methods
 */
$P.defineClass = function(superclass, init, prototype) {
	init.prototype = Object.create(superclass && superclass.prototype);
	Object.getOwnPropertyNames(prototype).forEach(function(name) {
		Object.defineProperty(init.prototype, name, Object.getOwnPropertyDescriptor(prototype, name));});
	init.prototype.constructor = init;
	init.prototype.superclass = superclass;
	return init;
};


/**
 * Retrieves a specific value from the passed object.
 * @callback getter
 * @param {object} object - the object to retrieve from
 * @returns {*} - a specific value on the object
 */

/**
 * Create a function that retrieves a specific key from an object.
 * @param {string} key - the key to return
 * @returns {getter}
 */
$P.getter = function (key) {return function(object) {return object[key];};};

/**
 * Create a function that takes an object and calls f from it
 * @param {string} f - the name of the function to call
 * @param {...*} arg - any additional arguments to pass
 */
$P.method = function(f) {
	var args = Array.prototype.slice.call(arguments, 1);
	return function(o) {
		return o[f].apply(o, args);};};

/**
 * Returns the first element in the array which satisfies the predicate.
 * @param {Array} array - the array
 * @param {Function} predicate - The predicate function. Takes the
 * element and its index position.
 * @returns {?*} - the first object in array satisfying predicate
 */
$P.findFirst = function(array, predicate) {
	var i, element;
	for (i = 0; i < array.length; ++i) {
		element = array[i];
		if (predicate(element, i)) {return element;}}
	return null;};

/**
 * Loops over array, returning the first true result of applying f.
 * @param {Array} array - the array to loop over
 * @param {Function} f - the function to apply
 * @returns {?*} - the first true returned value
 */
$P.or = function(array, f) {
	var i, result;
	for (i = 0; i < array.length; ++i) {
		result = f(array[i]);
		if (result) {return result;}}
	return null;};

/**
 * If the html element is visible.
 * @param {HTMLElement} element - the element to test
 * @returns {boolean} - if the element is visible
 */
$P.isHtmlElementVisible = function(element) {
	return 'none' !== element.style.display && 'hidden' !== element.style.visibility;};

$P.removeFromList = function(list, element) {
	var index = list.indexOf(element);
	if (-1 == index) {return;}
	list.splice(index, 1);};

$P.randomFromList = function(list) {
	return list[Math.floor(Math.random() * list.length)];};

$P.readonly = function(object, variable, value) {
	Object.defineProperty(object, variable, {
		value: value, enumerable: true});};

$P.not = function(fun) {
	return function(a) {return !fun(a);};};