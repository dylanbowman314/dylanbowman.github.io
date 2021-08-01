import * as d3 from "https://cdn.skypack.dev/d3@7";

const margin = {top: 10, right: 10, bottom: 20, left: 10};
const barChart = {x: 900, y: 100, barHeight: 100}
const scatterplot = {x: 400, y:400, width:700, height:500}
const width = 1400 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;
const globalColors = {default:"steelblue", correct:"green", incorrect:"red", continue:"yellow", tooltip:"#b6d8e3"}
let pointRadius = 5


const g = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + barChart.x) + "," + (margin.top + barChart.y) + ")");


function drawScatterplot(x, y, width, height, xfield, yfield, pointColor, source) {
    d3.csv(source)
        .then(function(data) {
            let maxX = (xfield.includes("hdi") ? 1 : 100)
            let maxY = (yfield.includes("hdi") ? 1 : 100)

            g.attr("transform","translate(0,0)")

            let points = g.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx",function(d) {return d[xfield]*width/maxX + margin.left})
                .attr("cy",function(d) {return height + margin.top})
                .attr("r",pointRadius)
                .style("fill",pointColor)
                .style("opacity",0)
                .transition().duration(1000)
                .attr("cy",function(d) {return height + margin.top - d[yfield]*height/maxY})
                .style("opacity",1)

            let xScale = d3.scaleLinear()
                .domain([0,maxX])
                .range([0, width]);
            let xAxisGenerator = d3.axisBottom(xScale);
            let xAxis =  g.append("g")
                .call(xAxisGenerator)
                .attr("transform",`translate(${0},${height})`)

            let yScale = d3.scaleLinear()
                .domain([0,maxY])
                .range([height - margin.top, 20]);
            let yAxisGenerator = d3.axisLeft(yScale);
            let yAxis =  g.append("g")
                .call(yAxisGenerator)
                .attr("transform",`translate(${margin.left + 20},${margin.top})`)

            g.append("text")
                .attr("x", margin.left + width/2)
                .attr("y", margin.top + height + 10)
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

            let tooltipWidth = 480.0
            let tooltipHeight = 30.0
            drawTooltip(100,100,tooltipWidth,tooltipHeight,"test text",globalColors.tooltip)
            setTooltipOpacity(0)

            // turn red when clicked
            g.selectAll("circle")
                .on("mouseover",function(e,d) {
                    d3.selectAll("circle").style("fill",pointColor);
                    let point = d3.select(this)
                    point.style("fill","red")
                    point.raise()
                    setTooltipOpacity(1)

                    let newX = parseFloat(point.attr("cx")) + 10
                    let newY = parseFloat(point.attr("cy"))
                    let newText = point.data()[0]["country"] + ", " + xfield + " = " + point.data()[0][xfield] + ", " + yfield +  " = " + point.data()[0][yfield]

                    moveTooltip(newX,newY,tooltipWidth,tooltipHeight)
                    console.log(tooltipWidth)
                    setTooltipText(newText)
                })
                .on("click",function(e,d) {
                    d3.selectAll("circle").style("fill",pointColor)
                    d3.select(this).style("fill","red")
                    d3.select(this).raise()
                })
                .on("mouseout",function(e,d) {
                    setTooltipOpacity(0)
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
                .attr("height", barHeight - 10)
                .style("fill","white")
                .transition().duration(1500)
                .attr("width", function(d) {return (d[xfield] * barWidthFactor)})
                .attr("height", barHeight - 10)
                .style("fill",barColor);

            var texts = g.selectAll(".myTexts")
                .data(data)
                .enter()
                .append("text");

            texts
                .attr("y", function(d,i){ return i*barHeight + 0.5 * barHeight})
                .style('font-size', '24px')
                .style('font-family', '"Open Sans", sans-serif')
                .transition().duration(1500)
                .attr("x", function(d){ return (d[xfield] * barWidthFactor + 10)})
                .attr("y", function(d,i){ return i*barHeight + 0.5 * barHeight})
                .text(function(d){ return d["vaccines_safe"]+"%"})
                .style('font-size', '24px')
                .style('font-family', '"Open Sans", sans-serif')

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
        .attr("y",y + height/2 + 10)
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

function drawTooltip(x,y,width,height,text,color) {
    g.append("rect")
        .attr("class","tooltiprect")
        .attr("x",x)
        .attr("y",y)
        .attr("width",width)
        .attr("height",height)
        .style("fill",color)
        .style("stroke","black")
        .style("stroke-width",1)
        .style("opacity",0)

    g.append("text")
        .attr("class","tooltiptext")
        .attr("x",x + width/2)
        .attr("y",y + 20)
        .text(text)
        .style("text-anchor", "middle")
        .style('font-size', '14px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("opacity",0)
}

function setTooltipOpacity(v) {
    g.selectAll(".tooltiprect").transition().duration(200).style("opacity",v)
    g.selectAll(".tooltiptext").transition().duration(200).style("opacity",v)
    if (v < 0.1) {
        g.selectAll(".tooltiprect").lower()
        g.selectAll(".tooltiptext").lower()
    } else if (v > 0.9) {
        g.selectAll(".tooltiprect").raise()
        g.selectAll(".tooltiptext").raise()
    }
}


function moveTooltip(x,y,width,height) {
    g.selectAll(".tooltiprect").attr("x",x).attr("y",y).raise()
    g.selectAll(".tooltiptext").attr("x",x + width/2).attr("y",y + 20).raise()
    console.log([x,y])
    console.log([x + (width/2), y + 20.0])
}

function setTooltipText(text) {
    g.selectAll(".tooltiptext").text(text)
}

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
        .text("Positive Correlation between Religiosity and Vaccine Trust")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    drawScatterplot(0,0,800,800,"religiosity","vaccines_safe",globalColors.default,"resources/vaxdata.csv")
    drawButton(940,700,buttonWidth,barChart.barHeight,
        "Continue",globalColors.continue,globalColors.continue,function(){setScene4()})


}

function setScene4() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Negative Correlation between HDI and Vaccine Trust")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    drawScatterplot(0,0,800,800,"hdi","vaccines_safe",globalColors.default,"resources/vaxdata.csv")
    drawButton(940,700,buttonWidth,barChart.barHeight,
        "Continue",globalColors.continue,globalColors.continue,function(){moveTooltip(1000,100,100,100)})


}

setScene2()