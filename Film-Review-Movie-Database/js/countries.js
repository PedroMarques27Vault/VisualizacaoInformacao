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

d3.queue().defer(d3.json, "custom.geo.json").await(load_data);
// Data and color scale

var colorScale = d3.scaleThreshold()
  .domain([0, 100, 500,1000,5000,10000,20000 ])
  .range(d3.schemeBlues[7]);

// Range




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

    .html("<p>I'm a tooltip written in HTML</p><span style='font-size: 40px;'>Isn't it?</span>");

let filters = {genres: [], rating :[0,10], release:[1900, 2025]}
var gRange = d3
    .select('div#slider-range')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

var gRangeDate = d3
    .select('div#slider-range-date')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');
var all_data = []








function ready(error,datageo,countries, data) {

    var sliderRange = d3
        .sliderBottom()
        .min(0)
        .max(10)
        .width(300)
        .tickFormat(d3.format(".1f"))
        .ticks(5)
        .default([0.0, 10])
        .fill('#2196f3')
        .on('onchange', async val => {
            filters.rating = val


            var newdata = data.filter(function (a) {
                return a.vote_average >= filters.rating[0] && a.vote_average <= filters.rating[1]
            });
            countries =  (load_movies_per_country(error, datageo, newdata));
            svg
                .selectAll("path")
                .data(datageo.features).attr("fill", function (d) {
                var subs = d.properties.wb_a2

                if (subs in countries) {
                    d.total = countries[subs].Count
                } else {
                    d.total = 0
                }

                return colorScale(d.total);
            })
            // Draw the map



            d3.select('p#value-range').text(val.map(d3.format('.1f')).join('-'));

        });


    var sliderRangeDate = d3
        .sliderBottom()
        .min(1900)
        .max(2025)
        .width(300)
        .tickFormat(d3.format(",.0f"))
        .ticks(5)
        .default([1900, 2025])
        .fill('#2196f3')
        .on('onchange', async val => {
            filters.release = val

            var newdata = data.filter(function (a) {

                if (a.release_date){

                    date = parseInt(a.release_date.substring(0, 4))
                    return date >= filters.release[0] && date <= filters.release[1]
                }
            });
            countries =  (load_movies_per_country(error, datageo, newdata));
            svg
                .selectAll("path")
                .data(datageo.features).attr("fill", function (d) {
                var subs = d.properties.wb_a2

                if (subs in countries) {
                    d.total = countries[subs].Count
                } else {
                    d.total = 0
                }

                return colorScale(d.total);
            })
            // Draw the map



            d3.select('p#value-range-date').text(val.map(d3.format(",.0f")).join('-'));

        });


    gRange.call(sliderRange);

    d3.select('p#value-range').text(
        sliderRange
            .value()
            .map(d3.format('.1f'))
            .join('-')
    );

    gRangeDate.call(sliderRangeDate);

    d3.select('p#value-range-date').text(
        sliderRangeDate
            .value()
            .map(d3.format('.1f'))
            .join('-')
    );

    // Draw the map
    svg
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
            var subs = d.properties.wb_a2

            if (subs in countries) {
                d.total = countries[subs].Count
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



            var subs = d.properties.wb_a2
            if (subs in countries) {
                count = countries[subs].Count
                revenue = countries[subs].Revenue
                budget = countries[subs].Budget


                return tooltip.style("visibility", "visible").style("padding", "10px").style("top", (event.pageY)+"px")
                    .style("left",(event.pageX)+"px").html(
                        "<h3>"+d.properties.admin+"</h3>"+
                        "<p>Movies Produced By This Country: "+count +" </p>"
                        +"<p>Invested In Movies: "+budget +" </p>"
                        +"<p>Revenue From Movies: "+revenue +" </p>")
            }


        }).on("mouseleave",function(d){

        return tooltip.style("visibility", "hidden")}).on("click", function (d) { click(d); })
}


function click(d){
    window.location = window.location.origin + ("/movielist.html?country="+d.properties.wb_a2)
}

function load_data(error, datageo){
    d3.csv("js/movies_metadata.csv", function(error, data) {
        data.forEach(d => {
            if (d.genres && d.genres.includes('[') && d.genres.length!==2){

                var pairs = cutSides(d.genres).split(", ");

                d.genres = []
                pairs.forEach(s=>{
                    var pair = cutSides(s).split(": ");

                    cutted_sides = cutSides(pair[1]);

                    if (pair[0]==="name'"){
                        pair[1] = pair[1].substring(1, pair[1].length - 1)
                        d.genres.push(pair[1])



                    }
                })


            }
            if (d.production_countries && d.production_countries.includes('[') && d.production_countries.length!==2){
                var pairs = cutSides(d.production_countries).split(", ");

                d.production_countries = []
                pairs.forEach(s=>{
                    var pair = cutSides(s).split(": ");

                    if (pair[0]!=="name'"){
                        d.production_countries.push(pair[1].substring(1, pair[1].length))

                    }
                })








            }
        })

        var countries = load_movies_per_country(error,datageo,data)
        ready(error,datageo, countries, data)

    })
}

function load_movies_per_country(error,datageo, data){
        var countries = {}

        data.forEach(d => {
            if (d.production_countries){
                let _revenue = parseFloat(d.revenue)
                let _budget = parseFloat(d.budget)
                for (let c of d.production_countries){
                    if (c in countries){
                        countries[c] = {Count:countries[c].Count+1, Budget:countries[c].Budget+_budget,Revenue:countries[c].Revenue+_revenue}

                    }else{
                        countries[c] =  {Count:1, Budget:_budget,Revenue:_revenue}

                    }
                }






            }
        });






    return countries



}

function cutSides(s) { return s.substring(1, s.length - 1); }

