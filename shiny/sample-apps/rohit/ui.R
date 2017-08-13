library(plotly)
library(shiny)


fluidPage(
  fluidRow(column(4),column(4,textInput("search", "Search", "")),column(4)),
  fluidRow(column(4),column(4,actionButton("enter", "Go!")),column(4)),
  fluidRow(column(6,plotlyOutput("plot",height = "500px")),
  column(6,plotlyOutput("click",height="500px")))
)
