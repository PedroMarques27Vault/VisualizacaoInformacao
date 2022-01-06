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

d3.queue().defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").await(ready);
// Data and color scale

var colorScale = d3.scaleThreshold()
  .domain([0, 5, 100, 200, 3000])
  .range(d3.schemeBlues[7]);
 


// Load external data and boot

 
function ready(error,datageo) {
    var div = d3.select("body").append("div")
        .attr("class", "tooltip-donut")
        .style("opacity", 0);
    let data = load_movies_per_country()
  let mouseOver = function(d) {
        console.log(d.total)
    d3.selectAll(".Country")
      .transition()
      .duration(200)
      .style("opacity", .5)
    d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 1)
      .style("stroke", "black")
      div.transition()
          .duration(50)
          .style("opacity", 1);
      div.html('HELLO')
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 15) + "px");
  }

  let mouseLeave = function(d) {
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
    console.log(typeof cc)
    cc.forEach(function(item, index, array) {
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

          if (data.country_codes.indexOf(("AE")) >= 0){
              console.log(data, d.id.substring(0, d.id.length - 1))
              d.total = data[d.id.substring(0, d.id.length - 1)]['count']
          }else{
              d.total = 0
          }

        return colorScale(d.total);
      })
      .style("stroke", "transparent")
      .attr("class", function(d){ return "Country" } )
      .style("opacity", .8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave )
    }




function load_movies_per_country(){
    var countries = {"HELLOOOO":1}
    const country_codes = []

    console.log(d3.keys(countries))
    d3.csv("js/movies_metadata.csv", function(data) {

        for (var i = 0; i < data.length; i++) {
            if (data[i].production_countries && data[i].production_countries.includes('[') && data[i].production_countries.length!=2){

                var pairs = cutSides(data[i].production_countries).split(", ");
                let revenue = parseFloat(data[i].revenue)
                let budget = parseFloat(data[i].budget)
                pairs.map(function(s) { 
                    var pair = cutSides(s).split(": ");
                    var result = {};
                    result[pair[0]] = cutSides(pair[1]); 

                    if (pair[0]==="'iso_3166_1'"){
                        
                        pair[1] = pair[1].substring(1, s.length - 1)
                        if (pair[1] in countries){
                            countries[pair[1]] = {"count":countries[pair[1]]["count"]+1, "budget":countries[pair[1]]["budget"]+budget,"revenue":countries[pair[1]]["revenue"]+revenue}
                        }else{
                            countries[pair[1]] =  {"count":1, "budget":budget,"revenue":revenue} 
                            country_codes.push(pair[1])
                        }
                        
                    }
                    return result;
                });
            }
           
            
     
        }
    
    });
    return {countries,country_codes}

}

function cutSides(s) { return s.substring(1, s.length - 1); }

