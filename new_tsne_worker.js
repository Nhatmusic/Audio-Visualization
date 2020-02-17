'use strict';

importScripts('./assets/js/tsne_new.js');


//function return a postMessage which show the status of worker
function isBusy () {
    postMessage({
        message: 'BUSY'
    });
}

//function return a postMessage which show the status of worker
function isReady () {
    postMessage({
        message: 'READY'
    });
}

//assign control variable called firstRun
let firstRun = true;
//define first instance of tsne
let tsne;
// var isUpdate = false;
let store_tsne_solution;
let index;

let store_tsne_stage_solution;
let count_step;
//function inside onmessage will be called when worker receives data or message
self.onmessage = function (e) {

    //get data pass to worker when it is called
    var msg = e.data;
    var step_tsne;
    // console.log(msg);
//case statement depends on the type of message pass to worker
    switch (msg.message) {

        //if message type is 'input data' then initial the T_sne model
        case 'initTSNE':
            // isBusy();
            tsne = new tsnejs.tSNE(msg.value);
            isReady();
            break;
        //if message type is 'RUN' then run the t-sne, post a message back to the front-end to know that worker is busy, not receive any data
        case 'RUN':

            // isBusy();
                //if firstRun, then there are 2 samples, let tsne run for 10 step and store the position
                if (firstRun ==  true) {
                    tsne.initDataRaw(msg.value);
                    for (let i = 0; i < 500; i++)
                    {
                        tsne.step();
                        tsne.getSolution();

                    }
                    //get the current solution of tsne of the first run
                    store_tsne_solution = tsne.getSolution();
                    // console.log(store_tsne_solution);

                    firstRun = false;
                    console.log('Run tsne')

                }
        case'DataReady':

                index = store_tsne_solution.length;
                postMessage({
                    message: 'Update',
                    value: store_tsne_solution,
                    index: index
                });
                index ++;
        // }
            break;

        case'UpdateData':
            //if there are more than 2 samples, we update the data only, does not re-generate random position in low dimension
            tsne.updateData(msg.value);
            for (let i = 0; i < 500; i++)
            {
                tsne.step();
                step_tsne = tsne.getSolution();
                // console.log(step_tsne.flat());
                    postMessage({
                        message: 'DrawUpdate',
                        value: step_tsne
                    });

            }
            store_tsne_solution = tsne.getSolution();
                postMessage({
                    message: 'Update',
                    value: store_tsne_solution,
                    index: store_tsne_solution.length
                });
            break;

        case 'Done':
            for (let i = 0; i < 500; i++)
            {
                tsne.step();
                step_tsne = tsne.getSolution();
                postMessage({
                    message: 'DrawUpdate',
                    value: step_tsne
                });
            }
                postMessage({
                    message: 'Done',
                    value: store_tsne_solution,
                    index: store_tsne_solution.length
                });

        default:

    }
};
