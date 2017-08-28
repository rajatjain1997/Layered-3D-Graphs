FROM ubuntu:14.04

RUN apt-get update

#NodeJS
RUN apt-get -y install python-software-properties
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN apt-get -y install nodejs

#Redis
RUN apt-get -y install redis-server

#Java
RUN apt-get -y install openjdk-8-jre

#Neo4J
RUN wget -O - https://debian.neo4j.org/neotechnology.gpg.key | sudo apt-key add -
RUN echo 'deb https://debian.neo4j.org/repo stable/' | sudo tee /etc/apt/sources.list.d/neo4j.list
RUN apt-get update
RUN apt-get -y install neo4j

#R#
RUN apt-get -y install r-base
RUN apt-get -y install r-base-dev

#R packages#
RUN apt-get -y install build-essential libcurl4-gnutls-dev libxml2-dev libssl-dev
RUN su - -c "R -e \"install.packages('devtools', repos='http://cran.rstudio.com/')\""
RUN su - -c "R -e \"install.packages('rjson', repos = 'http://cran.rstudio.com/')\""
RUN su - -c "R -e \"install.packages('shiny', repos = 'http://cran.rstudio.com/')\""
RUN su - -c "R -e \"devtools::install_github('ropensci/plotly')\""
RUN su - -c "R -e \"devtools::install_github('nicolewhite/RNeo4j')\""

#Shiny Server#
RUN apt-get -y install gdebi-core
RUN wget https://download3.rstudio.org/ubuntu-12.04/x86_64/shiny-server-1.5.3.838-amd64.deb
RUN gdebi shiny-server-1.5.3.838-amd64.deb
ADD ./config/shiny-server.conf /etc/shiny-server/shiny-server.conf


RUN apt-get -y install openjdk-8-jre
RUN ["chmod", "+x", "/bin/initialize.sh"]

ENTRYPOINT ["/bin/initialize.sh"]

EXPOSE 8000
EXPOSE 4000