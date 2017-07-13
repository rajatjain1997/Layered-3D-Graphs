var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3_force.forceSimulation().numDimensions(3)
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(1))
  .force("center", d3.forceCenter(0,0));
var timer;
d3.json("../data/debian.json", function(error, graph) {
  if (error) throw error;

  var layers=1;
  var i;
  // for(i=0;i<graph.links.length;i++)
  // {
  //   if(graph.nodes[graph.links[i].source-1].fz>=graph.nodes[graph.links[i].target-1].fz)
  //     {
  //       graph.nodes[graph.links[i].target-1].fz=graph.nodes[graph.links[i].source-1].fz+1;
  //       if(graph.nodes[graph.links[i].target-1].fz>layers)
  //       layers=graph.nodes[graph.links[i].target-1].fz;
  //     }
  //     for(j=0;j<graph.links.length;j++)
  //     {
  //       if(graph.nodes[graph.links[j].source-1].fz>=graph.nodes[graph.links[j].target-1].fz)
  //         graph.nodes[graph.links[j].target-1].fz=graph.nodes[graph.links[j].source-1].fz+1;
  //       if(graph.nodes[graph.links[j].target-1].fz>layers)
  //       layers=graph.nodes[graph.links[j].target-1].fz;
  //     }   
  // }
  log("Layering Algorithm Initiated...");

    var source = new Array();
    var target = new Array();

    for(i=0;i<graph.nodes.length;i++)
    {
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

  log("No. of layers are: "+layers);
  
  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody().strength(-100), graph.nodes, function(d) {return d.fz == iter;}));
    })(iter);
  }

  simulation
    .nodes(graph.nodes);

  simulation.force("link")
    .links(graph.links);
  timer = new Date();
  log("Beginning force calcuations and rendering");
});


simulation.on("end", function() {
  timer= new Date()-timer;
  log("Force calculations took "+timer/1000+" seconds. Rest of the time was spent in rendering.");
  console.log("Forces done in " + timer);
  var nodePos=simulation.nodes();
  var edgePos=simulation.force("link").links();  

  $.post("http://localhost:80/neo4j/reset",{});
  for(var nodeitr = 0; nodeitr<nodePos.length; nodeitr++) {
    // console.log(nodePos[nodeitr]);
    $.post("http://localhost:80/neo4j/node", {"node": nodePos[nodeitr]});
  }

  $.post("http://localhost:80/neo4j/index", {});

  for(var edgeitr = 0; edgeitr< edgePos.length; edgeitr++) {
    $.post("http://localhost:80/neo4j/edge", {"edge": edgePos[edgeitr]});
  }

  //Old posting to server serialization
  // $.post("http://localhost:80",
  //   {data: "{\"nodes\":"+JSON.stringify(nodePos, null, 4)+",\"links\":"+ JSON.stringify(edgePos, null, 4)+"}"}
  // );

  //Plotlty plots
  // //console.log(simulation.force("link").links());
  // var nodes = new Array();

  // var i;
  // for(i=0;i<nodePos.length;i++)
  // {
  //   nodes[i]={
  //   x:[nodePos[i].x], y:[nodePos[i].y], z:[nodePos[i].z],
  //   text:[nodePos[i].name],
  //   mode: 'markers',
  //   line: {
  //     color: 10, 
  //     width: 2
  //   },
  //   marker: {
  //     size: 5,
  //     line: {
  //     color: 'rgba(217, 217, 217, 0.14)',
  //     width: 0.5},
  //     opacity: 0.8},
  //   type: 'scatter3d'
  // };
  // }

  // var edges = new Array();

  // for(i=0;i<edgePos.length;i++)
  // {
  //   edges[i]={
  //   x:[edgePos[i].source.x,edgePos[i].target.x], y:[edgePos[i].source.y,edgePos[i].target.y], z:[edgePos[i].source.z,edgePos[i].target.z],
  //   mode: 'lines',
  //   line: {
  //     color: 10, 
  //     width: 2
  //   },
  //   marker: {
  //     size: 5,
  //     line: {
  //     color: 8,
  //     width: 0.5},
  //     opacity: 0.8},
  //   type: 'scatter3d'
  // };
  // }
  // var data = new Array();
  
  // for(i=0;i<nodePos.length;i++)
  // {
  //   data.push(nodes[i]);
  // }

  // for(i=0;i<edgePos.length;i++)
  // {
  //   data.push(edges[i]);
  // }
  
  // var layout = {margin: {
  //   l: 0,
  //   r: 0,
  //   b: 0,
  //   t: 0
  //   }};
  // Plotly.newPlot('myDiv', data, layout);
});

function isolate(force, nodes, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}

function log(msg) {
  d3.select("#log").append("p").text(msg);
}