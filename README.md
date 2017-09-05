# Layered-3D-Graphs

Layered-3D-Graphs plots 3D force directed and layered graphs on the basis of a **pre-requisite of** relationship between nodes.

## Introduction

The graph is rendered using the following sequence of steps:

1. Read the data and initialize each node to **(x = 0, y = 0, layer = 1)**, where layer is plotted on the z-axis.

2. Calculate the layer of each node using the "pre-requisite of" relationship. Each node has a layer assigned to it such that, 

	a. No two nodes related by an edge are on the same level.

	b. For each node at layer n, there exists at least one node at layer n-1 which is related to the aforementioned node.

3. Apply electrostatic repulsive forces between each node in a particular layer and give each edge a spring force.

4. Store the graph in a database, so that if the same dataset is needed, calculations need not be done.

5. Render the graph with the coordinates (x, y, layer) calculated in step 3.

Layered-3D-Graphs can scale to huge datasets easily, with most of the time taken only in serializing the data to the database, and constructing indices.

## Installation

Layered-3D-Graph is available as a docker image. The following are the ports used by the image:

Port | Task
---- | -------------------
8000 | Dataset processing
4000 | Graph Plotter

To run the image, use:

	docker run -p 4000:4000 -p 8000:8000 --volume=$HOME/Layered-3D-Graphs/data:/code/data --name=layered3dgraphs layered3dgraphs

This binds the data volume of the container to the host machine to allow for easy input of data.

## Creating/Preparing Data

Layered-3D-Graphs accepts JSON format graphs, with the key **"nodes"** holding an array of all vertix objects and **"links"** holding an array denoting the relationships.

Each node in **nodes** should have the following keys:
- id = *Unique ID for the node*
- name = *Name of the node*

Each relationship in **links** should have the following keys:
- source = *The node from which the link orginates*
- destination = *The node on which the link ends*

Once prepared, the data file can be placed in the docker container's **data** volume and can be plotted by visiting the web interface at

	localhost:8000/?data="FILE_NAME"

Layered-3D-Graphs has been tested with more than 30000 nodes and 70000 edges! It's easy to plot big graphs!

## Backend Design

The backend is written keeping big graphs in mind, and employs the use of nodejs, redis, neo4j and shiny. Each component achieves separate purposes, as described below.

- **Nodejs:** The main page is hosted on an express app, which does all the calculations related to forces on the graph on the client machine and sends the calculated information to the server. This information is sent through sockets as they maintain persistent connections and are thus able to consistently post messages to the server without the overhead of sending the headers and waiting for the response per request. 	

- **Redis:** Loading all the data in neo4j takes time as queries on databases are slower than the speed at which the server is receiving the database insertion requests. Kue is used to maintain an asynchronous queue on redis which acts as a buffer from the server where queries are stored until neo4j is ready to execute them.

- **Neo4j:** Neo4j is the database that is used to store persistent information about the last graph calculated by Layered-3D-Graphs. This helps in fast access of the last graph generated any number of times at the cost of the initial time taken in order to construct the database.

- **Shiny:** The shiny server uses the power of plotly to batch plot the entire graph present in the database. It also hosts the search engine and the entire UI of the graph rendering page, and if directly visited skips the recalculations.

## UI

Once plotting is completed, Layered-3D-Graphs offers a simple web-interface which allows the user to search and plot the dependecies and parents of each node in the graph by either doing a **full test search** or by **clicking any node in the graph**. The results, once computed, are available in a sub-graph.

Both the graphs and the subgraphs are fully interactive and support search functionality.

The graph is persistently stored and can be generated again without recalculations by visiting

	localhost:4000

## Use Cases



## License

All Layered-3D-Graphs source code is made available under the terms of the GNU Affero Public License (GNU AGPLv3).