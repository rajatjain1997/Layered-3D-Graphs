library(plotly)
library(shiny)

neo4j.json <- rjson::fromJSON(file = "./../../../config/neo4j.json")
  graph=RNeo4j::startGraph(paste(substr(neo4j.json$bolt,8,nchar(neo4j.json$bolt)),":7474/db/data", sep=""), username=neo4j.json$username, password=neo4j.json$password)

nodes.text=(unlist(RNeo4j::getNodes(graph,"MATCH (p:Node) RETURN p.name")))

fluidPage(
  fluidRow(column(12,align = "center",selectInput("search","",choices=nodes.text), actionButton("enter", "Search"))),
  fluidRow(column(6,plotlyOutput("plot",height = "500px")),
  column(6,plotlyOutput("click",height="500px"))),
  fluidRow(column(12, align = "center", p("Click on any node to search for its subgraph! Alternatively, you can use the search bar above.")))
)
