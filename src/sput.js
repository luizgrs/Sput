var Sput = new function () {

    var me = this;
    var recognition = null;
    var userMedia = null;
    var micStreamAnalyser = null;
    var micUserMedia = null;
    var audioContext = null;
    var current_trigger = null;
    var transformProp = null;
    var trigger_inputs = {};
	var classes = { trigger: 'sput-trigger', triggerBg: 'sput-trigger-bg', container: 'sput-container', input: 'sput-input', listening: 'sput-listening' };
	var debug = false;

	
    function findUserMedia() {
        userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    function findAnimationTransform() {
        var test = document.createElement('span');

        var attempts = ['transform', 'webkitTransform', 'msTransform', 'mzTransform', 'oTransform'];
        for (var x = 0; x < attempts.length; x++)
            if (attempts[x] in test.style) {
                transformProp = attempts[x];
                break;
            }
    }

    function findRecognition() {
        recognition = window.SpeechRecognition || window.webkitSpeechRecognition;


        if (recognition) {
            recognition = new recognition();
            //TODO Change this to true and prepare the code to handle interim results
            recognition.interimResults = false;
            recognition.onstart = onRecognitionStart;
            recognition.onresult = handleRecognitionResult;
            recognition.onerror = function (e) { console.log('Speech recognition error... (' + e.error + ' / ' + e.messsage + ')'); };
            recognition.onend = onRecognitionEnd;

            //TODO Change to a better language approach
            recognition.lang = navigator.language;
        }

    }

    function findAudioContext() {
        audioContext = window.AudioContext || window.webkitAudioContext;

        if (!audioContext)
            return;

        audioContext = new audioContext();
        micStreamAnalyser = audioContext.createAnalyser();
        micStreamAnalyser.fftSize = 128;
        //micStreamAnalyser.connect(audioContext.destination);
    }

    function handleRecognitionResult(e) {
		debugLog('We have a result', e);
			
        var input = getInput(current_trigger);
        if (e.results.length > 0)
            input.setAttribute('value', e.results[0][0].transcript);
    }

    function onRecognitionStart(e) {
		debugLog('Starting listening for audio input...');

        current_trigger.parentNode.classList.add(classes.listening);
        if (userMedia && audioContext) {
            userMedia.call(navigator, { audio: true }, function (stream) {
                if (current_trigger != null) {
                    micUserMedia = audioContext.createMediaStreamSource(stream);
                    micUserMedia.connect(micStreamAnalyser);
                    if (transformProp)
                        window.requestAnimationFrame(updateTriggerAnimation);
                }
                else {
                    //if we get access to the stream late we just stop it
                    stream.stop();
                }
            }, function () {
				debugLog('getuserMedia failed');
            });
        };
    }

    function updateTriggerAnimation() {
        if (current_trigger) {
            var fData = new Uint8Array(micStreamAnalyser.frequencyBinCount);
            micStreamAnalyser.getByteFrequencyData(fData);

            var sum = 0;
            var x;
            for (x = 0; x < fData.length; x++) {
                sum += fData[x];
            }

            var result = sum / fData.length;
            var maxAcceptableResult = 50; //magic number very accurate and collected during tests using me yelling at the mic

            result = Math.min(result, maxAcceptableResult);

            var maxSize = Math.max(current_trigger.offsetHeight, current_trigger.offsetWidth);

            var current_ratio = result / maxAcceptableResult;

            var size = Math.round(current_ratio * maxSize);
            if (isNaN(size))
                size = 1;

            var bg = current_trigger.querySelector('.'+classes.triggerBg);
            bg.style[transformProp] = 'scale(' + size + ',' + size + ')';

            window.requestAnimationFrame(updateTriggerAnimation);
        }

    }

    function onRecognitionEnd(e) {
        getInput(current_trigger).removeAttribute('readOnly');
        current_trigger.parentNode.classList.remove(classes.listening);
        current_trigger = null;

        if (micUserMedia) {
            micUserMedia.disconnect();

            if (micUserMedia.mediaStream)
                micUserMedia.mediaStream.stop();
        }

		debugLog('Stopped listening for audio input...');
    }

    function stopAudioCapture() {
        recognition.stop();
    }

    function getInput(trigger) {
        return trigger_inputs[trigger];
    }

	function onInputFocus(e){
		e.currentTarget.parentNode.classList.add('sput-focus');
	}
	
	function onInputBlur(e){
		e.currentTarget.parentNode.classList.remove('sput-focus');
	}	
	
    function setInput(trigger, input) {
        trigger_inputs[trigger] = input;
    }
	
	function setupInput(input, options) {

		input.addEventListener('focus', onInputFocus);
		input.addEventListener('blur', onInputBlur);
		
		
		var inputComputedStyle = window.getComputedStyle(input);

		
		var container = document.createElement('div');
		container.classList.add(classes.container);
		input.parentNode.insertBefore(container, input);
		container.appendChild(input);
		
		container.style.fontSize = inputComputedStyle.fontSize;

        var trigger = document.createElement('button');
        trigger.classList.add(classes.trigger);
        trigger.addEventListener('click', captureAudio);
        container.appendChild(trigger);
		
		var label;
		if(!options.triggerLabel || !options.triggerLabel.cloneNode)
		{
			label = document.createElement('span');
			
			if (typeof options.triggerLabel == 'string')
				label.innerText = options.triggerLabel;
			else
				label.innerHTML = '&#127908;';
		}
		else 
			label = options.triggerLabel.cloneNode(true);
        
		trigger.appendChild(label);

		//create BG but do not position it yet because the trigger may be invisible
        var bg = document.createElement('div');
        bg.classList.add(classes.triggerBg);
        trigger.appendChild(bg);

		input.classList.add(classes.input);
		
		//only get width/height after applying our class
		if(options.adjustInputSize != false)
			input.style.width = (input.offsetWidth - trigger.offsetWidth) + 'px';
		trigger.style.height = input.offsetHeight + 'px';
        
		setInput(trigger, input);
    }
	
    function captureAudio(e) {
        var trigger = e.currentTarget;
        var input = getInput(trigger);
        var previous_trigger = current_trigger;

        if (current_trigger != null)
            stopAudioCapture();

        if (previous_trigger == trigger) //user was only aborting
            return;

        input.setAttribute('readOnly', 'readOnly');
        current_trigger = trigger;
        input.setAttribute('value', '');
		
		//position trigger background
		var bg = trigger.querySelector('.'+classes.triggerBg);
		bg.style.top = ((trigger.offsetHeight / 2) - (bg.offsetHeight / 2)) + 'px';
		bg.style.left = ((trigger.offsetWidth / 2) - (bg.offsetWidth / 2)) + 'px';
		
        recognition.start();
    }

	function debugLog(){
		if(debug && arguments.length > 0)
			console.log.apply(console, arguments);
	}
	
	
	//options = { triggerLabel: htmlElementToBeUsedInsideButtonTrigger, debug: true/false, adjustInputSize: false/true }
    me.prepare = function (inputs, options) {
		if(!options)
			options = {};	
	
		if(options.debug !== undefined)
			debug = options.debug;
			
        if (!recognition) {
			debugLog('This browser does not support the Web Speech API');
            return;
        }
        if (!inputs) inputs = document.querySelectorAll('input[x-webkit-speech]');

        if (!inputs)
            return;
			

		if(inputs.length)
		{
			for (var x = 0; x < inputs.length; x++)
				setupInput(inputs[x], options);
		}
		else
			setupInput(inputs, options);
    }

    findRecognition();
    findUserMedia();
    findAudioContext();
    findAnimationTransform();
} ();