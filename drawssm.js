'use strict';
importScripts("./assets/js/d3.v4.min.js");
importScripts("./assets/js/math.min.js");


var total_self_similarity_data = [];

//function inside onmessage will be called when worker receives data or message
self.onmessage = function (e) {
    var datadraw=e.data;
    total_self_similarity_data.push(predata(datadraw.data));

    postMessage({
        data:  predata(datadraw.data)
    });

}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data) {
        console.log('pre')
        // data normalization
        var normalized_data = [];
        for (var i = 0; i < origin_data.length; i++) {
            var data1 = [];
            var average = math.mean(origin_data[i]);
            for (var j = 0; j < origin_data[0].length; j++) {
                data1.push((origin_data[i][j] - average) / math.norm(origin_data[i][j] - average));
            }
            normalized_data.push(data1);
        }
        //calculate euclidean distance between two mfcc vector->create self similarity matrix
        var self_similarity_data = [];

        for (var i = 0; i < normalized_data.length; i++) {
            var data2 = [];
            for (var j = 0; j < normalized_data.length; j++) {
                data2.push(math.multiply(normalized_data[i], normalized_data[j]) / (math.norm(normalized_data[i]) * math.norm(normalized_data[j])));
            }
            self_similarity_data.push(data2);
        }

        return self_similarity_data;
}

