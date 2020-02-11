// setup init variables
var mfcc = [];
var rms = 0;
var featureType = 'mfcc';
var featureType2 = 'rms';
var origin_data1 = [];
var total_origin_data=[];
var windowsize = 4096;
var durations=4;
var data_min=[];
var perplexity_value;
var iterations_value;
var selected_node=false;
var start_node_id;
var end_node_id;
var stopworker=false;
var audio_statistic = [];
var all_canvas_image = [];
var total_self_similarity_data = [];
var audio_label = [];

//get file directory
window.onload = function () {

    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        audio_label = [];
        let files = event.target.files;
        fileContent = [];
        for (i = 0; i < files.length; i++) {
            audio_label.push(files[i].name.split('_').slice(0,2).join("_"))
            fileContent.push(URL.createObjectURL(files[i]));
        }
        getData(fileContent[0], 0)

    }, false);


    var get_durations = document.getElementById("duration")
    get_durations.onchange = function () {
        durations=parseInt(this.value)
        console.log(durations)
    }
    var perplexity = document.getElementById("myRange1");
    var iterations = document.getElementById("myRange2");
    var output_perplexity = document.getElementById("perplexity_output");
    var output_iterations = document.getElementById("iteration_output");
    perplexity_value=perplexity.value;
    iterations_value=iterations.value

    perplexity.oninput = function() {
        output_perplexity.value= this.value;
        perplexity_value = this.value;
    }

    iterations.oninput = function() {
        output_iterations.value = this.value;
        iterations_value = this.value;
    }

//     //create keyboard
//     const synth = new Tone.AMSynth().toMaster()
//
// //attach a listener to the keyboard events
//     document.querySelector('tone-keyboard').addEventListener('noteon', e => {
//         synth.triggerAttack(e.detail.name)
//     })
//
//     document.querySelector('tone-keyboard').addEventListener('noteoff', e => {
//         synth.triggerRelease()
//     })

}



function getData(a, index) {
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
            if (duration1 > durations) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index == fileContent.length) {
                    var index1 = 0
                    //draw self_similarity matrix1
                    drawmatrix(total_self_similarity_data[index1], index1);
                } else {
                    getData(fileContent[index], index)
                }
            } else {
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
                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': windowsize,
                    'hopSize': windowsize / (durations / duration1),
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show1
                });
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                var hop = Meyda.hopSize;
                var buf = Meyda.bufferSize;
                var dur = duration1;
                audio_statistic.push({duration: dur, bufferSize: buf, hopSize: hop})
                //Using offline audio context to render audio data
                offlineCtx.startRendering();
                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //copy the data generated from Meyda Analyzer 1
                    var matrix1 = [];
                    var mean_data=[];
                    //origin_data1 is generated from function show1 of Meyda Analyzer 1
                    var matrix1 = origin_data1;
                    total_origin_data.push(origin_data1)
                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    var matrix11 = [];
                    var matrix11 = predata(matrix1, index);
                    ++index;
                    if (index < fileContent.length) {
                        origin_data1 = [];
                        getData(fileContent[index], index)
                    } else if (index == fileContent.length) {
                        var index1 = 0
                        //draw self_similarity matrix1
                        drawmatrix(total_self_similarity_data[index1], index1);
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
function data_preprocess(origin_data){
    if (origin_data.length%2!=0) {
        origin_data=origin_data.slice(0,origin_data.length-1)
    }
    const reducer = (accumulator, currentValue) => math.add(accumulator, currentValue);
    var mean = [];
    var standardeviation = [];
    var mean_std = [];
    var difference1 = [];
    var difference2 = []
    var t_sne_data = [];
    var t_sne_data_extra = [];
    var origin_data_unzip = []
    origin_data_unzip = _.unzip(origin_data);
    origin_data_unzip.forEach(function (d) {
        mean.push(math.mean(d));
        standardeviation.push(math.std(d))
    })
    var std_difference1=[];
    var std_difference2=[];
    for (i=0; i< origin_data_unzip.length; i++) {
        for (k = 0; k < origin_data_unzip[0].length; k += 2) {
            std_difference1.push(math.subtract(origin_data_unzip[i][k],origin_data_unzip[i][k+1]))
        }
        std_difference2.push(math.std(std_difference1));
        // console.log(std_difference2)
    }
    mean_std=mean.concat(standardeviation)
    for (i = 0; i < origin_data.length; i += 2) {
        difference1.push(nj.subtract(origin_data[i], origin_data[i + 1]).tolist());
    }
    difference2 = difference1.reduce(reducer)

    t_sne_data_extra=mean_std.concat(difference2);

    // return t_sne_data= t_sne_data_extra.concat(std_difference2)
    return t_sne_data_extra;
    // console.log("tala:" +t_sne_data)
}

//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {
    var mfcc = features[featureType];
    var rms = features[featureType2];
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data, index) {
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
            // data2.push(euclideanDistance(normalized_data[i], normalized_data[j]))
            data2.push(math.multiply(normalized_data[i], normalized_data[j]) / (math.norm(normalized_data[i]) * math.norm(normalized_data[j])));
        }
        self_similarity_data.push(data2);
    }
    self_similarity_data.index = index;
    total_self_similarity_data.push(self_similarity_data)
    return self_similarity_data;
}

function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {

        sum = distance(a, b);
        //if 2 vector does not have the same data lenthg, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
        sum = distance(a, b);

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))

        sum = distance(a, b)

    }
    return sum
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data, index1) {
    console.log('draw')
    //scale the self_similarity data value to draw
    var CSM22 = d3.scaleLinear()
        .domain([math.min(total_self_similarity_data), math.max(total_self_similarity_data)])
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
    c.width = color_data.length;
    c.height = color_data.length;
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
    var imagedata = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
    all_canvas_image.push(imagedata);

    //clear canvas everytime draw matrix
    ctx.clearRect(0, 0, 100, 100);
    ++index1;
    if (index1 < fileContent.length) {

        drawmatrix(total_self_similarity_data[index1], index1)
    }
    console.log("I am calculating the distance");
    if (index1 == (fileContent.length - 1)) {
        // alert('Song Loading Completed')
        // $.notify("Audio Loading Completed");
        $.notify("Audio Loading Completed", "success");
        d3.select("#loader").style("display", "none");
        // drawLegend()
    }

}

function calculate_tsne(){
    if (stopworker==true){
        stopWorker()
        stopworker=false;
    }
    stopworker=true;
    scatterplot.selectAll("circle").remove();
    scatterplot.selectAll("path").remove();
    // scatterplot.selectAll("circle").remove()
    var total_pre_process_data=[];
    total_origin_data.forEach(d=>{
        total_pre_process_data.push(data_preprocess(d))});
    data_min=total_pre_process_data;
    fileContent.forEach((d,i)=>{
        data_min[i].url=d;
        data_min[i].info=audio_statistic[i];
        data_min[i].id=i;
    })
    getcluster(data_min)
    // startWorker(total_pre_process_data,Initial_Scatterplot,getcluster)
    startWorker({dataset:total_pre_process_data,
        epsilon: 10,        // epsilon is learning rate (10 = default)
        perplexity: perplexity_value,    // roughly how many neighbors each point influences (30 = default)
        iterations: iterations_value})
    total_origin_data=[];
    audio_statistic = [];
    all_canvas_image = [];
    total_self_similarity_data = [];

}

//initiate scatter plot for tsne
width = 500, height = 400,
    margin = {left: 50, top: 50, right: 50, bottom: 50},
    contentWidth = width - margin.left - margin.right,
    contentHeight = height - margin.top - margin.bottom;

svg_scatterplot = d3.select("#theGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("transform",'translate(100,-30)');

scatterplot = svg_scatterplot
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.right})`)
    .attr("id", "snodes");

div = d3.select("body").append("div")
    .attr("class", "tooltip_circle")
    .style("opacity", 0);

// Draw a scatterplot from the given t-SNE data
function Initial_Scatterplot(tsne_data) {
    UpdateDataTSNE(tsne_data);      // Update our clu with the given t-SNE data
    _Draw_Scatterplot(data_min);    // Draw the scatterplot with the updated data
}

// Update the data with the given t-SNE result
function UpdateDataTSNE(data) {

    data.forEach(function(d, i) {
        data_min[i].x = d[0];  // Add the t-SNE x result to the dataset
        data_min[i].y = d[1];  // Add the t-SNE y result to the dataset
        data_min[i].label=audio_label[i];

    });


}

function playmusic(){
    let graph1 = {};
    graph1.nodes = [];
    graph1.links = [];
    for ( i=0; i < data_min.length; i++) {
        graph1.nodes.push({"id": i, "links": []})
    }
    var link2=[];
    for (i = 0; i < data_min.length - 1; i++) {
        var link1 = [];
        for (j = i + 1; j < data_min.length; j++) {
            link1.push({"source": i, "target": j, "weight": euclideanDistance(data_min[i],data_min[j]),
                "connection": data_min[i].label+ " : " +data_min[j].label})
        }
        link2.push(link1)
    }
    graph1.links=d3.merge(link2)

    //create minimumSpanningTree
       minimumSpanningTree = mst(graph1);
    var store_nodes=[];
    minimumSpanningTree.links.forEach(d=> {
        store_nodes.push([data_min[d.source],data_min[d.target]])
    })
    draw_path(store_nodes,100)

}
function draw_shortestpath(){
    var node_circle=[];
    node_circle = svg_scatterplot.selectAll("circle")._groups[0];
    minimumSpanningTree.links.forEach(d=>{
        minimumSpanningTree.links.push({"source":d.target,"target":d.source,"weight": d.weight})
    })
    var nodes= minimumSpanningTree.nodes;
    var links= minimumSpanningTree.links;
    console.log(minimumSpanningTree)

    function convert_graph(graph) {
        var j, k, l, len, len1, map, n, ref;
        map = {};
        ref = graph.nodes;
        for (j = 0, len = ref.length; j < len; j++) {
            n = ref[j];
            for (k = 0, len1 = links.length; k < len1; k++) {
                l = links[k];
                if (n.id === l.source) {
                    if (!(n.id in map)) {
                        map[n.id] = {};
                    }
                    map[n.id][l.target] = l.weight;
                }
            }
        }
        return map;
    };

    map = convert_graph(minimumSpanningTree);

    var lib_graph = new Graph(map);
    var shortest_path = lib_graph.findShortestPath(start_node_id, end_node_id);
    for (i=0;i<shortest_path.length;i++){
        shortest_path[i]=parseInt(shortest_path[i])}
    var store_nodes=[];
    shortest_path.forEach((d,i)=>{
        if (i<shortest_path.length-1) {
            store_nodes.push([data_min[shortest_path[i]], data_min[shortest_path[i + 1]]])
        }
    })

    draw_path(store_nodes,900)
    var store_links=[];
    minimumSpanningTree.links.forEach(d=> {
        store_links.push(d.source,d.target)
    })
    svg_scatterplot.selectAll("circle").style("opacity",function (d){
        return shortest_path.includes(d.id)?1:0.3;
    })
    for (var i = 0; i < shortest_path.length; i++) {
        (function (i) {
            setTimeout(function () {
                PlayAudio(node_circle[shortest_path[i]], data_min[shortest_path[i]]);
                d3.select(node_circle[shortest_path[i]])
                // Does work
                    .attr("r", 10)
                    .transition().duration(500)
                    .attr("r",3);

            }, 800 * (i + 1));
        })(i);
    }

}
function draw_path(store_nodes,time_play) {
    scatterplot.selectAll("path").remove()
    svg_scatterplot.selectAll("circle").style("opacity",1);
    function length(path) {
        return d3.create("svg:path").attr("d", path).node().getTotalLength();
    }

    var valueline = d3.line()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.x);
        })
        .y(function (d) {
            return yScale(d.y);
        });
    const l = length(valueline(data_min));

    for (var i = 0; i < store_nodes.length; i++) {
        (function (i) {
            setTimeout(function () {
                scatterplot.append("path")
                    .data([store_nodes[i]])
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-dasharray", `0,${l}`)
                    .attr("d", valueline)
                    .attr("id", "line" + i)
                    .transition()
                    .duration(500)
                    .ease(d3.easeLinear)
                    .attr("stroke-dasharray", `${l},${l}`);
            }, time_play * (i + 1));
        })(i);
    }

}



function reset(){
    stopWorker()

}

function stopWorker() {
    w.terminate();
    w = undefined;
}

// Draw a scatterplot from the given data
function _Draw_Scatterplot(data){

     xScale = d3.scaleLinear()
        .domain(getExtent(data, "x"))
        .range([0, contentWidth]);
     yScale = d3.scaleLinear()
        .domain(getExtent(data, "y"))
        .range([0, contentHeight]);

    UpdateNodes(data);
}
function UpdateNodes(data) {
    var colors = d3.scaleOrdinal(d3.schemeCategory20);
    const radius = 3;
    const opacity = "1";
    const selection = scatterplot.selectAll(".compute").data(data);
    //Exit
    selection.exit().remove();
    //Enter
    const newElements = selection.enter()
        .append('circle')
        .attr("class", "compute")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", radius)
        .style("opacity", opacity)
        .style("fill", function(d){
            return colors(d.group)
        })
        .on("click", function (d){
            if (selected_node==false){
                minimumSpanningTree.nodes[d.id].start=true;
                start_node_id=d.id
                $.notify("Start Node Selected", "success");
                selected_node=true;
            }
            else {
                minimumSpanningTree.nodes[d.id].end=true;
                $.notify("End Node Selected", "success");
                end_node_id=d.id;
                selected_node=false;
            }
        })
        .on("mouseover", function(d) {
            PlayAudio(this, d)
            MouseOvertooltip(d);
            d3.select(this)     // Does work
                .attr("r", radius * 2);
            d3.select(this)
                .append("title")
                .text(function(d) { return d.id
                })
        })
        .on("mouseout", function(d) {
            div.style("opacity", 0);
            d3.select(this)     // Does work
                .attr("r", radius);
            d3.select(this)
                .select("text")
                .remove();
        });


    //Update
    selection
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y)).attr("r", 3);
}

function getExtent(data, key) {
    return d3.extent(data.map(d => d[key]));
}

function MouseOvertooltip(d) {
    div.transition()
        .duration(200)
        .style("opacity", .9);
    div.html("Label: " + d.label + "<br/>" +
        "Durations: " + d.info.duration.toFixed(2) + "<br/>" +
        "BufferSize: " + d.info.bufferSize.toFixed(2) + "<br/>" +
        "HopSize: " + d.info.hopSize.toFixed(2) + "<br/>");
}

// Get a set of cluster centroids based on the given data
function getcluster(data){
    let clusterSet = [];
    let centroids = [];

    //give number of clusters we want
    clusters.k(7);

    //number of iterations (higher number gives more time to converge), defaults to 1000
    clusters.iterations(750);

    //data from which to identify clusters, defaults to []
    clusters.data(data);

    clusterSet = clusters.clusters();
    for (i=0; i<clusterSet.length;i++){
        for (j=0; j<data_min.length; j++) {
            clusterSet[i].points.includes(data_min[j]) ? data_min[j].group=i:0;
        }
    }
}

function calculate_Euclidean() {

    var totalscore = [];
    for (i = 0; i < total_self_similarity_data.length - 1; i++) {
        var scorefinal = [];
        for (j = i + 1; j < total_self_similarity_data.length; j++) {
            //Calculate distance based on Euclidean Distance
            scorefinal.push(comparescore_Euclidean(total_self_similarity_data[i], total_self_similarity_data[j]))
        }
        totalscore.push(scorefinal)
    }

}

function drawLegend(){
    var colors = colorbrewer.Spectral[9];
    var cellSize = 10
    var legendElementWidth = 40
    var control1 = d3.select("#controller").append("svg")
        .attr("width", 450)
        .attr("height", 100)
        .attr("transform", "translate(450,10)");

    //create legend bar to show the level of each chroma feature in color. Domain of chroma  [0,1]
    var legend = control1.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(0,25)")
        .selectAll(".legendElement")
        .data([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);

    var legend1=legend.enter().append("g")
        .attr("class", "legendElement");



    legend1.append("rect")
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", cellSize)
        .style("fill", function (d, i) {
            return colors[i];

        });

    legend1.append("text")
        .attr("class", "mono legendElement")
        .text(function (d) {
            return ">" + Math.round(d * 100) / 100;
        })
        .attr("x", function (d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 40)
        .attr("font-size", "12px");
    legend.exit().remove();

    control1.append("text")
        .text("Similarity")
        .attr("x", 0)
        .attr("y", 32)
        .attr("font-family", "Times New Roman")
        .attr("font-size", "15px");

    control1.append("text")
        .text("Dissimilarity")
        .attr("x", 320)
        .attr("y", 32)
        .attr("font-family", "Times New Roman")
        .attr("font-size", "15px");
}
function PlayAudio(thisElement, d) {
    // Play audio on click
    let audioElement;
    if (thisElement.getElementsByTagName("audio").length === 0) {

        // Create audio object from source url
        audioElement = new Audio(d.url);
        // Preload audio to improve response times
        audioElement.preload = "auto";
        // Cache audio for later use to improve performance
        thisElement.appendChild(audioElement);
        // Play the audio
        audioElement.play();
    }
     else {
        // Get saved audio element
        audioElement = thisElement.getElementsByTagName("audio")[0];
        if (audioElement.isPlaying()) {
            // Pause if it is playing
            audioElement.stop();
        } else {
            // Play if not already playing
            audioElement.play();
        }
    }
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



