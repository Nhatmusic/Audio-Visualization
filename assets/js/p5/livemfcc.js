// setup init variables
var DEFAULT_MFCC_VALUE = [0,0,0,0,0,0,0,0,0,0,0,0,0]
var FEATURE_NAME_MFCC = 'mfcc'
var FEATURE_NAME_RMS = 'rms'

var THRESHOLD_RMS = 0.002 // threshold on rms value
var MFCC_HISTORY_MAX_LENGTH = 60

var BOX_WIDTH = 10
var BOX_HEIGHT = 10

var silence = true

var cur_mfcc = DEFAULT_MFCC_VALUE
var cur_rms = 0
var mfcc_history = [];
var mfcc_test = [];
var mfcc_group = [];



function
/* create microphone
audio input source from
audio context */
createMicSrcFrom(audioCtx){
    /* get microphone access */
    return new Promise((resolve, reject)=>{
        /* only audio */
        let constraints = {audio:true, video:false}

        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream)=>{
                /* create source from
                microphone input stream */
                let src = audioCtx.createMediaStreamSource(stream)
                resolve(src)
            }).catch((err)=>{reject(err)})
    })
}



function
/* call given function
on new microphone analyser
data */
onMicDataCall(features, callback){
    return new Promise((resolve, reject)=>{
        let audioCtx = new AudioContext();

        createMicSrcFrom(audioCtx)
            .then((src) => {
                analyzer = Meyda.createMeydaAnalyzer({
                    'audioContext': audioCtx,
                    'source':src,
                    'bufferSize':8192,
                    'featureExtractors':features,
                    'callback':callback
                })
                resolve(analyzer)
            }).catch((err)=>{
            reject(err)
        })
    })

}

window.onload = function() {
    // function setup() {
        // canvas setup
        var live_canvas = createCanvas(BOX_WIDTH * MFCC_HISTORY_MAX_LENGTH*3, BOX_HEIGHT * (cur_mfcc.length+13));
        live_canvas.id('live_canvas');
        background(255, 230, 150)
        // create meyda analyzer
        // and connect to mic source
        onMicDataCall([FEATURE_NAME_MFCC, FEATURE_NAME_RMS], show)
            .then((meydaAnalyzer) => {
                meydaAnalyzer.start()

            }).catch((err)=>{
            alert(err)
        })
    // }

}



function show(features){
    // update spectral data size
    cur_mfcc = features[FEATURE_NAME_MFCC]
    cur_rms = features[FEATURE_NAME_RMS]
}



function draw () {
    clear ()
    background ( 255, 230, 150 )

    /* append new mfcc values */
    if ( cur_rms > THRESHOLD_RMS ) {
        mfcc_history.push ( cur_mfcc )
        mfcc_test.push(cur_mfcc)
        if (mfcc_test.length%50==0){
            mfcc_group.push(mfcc_test)
            mfcc_test = [];
        }

        silence = false
    } else {
        // push an empty mfcc value
        // to signify end of utterance
        if ( silence == false ) {
            mfcc_history.push(DEFAULT_MFCC_VALUE)
            silence = true
        }
    }

    // only store the last n
    if(mfcc_history.length > MFCC_HISTORY_MAX_LENGTH)
        mfcc_history.splice(0,1)

    plot(mfcc_history)
}


let plot = (data) => {
    for(let i = 0; i < data.length; i++ ) {
        for(let j = 0; j < data [i].length; j++ ) {
            let color_strength = data[i][j] * 100

            // setting color
            if ( data [i] [j] >= 0 )
                fill ( 0, color_strength, 0 )
            else
                fill( 0, 0, - color_strength )

            // noStroke();

            // drawing the rectangle
            rect(i * BOX_WIDTH, j * BOX_HEIGHT, BOX_WIDTH, BOX_HEIGHT)
        }
    }
}