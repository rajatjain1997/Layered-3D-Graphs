const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const neo4j = require('neo4j-driver').v1;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const port = 80;

const driver = neo4j.driver('bolt://192.168.99.100:7687', neo4j.auth.basic("neo4j", "neo"));
const session = driver.session();
var nodesprocessed = 0;
var edgesprocessed = 0;

app.use(express.static("../"));
app.use('/',express.static("../html"));


app.post('/', function(req, res) {
  var data = req.body.data;
  fs.writeFile('../tmp/test.json', data, "utf-8", 4,function(err) {
  	if(err) {	
  		res.send(err);
  	}
  	res.send("Serialized!");
  });
});

app.post('/neo4j/reset', function(req, res) {
	var result = session.run("Match (n) detach delete n");
	result.then(r => {res.send("Database Cleared!");});
	nodesprocessed = 0;
	edgesprocessed = 0;
});

app.post('/neo4j/node', function(req, res) {
	var nodes = req.body.nodes;
	var result = session.run("CREATE (n:Node {x: $x, y:$y, z:$fz, id: $id, index: $index, name: $name})", node);
	result.then(r=> {res.send("Node added!");});
	nodesprocessed++;
});

app.post('/neo4j/edge', function(req, res) {
	var source = req.body.edge.source.id;
	var target = req.body.edge.target.id;
	var result = session.run("Match (m:Node {id: $source}), (n:Node {id: $target}) create (m)-[r:pre]->(n)", {"source": source, "target": target});
	result.then(r=> {res.send("Edge added!");});
	edgesprocessed++;
});

app.post('/neo4j/index', function(req, res) {
	var result = session.run("CREATE INDEX ON :Node(id)");
	result.then(r=> {res.send("Index created!");});
})

app.get('/neo4j', function(req, res) {
	res.send({"Nodes": nodesprocessed, "Edges": edgesprocessed});
})

app.listen(port, function() {
  console.log('Server listening on http://localhost:' + port);
});