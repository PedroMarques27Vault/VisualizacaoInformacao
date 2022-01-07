// The svg

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()
  .scale(70)
  .center([0,20])
  .translate([width / 2, height / 2]);

d3.queue().defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").await(load_movies_per_country);
// Data and color scale

var colorScale = d3.scaleThreshold()
  .domain([0, 5, 100, 200, 3000])
  .range(d3.schemeBlues[7]);





var svg_customContent = d3.select("#div_customContent")
    .append("svg")
    .attr("width", 400)
    .attr("height", 400)

// Append a circle
svg_customContent.append("circle")
    .attr("id", "circleCustomTooltip")
    .attr("cx", 150)
    .attr("cy", 200)
    .attr("r", 40)
    .attr("fill", "#69b3a2")

// create a tooltip
var tooltip = d3.select("#word_movies")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")

    .html("<p>I'm a tooltip written in HTML</p><img src='https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true'></img><br>Fancy<br><span style='font-size: 40px;'>Isn't it?</span>");


function ready(error,datageo,data) {


    let mouseLeave = function (d) {
        d3.selectAll(".Country")
            .transition()
            .duration(200)
            .style("opacity", .8)
        d3.select(this)
            .transition()
            .duration(200)
            .style("stroke", "transparent")
        div.transition()
            .duration('50')
            .style("opacity", 0);
    }
    let cc = (data.country_codes)

    cc.forEach(function (item, index, array) {
        console.log(item, index)
    })
    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(datageo.features)
        .enter()
        .append("path")
        // draw each country
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        // set the color of each country
        .attr("fill", function (d) {
            var subs = d.id.substring(0, d.id.length - 1)
            if (data.country_codes.indexOf(subs) >= 0) {
                d.total = data.countries[d.id.substring(0, d.id.length - 1)].Count
            } else {
                d.total = 0
            }

            return colorScale(d.total);
        })
        .style("stroke", "transparent")
        .attr("class", function (d) {
            return "Country"
        })
        .style("opacity", .8)
        .on("mouseover", function (d) {
            let count, budget, revenue = 0
            let subs = d.id.substring(0, d.id.length - 1)
            if (data.country_codes.indexOf(subs) >= 0) {
                count = data.countries[subs].Count
                revenue = data.countries[subs].Revenue
                budget = data.countries[subs].Budget

            }
            return tooltip.style("visibility", "visible").style("padding", "10px").style("top", (event.pageY)+"px")
                .style("left",(event.pageX)+"px").html(
                    "<p>Movies Produced By This Country: "+count +" </p>"
                    +"<p>Invested In Movies: "+budget +" </p>"
                    +"<p>Revenue From Movies: "+revenue +" </p>")

        })
}




function load_movies_per_country(error, datageo){

    d3.csv("js/movies_metadata.csv", function(error, data) {
        var countries = {}
        const country_codes = []
        let c = data.forEach(d => {
            if (d.production_countries && d.production_countries.includes('[') && d.production_countries.length!==2){

                var pairs = cutSides(d.production_countries).split(", ");
                let _revenue = parseFloat(d.revenue)
                let _budget = parseFloat(d.budget)
                pairs.forEach(s=>{
                    var pair = cutSides(s).split(": ");
                    var result = {};
                    result[pair[0]] = cutSides(pair[1]);

                    if (pair[0]==="'iso_3166_1'"){
                        pair[1] = pair[1].substring(1, s.length - 1)
                        if (pair[1] in countries){
                            countries[pair[1]] = {Count:countries[pair[1]].Count+1, Budget:countries[pair[1]].budget+_budget,Revenue:countries[pair[1]].Revenue+_revenue}

                        }else{
                            countries[pair[1]] =  {Count:1, Budget:_budget,Revenue:_revenue}
                            country_codes.push(pair[1])
                        }

                    }
                })

            }
        });

        ready(error,datageo, {countries,country_codes})
    })



}

function cutSides(s) { return s.substring(1, s.length - 1); }

