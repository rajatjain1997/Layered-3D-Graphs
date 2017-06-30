var width = 960,
  height = 600;

var svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3_force.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(10))
  .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("../data/smalldep.json", function(error, graph) {
  if (error) throw error;
  var layers = 3;

  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody(), graph.nodes, function(d) {return d.group == iter;}));
      simulation = simulation.force("layerconstraint" + iter, isolate(d3.forceY(-iter*10).strength(2), graph.nodes, function(d) {return d.group == iter;}));
    })(iter);
  }

  var link = svg.append("g")
    .attr("class", "links")
  .selectAll("line")
  .data(graph.links)
  .enter().append("line")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
    .attr("class", "nodes")
  .selectAll("circle")
  .data(graph.nodes)
  .enter().append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { return color(d.group); })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  node.append("title")
    .text(function(d) { return d.id; });

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(graph.links);

  function ticked() {
  link
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  node
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

simulation.on("end", function() {
  var nodePos=simulation.nodes();  
  var trace = new Array();

  var i;
  for(i=0;i<nodePos.length;i++)
  {
    trace[i]={
    x:[nodePos[i].x], y:[nodePos[i].y], z:[nodePos[i].y],
    mode: 'lines+markers',
    line: {
      color: 10, 
      width: 2
    },
    marker: {
      size: 12,
      line: {
      color: 'rgba(217, 217, 217, 0.14)',
      width: 0.5},
      opacity: 0.8},
    type: 'scatter3d'
  };
  }

  var data = new Array();
  for(i=0;i<nodePos.length;i++)
  {
    data.push(trace[i]);
  }
  var layout = {margin: {
    l: 0,
    r: 0,
    b: 0,
    t: 0
    }};
  Plotly.newPlot('myDiv', data, layout);
});

function isolate(force, nodes, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}