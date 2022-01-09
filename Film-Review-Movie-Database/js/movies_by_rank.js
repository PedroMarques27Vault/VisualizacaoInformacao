let titles = []
let ratings = []
let filters = {genres:new Set(), rating :[0,10], release:[1900, 2025]}

const margin = {top: 20, right: 30, bottom: 40, left: 90},
    width = 660,
    height = 400;

console.log(width)
const svg = d3.select("svg")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.csv("js/movies_metadata.csv", function(error, data) {
    if (error) {
        throw error;
    }      
    
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
    })
    
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
        titles.push(d.title);
        ratings.push(d.vote_average);
    })

    const slicedtitles = titles.slice(0, 6);
    const slicedratings = ratings.slice(0, 6); 
    
    // Add X axis
    const x = d3.scaleLinear()
    .range([margin.left, width - margin.right])
    .domain([0, 10])
    .range(slicedratings);
    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

    // Y axis
    const y = d3.scaleBand()
    .range([ 0, height ])
    .domain(slicedtitles)
    .padding(.1);
    svg.append("g")
    .call(d3.axisLeft(y))
            
    svg.selectAll("myRect")
    .data(data)
    .enter().append("rect")
    .attr("x", x(0))
    .attr("y", d => y(d.title))
    .attr("width", d => x(d.vote_average))
    .attr("height", y.bandwidth())
    .attr("fill", "#69b3a2")

});
    
function cutSides(s) { return s.substring(1, s.length - 1); }
