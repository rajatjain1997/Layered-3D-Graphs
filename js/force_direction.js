var d3_force = require('d3-force-3d');
var d3 = require('d3');

function layer_calculate(graph) {
  var layers=1;
  var i;
  var source = new Array();
  var target = new Array();

  for(i=0;i<graph.nodes.length;i++)
  {
    graph.nodes[i].x = 0;
    graph.nodes[i].y = 0;
    graph.nodes[i].fz = 1;
    source[i] = new Array();
    target[i] = new Array();
  }

  for(i=0;i<graph.links.length;i++)
  {
    source[graph.links[i].target-1].push(graph.links[i].source);
    target[graph.links[i].source-1].push(graph.links[i].target);
  }

  var noOfChild = new Array();
  var queue = new Array();

  for(i=0;i<graph.nodes.length;i++)
  {
    noOfChild[i]=0;
    if(source[i].length==0)
    {
      queue.push(graph.nodes[i].id);
    }
  } 

  while(queue.length!=0)
  {
    var ele = queue.pop();
    for(i=0;i<target[ele-1].length;i++)
    {
      noOfChild[target[ele-1][i]-1]++;
      if(graph.nodes[target[ele-1][i]-1].fz<(graph.nodes[ele-1].fz+1))
      graph.nodes[target[ele-1][i]-1].fz=graph.nodes[ele-1].fz+1;
      if(graph.nodes[target[ele-1][i]-1].fz>layers)
          {
            layers=graph.nodes[target[ele-1][i]-1].fz;
          }

      if(noOfChild[target[ele-1][i]-1]==source[target[ele-1][i]-1].length)
      {
        queue.push(target[ele-1][i]);
      }
    }
  }
  return {
    "graph": graph,
    "layers": layers
  }
}

function isolate(force, nodes, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}


function begin_simulation(graph, callback) {
  var layer_info = layer_calculate(graph);
  graph = layer_info.graph;
  var layers = layer_info.layers;
  var simulation = d3_force.forceSimulation().numDimensions(3)
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(1))
  .force("center", d3.forceCenter(0,0));

  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody().strength(-100), graph.nodes, function(d) {return d.fz == iter;}));
    })(iter);
  }

  simulation.nodes(graph.nodes);

  simulation.force("link").links(graph.links);

  simulation.on("end", function() {
    callback(simulation.nodes(), simulation.force("link").links())
  })
  return simulation
}

module.exports = {
  "begin_simulation": begin_simulation
}