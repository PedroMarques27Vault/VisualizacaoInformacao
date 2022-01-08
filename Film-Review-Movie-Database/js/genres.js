
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);



d3.queue().defer(d3.json, "custom.geo.json").await(load_data);
// Data and color scale


var tooltip = d3.select("#world_movies")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")

    .html("");

let filters = {genres: new Set(),countries:"All", rating :[0,10], release:[1900, 2025]}
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





var width = 650
height = 650
margin = 40

// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
var radius = Math.min(width, height) / 2 - margin

// append the svg object to the div called 'my_dataviz'
var svg = d3.select("#pie_svg")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

d3.select("#countries_click").on('click',v=>{ window.location = window.location.origin + ("/home.html")})
d3.select("#genres_click").on('click',v=>{ window.location = window.location.origin + ("/genres.html")})

// set the color scale
var color = d3.scaleOrdinal()
    .domain(["a", "b", "c", "d", "e", "f"])
    .range(d3.schemeDark2);
var all_genres = new Set()
var all_countries = new Set()
filters.countries=("All")
filters.genres.add("All")
all_countries.add("All")
all_genres.add("All")

// A function that create / update the plot for a given variable:
function update(datageo, data, original_data) {

    var country_code_map = get_country_list(datageo)

    d3.select("#title").html("<h1>Seeing results for " + country_code_map[filters.countries]+ " (" +data.length+" Movies)</h1>")

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
        .attr("checked", true)
        .attr("type", "checkbox")
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

    d3.select("#checkbox_submit").on("click",val=>{
        apply_filters(datageo, data,original_data)

    })



    d3.select("#countries_select")
        .selectAll('option')
        .data(Array.from(Object.keys(country_code_map)))
        .enter()
        .append('option')
        .text(function (d) { return country_code_map[d]; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button


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

    var result = genre_counter(data)
    var count_g = result[0]
    var popular = result[1]

    // Compute the position of each group on the pie:
    var pie = d3.pie()
        .value(function(d) {return d.value; })
        .sort(function(a, b) { return d3.ascending(a.key, b.key);} ) // This make sure that group order remains the same in the pie chart
    var data_ready = pie(d3.entries(count_g))

    // map to data
    var u = svg.selectAll("path")
        .data(data_ready)
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    u
        .enter()
        .append('path')
        .merge(u)
        .transition()
        .duration(1)
        .attr('d', d3.arc()
            .innerRadius(radius/2)
            .outerRadius(radius)
        ).attr('fill', function(d){ return(color(d.data.key)) })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 1)

    svg.selectAll('path').on('mouseover', function (d, i) {
        d3.select(this).transition()
            .duration('1')
            .attr('opacity', '.85');
        var coordinates= d3.mouse(this);
        var x = coordinates[0]+350;
        var y = coordinates[1]+150;

        var items = Object.keys(popular[d.data.key]).map(function(key) {
            return [key, popular[d.data.key][key]];
        });
        items.sort(function(first, second) {
            return second[1][0] - first[1][0];
        });
        var keys = items.slice(0,5).map(
            (e) => { return [e[0],e[1][1]] });



        tooltip.style("visibility", "visible").style("padding", "10px")
            .style("top", (y)+"px")
            .style("left",(x)+"px").html(
            "<h1>"+d.data.value+ " " + d.data.key +" Movies </h1>"+
            "<span style='color:blue'>"+d3.format(",.1%")((d.data.value)/data.length)+ " Of All Movies Are Included In This Genre</span>"



        )

        tooltip.append("p")
        tooltip.append("h6").text("Popular Movies")
        var index = 0
        for (var key of keys){
            index+=1
            tooltip.append("p").text("\t"+index+" - "+key[0]+", Score "+key[1]+"\n")
        }


    })
    .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
        tooltip.style("visibility", "hidden")
         })
    // remove the group that is not present anymore
    u
        .exit()
        .remove()

}

// Initialize the plot with the first dataset
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


        apply_filters(datageo, data, data)

    })
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
            if (!filters.genres.has(g)){
                return false
            }

        }
        return true
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
function genre_counter(data){
    var counter = {}
    var popular = {}
    data.forEach(d=>{
        var p_score = [d.popularity, d.vote_average]
        for (var g of d.genres){
            if (title!=="title"){
                if (g in counter){
                    counter[g]+=1
                }else{
                    counter[g] = 1
                }

                if (g in popular){

                    popular[g][d.original_title]= p_score
                }else{
                    popular[g] = {  }
                    popular[g][d.original_title] = p_score
                }
            }

        }
    })
    return [counter,popular];
}


function cutSides(s) { return s.substring(1, s.length - 1); }

