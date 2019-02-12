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
const force_direction = require('./force_direction');

const port = config.get('server').port;
const host = config.get('server').host;
const shiny = config.get('server').plotter_mapping;

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
				data: JSON.stringify({"data": data}),
				host: JSON.stringify({"host": host}),
				shiny: shiny
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
			setTimeout(function() {
				done("Socket Unresponsive");
			}, 5000);
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

	neoQueue.create('neo4j', {
		request: "Match (n) detach delete n",
		params: {}
	}).priority(-15).removeOnComplete( true ).save();
	nodesprocessed = 0;
	edgesprocessed = 0;

	function neo4j_update(nodePos, edgePos) {
		log("Queuing nodes to database");
		for(var nodeitr = 0; nodeitr<nodePos.length; nodeitr++) {
			neoQueue.create('neo4j', {
				request: "CREATE (n:Node {x: $x, y:$y, z:$fz, id: $id, index: $index, name: $name})",
				params: nodePos[nodeitr]
			}).attempts(5).removeOnComplete( true ).save();
			nodesprocessed++;
		}

		neoQueue.create('neo4j', {
			request: "CREATE INDEX ON :Node(id)",
			params: {}
		}).removeOnComplete( true ).save();

		log("Queuing edges to database");
		for(var edgeitr = 0; edgeitr< edgePos.length; edgeitr++) {
			var source = edgePos[edgeitr].source.id;
			var target = edgePos[edgeitr].target.id;
			neoQueue.create('neo4j', {
				request: "Match (m:Node {id: $source}), (n:Node {id: $target}) create (m)-[r:pre]->(n)",
				params: {"source": source, "target": target}
			}).attempts(5).removeOnComplete( true ).save();
			edgesprocessed++;
		}

		neoQueue.create('neo4j', {
			end: true
		}).removeOnComplete( true ).attempts(50).save();

	}

	function log(msg) {
		socket.emit('log', {"msg": msg});
	}

	socket.on('start', function(data) {
		log("Reading Data");
		fs.readFile("../data/"+data.data+".json", 'utf-8', function(error, graph) {
			if (error) throw error;
			log("Calculating Force Directed Layout");
			force_direction.begin_simulation(JSON.parse(graph), neo4j_update);
		});
	});
});

server.listen(port, function() {
  console.log('Server listening on http://' + host +':' + port);
});