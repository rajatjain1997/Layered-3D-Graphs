var loading_screen = pleaseWait({
  logo: "../images/logo.jpg",
  backgroundColor: '#f46d3b',
  loadingHtml: "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div><p class='loading-message'>Starting Up!</p>"
});

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3_force.forceSimulation().numDimensions(3)
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(1))
  .force("center", d3.forceCenter(0,0));
var timer;
d3.json("../data/"+data+".json", function(error, graph) {
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
  
  for(var iter = 1; iter<=layers; iter++) {
    (function(iter) {
      simulation = simulation.force("layerrepel" + iter, isolate(d3.forceManyBody().strength(-100), graph.nodes, function(d) {return d.fz == iter;}));
    })(iter);
  }

  simulation
    .nodes(graph.nodes);

  simulation.force("link")
    .links(graph.links);
  log("Beginning force calcuations and rendering");
});


simulation.on("end", function() {
  log("Queuing Up requests to neo4j");
  var nodePos=simulation.nodes();
  var edgePos=simulation.force("link").links();  

  var socket = io('http://localhost:'+port);

  socket.emit('/neo4j/reset', {});

  for(var nodeitr = 0; nodeitr<nodePos.length; nodeitr++) {
    socket.emit('/neo4j/node', {"node": nodePos[nodeitr]});
  }

  socket.emit('/neo4j/index', {});

  for(var edgeitr = 0; edgeitr< edgePos.length; edgeitr++) {
    socket.emit('/neo4j/edge', {"edge": edgePos[edgeitr]});
  }

  loading_screen.finish();
});

function isolate(force, nodes, filter) {
  var initialize = force.initialize;
  force.initialize = function() { initialize.call(force, nodes.filter(filter)); };
  return force;
}

function log(msg) {
  loading_screen.updateLoadingHtml("<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div><p class='loading-message'>"+msg+"</p>")
}