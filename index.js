import * as d3 from "https://cdn.skypack.dev/d3@7";

var vax_data;
var svgWidth = 500, svgHeight = 500, pointRadius = 3;

d3.csv("https://raw.githubusercontent.com/irinavrt/vaccineconf-by-religiosity/main/vaccineconf-and-religiosity-combined.csv")
    .then(function(data) {
        var svg = d3.select("svg")
            .attr("width",svgWidth)
            .attr("height",svgHeight)

        var points = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx",function(d) {return d["religiosity"]*5})
            .attr("cy",function(d) {return svgHeight - d["vaccines_safe"]*5})
            .attr("r",pointRadius)
            .style("fill","steelblue")

        var scale = d3.scaleLinear().domain([0,svgWidth]).range([0,svgHeight])

        var xAxis = d3.axisBottom(scale)
        var yAxis = d3.axisLeft(scale)

        svg.append("g").call(xAxis).call(yAxis)
    });

/*setTimeout(function() {
    console.log(vax_data);

    const container = d3.selectAll("svg")
        .classed("container",true)

    const bars = container
        .selectAll(".bar")
        .data(vax_data)
        .enter()
        .append("rect")
        .classed("bar",true)
        .attr("width",50)
        .attr("height",20)
        .fill("lime")

},400);*/

