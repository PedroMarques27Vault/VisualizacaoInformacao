// The svg

var svg = d3.select("#map"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()

    .center([0, 40]) // set centre to further North
    .scale((width) / (2.5 * Math.PI))
    .translate([width / 2, height / 2]);



d3.queue().defer(d3.json, "custom.geo.json").await(load_data);
// Data and color scale

var colorScale = d3.scaleThreshold()
  .domain([0, 1, 50, 100,500,1000,5000,10000,20000 ])
  .range(d3.schemeReds[9]);

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
        .on('onchange', val => {
            filters.release = val
            d3.select('p#value-range-date').text(val.map(d3.format(",.0f")).join('-'));

        });


    gRange.call(sliderRange);


    gRangeDate.call(sliderRangeDate);








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




            }


        }).on("mouseleave",function(d){




        return tooltip.style("visibility", "hidden")}).on("click", function (d) { click(d); })

}


function click(d){
    window.location = window.location.origin + ("/genres.html?country="+d.properties.wb_a2)
}

function load_data(error, datageo){
    d3.csv("js/movies_metadata.csv", function(error, data) {
        data.forEach(d => {

            if (d.genres && d.genres.includes('[') && d.genres.length!==2){

                var pairs = cutSides(d.genres).split(", ");

                d.genres = []
                pairs.forEach(s=>{
                    var pair = cutSides(s).split(": ");


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
    data =  data.filter(function (a) {

        for (let g of a.genres){
            if (!filters.genres.has(g)){
                return false
            }

        }
        return true
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

