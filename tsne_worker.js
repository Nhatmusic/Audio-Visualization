
let worker;
var controltoto=true;

function init (data) {

    worker = new Worker('worker.js');

    worker.onmessage = function (e) {

        var msg = e.data;

        switch (msg.type) {
            case 'PROGRESS_DATA':

                UpdateDataTSNE(msg.data);
                 Draw_Scatterplot(total_origin_data2[count_tsne_data]);
             // }
             controltoto=false;
                break;
            case 'STATUS':
                if (msg.data === 'READY') {
                    runtsne()
                }
                break;
            case 'DONE':
                ++count_tsne_data;
                controltoto=true;

                worker.postMessage({
                    type: 'INPUT_DATA',
                    data: total_origin_data2[count_tsne_data]
                });
                break;
            default:
        }
    }

    worker.postMessage({
        type: 'INPUT_DATA',
        data: data.dataset
    });


}
function runtsne () {
    worker.postMessage({
        type: 'RUN',
        data: {
            perplexity: parseInt($('#myRange1').val(), 10),
            earlyExaggeration: 4.0,
            learningRate: 100.0,
            nIter: parseInt($('#myRange2').val(), 10),
            metric: 'euclidean'
        }
    });
}

