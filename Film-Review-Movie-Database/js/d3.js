// initial setup

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Map and projection
var projection = d3.geoMercator()
    .center([0,20])                // GPS of location to zoom on
    .scale(100)                       // This is like the zoom
    .translate([ width/2, height/2 ])

d3.queue()
  .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")  // World shape
  .defer(d3.csv, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv") // Position of circles
  .await(ready);

d3.csv("js/movies_metadata.csv", function(data) {
    console.log(data);
});


function ready(error, dataGeo, data) {
    let countries_data = load_movies_per_country()
    let mouseOver = function(d) {
		d3.selectAll(".Country")
			.transition()
			.duration(200)
			.style("opacity", 0.1)
			.style("stroke", "transparent");
		d3.select(this)
			.transition()
			.duration(200)
			.style("opacity", 1)
			.style("stroke", "white");
		tooltip.style("left", (d3.event.pageX + 15) + "px")
			.style("top", (d3.event.pageY - 28) + "px")
			.transition().duration(400)
			.style("opacity", 1)
			.text(d.properties.name + ': ' + Math.round((d.total / 1000000) * 10) / 10 + ' mio.');
	}

	let mouseLeave = function() {
		d3.selectAll(".Country")
			.transition()
			.duration(200)
			.style("opacity", 1)
			.style("stroke", "transparent");
		tooltip.transition().duration(300)
			.style("opacity", 0);
	}

  // Create a color scale
  var allContinent = d3.map(data, function(d){return(d.homecontinent)}).keys()
  var color = d3.scaleOrdinal()
    .domain(allContinent)
    .range(d3.schemePaired);

  // Add a scale for bubble size
  var valueExtent = d3.extent(data, function(d) { return +d.n; })
  var size = d3.scaleSqrt()
    .domain(valueExtent)  // What's in the data
    .range([ 1, 50])  // Size in pixel


  // Draw the map
  svg.append("g")
      .selectAll("path")
      .data(dataGeo.features)
      .enter()
      .append("path")
        .attr("fill", "#b8b8b8")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
      .style("stroke", "none")
      .style("opacity", .3)

  // Add circles:
  svg
    .selectAll("myCircles")
    .data(data.sort(function(a,b) { return +b.n - +a.n }).filter(function(d,i){ return i<1000 }))
    .enter()
    .append("circle")
      .attr("cx", function(d){ return projection([+d.homelon, +d.homelat])[0] })
      .attr("cy", function(d){ return projection([+d.homelon, +d.homelat])[1] })
      .attr("r", function(d){ return size(+d.n) })
      .style("fill", function(d){ return color(d.homecontinent) })
      .attr("stroke", function(d){ if(d.n>2000){return "black"}else{return "none"}  })
      .attr("stroke-width", 1)
      .attr("fill-opacity", .4)



  // Add title and explanation
  svg
    .append("text")
      .attr("text-anchor", "end")
      .style("fill", "black")
      .attr("x", width - 10)
      .attr("y", height - 30)
      .attr("width", 90)
      .html("WHERE SURFERS LIVE")
      .style("font-size", 14)


  // --------------- //
  // ADD LEGEND //
  // --------------- //

  // Add legend: circles
  var valuesToShow = [100,4000,15000]
  var xCircle = 40
  var xLabel = 90
  svg
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("circle")
      .attr("cx", xCircle)
      .attr("cy", function(d){ return height - size(d) } )
      .attr("r", function(d){ return size(d) })
      .style("fill", "none")
      .attr("stroke", "black")

  // Add legend: segments
  svg
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("line")
      .attr('x1', function(d){ return xCircle + size(d) } )
      .attr('x2', xLabel)
      .attr('y1', function(d){ return height - size(d) } )
      .attr('y2', function(d){ return height - size(d) } )
      .attr('stroke', 'black')
      .style('stroke-dasharray', ('2,2'))

  // Add legend: labels
  svg
    .selectAll("legend")
    .data(valuesToShow)
    .enter()
    .append("text")
      .attr('x', xLabel)
      .attr('y', function(d){ return height - size(d) } )
      .text( function(d){ return d } )
      .style("font-size", 10)
      .attr('alignment-baseline', 'middle')

      svg.on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
   
}



function load_movies_per_country(){
    var countries = {}
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

                    if (pair[0]=="name'"){
                        

                        if (pair[1] in countries){
                            countries[pair[1]] = {"count":countries[pair[1]]["count"]+1, "budget":countries[pair[1]]["budget"]+budget,"revenue":countries[pair[1]]["revenue"]+revenue}
                        }else{
                            countries[pair[1]] =  {"count":1, "budget":budget,"revenue":revenue} 
                        }
                        
                    }
                    return result;
                });
            }
           
            
     
        }
    
    });
    return countries

}

function cutSides(s) { return s.substring(1, s.length - 1); }

