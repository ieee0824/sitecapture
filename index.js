var webshot = require('webshot');

var defaultScreenSize = {
    width: 1024,
    height: 768
};

var options = {
    windowSize: defaultScreenSize,
    screenSize: defaultScreenSize,
    shotSize: defaultScreenSize,
    defaultWhiteBackground: true
};

webshot('google.co.jp', 'google.png', options, function(err) {
});

