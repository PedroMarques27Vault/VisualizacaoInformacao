// The svg

var svg = d3.select("#map"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
var path = d3.geoPath();
var projection = d3
    .geoEquirectangular()
    .center([0, 15]) // set centre to further North
    .scale([width/(2*Math.PI)]) // scale to fit group width
    .translate([width/2,height/2]) // ensure centred in group
;


d3.queue().defer(d3.json, "custom.geo.json").await(load_data);
// Data and color scale

var colorScale = d3.scaleThreshold()
  .domain([0, 50, 100,500,1000,5000,10000,20000,30000 ])
  .range(d3.schemeBlues[9]);

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








function ready(error,datageo,countries, data) {


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


            
            countries =  (load_movies_per_country(error, datageo, data));
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
        .attr("for", function(d,i) { return i; });
    d3.select("#checkbox_submit").on("click",val=>{
        countries =  (load_movies_per_country(error, datageo, data));
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
        .on('onchange', async val => {
            filters.release = val


            countries =  (load_movies_per_country(error, datageo, data));
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





    var svg_pie = d3.select("#svg_pie")

        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

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
        }).style("background-color", 'red')
        .on("mouseover", function (d) {
            let count, budget, revenue = 0



            var subs = d.properties.wb_a2
            if (subs in countries) {
                count = countries[subs].Count
                revenue = countries[subs].Revenue
                budget = countries[subs].Budget
                var coordinates= d3.mouse(this);
                var x = coordinates[0]+25;
                var y = coordinates[1]+25;

                tooltip.style("visibility", "visible").style("padding", "10px")
                    .style("top", (y)+"px")
                    .style("left",(x)+"px").html(
                    "<h1>"+d.properties.admin+ " ("+  filters.release.map(d3.format('.0f'))
                        .join('-')  +")</h1>"+


                    "<p><b style='color:cornflowerblue'>Movies Produced By This Country: "+d3.format(",")(count) +" </b></p>"
                    +"<p>Invested In Movies: "+d3.format(",.3r")(budget) +"$ </p>"
                    +"<p>Revenue From Movies: "+d3.format(",.3r")(revenue) +"$ </p>"           )



                var count_g = genre_counter(countries[subs].Genres)
                var width = 450
                height = 450
                margin = 40

                var radius = Math.min(width, height) / 2 - margin




                var color = d3.scaleOrdinal()
                    .domain(["a", "b", "c", "d", "e", "f", "g", "h"])
                    .range(d3.schemeDark2);

                var pie = d3.pie()
                    .sort(null) // Do not sort group by size
                    .value(function(d) {return d.value; })
                var data_ready = pie(d3.entries(count_g))
                svg_pie.selectAll("path")
                    .data(data_ready).exit().remove()

                svg_pie.selectAll("polyline")
                    .data(data_ready).exit().remove()
                svg_pie.selectAll("text")
                    .data(data_ready).exit().remove()

                var arc = d3.arc()
                    .innerRadius(radius * 0.5)         // This is the size of the donut hole
                    .outerRadius(radius * 0.8)

                var outerArc = d3.arc()
                    .innerRadius(radius * 0.9)
                    .outerRadius(radius * 0.9)


                svg_pie
                    .selectAll('allSlices')
                    .data(data_ready)
                    .enter()
                    .append('path')
                    .attr('d', arc)
                    .attr('fill', function(d){ return(color(d.data.key)) })
                    .attr("stroke", "white")
                    .style("stroke-width", "2px")
                    .style("opacity", 0.7)

// Add the polylines between chart and labels:
                svg_pie
                    .selectAll('allPolylines')
                    .data(data_ready)
                    .enter()
                    .append('polyline')
                    .attr("stroke", "black")
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr('points', function(d) {
                        var posA = arc.centroid(d) // line insertion in the slice
                        var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                        var posC = outerArc.centroid(d); // Label position = almost the same as posB
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                        posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                        return [posA, posB, posC]
                    })

// Add the polylines between chart and labels:
                svg_pie
                    .selectAll('allLabels')
                    .data(data_ready)
                    .enter()
                    .append('text')
                    .text( function(d) {  return d.data.key+" ("+d.data.value+")" } )
                    .attr('transform', function(d) {
                        var pos = outerArc.centroid(d);
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')';
                    })
                    .style('text-anchor', 'end')


            }


        }).on("mouseleave",function(d){


        svg_pie.selectAll("path")
            .remove()

        svg_pie.selectAll("polyline").remove()
        svg_pie.selectAll("text").remove()


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

        var countries = load_movies_per_country(error,datageo,data)
        ready(error,datageo, countries, data)

    })
}
function genre_counter(list_of_genres){
    counter = {}
    for (let g of list_of_genres){
        if (g in counter){
            counter[g]+=1
        }else{
            counter[g]=1
        }
    }
    var items = Object.keys(counter).map(function(key) {
        return [key, counter[key]];
    });


// Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    var top5 = new Set()

    items.slice(0,5).forEach(d=>{top5.add(d[0])})

    var final_counter = {}
    for (const [key, value] of Object.entries(counter)){

        if  (top5.has(key)){
            final_counter[key] = value
        }else{
            if ('Other' in final_counter)
                final_counter['Other'] += value
            else

                final_counter['Other'] =1
        }
    }
    return final_counter
}
function load_movies_per_country(error,datageo, data){
        var countries = {}
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
        data.forEach(d => {

            if (d.production_countries){
                let _revenue = parseFloat(d.revenue)
                let _budget = parseFloat(d.budget)
                for (let c of d.production_countries){
                    if (c in countries){
                        countries[c] = {Count:countries[c].Count+1, Budget:countries[c].Budget+_budget,Revenue:countries[c].Revenue+_revenue,Genres:countries[c].Genres.concat(d.genres)}

                    }else{
                        countries[c] =  {Count:1, Budget:_budget,Revenue:_revenue, Genres:d.genres}

                    }
                }






            }
        });






    return countries



}

function cutSides(s) { return s.substring(1, s.length - 1); }

