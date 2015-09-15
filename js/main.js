/**
 * @author      Yongnan
 * @version     1.0
 * @time        9/16/2014
 * @name        main
 */
(function($P){
	'use strict';

	var viewpoint = null;
	var navInterection = null;
	var interection = null;
	var showLinks = true;
	$(document).ready(function () {
		$P.state = new $P.Context();

		var canvas = $('#bgCanvas')[0];
		var overlayCanvas = $('#overlayCanvas')[0];
		var navCanvas = $('#navCanvas')[0];
		window.addEventListener( 'keydown', function(event){
			if(event.keyCode === 70)
			{
				screenfull.request();
			}
		}, false );
		// trigger the onchange() to set the initial values
		screenfull.onchange();
		//    THREEx.FullScreen.bindKey({ charCode: 'f'.charCodeAt(0) });
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		navCanvas.height = 50;
		navCanvas.width = window.innerWidth;

		$P.state.scene = new $P.Scene();
		$P.state.scrollX = 0;

		$P.state.mainCanvas = new $P.MainCanvas({element: canvas, scene: $P.state.scene});
		$P.state.overlayCanvas = new $P.OverlayCanvas({element: overlayCanvas, scene: $P.state.scene});
		$P.state.navCanvas = new $P.NavCanvas({element: navCanvas, scene: $P.state.scene});
		$P.state.markDirty = function() {
			this.mainCanvas.needsRedraw = true;
			this.overlayCanvas.needsRedraw = true;
			this.navCanvas.needsRedraw = true;};

		function render() {
			$P.requestAnimationFrame(render);
			$P.state.mainCanvas.draw();
			$P.state.overlayCanvas.draw();
			$P.state.navCanvas.draw();
		}

		render();

		$P.state.scene.add(new $P.TreeRing({
			x: 50, y: 50, w: 840, h: 700,
			dataName: 'human'}));

		var mousePosX, mousePosY;

		$('#bgCanvas').on('contextmenu', function (e) {
			mousePosX = e.clientX;
			mousePosY = e.clientY;
		});
		function setContextMenu() {
			var timestamp = Date.now();
			$('#bubble').contextMenu({
				selector: '#bgCanvas',
				show: function(opt) {
					timestamp = Date.now();},
				callback: function (key) {
					var bubble, state, objects;
					// Don't react for a second to prevent misclicks.
					if (Date.now() - timestamp < 2000) {return false;}

					if (key === 'search') {
						bubble = new $P.Bubble.Search({x: mousePosX + $P.state.scrollX, y: mousePosY, w: 300, h: 500});
						$P.state.scene.add(bubble);}
					if (key === 'pathway') {
						bubble = new $P.Bubble.Pathway({x: mousePosX + $P.state.scrollX, y: mousePosY, w: 300, h: 150});
						$P.state.scene.add(bubble);}
					if (key === 'treering') {
						$P.state.scene.add(new $P.TreeRing({
							x: mousePosX + $P.state.scrollX, y: mousePosY, w: 820, h: 700,
							dataName: 'human'}));}
					else if ('save' === key) {
						$P.Save($P.state).write();}
					else if ('load' === key) {
						function load(file) {
							$P.Load(file);}
						$P.loadFile(load);}
					else if ('record' === key) {
						$P.state.scene.recording = [];}
					else if ('force' === key) {
						bubble = new $P.Bubble.Force({x: mousePosX + $P.state.scrollX, y: mousePosY, w: 750, h: 600});
						$P.state.scene.add(bubble);}
					else if ('note' === key) {
						bubble = new $P.Bubble.Note({x: mousePosX + $P.state.scrollX, y: mousePosY, w: 300, h: 300});
						$P.state.scene.add(bubble);}
					else if (key === 'Delete_All') {
						if (window.confirm('Delete all bubbles?')) {
							$P.state.scene.deleteAll();}}
					else if (key === 'help') {
						window.open('documents/manual.pdf');}
					else if (key === 'Toggle_Hints') {
						$P.state.hintsEnabled = !$P.state.hintsEnabled;
						if (!$P.state.hintsEnabled) {
							$P.state.scene.sendEvent({name: 'destroyHints'});}}
					else if (key === 'Toggle_Links') {
						$P.state.linksEnabled = !$P.state.linksEnabled;
						$P.state.markDirty();}
				},
				items: {
					search: {name: 'Open Search Bubble'},
					pathway: {name: 'Open Pathway Bubble'},
					'help': {name: 'Open Manual'},
					'treering': {name: 'Open Entire Pathway'},
					'force': {name: 'Open Force Bubble'},
					note: {name: 'Open Note Bubble'},
					save: {name: 'Save'},
					load: {name: 'Load'},
					record: {name: 'Start Recording'},
					'Delete_All': {name: 'Delete All'},
					'Toggle_Hints': {name: 'Toggle Hints'},
					'Toggle_Links': {name: 'Toggle Links'}}
			});}
		setContextMenu();
	});
})(PATHBUBBLES);
