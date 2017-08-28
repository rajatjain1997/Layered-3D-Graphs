# Layered-3D-Graphs

Layered-3D-Graphs plots 3D force directed and layered graphs on the basis of a **pre-requisite of** relationship between nodes.

The graph is rendered using the following sequence of steps:

1. Read the data and initialize each node to (x = 0, y = 0, layer = 1), where layer is plotted on the z-axis.
2. Calculate the layer of each node using the "pre-requisite of" relationship. Each node has a layer assigned to it such that, 
	a. No two nodes related by an edge are on the same level.
	b. For each node at layer n, there exists at least one node at layer n-1, which is related to the aformentioned node.
3. Apply electrostatic repulsive forces between each node in a particular layer and give each edge a spring force.
4. Store the graph in a database, so that if the same dataset is needed, calculations need not be done.
5. Render the graph with the coordinates (x, y, layer) calculated in step 3.

Layered-3D-Graphs can scale to huge datasets easily, with most of the time taken only in serializing the data to the database, and constructing indices.

## Installation

## Creating/Preparing Data

Layered-3D-Graphs accepts JSON format graphs, with the key **"nodes"** holding an array of all vertix objects and **"links"** holding an array denoting the relationships.

Each node in **nodes** should have the following keys:
- id = *Unique ID for the node*
- name = *Name of the node*

Each relationship in **links* should have the following keys:
- source = *The node from which the link orginates*
- destination = *The node on which the link ends*

Layered-3D-Graphs has been tested with more than 30000 nodes and 70000 edges! It should not be a problem to big graphs!

## Backend Design