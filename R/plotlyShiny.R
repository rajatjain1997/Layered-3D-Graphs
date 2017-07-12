library(plotly)
library(shiny)
library("RNeo4j")

graph=RNeo4j::startGraph("192.168.99.100:7474/db/data",username="neo4j",password="neo")

nodes.x=as.numeric(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.x")))
nodes.y=as.numeric(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.y")))
nodes.z=as.numeric(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.z")))
nodes.text=(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.name")))
nodes.id=(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.id")))

edge.source.x=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN p.x")))
edge.source.y=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN p.y")))
edge.source.z=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN p.z")))
edge.target.x=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN a.x")))
edge.target.y=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN a.y")))
edge.target.z=as.numeric(unlist(RNeo4j::getRels(graph,"MATCH (p:Node)-[:pre]->(a:Node) RETURN a.z")))

edge.x=c(rbind(edge.source.x,edge.target.x))
edge.y=c(rbind(edge.source.y,edge.target.y))
edge.z=c(rbind(edge.source.z,edge.target.z))

dataFrame =data.frame(x=nodes.x,y=nodes.y,z=nodes.z,name=nodes.text,id=nodes.id)

ui <- fluidPage(
  plotlyOutput("plot"),
  verbatimTextOutput("hover"),
  verbatimTextOutput("click")
)

server <- function(input, output, session) {
  
  output$plot <- renderPlotly({
    object1 <- plot_ly(x = nodes.x, y = nodes.y, z = nodes.z, type = "scatter3d", mode='markers', hoverinfo="text+z", marker= list(size=2,color='red'), text=nodes.text, key=nodes.id)
    object2 <- plot_ly(x = edge.x, y = edge.y, z = edge.z,type="scatter3d" ,mode='lines', hoverinfo='none', opacity=0.2, line=list(color='cyan'))
    combinedObj<-subplot(object1,object2)
    })
  
  #output$hover <- renderPrint({
  #  d <- event_data("plotly_hover")
  #  if (is.null(d)) "Hover events appear here (unhover to clear)" else d
  #})
  
  output$click <- renderPrint({
    d <- event_data("plotly_click")
    if (is.null(d) || is.null(d$key)) "Click events appear here (double-click to clear)" else {
      pathQuery <- paste('MATCH p=()-[*0..]->(n:Node {id:"',as.character(d$key),'"})-[*0..]->() return p',sep="")
      path <- RNeo4j::getPaths(graph,pathQuery)
      print(path)
    }
    })
  
}

shinyApp(ui, server)