import * as d3 from "https://cdn.skypack.dev/d3@7";

const margin = {top: 10, right: 10, bottom: 20, left: 10};
const barChart = {x: 900, y: 100, barHeight: 100}
const width = 1400 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;
const globalColors = {default:"steelblue", correct:"green", incorrect:"red", continue:"yellow"}
let pointRadius = 5


const g = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + barChart.x) + "," + (margin.top + barChart.y) + ")");


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
                .attr("width", function(d) {return (d[xfield] * barWidthFactor)})
                .attr("height", barHeight - 3)
                .style("fill",barColor);

            var texts = g.selectAll(".myTexts")
                .data(data)
                .enter()
                .append("text");

            texts
                .attr("y", function(d,i){ return i*barHeight + 0.5 * barHeight})
                .transition().duration(1500)
                .attr("x", function(d){ return (d[xfield] * barWidthFactor + 10)})
                .attr("y", function(d,i){ return i*barHeight + 0.5 * barHeight})
                .text(function(d){ return d["vaccines_safe"]+"%"});

            d3.select("rect").style("color","lime")

        });
}

function drawButton (x,y,width,height,text,startColor,endColor,func) {
    d3.select("svg").append("rect")
        .attr("x",x)
        .attr("y",y)
        .attr("width",width)
        .attr("height",height)
        .style("fill",startColor)
        .style("stroke","black")
        .style("stroke-width",2)
        .on("click",function() {
            d3.select(this).style("fill",endColor)
            func()
        })

    d3.select("svg").append("text")
        .attr("x",x + width/2)
        .attr("y",y + height/2)
        .text(text)
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
}

function countryFilter(countryName) {
    g.selectAll("circle").remove()

    g.selectAll("circle")
}

function clearSVG() {
    g.selectAll("*").remove()
    d3.select("svg").selectAll("rect").remove()
    d3.select("svg").selectAll("circle").remove()
    d3.select("svg").selectAll("text").remove()
}

//drawBarGraph("vaccines_safe","steelblue",100,2000)

let buttonX = (width - barChart.x - margin.left) - 10 // for gap
let buttonY = barChart.y + margin.top
let buttonWidth = -2 * (width / 2 - (barChart.x + margin.left)) - 10


function setScene2() {
    clearSVG()
    let countries = ["Bangladesh", "Japan", "Libya", "USA"]
    let colors = [globalColors.correct, globalColors.incorrect, globalColors.incorrect, globalColors.incorrect]

    d3.select("svg").append("text")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Which of these countries has the highest trust in vaccines?")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    for (let i = 0; i < 4; i++) {
        drawButton(buttonX,buttonY + i * barChart.barHeight,buttonWidth,barChart.barHeight - 10,countries[i],
            "gray",colors[i],
            function() {
            drawBarGraph("vaccines_safe","steelblue",barChart.barHeight,4);
            drawButton(buttonX,buttonY + 4*barChart.barHeight,buttonWidth,barChart.barHeight,
                "Continue",globalColors.continue,globalColors.continue,function(){setScene3()})
        })
    }
}

function setScene3() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("hi matthew")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")
}

setScene2()