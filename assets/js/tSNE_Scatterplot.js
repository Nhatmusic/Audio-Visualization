


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
      if(record==true) {
          scatterplot.selectAll('circle').remove();
      }

        selection = scatterplot.selectAll(".compute").data(data);
        //Exit
        selection.exit().remove();
        scatterplot.selectAll('text').remove();
        selection.enter().append("text")
            .text(function (d) {
                return d.lable;
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
                noLoop();
                for(let i = 0; i < mfcc_data_all[d.id].length; i++ ) {
                    for (let j = 0; j < mfcc_data_all[d.id][i].length; j++) {
                        let color_strength = mfcc_data_all[d.id][i][j] * 100

                        // setting color
                        if (mfcc_data_all[d.id] [i] [j] >= 0)
                            fill(0, color_strength, 0)
                        else
                            fill(0, 0, -color_strength)
                        // noStroke();
                        //drawing the rectangle
                        rect(i * BOX_WIDTH * 2, j * BOX_HEIGHT * 2, BOX_WIDTH * 2, BOX_HEIGHT * 2)
                    }
                }
                PlayAudio(this, d);
                d3.select(this)
                    .attr("width", 50)
                    .attr("height", 50);
                d3.selectAll('text').style("opacity",0);

                d3.select(".text"+ d.id).style("font-size", "20px").style("opacity",1);

            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr("width", 10)
                    .attr("height", 10)
                d3.select(".text"+ d.id).style("opacity",1).style("font-size", "10px");
                d3.selectAll('text').style("opacity",1);
            });

        //Update
        selection
            .attr("x", d => (xScale(d.x)))
            .attr("y", d=> (yScale(d.y)))


            // .on('mouseover', function (d) {
            //
            //     PlayAudio(this, d);
            //     d3.select(this)
            //         .attr("width", 100)
            //         .attr("height", 100)
            // })
            // .on('mouseout', function (d) {
            //     d3.select(this)
            //         .attr("width", 60)
            //         .attr("height", 60)
            // });

        // scatterplot.selectAll(".texte").data(store_process_tsne_data)
        //     .text(function (d) {
        //         return d.lable;
        //     })
        //     // .attr("class","text" + d.id)
        //     .attr("x", d => (xScale(d.x)))
        //     .attr("y", d=> (yScale(d.y)));
    }
    else {
        if (record == true) {
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
                    return d.lable;
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
        store_process_tsne_data[i].image_canvas=store_image_in_canvas[i];
        store_process_tsne_data[i].url = fileContent[i];
        store_process_tsne_data[i].id = i;
        store_process_tsne_data[i].lable = audio_label[i];
    });
}
