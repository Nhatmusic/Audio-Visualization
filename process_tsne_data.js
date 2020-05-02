'use strict';
importScripts("./assets/js/math.min.js");
importScripts("./assets/js/underscore.js");
importScripts("./assets/js/d3.v4.min.js");
importScripts("./assets/js/numjs.min.js");
var total_process_tsne_data = [];
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


//function inside onmessage will be called when worker receives data or message
self.onmessage = function (e) {
    isBusy();
    var datadraw=e.data;
switch (e.data.control) {
    case 'rerun':
        total_process_tsne_data = [];
        datadraw.data.forEach(
            d => total_process_tsne_data.push(data_preprocess(d, datadraw.select_feature))
        )
        postMessage({
            value: total_process_tsne_data,
            message: 'FEATURES'
        })
        break;
    default:
    total_process_tsne_data.
        push(data_preprocess(datadraw.data, datadraw.select_feature));
        postMessage({
            value: data_preprocess(datadraw.data, datadraw.select_feature),
            message: 'READY'
        })
        break;
}
    // isReady();
}

function data_preprocess(origin_data, selection){
    if (origin_data.length%2!=0) {
        origin_data=origin_data.slice(0,origin_data.length-1)
    }
    function scale(data){
        var scale1=d3.scaleLinear().domain([math.min(origin_data),math.max(origin_data)]).range([0,1])
        var scale_data=[]
        data.forEach(d=>scale_data.push(scale1(d)))
        return scale_data
    }
    const reducer = (accumulator, currentValue) => math.add(accumulator, currentValue);
    var mean = [];
    var standardeviation = [];
    var mean_std = [];
    var difference1 = [];
    var difference2 = [];
    var t_sne_data = [];
    var t_sne_data_extra = [];
    var origin_data_unzip = []
    origin_data_unzip = _.unzip(origin_data);
    origin_data_unzip.forEach(function (d) {
        // mean.push(math.mean(scale(d)));
        mean.push(math.mean(d))
        standardeviation.push(math.std(d))
    })
    var std_difference1=[];
    var std_difference2=[];
    var length=origin_data.length/2;
    for (var i = 0; i< origin_data_unzip.length; i++) {
        for (var k = 0; k < origin_data_unzip[0].length; k += 2) {
            std_difference1.push(math.subtract(origin_data_unzip[i][k+1],origin_data_unzip[i][k]))
        }
        std_difference2.push(math.std(std_difference1));
        // console.log(std_difference2)
    }
    mean_std=scale(mean).concat(scale(standardeviation))
    for (i = 0; i < origin_data.length; i += 2) {
        difference1.push(nj.subtract(origin_data[i+1], origin_data[i]).tolist());
    }
    difference2 = difference1.reduce(reducer)
    switch (selection){

        case "m":

            return mean;
            break;
        case "s":

            return standardeviation;
            break;
        case "d":
            return difference2;
            break;
        case "t":
            t_sne_data_extra=mean_std.concat(scale(math.divide(difference2,length)));
            return t_sne_data_extra;
            break;
        default:
            break;
    }


    // var std_difference1=[];
    // var std_difference2=[];
    // var length=origin_data.length/2;
    // for (var i = 0; i< origin_data_unzip.length; i++) {
    //     for (var k = 0; k < origin_data_unzip[0].length; k += 2) {
    //         std_difference1.push(math.subtract(origin_data_unzip[i][k+1],origin_data_unzip[i][k]))
    //     }
    //     std_difference2.push(math.std(std_difference1));
    //     // console.log(std_difference2)
    // }
    // mean_std=scale(mean).concat(scale(standardeviation))
    // for (i = 0; i < origin_data.length; i += 2) {
    //     difference1.push(nj.subtract(origin_data[i+1], origin_data[i]).tolist());
    // }
    // difference2 = difference1.reduce(reducer)
    //
    // t_sne_data_extra=mean_std.concat(scale(math.divide(difference2,length)));



}