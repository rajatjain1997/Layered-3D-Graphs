const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const neo4j = require('neo4j-driver').v1;
const config = require('nodejs-config') (path.resolve("../"));
const redis = require('redis');
const kue = require('kue');
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = config.get('server').port;

//Defining Neo4J counters

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

//Defining Redis & Kue

const redisClient = redis.createClient({
	host: config.get('redis').host,
	port: config.get('redis').port
});

var neoQueue = kue.createQueue({
	redis: {
		port: config.get('redis').port,
		host: config.get('redis').host
	}
});

kue.app.listen(config.get('server').kue);

//Routes

app.get('/', function(req, res) {
	var data = "meta-academy";
	if(req.query.data) {
		data = req.query.data;
	}
	redisClient.flushdb(function(err,done) {
		if(!err) {
			res.render('index', {
				port: port,
				data: data
			});
		}
	});
});

app.get('/neo4j', function(req, res) {
	res.send({"Nodes": nodesprocessed, "Edges": edgesprocessed});
});

//Socket Configuration

io.on('connection', function(socket) {

	let driver = neo4j.driver(config.get('neo4j').bolt, neo4j.auth.basic(config.get('neo4j').username, config.get('neo4j').password));
	let session = driver.session();

	neoQueue.process('neo4j', function(job, done) {
		if(job.data.end) {
			session.close();
			driver.close();
			socket.emit('neo4j', {}, function(err) {
				if(err) {
					done(err);
				}
				done();
			});
			return;
		}
		session.run(job.data.request, job.data.params)
			.then(r => {
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	socket.on('/neo4j/reset', function(data) {
		neoQueue.create('neo4j', {
			request: "Match (n) detach delete n",
			params: {}
		}).priority(-15).removeOnComplete( true ).save();
		nodesprocessed = 0;
		edgesprocessed = 0;
	});
	socket.on('/neo4j/node', function(data) {

		neoQueue.create('neo4j', {
			request: "CREATE (n:Node {x: $x, y:$y, z:$fz, id: $id, index: $index, name: $name})",
			params: data.node
		}).attempts(5).removeOnComplete( true ).save();
		nodesprocessed++;
	});
	socket.on('/neo4j/edge', function(data) {
		var source = data.edge.source.id;
		var target = data.edge.target.id;
		neoQueue.create('neo4j', {
			request: "Match (m:Node {id: $source}), (n:Node {id: $target}) create (m)-[r:pre]->(n)",
			params: {"source": source, "target": target}
		}).attempts(5).removeOnComplete( true ).save();
		edgesprocessed++;
	});
	socket.on('/neo4j/index', function(data) {
		neoQueue.create('neo4j', {
			request: "CREATE INDEX ON :Node(id)",
			params: {}
		}).removeOnComplete( true ).save();
	});
	socket.on('/neo4j/endtransmission', function(data) {
		neoQueue.create('neo4j', {
			end: true
		}).removeOnComplete( true ).save();
	});
});

server.listen(port, function() {
  console.log('Server listening on http://localhost:' + port);
});