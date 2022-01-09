let titles = []
let ratings = []
let filters = {countries:"All",genres:new Set(), rating :[0,10], release:[1900, 2025]}
var all_genres = new Set()
var all_countries = new Set()

filters.genres.add("All")
all_countries.add("All")
all_genres.add("All")

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

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

d3.select("#countries_click").on('click',v=>{ window.location = window.location.origin + ("/home.html")})
d3.select("#genres_click").on('click',v=>{ window.location = window.location.origin + ("/genres.html")})
d3.select("#ranked_click").on('click',v=>{ window.location = window.location.origin + ("/ranked.html")})

//sort bars based on value
const margin = {top: 20, right: 30, bottom: 40, left: 5},
    width = 660,
    height = 500;

var formatPercent = d3.format("");

var svg = d3.select("#movies_rated").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");




d3.queue().defer(d3.json, "custom.geo.json").await(load_data);

var tooltip = d3.select("#movies_rated")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .html("");


function update(datageo, dataset,original_data) {
    svg.selectAll("*").remove();
    var country_code_map = get_country_list(datageo)

    d3.select("#title").html("<h2>Results for " + country_code_map[filters.countries]+ " (" +dataset.length+" Movies)\n <p>Included Genres: "+Array.from(filters.genres).join(', ')+"</p> </h2>")

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
            d3.select('p#value-range').text(val.map(d3.format('.1f')).join('-'));
        });

    d3.select("#checkbox_div").selectAll("input")
        .data(Array.from(all_genres))
        .enter().append("label")
        .text(function(d) { return d; })
        .append("input")
        .attr("type", "checkbox")
        .attr("checked",  true)

        .attr("id", function(d,i) { return i; })
        .on("change", val => {
            if (val==='All'){
                if (filters.genres.has(val)){
                    d3.select("#checkbox_div").selectAll('input').property('checked', false);
                    filters.genres = new Set()
                }else{
                    filters.genres = all_genres
                    d3.select("#checkbox_div").selectAll('input').property('checked', true);
                }
            }else{
                if (filters.genres.has(val)){
                    filters.genres.delete(val)
                }else{
                    filters.genres.add(val)
                }
            }
        })
        .attr("for", function(d,i) { return i; });

    d3.selectAll('input').property('checked', d=>{
        return filters.genres.has(d)
    });

    d3.select("#checkbox_submit").on("click",val=>{
        apply_filters(datageo, dataset,original_data)
    })

    d3.select("#countries_select")
      .selectAll('option')
      .data(Array.from(Object.keys(country_code_map)))
      .enter()
      .append('option')
      .text(function (d) { return country_code_map[d]; }) // text showed in the menu
      .attr("value", function (d) { return d; })
    d3.select("#countries_select").on("change", function(d) {
        // recover the option that has been chosen
        filters.countries = d3.select(this).property("value")
    })

    var sliderRangeDate = d3
        .sliderBottom()
        .min(1900)
        .max(2025)
        .width(300)
        .tickFormat(d3.format(".0f"))
        .ticks(5)
        .default([1900, 2025])
        .fill('#2196f3')
        .on('onchange', val => {
            filters.release = val
        });

    gRange.call(sliderRange);
    gRangeDate.call(sliderRangeDate);

    var dataset = get_top(dataset,10)
    var slicedtitles = []
    var sliced_ratings = []

    for (let d of dataset){
        slicedtitles.push(d.title)
        sliced_ratings.push(d.vote_average)
    }

    var y = d3.scaleOrdinal()
              .range([height, 0], .2, 0.5).domain(slicedtitles);

    d3.axisLeft()
      .scale(y)

    svg.select(".y.axis").remove();
    svg.select(".x.axis").remove();

    x = d3.scaleLinear()
        .range([10, width])
        .domain([0, 10]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")

    y = d3.scaleBand()
        .range([ 0, height ])
        .domain(slicedtitles)
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))

    let bars = svg.selectAll("myRect")
        .data(dataset)
        .enter().append("rect")

    bars.attr("x", d=>{  return (10)})
        .attr("y", d => y(d.title))
        .attr("width", d => {
            return x(parseFloat(d.vote_average))
        })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2")

    for (let d of dataset){
        svg.append("text")
            .attr("class", "y label")
            .attr("y", y(d.title)+25)
            .attr("x", 20)
            .text(d.title);
    }
    
    bars.on('mouseover', function (d, i) {
        d3.select(this).transition()
            .duration('1')
            .attr('opacity', '.85');
        var coordinates= d3.mouse(this);
        var x = coordinates[0]+100;
        var y = coordinates[1];
        var prod_countries = []
        for (let f of d.production_countries){
            prod_countries.push(country_code_map[f])
        }
        tooltip.style("visibility", "visible").style("padding", "10px")
            .style("top", (y)+"px")
            .style("left",(x)+"px").html(
            "<h1>"+d.title+ "</h1>"+

            "<p style='color:blue'>Top "+(i+1) + " most popular right now</p>"+
            "<p style='color:blue'>Rating: "+d.vote_average + "/10 ("+d.vote_count+" votes)</p>"+
            "<p >Overview: "+d.overview + " </p>"+
            "<p>Runtime: "+d.runtime+" minutes </p>"+
            "<p>Release: "+d.release_date+"</p>"+
            "<p>Production Countries: "+prod_countries.join(', ')+"</p>"+
            "<p style='color:blue'>Genres: "+d.genres.join(', ') + " </p>"
        )
    })
        .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
            tooltip.style("visibility", "hidden")
        })
};


function get_country_list(datageo){
    var list = {"All":"All Countries"}
    var _copy = all_countries

    _copy.delete("All")

    var cs = Array.from(_copy)
    cs.sort()

    for (let c of cs){
        var name = name_from_code(datageo, c)
        if (name.length>4){
            list[c] = name
        }
    }
    return list
}


function name_from_code(datageo, d){
    for (let a of datageo.features){
        if (a.properties.wb_a2 === d)
            return "("+d +") "+ a.properties.admin
    }
    return ""
}


function load_data(error, datageo){
    d3.csv("js/movies_metadata.csv", function(error, data) {
        data.forEach(d => {
            if (d.genres && d.genres.includes('[') && d.genres.length!==2){
                var pairs = cutSides(d.genres).split(", ");
                d.genres = []
                pairs.forEach(s=>{
                    var pair = cutSides(s).split(": ");
                    if (pair[0]==="name'" && pair[1].length!==1){
                        pair[1] = pair[1].substring(1, pair[1].length - 1)
                        d.genres.push(pair[1])
                        filters.genres.add(pair[1])
                        all_genres.add(pair[1])
                    }
                })
            }
            if (d.production_countries && d.production_countries.includes('[') ){
                if (d.production_countries.length===2){
                    d.production_countries = new Set()
                }else{
                    var pairs = cutSides(d.production_countries).split(", ");

                    d.production_countries = new Set()
                    pairs.forEach(s=>{
                        var pair = cutSides(s).split(": ");

                        if (pair[0]!=="name'"){
                            pair[1]= pair[1].substring(1, pair[1].length)
                            d.production_countries.add(pair[1])
                            all_countries.add(pair[1])
                        }
                    })
                }
            }
        })
        if (urlParams.get('country')){
            filters.countries = new Set()
            filters.countries=(urlParams.get('country'))
        }
        if (urlParams.get('genre')){
            filters.genres = new Set()
            filters.genres.add(urlParams.get('genre'))
        }


        apply_filters(datageo, data, data)
    })
}

function get_top(data,n){
    data.sort(function(first, second) {
        return second.popularity - first.popularity;
    });
    var keys = data.slice(0,n)

    /* keys.sort(function(first, second) {
        return second.vote_average - first.vote_average;
    }); */
    
    return keys
}
function apply_filters(datageo, data, original_data){

    var altereddata = original_data.filter(function (a) {
        return a.vote_average >= filters.rating[0] && a.vote_average <= filters.rating[1]
    });

    altereddata =  altereddata.filter(function (a) {
        if (a.release_date){
            date = parseInt(a.release_date.substring(0, 4))
            return date >= filters.release[0] && date <= filters.release[1]
        }
    });

    altereddata =  altereddata.filter(function (a) {
        for (let g of a.genres){
            if (filters.genres.has(g)){
                return true
            }
        }
        return false
    });

    altereddata =  altereddata.filter(function (a) {
        if ( a.production_countries.has(filters.countries) || filters.countries==="All"){
            return true
        }
        return false
    });

    update(datageo, altereddata, original_data)
    return altereddata
}
   

function cutSides(s) { return s.substring(1, s.length - 1); }
