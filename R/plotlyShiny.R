library(plotly)
library(shiny)
library("RNeo4j")
library(rjson)

neo4j.json <- rjson::fromJSON(file = "./../config/neo4j.json")
graph=RNeo4j::startGraph(paste(substr(neo4j.json$bolt,8,nchar(neo4j.json$bolt)),":7474/db/data", sep=""), username=neo4j.json$username, password=neo4j.json$password)

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

edge.x=c(rbind(edge.source.x,edge.target.x,rep('NA',length(edge.source.x))))
edge.y=c(rbind(edge.source.y,edge.target.y,rep('NA',length(edge.source.x))))
edge.z=c(rbind(edge.source.z,edge.target.z,rep('NA',length(edge.source.x))))

nodes.dataFrame <- data.frame(x=nodes.x,y=nodes.y,z=nodes.z,name=nodes.text,id=nodes.id)
edges.dataFrame <- data.frame(x=nodes.x,y=nodes.y,z=nodes.z,name=nodes.text,id=nodes.id)

display <- ""
action <- 0

ui <- fluidPage(
  fluidRow(column(4),column(4,textInput("search", "Search", "")),column(4)),
  fluidRow(column(4),column(4,actionButton("enter", "Go!")),column(4)),
  fluidRow(column(6,plotlyOutput("plot",height = "500px")),
  column(6,plotlyOutput("click",height="500px")))
)

server <- function(input, output, session) {
  
  output$plot <- renderPlotly({
    object1 <- plot_ly(x = nodes.x, y = nodes.y, z = nodes.z, type = "scatter3d", mode='markers', hoverinfo="text+z", marker= list(size=2,color='red'), text=nodes.text, key=nodes.id)
    object2 <- plot_ly(x = edge.x, y = edge.y, z = edge.z,type="scatter3d" ,mode='lines', hoverinfo='none', opacity=0.2, line=list(color='cyan'))
    combinedObj<-subplot(object1,object2)
    })
  
  output$click <- renderPlotly({
    d <- event_data("plotly_click")
    search <- NULL
    input$enter
    if(action<input$enter) {
      search <- input$search
      action <<- input$enter
    }
    if ((is.null(d) || is.null(d$key)) && is.null(search)){
      plot_ly(x=0,y=0,z=0,type="scatter3d",mode='markers',marker=list(size=5,color='black')) 
    }else if (!(is.null(d) || is.null(d$key)) && display != d$key){
      display <<- d$key
      pathQuery <- paste('MATCH p=()-[*0..]->(n:Node {id:',as.character(d$key),'})-[*0..]->() return p',sep="")
      path <- RNeo4j::getPaths(graph,pathQuery)
      nodes.path <- lapply(path,nodes)
      
      plotlyObject = plot_ly(x=0, y=0, z=0, type="scatter3d", marker=list(size=5,color='red'), mode='lines+markers')
      count = 1
      xValues <- c()
      yValues <- c()
      zValues <- c()
      nodes.names <- c()
      nodes.id <- c()
      
      while(count <= length(nodes.path)){
        listNodesX <- unlist(lapply(nodes.path[[count]],'[[','x'))
        listNodesY <- unlist(lapply(nodes.path[[count]],'[[','y'))
        listNodesZ <- unlist(lapply(nodes.path[[count]],'[[','z'))
        names <- unlist(lapply(nodes.path[[count]],'[[','name'))
        ids <- unlist(lapply(nodes.path[[count]],'[[','id'))
        if(length(listNodesX)>1){  
          xValues <- c(xValues,'NA',listNodesX)
          yValues <- c(yValues,'NA',listNodesY)
          zValues <- c(zValues,'NA',listNodesZ)
          nodes.names <- c(nodes.names,'NA',names)
          nodes.id <- c(nodes.id,'NA',ids)
        }
        count=count+1
      }
      
      plotlyObject1 <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode ='markers', hoverinfo = 'text+z', marker = list(size=2,color='red'), text = nodes.names, key = nodes.id)
      plotlyObject2 <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode ='lines', hoverinfo = 'none', line = list(color='yellow'))
      subplot(plotlyObject1,plotlyObject2)
    } else if (display != search){
      display <<- search
      pathQuery <- paste('MATCH p=()-[*0..]->(n:Node {name:"',as.character(search),'"})-[*0..]->() return p',sep="")
      
      path <- RNeo4j::getPaths(graph,pathQuery)
      nodes.path <- lapply(path,nodes)
      
      plotlyObject = plot_ly(x=0, y=0, z=0, type="scatter3d", marker=list(size=5,color='red'), mode='lines+markers')
      count = 1
      xValues <- c()
      yValues <- c()
      zValues <- c()
      nodes.names <- c()
      nodes.id <- c()
      
      while(count <= length(nodes.path)){
        listNodesX <- unlist(lapply(nodes.path[[count]],'[[','x'))
        listNodesY <- unlist(lapply(nodes.path[[count]],'[[','y'))
        listNodesZ <- unlist(lapply(nodes.path[[count]],'[[','z'))
        names <- unlist(lapply(nodes.path[[count]],'[[','name'))
        ids <- unlist(lapply(nodes.path[[count]],'[[','id'))
        if(length(listNodesX)>1){  
          xValues <- c(xValues,'NA',listNodesX)
          yValues <- c(yValues,'NA',listNodesY)
          zValues <- c(zValues,'NA',listNodesZ)
          nodes.names <- c(nodes.names,'NA',names)
          nodes.id <- c(nodes.id,'NA',ids)
        }
        count=count+1
      }
      
      plotlyObject1 <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode ='markers', hoverinfo = 'text+z', marker = list(size=2,color='red'), text = nodes.names, key = nodes.id)
      plotlyObject2 <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode ='lines', hoverinfo = 'none', line = list(color='yellow'))
      subplot(plotlyObject1,plotlyObject2)
    }
  })
}

runApp(shinyApp(ui, server))