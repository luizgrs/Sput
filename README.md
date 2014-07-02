Sput
====

Helper for enable Speech Recognition in HTML Inputs using Web Speech API


x-webkit-speech Deprecation
============================

Once the attribute x-webkit-speech is deprecated there is no easy way to enable speech recognition in input fields. 

The attribute used not only SpeechRecognition but also Web Audio API in order to provide a feedback for the audio input

Sput will enable a very similar behavior like the old x-webkit-speech attribute.


How to Use
===========

Load sput.js and sput.css in your HTML then call the prepare method:
```JavaScript
Sput.prepare();
```
With no params it will detect all input fields with the deprecated x-webkit-speech attribute and transform them in Sput fieds.
You can also specify one or more:
```JavaScript
Sput.prepare(document.getElementById('inputId'));
Sput.prepare(document.querySelectorAll('input[type=text]'));
```

Required Features in Browsers
=============================

Sput is built with only native javascript, no library is required. However it depends on some new (or in progress) standards. The web speech api is very new so I believe there are no problems in also use the other new ones.
- Web Speech API (http://caniuse.com/#feat=web-speech): It does the speech recognition work.
- getUserMedia API (http://caniuse.com/#feat=stream): Captures mic input and redirect to Web Audio API
- Web Audio API (http://caniuse.com/#feat=audio-api): Captures audio to detect user speech and provides feedback
- CSS Transform 2D (http://caniuse.com/#feat=transforms2d): Scale transformation to animate the speech input circle
- querySelectorAll (http://caniuse.com/#search=querySelectorAll): get elements in the document using CSS selectors
- element.ClassList (http://caniuse.com/#feat=classlist): Adds/removes classes to elements attributes easily
