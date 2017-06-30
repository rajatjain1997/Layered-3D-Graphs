var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3_force.forceSimulation().numDimensions(3)
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(10));

d3.json("../data/smalldep.json", function(error, graph) {
  if (error) throw error;
  var layers = 3;

  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody(), graph.nodes, function(d) {return d.group == iter;}));
      simulation = simulation.force("layerconstraint" + iter, isolate(d3_force.forceZ(iter*10).strength(2), graph.nodes, function(d) {return d.group == iter;}));
    })(iter);
  }

  simulation
    .nodes(graph.nodes);

  simulation.force("link")
    .links(graph.links);
});

simulation.on("end", function() {
  console.log(simulation.nodes());
});

function isolate(force, nodes, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}