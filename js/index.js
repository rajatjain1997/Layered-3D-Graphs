var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3_force.forceSimulation().numDimensions(3)
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(1))
  .force("center", d3.forceCenter(0,0));

d3.json("../data/names.json", function(error, graph) {
  if (error) throw error;

  var i;
  for(i=0;i<graph.links.length;i++)
  {
    if(graph.nodes[graph.links[i].source-1].fz>=graph.nodes[graph.links[i].target-1].fz)
      graph.nodes[graph.links[i].target-1].fz=graph.nodes[graph.links[i].source-1].fz+1;
      for(j=0;j<graph.links.length;j++)
      {
        if(graph.nodes[graph.links[j].source-1].fz>=graph.nodes[graph.links[j].target-1].fz)
          graph.nodes[graph.links[j].target-1].fz=graph.nodes[graph.links[j].source-1].fz+1;
      }   
  }

  var layers = 3;

  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody().strength(-100), graph.nodes, function(d) {return d.fz == iter;}));
    })(iter);
  }

  simulation
    .nodes(graph.nodes);

  simulation.force("link")
    .links(graph.links);
});

simulation.on("end", function() {
  var nodePos=simulation.nodes();
  var edgePos=simulation.force("link").links();  
  //console.log(simulation.force("link").links());
  var nodes = new Array();

  var i;
  for(i=0;i<nodePos.length;i++)
  {
    nodes[i]={
    x:[nodePos[i].x], y:[nodePos[i].y], z:[nodePos[i].z],
    text:[nodePos[i].name],
    mode: 'markers',
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

  var edges = new Array();

  for(i=0;i<edgePos.length;i++)
  {
    edges[i]={
    x:[edgePos[i].source.x,edgePos[i].target.x], y:[edgePos[i].source.y,edgePos[i].target.y], z:[edgePos[i].source.z,edgePos[i].target.z],
    mode: 'lines',
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
    data.push(nodes[i]);
  }

  for(i=0;i<edgePos.length;i++)
  {
    data.push(edges[i]);
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