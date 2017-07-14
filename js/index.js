const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const neo4j = require('neo4j-driver').v1;
const config = require('nodejs-config') (path.resolve("../"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const port = 80;

const driver = neo4j.driver(config.get('neo4j').bolt, neo4j.auth.basic(config.get('neo4j').username, config.get('neo4j').password));
const session = driver.session();
var nodesprocessed = 0;
var edgesprocessed = 0;


app.use(express.static("../"));
app.use('/',express.static("../views"));
app.engine('.html', require('ejs').__express);
app.set('views',  path.resolve("../html"));
app.set('view engine', 'html');

app.get('/', function(req, res) {
	res.render('index', {
		port: port,
		data: req.query.data
	});
});

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
	var node = req.body.node;
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