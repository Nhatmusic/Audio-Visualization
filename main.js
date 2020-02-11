let audio_label = [];
let fileContent = [];
let featureType = 'mfcc';
let featureType2 = 'rms';
let mfcc_data = [];
let mfcc_data_all = [];
let draw_ssm_worker;
let tsne_worker;
let tsne_data_worker;
let store_process_tsne_data = [];
let empty = [];
let fakeDataforfirstplot = [];
let store_image_in_canvas = [];
let output_tsne;
let firstdraw = true;

let tsne_config = {
    opt: {
        epsilon: 10, // epsilon is learning rate (10 = default)
        perplexity: parseInt($('#myRange1').val(), 10)||5, // roughly how many neighbors each point influences (30 = default)
        // tsne_iteration: parseInt($('#myRange2').val(), 10) || 100,
        dim: 2 // dimensionality of the embedding (2 = default)

    }
};

//set up heatmap canvas
var BOX_WIDTH = 5;
var BOX_HEIGHT = 5;
var heatmap_max_length = 84;

//get file directory
window.onload = function () {
    //Load the sound sample then get the sound label
    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        let files = event.target.files;
        console.log(files);
        for (i = 0; i < files.length; i++) {
            audio_label.push(files[i].name.split('_').slice(0, 2).join("_"));
            fileContent.push(URL.createObjectURL(files[i]));
        }
        fakeDataforfirstplot = Array(fileContent.length).fill([0]);
        fakeDataforFirstScatterplot();
        tsne_worker = new Worker('new_tsne_worker.js');
        //getData function was called recursively to
        get_mfcc_data(fileContent[0], 0);
    }, false);
}


Audio.prototype.isPlaying = function () {
    return this
        && this.currentTime > 0  // Audio has started playing
        && !this.paused          // Audio playback is not paused
        && !this.ended           // Audio playback is not ended
        && this.readyState >= 3; // Audio data is available and ready for playback
};
Audio.prototype.stop = function () {
    // Pause the playback
    this.pause();
    // Reset the playback time marker
    this.currentTime = 0;
};
let width = 900, height = 450,
    margin = {left: 50, top: 50, right: 50, bottom: 50},
    contentWidth = width - margin.left - margin.right,
    contentHeight = height - margin.top - margin.bottom;

function setup() {
// canvas setup
//     frameRate(30);
    var live_canvas=createCanvas(heatmap_max_length*BOX_WIDTH*4.0, 26*BOX_HEIGHT);
    live_canvas.parent('live_canvas');
    background(0)
    //Create worker to draw self-similarity-matrix in canvas whenever it has data
    draw_ssm_worker = new Worker('drawssm.js');
    tsne_data_worker = new Worker('process_tsne_data.js');
    tsne_worker = new Worker('new_tsne_worker.js');
    //initiate scatter plot for tsne



    svg_scatterplot = d3.select("#theGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    scatterplot = svg_scatterplot
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.right})`)
        .attr("id", "snodes");
}

function get_mfcc_data(a, index) {

    //Create audioContext to decode the audio data later
    var audioCtx = new AudioContext();
    //Create source as a buffer source node which contains the audio data after decoding
    var source = audioCtx.createBufferSource();
    //use XMLHttpRequest to load audio track
    var request = new XMLHttpRequest();
    //Open audio file
    request.open('GET', a, true);
    //The response is a JavaScript ArrayBuffer containing binary data.
    request.responseType = 'arraybuffer';
    //return the audio data to audioData variable type arraybuffer
    request.onload = function () {
        d3.select("#loader").style("display", "block");
        var audioData = request.response;
        //decode the audio data from array buffer and stored to AudioBufferSourceNode
        audioCtx.decodeAudioData(audioData, function (buffer) {
            //store data to buffer source node
            source.buffer = buffer;
            //find the duration of the audio in second after decoding
            var duration1 = 0;
            duration1 = source.buffer.duration;
            //ignore the sound sample's duration exceeds the default setting
            if (duration1 > parseInt($('#duration').val(), 10)) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index != fileContent.length) {
                    get_mfcc_data(fileContent[index], index)
                }
            }
            else {
                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, 44100 * duration1, 44100);
                //create buffer source node which is used in Meyda Analyzer
                var source11 = offlineCtx.createBufferSource();
                //store the audio data to the buffer source node again
                source11.buffer = buffer;
                //connect the source node to offline audio context then go to Meyda Analyzer
                source11.connect(offlineCtx.destination);
                //start the buffer source node
                source11.start();
                var windowsize = 4096;
                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': windowsize,
                    'hopSize': windowsize / (parseInt($('#duration').val(), 10) / duration1),
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': mfcc_extract
                });
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                // var hop = Meyda.hopSize;
                // var buf = Meyda.bufferSize;
                // var dur = duration1;
                // audio_statistic.push({duration: dur, bufferSize: buf, hopSize: hop})
                //Using offline audio context to render audio data
                offlineCtx.startRendering();
                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //copy the data generated from Meyda Analyzer 1

                    var store_each_sound_mfcc = [];
                    //mfcc_data is generated from function show1 of Meyda Analyzer 1 of each sound samples
                    store_each_sound_mfcc = mfcc_data;

                    //mfcc_data_all contains all the mfcc features of all sound samples
                    mfcc_data_all.push(store_each_sound_mfcc);
                    //draw first scatter plot for all sound sample
                    // fakeDataforFirstScatterplot();
                    draw_ssm_worker.postMessage({
                        data: store_each_sound_mfcc
                    });
                    tsne_data_worker.postMessage({
                        data: store_each_sound_mfcc
                    })
                    draw_ssm_worker.onmessage = function(e){
                        var msg = e.data;
                        store_image_in_canvas.push(drawmatrix(msg.data));
                    }


                    tsne_data_worker.onmessage = function(e) {
                        var msg = e.data;
                                store_process_tsne_data.push(msg.value);

                              if (store_process_tsne_data.length == 2) {
                                  tsne_worker.postMessage({message: 'initTSNE', value: tsne_config.opt});
                              }
                              if (store_process_tsne_data.length > 2) {
                                  tsne_worker.postMessage({
                                      message: 'DataReady',
                                  });
                              }

                        }

                    tsne_worker.onmessage = function(e) {
                        var msg = e.data;

                        switch (msg.message){
                            case 'BUSY':
                                console.log('Iam busy');
                                break;
                            case 'READY':
                                tsne_worker.postMessage({
                                    message: 'RUN',
                                    value: store_process_tsne_data.slice(0, 2)
                                });
                                break;
                            case 'Update':
                                if(store_process_tsne_data.length>msg.index) {
                                    console.log(msg.index);
                                    tsne_worker.postMessage({
                                        message: 'UpdateData',
                                        value: store_process_tsne_data.slice(0, msg.index + 1)
                                    })
                                }
                                console.log('hehe'+msg.index);
                                console.log('haha' +store_process_tsne_data.length);
                            output_tsne = msg.value;
                                if (fileContent.length ==  msg.index){
                                    tsne_worker.postMessage({
                                        message: 'Done'
                                    })
                                }
                                break;
                            case 'DrawUpdate':
                                drawscatterplot(msg.value);
                                break;
                            case 'Done':
                                firstdraw = false;
                                drawscatterplot(msg.value);
                            default:
                                break;

                        }
                    }


                    mfcc_data = [];
                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    ++index;
                    console.log("loading"+index)
                   //call the function get_mfcc_data recursively
                    if (index < fileContent.length) {
                        get_mfcc_data(fileContent[index], index)
                    }

                    else if (index == fileContent.length) {

                        d3.select("#loader").style("display", "none");


                    }
                }
            }
        }).catch(function (err) {
            console.log('Rendering failed: ' + err);
            // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
    };
    request.send();
    return 0;
}




//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function mfcc_extract(features) {
    var mfcc = features[featureType];
    var rms = features[featureType2];
    //mfcc data contains all the mfcc feature extracted from sound in time series
    if (rms > 0) {
        mfcc_data.push(mfcc)
    }
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data) {
    var canvas="compareCanvas";
    //scale the self_similarity data value to draw
    var CSM22 = d3.scaleLinear()
        .domain([math.min(self_similarity_data), math.max(self_similarity_data)])
        .range([0, 1]);
    var scaled_self_similarity_data = [];
    for (var i = 0; i < self_similarity_data.length; i++) {
        var CSM44 = [];
        for (var j = 0; j < self_similarity_data[0].length; j++) {
            CSM44.push(CSM22(self_similarity_data[i][j]))
        }
        scaled_self_similarity_data.push(CSM44);
    }
    //Create color data from scaled_self_similarity_data
    var color_data = [];
    for (var i = 0; i < scaled_self_similarity_data.length; i++) {
        var data3 = [];
        for (var j = 0; j < scaled_self_similarity_data[0].length; j++) {
            //get R G B value after convert scaled self similarity data to HSL color scale
            data3.push(d3.rgb(d3.hsl(scaled_self_similarity_data[i][j] * 257, 1, 0.5)));
        }
        color_data.push(data3);
    }

    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");

    // define the size of image
    var imgData = ctx.createImageData(color_data[0].length, color_data.length);
    //draw each pixel, one pixel contain 4 values (R G B A),
    for (var i = 0; i < color_data.length; i++) {
        for (var j = 0; j < color_data[0].length; j++) {
            //each step is 4, the next pixel value have index in position 4 5 6 7,
            var pos = (i * color_data[0].length + j) * 4;
            imgData.data[pos + 0] = color_data[i][j].r;
            imgData.data[pos + 1] = color_data[i][j].g;
            imgData.data[pos + 2] = color_data[i][j].b;
            imgData.data[pos + 3] = 255;
        }
    }

    //define where to put the image in canvas
    ctx.putImageData(imgData, 0, 0);

    //save canvas to png image then call back to use in network diagram
    var imagedata = c.toDataURL("image/png");
    return imagedata;
    console.log("I am calculating the distance");
}



function draw() {
    clear ();
    background ( 220,220,220);
    plot(mfcc_data);
}

function plot(data){
    for(let i = 0; i < data.length; i++ ) {
        for(let j = 0; j < data [i].length; j++ ) {
            let color_strength = data[i][j] * 100

            // setting color
            if ( data [i] [j] >= 0 )
                fill ( 0, color_strength, 0 )
            else
                fill( 0, 0, - color_strength )
            // noStroke();
            //drawing the rectangle
            rect(i * BOX_WIDTH*2, j * BOX_HEIGHT*2, BOX_WIDTH*2, BOX_HEIGHT*2)
        }
    }
}

function fakeDataforFirstScatterplot() {

    fakeDataforfirstplot.forEach(function(d, i) {
        fakeDataforfirstplot[i].x = d[0];  // Add the t-SNE x result to the dataset
        fakeDataforfirstplot[i].y = d[0];  // Add the t-SNE y result to the dataset

    });

    Draw_Scatterplot(fakeDataforfirstplot);

}

