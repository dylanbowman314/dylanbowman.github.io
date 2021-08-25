import * as d3 from "https://cdn.skypack.dev/d3@7";

const margin = {top: 10, right: 10, bottom: 20, left: 10};
const barChart = {x: 900, y: 100, barHeight: 100}
const scatterplot = {x: 400, y:400, width:700, height:500}
const width = 1480 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;
const globalColors = {
    default:"#15abd1",
    scatter2color:"#34a832",
    correct:"#2aeb28",
    incorrect:"#e85620",
    continue:"#fff596",
    neutral:"#d6d5d2",
    tooltip1:"#9ed9e8",
    tooltip2:"#90e38f",
    annotation:"#d6d5d2"}
let pointRadius = 5


const g = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + barChart.x) + "," + (margin.top + barChart.y) + ")");

function getWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

function drawScatterplot(x, y, width, height, xfield, yfield, pointColor, source, tooltipColor) {
    d3.csv(source)
        .then(function(data) {
            let maxX = (xfield.includes("hdi") ? 1 : 100)
            let maxY = (yfield.includes("hdi") ? 1 : 100)

            g.attr("transform","translate(0,0)")

            let points = g.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("id",function(d){return d["country"]})
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
            drawTooltip(100,100,tooltipWidth,tooltipHeight,"test text",tooltipColor)
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
                    d3.select(this).style("fill",pointColor)
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
        .attr("class","button")
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
        .attr("class","button")
        .attr("x",x + width/2)
        .attr("y",y + height/2 + 10)
        .text(text)
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .on("click",function() {
            func()
        })
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

function filterPoints(parameter,filter) {
    g.selectAll("circle")
        .transition().duration(200)
        .style("opacity",function(d) {
            if (d[parameter].includes(filter)) {
                return 1.0
            } else {
                return 0.0
            }
        })
}

function drawAnnotation(x,y,pointX,pointY,width,height,color,text) {
    let xYes = pointX < x + width/2 ? 0 : 1 // left side or right side
    let yYes = pointY < y + height/2? 0 : 1 // top or bottom
    let delay = 500

    g.append("rect")
        .transition().duration(delay)
        .attr("class","annotation")
        .attr("x",x)
        .attr("y",y)
        .attr("width",width)
        .attr("height",height)
        .style("fill",color)
        .style("stroke","black")
        .style("stroke-width",1)

    let lines = text.split(";")

    for (let i = 0; i < lines.length; i++) {
        g.append("text")
            .transition().duration(delay)
            .attr("class","annotation")
            .attr("x",x + 10)
            .attr("y",y + 20 + 16*i)
            .text(lines[i])
            .style("text-anchor", "left")
            .style('font-size', '14px')
            .style('font-family', '"Open Sans", sans-serif')
    }

    g.append("line")
        .transition().duration(delay)
        .attr("class","annotation")
        .style("stroke","black")
        .attr("x1",x + xYes * width)
        .attr("y1",y + yYes * height)
        .attr("x2",pointX)
        .attr("y2",pointY)
}

let buttonX = (width - barChart.x - margin.left) - 10 // for gap
let buttonY = barChart.y + margin.top
let buttonWidth = -2 * (width / 2 - (barChart.x + margin.left)) - 10

function setScene1() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("class","header")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Visual Report on a Trend in Global Vaccine Confidence")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    let text =
        "This project was created by Dylan Bowman, an undergraduate ;" +
        "in Mathematics and Conputer Science at the University ;" +
        "of Illinois. The project is based on a 2021 paper by Erikkson ;" +
        "and Vartanova. ;" +
        ";" +
        "[Kimmo Eriksson & Irina Vartanova (2021): Human Vaccines ;" +
        "& Immunotherapeutics, DOI:10.1080/21645515.2021.1883389]"
    let lines = text.split(";")
    let delay = 1000

    for (let i = 0; i < lines.length; i++) {
        d3.select("svg").append("text")
            .attr("class","flavor")
            .attr("x",buttonX + buttonWidth/2 - 320)
            .attr("y",2000)
            .text(lines[i])
            .style("text-anchor", "left")
            .attr("xlink:href",function() {
                if (lines[i].includes("- ")) {
                    return lines[i].substr(2)
                } else {
                    return ""
                }
            })
            .transition().duration(delay)
            .attr("y",textY + 50 + i*40)
            .style('font-size', '26px')
            .style('font-family', '"Open Sans", sans-serif')
    }

    setTimeout(function() {
        drawButton(buttonX,buttonY + 4*barChart.barHeight - 75,buttonWidth,barChart.barHeight,
            "Continue",globalColors.continue,globalColors.continue,function(){setScene2()});
    },800)
}

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
            globalColors.neutral,colors[i],
            function() {
            drawBarGraph("vaccines_safe","steelblue",barChart.barHeight,4);
                drawButton(buttonX,buttonY + 4*barChart.barHeight,buttonWidth,barChart.barHeight,
                    "Continue",globalColors.continue,globalColors.continue,function(){setScene3()})
        })
    }


}

let textX = 900
let textY = 100

function setScene3() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("class","header")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Positive Correlation between Religiosity and Vaccine Trust")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")


    let text = "There exists a moderate correlation ;" +
        "between religiosity and vaccine trust, ;" +
        "with R-squared equal to 0.44 for the ;" +
        "two variables. Hover over any of the ;" +
        "data points to see which country they ;" +
        "correspond to."
    let lines = text.split(";")
    let delay = 500

    for (let i = 0; i < lines.length; i++) {
        g.append("text")
            .attr("class","flavor")
            .attr("x",textX + 10)
            .attr("y",textY + 100 + i*40)
            .transition().duration(delay)
            .text(lines[i])
            .style("text-anchor", "left")
            .style('font-size', '26px')
            .style('font-family', '"Open Sans", sans-serif')
    }

    drawScatterplot(0,0,800,800,"religiosity","vaccines_safe",globalColors.default,"resources/vaxdata.csv",globalColors.tooltip1)
    drawButton(textX + 40,textY + 600,buttonWidth,barChart.barHeight,
        "Continue",globalColors.continue,globalColors.continue,function(){
            let target = ["Japan", "Bangladesh", "USA"]
            let annotations = [
                "Despite their high mask use, Japan has the ;" +
                "least vaccine trust out of any country, ;" +
                "likely stemming from a history of government ;" +
                "incompetence regarding the issue over the ;" +
                "past several decades.",

                "According to the data, Bangladesh has the ;" +
                "highest percentage of citizens who think ;" +
                "vaccines are safe in general. It's also ;" +
                "among the most religious countries.",

                "The United States is towards the middle of ;" +
                "the pack, just behind countries like Chile ;" +
                "and Kyrgyzstan."
            ]
            let coords = [[400,690],[100,150],[590,560]]
            let annoWidth = 300
            let annoHeight = [95,80,65]

            for (let i = 0; i < target.length; i++) {
                console.log("#" + target[i])
                let pointX = parseFloat(d3.selectAll("#" + target[i]).attr("cx"))
                let pointY = parseFloat(d3.selectAll("#" + target[i]).attr("cy"))
                drawAnnotation(coords[i][0],coords[i][1],
                    pointX,pointY,
                    annoWidth,annoHeight[i],globalColors.annotation,annotations[i])
            }

            d3.selectAll(".button").remove()
            drawButton(textX + 40,textY + 600,buttonWidth,barChart.barHeight,
                "Continue",globalColors.continue,globalColors.continue,function(){setScene4()})
        })

}

function setScene4() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("class","header")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Negative Correlation between HDI and Vaccine Trust")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    let text =
        "Surprisingly, there exists a negative ;" +
        "correlation between the Human ;" +
        "Development Index (HDI) and vaccine ;" +
        "trust. The HDI is a metric that ;" +
        "measures the overall life quality ;" +
        "of citizens within a given country. ;" +
        "It considers factors like lifespan, ;" +
        "education, and income."
    let lines = text.split(";")
    let delay = 500

    for (let i = 0; i < lines.length; i++) {
        g.append("text")
            .attr("class","flavor")
            .attr("x",textX + 50)
            .attr("y",textY + 100 + i*40)
            .transition().duration(delay)
            .text(lines[i])
            .style("text-anchor", "left")
            .style('font-size', '26px')
            .style('font-family', '"Open Sans", sans-serif')
    }

    drawScatterplot(0,0,800,800,"hdi","vaccines_safe",globalColors.scatter2color,"resources/vaxdata.csv",globalColors.tooltip2)
    drawButton(textX + 40,textY + 600,buttonWidth,barChart.barHeight,
        "Continue",globalColors.continue,globalColors.continue,function(){
            let target = ["Japan", "Bangladesh", "USA"]
            let annotations = [
                "Japan has one of the highest HDIs of the ;" +
                "countries listed, but ranks dead last in ;" +
                "vaccine trust.",

                "Despite having a very large population ;" +
                "and one of the lowest HDIs of the ;" +
                "countries listed, Bangladesh has a very ;" +
                "low rate of vaccine hesitancy.",

                "The United States is among the most developed ;" +
                "nations in the world, though it still trails behind ;" +
                "European republics like Norway. Of the extremely ;" +
                "developed nations, its vaccine hesitancy rates ;" +
                "are not actually that bad."
            ]
            let coords = [[400,690],[50,120],[150,500]]
            let annoWidth = [300,280,330]
            let annoHeight = [65,80,95]

            for (let i = 0; i < target.length; i++) {
                console.log("#" + target[i])
                let pointX = parseFloat(d3.selectAll("#" + target[i]).attr("cx"))
                let pointY = parseFloat(d3.selectAll("#" + target[i]).attr("cy"))
                drawAnnotation(coords[i][0],coords[i][1],
                    pointX,pointY,
                    annoWidth[i],annoHeight[i],globalColors.annotation,annotations[i])
            }

            d3.selectAll(".button").remove()
            drawButton(textX + 40,textY + 600,buttonWidth,barChart.barHeight,
                "Continue",globalColors.continue,globalColors.continue,function(){setScene5()})
        })

}

function setScene5() {
    clearSVG()
    d3.select("svg").append("text")
        .attr("class","header")
        .attr("x",buttonX + buttonWidth/2)
        .attr("y",buttonY - 50)
        .text("Explanations for the Correlation")
        .style("text-anchor", "middle")
        .style('font-size', '36px')
        .style('font-family', '"Open Sans", sans-serif')
        .style("font-weight","bold")

    let text =
        "The authors of the paper this project is based on propose ;" +
        "that \"the magical/spiritual beliefs that vaccine hesitancy ;" +
        "is often grounded in may be incompatible with traditional ;" +
        "religious teachings. Thus, even when religions do not ;" +
        "speak directly to the issue of vaccines, religiosity may ;" +
        "tend to crowd out the philosophical underpinnings of ;" +
        "anti-vaccine sentiments.\" ;" +
        ";" +
        "My hypothesis is that the combination of low religiosity ;" +
        "and high development creates a distrust towards the ;" +
        "government, which makes individuals more hesitant to use ;" +
        "vaccines." +
        ";" +
        ";" +
        ";" +
        "Sources: ;" +
        "- https://www.tandfonline.com/doi/pdf/10.1080/21645515.2021.1883389 ;" +
        "- https://www.japantimes.co.jp/news/2020/12/23/national/japan-vaccine-history-coronavirus/ ;" +
        "- http://hdr.undp.org/en/content/human-development-index-hdi ;"
    let lines = text.split(";")
    let delay = 1000

    for (let i = 0; i < lines.length; i++) {
        d3.select("svg").append("text")
            .attr("class","flavor")
            .attr("x",buttonX + buttonWidth/2 - 320)
            .attr("y",2000)
            .text(lines[i])
            .style("text-anchor", "left")
            .attr("xlink:href",function() {
                if (lines[i].includes("- ")) {
                    return lines[i].substr(2)
                } else {
                    return ""
                }
            })
            .transition().duration(delay)
            .attr("y",textY + 50 + i*40)
            .style('font-size', '26px')
            .style('font-family', '"Open Sans", sans-serif')
    }
}

setScene1()
