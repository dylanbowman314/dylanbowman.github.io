import * as d3 from "https://cdn.skypack.dev/d3@7";

const margin = {top: 100, right: 10, bottom: 20, left: 500};
const width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
let pointRadius = 5


const g = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + 100) + "," + margin.top + ")");


function drawScatterplot(xfield, yfield, pointColor,source) {
    d3.csv(source)
        .then(function(data) {
            let maxX = (xfield.includes("hdi") ? 1 : 100)
            let maxY = (yfield.includes("hdi") ? 1 : 100)

            let points = g.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx",function(d) {return d[xfield]*width/maxX + margin.left})
                .attr("cy",function(d) {return height + margin.top - d[yfield]*height/maxY - 15})
                .attr("r",pointRadius)
                .style("fill",pointColor)

            let xScale = d3.scaleLinear()
                .domain([0,maxX])
                .range([0, width]);
            let xAxisGenerator = d3.axisBottom(xScale);
            let xAxis =  g.append("g")
                .call(xAxisGenerator)
                .attr("transform",`translate(${0},${height - 20})`)

            let yScale = d3.scaleLinear()
                .domain([0,maxY])
                .range([height - margin.top, 20]);
            let yAxisGenerator = d3.axisLeft(yScale);
            let yAxis =  g.append("g")
                .call(yAxisGenerator)
                .attr("transform",`translate(${margin.left + 20},${margin.top})`)

            g.append("text")
                .attr("y", margin.top + height - 20)
                .attr("x", margin.left + width/2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(xfield);

            g.append("text")
                .attr("class","y_axis_label")
                .attr("y", 400)
                .attr("x", 400)
                .attr("transform","rotate(270)")
                .attr("dy", "1em")
                .attr("dx", "-1em")
                .style("text-anchor", "middle")
                .text(yfield);


            // turn red when clicked
            g.selectAll("circle")
                .on("mouseover",function(e,d) {
                    d3.selectAll("circle").style("fill",pointColor)
                    d3.select(this).style("fill","red")
                    d3.select(this).raise()
                })
                .on("click",function(e,d) {
                    d3.selectAll("circle").style("fill",pointColor)
                    d3.select(this).style("fill","red")
                    d3.select(this).raise()
                })
        });
}

function drawBarGraph(xfield, barColor, barHeight, barWidthFactor) {
    d3.csv("resources/bardata.csv")
        .then(function(data) {
            let bar = g.selectAll("g")
                .data(data)
                .enter().append("rect")
                .classed("bar",true)
                .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; })
                .attr("width", 20)
                .attr("height", barHeight - 3)
                .style("fill","white")
                .transition().duration(1500)
                .attr("width", function(d) {return (d[xfield] * barWidthFactor/width)})
                .attr("height", barHeight - 3)
                .style("fill",barColor);

            g.selectAll("rect").append("text")
                .attr("x", function(d) { return 10; })
                .attr("y", barHeight / 2)
                .attr("dy", ".35em")
                .text(function(d) { return d["country"]; });



        });
}

function countryFilter(countryName) {
    g.selectAll("circle").remove()

    g.selectAll("circle")
}

function clearSVG() {
    d3.selectAll("svg > *").remove();
}

drawBarGraph("vaccines_safe","steelblue",100,2000)

