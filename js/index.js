const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const neo4j = require('neo4j-driver').v1;
const config = require('nodejs-config') (path.resolve("../"));
const kue = require('kue');

const port = config.get('server').port;

//Defining Neo4J connections

const driver = neo4j.driver(config.get('neo4j').bolt, neo4j.auth.basic(config.get('neo4j').username, config.get('neo4j').password));
var nodesprocessed = 0;
var edgesprocessed = 0;

//Defining Express server

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("../"));
app.use('/',express.static("../views"));
app.engine('.html', require('ejs').__express);
app.set('views',  path.resolve("../html"));
app.set('view engine', 'html');

//Defining Redis Kue

kue.app.listen(config.get('server').kue);

var neoQueue = kue.createQueue();

neoQueue.process('neo4j', function(job, done) {
	var session = driver.session();
	session.run(job.data.request, job.data.params)
		.then(r => {
			session.close();
			done();
		})
		.catch(err => {
			session.close();
			done(err);
		});
});

//Routes

app.get('/', function(req, res) {
	var data = "meta-academy";
	if(req.query.data) {
		data = req.query.data;
	}
	res.render('index', {
		port: port,
		data: data
	});
});

app.post('/neo4j/reset', function(req, res) {
	neoQueue.create('neo4j', {
		driver: driver.session,
		request: "Match (n) detach delete n",
		params: {}
	}).save();
	res.send("Job queued!");
	nodesprocessed = 0;
	edgesprocessed = 0;
});

app.post('/neo4j/node', function(req, res) {
	var node = req.body.node;
	neoQueue.create('neo4j', {
		driver: driver.session,
		request: "CREATE (n:Node {x: $x, y:$y, z:$fz, id: $id, index: $index, name: $name})",
		params: node
	}).save();
	res.send("Job queued!");
	nodesprocessed++;
});

app.post('/neo4j/edge', function(req, res) {
	var source = req.body.edge.source.id;
	var target = req.body.edge.target.id;
	neoQueue.create('neo4j', {
		driver: driver.session,
		request: "Match (m:Node {id: $source}), (n:Node {id: $target}) create (m)-[r:pre]->(n)",
		params: {"source": source, "target": target}
	}).save();
	res.send("Job queued!");
	edgesprocessed++;
});

app.post('/neo4j/index', function(req, res) {
	neoQueue.create('neo4j', {
		driver: driver.session,
		request: "CREATE INDEX ON :Node(id)",
		params: {}
	}).save();
	res.send("Job queued!");
})

app.get('/neo4j', function(req, res) {
	res.send({"Nodes": nodesprocessed, "Edges": edgesprocessed});
})

app.listen(port, function() {
  console.log('Server listening on http://localhost:' + port);
});