const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const neo4j = require('neo4j-driver').v1;
const config = require('nodejs-config') (path.resolve("../"));
const kue = require('kue');
const server = require('http').Server(app);
const io = require('socket.io')(server);

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

//Socket Configuration

io.on('connection', function(socket) {

	neoQueue.process('neo4j', function(job, done) {
		if(job.data.end) {
			socket.emit('neo4j', {}, function() {
				done();
			});
			return;
		}
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

	socket.on('/neo4j/reset', function(data) {
		neoQueue.create('neo4j', {
			request: "Match (n) detach delete n",
			params: {}
		}).priority(-15).save();
		nodesprocessed = 0;
		edgesprocessed = 0;
	});
	socket.on('/neo4j/node', function(data) {
		neoQueue.create('neo4j', {
			request: "CREATE (n:Node {x: $x, y:$y, z:$fz, id: $id, index: $index, name: $name})",
			params: data.node
		}).save();
		nodesprocessed++;
	});
	socket.on('/neo4j/edge', function(data) {
		var source = data.edge.source.id;
		var target = data.edge.target.id;
		neoQueue.create('neo4j', {
			request: "Match (m:Node {id: $source}), (n:Node {id: $target}) create (m)-[r:pre]->(n)",
			params: {"source": source, "target": target}
		}).save();
		edgesprocessed++;
	});
	socket.on('/neo4j/index', function(data) {
		neoQueue.create('neo4j', {
			request: "CREATE INDEX ON :Node(id)",
			params: {}
		}).save();
	});
	socket.on('/neo4j/endtransmission', function(data) {
		neoQueue.create('neo4j', {
			end: true
		}).save();
	});
});


app.get('/neo4j', function(req, res) {
	res.send({"Nodes": nodesprocessed, "Edges": edgesprocessed});
});

server.listen(port, function() {
  console.log('Server listening on http://localhost:' + port);
});