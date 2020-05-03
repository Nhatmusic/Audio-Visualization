
function traindata() {
    state = 'training';
    console.log('starting training');
    model.normalizeData();
    let options = {
        epochs: parseInt($('#epoch').val(), 10),
        learningRate: parseFloat($('#learningrate').val(), 10),
        batchSize: parseInt($('#batchsize').val(), 10)
    }
    // let mlresult;
    model.train(options, whileTraining, finishedTraining);


}

function whileTraining(epoch, loss) {
    console.log(epoch);
}

function finishedTraining() {
    $.notify("Training Data Completed!", "success");
    console.log('finished training.');
    state = 'prediction';
}

function AddData() {
    wsTooltipContainer = d3.select('body').append("div")
        .attr('id', "wsTooltipContainer");

    wsTooltipDiv = wsTooltipContainer.append("div")
        .attr("class", "wsTooltip")
        .attr("id", "wsTooltip")
        .style("visibility", "hidden")
        ;
    columns = ["label", "confidence"];
    var inputs = {};
    var target = {};

    store_process_tsne_data.forEach((d) => {
        var inputs = {};
        var target = {};
        for (i = 0; i < d.length; i++) {
            var name = i;
            inputs[name] = d[i];
            target = {
                label: d.label
            }

        }
        model.addData(inputs, target);
    })
    $.notify("Add Data Completed!", "success");
}
function predict(inputs){
model.classify(inputs,gotResults)
    .then(result => {
        console.log(result);
        mlresult =result;
        createTableTooltip(wsTooltipDiv, result)
})
}

function gotResults(error,results) {
    if (error) {
        console.log(error);
        return;
    }
    // console.log(results);
}
function turnoff(){
    state = "collecting";
}
function createTableTooltip(wsTooltipDiv, info) {
    // process info text
    wsTooltipDiv.selectAll("*").remove();
    let table = wsTooltipDiv.append("table")
            .attr("class", "tableTooltip")
            .attr("id", "tableTooltip")
            .style("width", "100%"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .attr("class", column => "column-" + column)
        .text(column => capitalize(column));

    // create a row for each record
    let rows = tbody.selectAll("tr")
        .data(info.slice(0,5))
        .enter()
        .append("tr");


    let cells = rows.selectAll("td")
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]}
            })
        })
        .enter()
        .append("td")
        .style("color", "#808080")
        .html(function (d) {
            if (d.column == "label"){
                return d.value;
            }
            else if (d.column == "confidence") {
                return d.value.toFixed(2);
            }

        })
    ;
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

function drawscatterplot(data){
    UpdateDataTSNE(data);
    Draw_Scatterplot(store_process_tsne_data);
}

// Draw a scatterplot from the given data
function Draw_Scatterplot(data){
    xScale = d3.scaleLinear()
        .domain(getExtent(data, "x"))
        .range([0, contentWidth]);
    yScale = d3.scaleLinear()
        .domain(getExtent(data, "y"))
        .range([0, contentHeight]);
    Update_Tsne_node(data)
}

function getExtent(data, key) {
    return d3.extent(data.map(d => d[key]));
}

function Update_Tsne_node(data) {

       selection = scatterplot.selectAll(".compute").data(data);
    //Exit
    selection.exit().remove();
    //Enter
    if (firstdraw == false) {
      if(Isrecord==true) {
          scatterplot.selectAll('circle').remove();
      }
        selection = scatterplot.selectAll(".compute").data(data);
        //Exit
        selection.exit().remove();
        scatterplot.selectAll('text').remove();
        selection.enter().append("text")
            .text(function (d) {
                return d.label;
            })
            .attr("class", (d) => "text" + d.id)
            .attr("x", function (d) {return xScale(d.x) })
            .attr("y", function (d) {return yScale(d.y) })
            .style("text-anchor", "middle")
            .style("font-size", "10px");
         selection.enter().append('svg:image')
            .attr('xlink:href', function (d) {
                return d.image_canvas;
            })
            .attr('x', function (d) {
                return (xScale(d.x));
            })
            .attr('y', function (d) {
                return (yScale(d.y));
            })
            .attr("class", "imagee")
            .attr('width', 10)
            .attr('height', 10)
            .on('mouseover', function (d) {
                active_value = d.id;
                noLoop();
                for(let i = 0; i < mfcc_data_all[d.id].length; i++ ) {
                    for (let j = 0; j < mfcc_data_all[d.id][i].length; j++) {
                        let color_strength = quantile_heatmap(mfcc_data_all[d.id][i][j]).replace("rgb","").replace("(","").replace(")","").split(',')
                        // setting color
                        if (mfcc_data_all[d.id] [i] [j] >= 0)
                            fill(parseInt(color_strength[0]),parseInt(color_strength[1]),parseInt(color_strength[2]))
                        else
                            fill(209)
                        // noStroke();
                        //drawing the rectangle
                        rect(i * BOX_WIDTH * 2, j * BOX_HEIGHT * 2, BOX_WIDTH * 2, BOX_HEIGHT * 2)
                    }
                }
                PlayAudio(this, d);
                d3.select(this)
                    .attr("width", 50)
                    .attr("height", 50);

                scatterplot.selectAll('text').style("opacity",0);

                scatterplot.selectAll("path")
                    .style('stroke-width', function(d) {
                    return (d[0].id == active_value || d[1].id == active_value ? 5: 1)
                })
                        .style('opacity', function(d) {
                            return (d[0].id == active_value || d[1].id == active_value ? 0.5: 1)
                        })
                scatterplot.select(".text"+ d.id).style("font-size", "20px").style("opacity",1);
                draw_euclidean_line_chart(d);
                draw_radar_chart_comparision(d);

            })
             .on("click", function (d){
                 if (state == 'prediction'){
                     var inputs = {};
                     for (i = 0; i < d.length; i++) {
                         var name = i;
                         inputs[name] = d[i];
                     }
                     wsTooltipDiv.style("visibility","visible").style("top", (d3.event.pageY - 200) + "px").style("left", d3.event.pageX + "px");

                     predict(inputs,gotResults);
                 }
                 else {
                     if (selected_node == false) {
                         minimumSpanningTree.nodes[d.id].start = true;
                         start_node_id = d.id
                         $.notify("Start Node Selected", "success");
                         selected_node = true;
                     } else {
                         minimumSpanningTree.nodes[d.id].end = true;
                         $.notify("End Node Selected", "success");
                         end_node_id = d.id;
                         selected_node = false;
                     }
                 }
             })
            .on('mouseout', function (d) {
                if (state == 'prediction') {
                    wsTooltipDiv.style("visibility", "hidden");
                }
                d3.select(this)
                    .attr("width", 10)
                    .attr("height", 10)
                d3.select(".text"+ d.id).style("opacity",1).style("font-size", "10px");
                d3.selectAll('text').style("opacity",1);
                scatterplot.selectAll("path")
                    .style('stroke-width',1);
            });

        //Update
        selection
            .attr("x", d => (xScale(d.x)))
            .attr("y", d=> (yScale(d.y)))
    }
    else {
        if (Isrecord == true) {
            selection.enter().append('circle')
                .attr('cx', function (d) {
                    return (xScale(d.x));
                })
                .attr('cy', function (d) {
                    return (yScale(d.y));
                })
                .attr("class", "compute")
                .attr('r', 5)
                .style("fill", 'blue')
                .on('mouseover', function (d) {

                    PlayAudio(this, d);
                    d3.select(this)
                        .attr("width", 100)
                        .attr("height", 100)
                })
                .on('mouseout', function (d) {
                    d3.select(this)
                        .attr("width", 60)
                        .attr("height", 60)
                });
            //Update
            selection
                .attr("cx", d => (xScale(d.x)))
                .attr("cy", d=> (yScale(d.y)))
        }
        else {
            selection.enter().append("text")
                .text(function (d) {
                    return d.label;
                })
                .attr("class", "texte")
                .attr("x", function (d) {return xScale(d.x) })
                .attr("y", function (d) {return yScale(d.y) })
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .on('mouseover', function (d) {

                    PlayAudio(this, d);
                    d3.select(this)
                        .attr("width", 100)
                        .attr("height", 100)
                })
                .on('mouseout', function (d) {
                    d3.select(this)
                        .attr("width", 60)
                        .attr("height", 60)
                });
            //Update
            selection
                .attr("x", d => (xScale(d.x)))
                .attr("y", d=> (yScale(d.y)))
        }

    }

}


// Update the data with the given t-SNE result
function UpdateDataTSNE(data) {
    data.forEach(function(d, i) {
            store_process_tsne_data[i].x = d[0];  // Add the t-SNE x result to the dataset
            store_process_tsne_data[i].y = d[1];  // Add the t-SNE y result to the dataset
            store_process_tsne_data[i].image_canvas = store_image_in_canvas[i];
            store_process_tsne_data[i].url = fileContent[i];
            store_process_tsne_data[i].id = i;
            store_process_tsne_data[i].label = audio_label[i];
    });
}
function capitalize(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}