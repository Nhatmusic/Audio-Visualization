'use strict';

importScripts('./assets/tsne.min.js');

//function return a postMessage which show the status of worker
function isBusy () {
    postMessage({
        type: 'STATUS',
        data: 'BUSY'
    });
}

//function return a postMessage which show the status of worker
function isReady () {
    postMessage({
        type: 'STATUS',
        data: 'READY'
    });
}

isBusy();

//create a new tsne instance with default configuration
var model = new TSNE({
    dim: 2,
    perplexity: 2.0,
    earlyExaggeration: 4.0,
    learningRate: 100.0,
    nIter: 50,
    metric: 'euclidean'
});

//assign control variable called firstRun
var firstRun = true;

//function inside onmessage will be called when worker receives data or message
self.onmessage = function (e) {

    //get data pass to worker when it is called
    var msg = e.data;
//case statement depends on the type of message pass to worker
    switch (msg.type) {
        //if message type is 'input data' then initial the T_sne model
        case 'INPUT_DATA':
            isBusy();

            model.init({
                data: msg.data,
                type: 'dense'
            });
            isReady();
            break;
            //if message type is 'RUN' then run the t-sne, post a message back to the front-end to know that worker is busy, not receive any data
        case 'RUN':
            isBusy();
            model.perplexity = msg.data.perplexity;
            model.earlyExaggeration = msg.data.earlyExaggeration;
            model.learningRate = msg.data.learningRate;
            model.nIter = msg.data.nIter;
            model.metric = msg.data.metric;
            if (firstRun) {
                model.run();
                firstRun = false;
            } else {
                model.rerun();
            }
            //when t-sne finishes post message to the front-end to know that it's done calculate the t-sne, please get the output to do something else.
            postMessage({
                type: 'DONE'
                // data: model.getOutputScaled()

            });
            isReady();
            //post message to front-end, i am ready to receive the data to calculate
            // isReady();
            break;
        default:
    }
};

// emitted progress events
//update the value of t-sne iteration when it's running to the front-end
model.on('progressIter', function (iter) {
    // data: [iter, error, gradNorm]

    postMessage({
        type: 'PROGRESS_ITER',
        data: iter
    });


});
//update the status of t-sne to front-end
model.on('progressStatus', function (status) {
    postMessage({
        type: 'PROGRESS_STATUS',
        data: status
    });
});
//update the data after each iteration to front-end to draw
model.on('progressData', function (data) {
    postMessage({
        type: 'PROGRESS_DATA',
        data: data
    });
});

