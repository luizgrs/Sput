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


    function findUserMedia() {
        userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    function findAnimationTransform() luizg{
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
        console.log('We have a result', e);
        var input = getInput(current_trigger);
        if (e.results.length > 0)
            input.setAttribute('value', e.results[0][0].transcript);
    }

    function setupInput(input) {
        var trigger = document.createElement('button');
        trigger.setAttribute('class', 'trigger');

        var label = document.createElement('span');
        label.innerHTML = '&#127908;';
        trigger.appendChild(label);

        var bg = document.createElement('div');
        bg.setAttribute('class', 'background');
        trigger.appendChild(bg);

        setInput(trigger, input);
        trigger.addEventListener('click', captureAudio);
        input.parentNode.appendChild(trigger);
    }

    function onRecognitionStart(e) {

        console.log('Starting listening for audio input...');
        current_trigger.querySelector('.background').style.display = 'block';
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
                console.log('getuserMedia failed');
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

            var bg = current_trigger.querySelector('.background');
            bg.style.display = '';
            bg.style[transformProp] = 'scale(' + size + ',' + size + ')';
            bg.style.borderRadius = size + 'px';

            window.requestAnimationFrame(updateTriggerAnimation);
        }

    }

    function onRecognitionEnd(e) {
        getInput(current_trigger).removeAttribute('readOnly');
        current_trigger.querySelector('.background').style.display = 'none';
        current_trigger = null;

        if (micUserMedia) {
            micUserMedia.disconnect();

            if (micUserMedia.mediaStream)
                micUserMedia.mediaStream.stop();
        }

        console.log('Stopped listening for audio input...');
    }

    function stopAudioCapture() {
        recognition.stop();
    }

    function getInput(trigger) {
        return trigger_inputs[trigger];
    }

    function setInput(trigger, input) {
        trigger_inputs[trigger] = input;
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
        recognition.start();
    }

    me.prepare = function (inputs, options) {
        if (!recognition) {
            console.log('This browser does not support the Web Speech API');
            return;
        }
        if (!inputs) inputs = document.querySelectorAll('input[x-webkit-speech]');

        if (!inputs)
            return;

        var x;
        for (x = 0; x < inputs.length; x++)
            setupInput(inputs[x]);

    }

    findRecognition();
    findUserMedia();
    findAudioContext();
    findAnimationTransform();
} ();