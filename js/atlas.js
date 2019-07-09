var loading_screen = pleaseWait({
  logo: "../images/logo.jpg",
  backgroundColor: '#f46d3b',
  loadingHtml: "<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div><p class='loading-message'>Starting Up!</p>"
});

var socket = io('http://' + host.host + ':'+ port);

socket.emit('start', {"data": data.data});

socket.on('log', function(data) {
  log(data.msg);
});

socket.on("neo4j", function(data, callback) {
  loading_screen.finish();
  callback();
  window.location.href = shiny;
});

function log(msg) {
  loading_screen.updateLoadingHtml("<div class='sk-wave'><div class='sk-rect sk-rect1'></div><div class='sk-rect sk-rect2'></div><div class='sk-rect sk-rect3'></div><div class='sk-rect sk-rect4'></div><div class='sk-rect sk-rect5'></div></div><p class='loading-message'>"+msg+"</p>")
}