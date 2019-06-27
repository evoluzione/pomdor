window.addEventListener('DOMContentLoaded', () => {

	[].forEach.call(document.querySelectorAll('.js-audio'), function(el) {
		el.addEventListener('click', () => {
			el.classList.toggle('fa-volume-mute');
			el.classList.toggle('fa-volume-up');
		})
	});

	[].forEach.call(document.querySelectorAll('.js-settings'), function(el) {
		el.addEventListener('click', () => {
			const a = document.getElementById('js-panel');
			a.classList.toggle('is-active');
			el.classList.toggle('fa-times-circle');
			el.classList.toggle('fa-sliders-h');
		})
	});

	const progressCurrent = document.querySelectorAll('.js-progress-current');

	progressCurrent.forEach((path) => {
		// Get the length of the path
		let length = path.getTotalLength();

		// Just need to set this once manually on the .meter element and then can be commented out
		// path.style.strokeDashoffset = length;
		// path.style.strokeDasharray = length;

		// Get the value of the meter
		let value = parseInt(path.parentNode.getAttribute('data-value'));
		// Calculate the percentage of the total length
		let to = length * ((100 - value) / 100);
		// Trigger Layout in Safari hack https://jakearchibald.com/2013/animated-line-drawing-svg/
		path.getBoundingClientRect();
		// Set the Offset
		path.style.strokeDashoffset = Math.max(0, to);
	});
});