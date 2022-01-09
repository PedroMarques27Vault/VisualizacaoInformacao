var svg = d3.select("svg"),
    margin = 200,
    width = svg.attr("width") - margin,
    height = svg.attr("height") - margin

svg.append("text")
    .attr("transform", "translate(100,0)")
    .attr("x", 150)
    .attr("y", 150)
    .attr("font-size", "24px")
    .text("XYZ Foods Stock Price")

var xScale = d3.scaleBand().range([0, width]).padding(0.4),
    yScale = d3.scaleLinear().range([height, 0]);

var g = svg.append("g")
           .attr("transform", "translate(" + 100 + "," + 100 + ")");

d3.queue().defer(d3.json, "custom.geo.json").await(load_data);

// Range
var tooltip = d3.select("#world_movies")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .html("");

let filters = {genres:new Set(), rating :[0,10], release:[1900, 2025]}
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


function ready(error,countries, data) {

    var sliderRange = d3
        .sliderBottom()
        .min(0)
        .max(10)
        .width(300)
        .tickFormat(d3.format(".1f"))
        .ticks(5)
        .default([0.0, 10])
        .fill('red')
        .on('onchange', async val => {
            filters.rating = val
            countries =  (load_movies_per_country(error, data));
            
            const slicedtitles = countries[0].slice(0, 6);
            const slicedratings = countries[1].slice(0, 6); 

            xScale.domain(slicedtitles);
            yScale.domain([0, d3.max(slicedratings)]);

            g.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale))
                .append("text")
                .attr("y", height - 250)
                .attr("x", width - 100)
                .attr("text-anchor", "end")
                .attr("stroke", "black")
                .text("Year");

            g.append("g")
                .call(d3.axisLeft(yScale).tickFormat(function(d){
                    return d;
                })
                .ticks(10))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "-5.1em")
                .attr("text-anchor", "end")
                .attr("stroke", "black")
                .text("Stock Price");

            g.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return xScale(d.title); })
                .attr("y", function(d) { return yScale(d.vote_average); })
                .attr("width", xScale.bandwidth())
                .attr("height", function(d) { return height - yScale(d.vote_average); });
            });

    d3.select("#checkbox_div").selectAll("input")
        .data(Array.from(filters.genres))
        .enter().append("label")
        .text(function(d) { return d; })
        .append("input")
        .attr("checked", true)
        .attr("type", "checkbox")
        .attr("id", function(d,i) { return i; })
        .on("change", val => {
            if (filters.genres.has(val)){
                filters.genres.delete(val)
            }else{
                filters.genres.add(val)
            }
        })
        .attr("for", function(d,i) { return i; }
    );

    /* d3.select("#checkbox_submit").on("click",val=>{
        countries =  (load_movies_per_country(error, datageo, data));
        svg.selectAll("path")
           .data(datageo.features).attr("fill", function (d) {
            var subs = d.properties.wb_a2

            if (subs in countries) {
                d.total = countries[subs].Count
            } else {
                d.total = 0
            }
            return colorScale(d.total);
        })
    }) */


    var sliderRangeDate = d3
        .sliderBottom()
        .min(1900)
        .max(2025)
        .width(300)
        .tickFormat(d3.format(".0f"))
        .ticks(5)
        .default([1900, 2025])
        .fill('#2196f3')
        .on('onchange', async val => {
            filters.release = val
            countries =  (load_movies_per_country(error, data));
            const slicedtitles = countries[0].slice(0, 6);
            const slicedratings = countries[1].slice(0, 6); 

            xScale.domain(slicedtitles);
            yScale.domain([0, d3.max(slicedratings)]);

            g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("y", height - 250)
            .attr("x", width - 100)
            .attr("text-anchor", "end")
            .attr("stroke", "black")
            .text("Year");

            g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(function(d){
                return d;
            })
            .ticks(10))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-5.1em")
            .attr("text-anchor", "end")
            .attr("stroke", "black")
            .text("Stock Price");

            g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return xScale(d.title); })
            .attr("y", function(d) { return yScale(d.vote_average); })
            .attr("width", xScale.bandwidth())
            .attr("height", function(d) { return height - yScale(d.vote_average); });
        
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
    }

function click(d){
    window.location = window.location.origin + ("/movielist.html?country="+d.properties.wb_a2)
}

function load_data(error){
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
                            filters.genres.add(pair[1])
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
        var countries = load_movies_per_country(error,data)
        ready(error,countries, data)
    })
}

function load_movies_per_country(error, data){
        var movies = []
        data = data.filter(function (a) {
            return a.vote_average >= filters.rating[0] && a.vote_average <= filters.rating[1]
        });
        data =  data.filter(function (a) {
            if (a.release_date){
                date = parseInt(a.release_date.substring(0, 4))
                return date >= filters.release[0] && date <= filters.release[1]
            }
        });
        data =  data.filter(function (a) {
            for(let a_g of a.genres) {
                for(let f_g of filters.genres) {
                    if(a_g === f_g) {
                        return true;
                    }
                }
            }
            // Return if no common element exist
            return false;
        });
        
        var titles = []
        var ratings = []

        data.forEach(d => {
            titles.push(d.title);
            ratings.push(d.vote_average);
        });
        movies.push(titles)
        movies.push(ratings)

    return movies
}

function cutSides(s) { return s.substring(1, s.length - 1); }

