library(plotly)
library(shiny)


fluidPage(
  textInput("search", "Search", ""),
  actionButton("enter", "Go!"),
  plotlyOutput("plot"),
  plotlyOutput("click")
)

