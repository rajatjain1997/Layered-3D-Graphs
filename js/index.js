const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const port = 80;

app.use(express.static("../"));
app.use('/',express.static("../html"))


app.post('/', function(req, res) {
  var data = req.body.data;
  fs.writeFile('../tmp/test.json', data, "utf-8", 4,function(err) {
  	if(err) {	
  		res.send(err);
  	}
  	res.send("Serialized!");
  });
});


app.listen(port, function() {
  console.log('Server listening on http://localhost:' + port);
});