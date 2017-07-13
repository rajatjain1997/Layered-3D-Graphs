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

edge.x=c(rbind(edge.source.x,edge.target.x,rep('NA',length(edge.source.x))))
edge.y=c(rbind(edge.source.y,edge.target.y,rep('NA',length(edge.source.x))))
edge.z=c(rbind(edge.source.z,edge.target.z,rep('NA',length(edge.source.x))))

queryTest <- paste('MATCH p=()-[*0..]->(n:Node {id:"22914"})-[*0..]->() return p',sep="")
paths <- RNeo4j::getPaths(graph,queryTest)

nodes.dataFrame <- data.frame(x=nodes.x,y=nodes.y,z=nodes.z,name=nodes.text,id=nodes.id)
edges.dataFrame <- data.frame(x=nodes.x,y=nodes.y,z=nodes.z,name=nodes.text,id=nodes.id)

ui <- fluidPage(
  textInput("search", "Search", ""),
  actionButton("enter", "Go!"),
  plotlyOutput("plot"),
  plotlyOutput("click")
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
    action <- 0
    if(action<input$enter) {
      search <- input$search
      action <- input$enter + 1
    }
    if ((is.null(d) || is.null(d$key)) && is.null(search)){
      plot_ly(x=0,y=0,z=0,type="scatter3d",mode='markers',marker=list(size=5,color='black')) 
    }else if (!(is.null(d) || is.null(d$key))){
      pathQuery <- paste('MATCH p=()-[*0..]->(n:Node {id:"',as.character(d$key),'"})-[*0..]->() return p',sep="")
      path <- RNeo4j::getPaths(graph,pathQuery)
      nodes.path <- lapply(path,nodes)
      
      plotlyObject = plot_ly(x=0, y=0, z=0, type="scatter3d", marker=list(size=5,color='red'), mode='lines+markers')
      count = 1
      xValues <- c()
      yValues <- c()
      zValues <- c()
  
      while(count <= length(nodes.path)){
        listNodesX <- unlist(lapply(nodes.path[[count]],'[[','x'))
        listNodesY <- unlist(lapply(nodes.path[[count]],'[[','y'))
        listNodesZ <- unlist(lapply(nodes.path[[count]],'[[','z'))
        if(length(listNodesX)>1){  
          xValues <- c(xValues,'NA',listNodesX)
          yValues <- c(yValues,'NA',listNodesY)
          zValues <- c(zValues,'NA',listNodesZ)
        }
        count=count+1
      }
      
      plotlyObject <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode='lines+markers',  marker= list(size=2,color='red'), line = list(color='black'))
    } else {
      pathQuery <- paste('MATCH p=()-[*0..]->(n:Node {name:"',as.character(search),'"})-[*0..]->() return p',sep="")
      
      path <- RNeo4j::getPaths(graph,pathQuery)
      nodes.path <- lapply(path,nodes)
      
      plotlyObject = plot_ly(x=0, y=0, z=0, type="scatter3d", marker=list(size=5,color='red'), mode='lines+markers')
      count = 1
      xValues <- c()
      yValues <- c()
      zValues <- c()
      
      while(count <= length(nodes.path)){
        listNodesX <- unlist(lapply(nodes.path[[count]],'[[','x'))
        listNodesY <- unlist(lapply(nodes.path[[count]],'[[','y'))
        listNodesZ <- unlist(lapply(nodes.path[[count]],'[[','z'))
        if(length(listNodesX)>1){  
          xValues <- c(xValues,'NA',listNodesX)
          yValues <- c(yValues,'NA',listNodesY)
          zValues <- c(zValues,'NA',listNodesZ)
        }
        count=count+1
      }
      
      plotlyObject <- plot_ly(x = xValues, y = yValues, z = zValues, type = "scatter3d", mode='lines+markers',  marker= list(size=2,color='red'), line = list(color='black'))
      
    }
  })
}

shinyApp(ui, server)