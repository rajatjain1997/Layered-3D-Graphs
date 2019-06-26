import yaml
import json
import os

rootdir = 'khandata'

datafile = {}

for dirname, subdirlist, filelist in os.walk(rootdir):
    for fname in filelist:
        if fname.split(".")[1] =="yml" and fname != "0.yml":
            with open(os.path.join(dirname, fname)) as recfile:
                # records.append(recommendreader(recfile))
                datafile.update(yaml.safe_load(recfile))

with open(rootdir + "/0.yml") as master:
    masterfile = yaml.safe_load(master)

jsondata = {
    "nodes": [],
    "links": []
}

id = 1

def mapper(tup):
    global id
    k = tup[0]
    v = tup[1]
    data = [k, [id, id+len(v)-1]]
    jsondata["nodes"] += (list(map(lambda name, ident: {"id": ident, "name": name}, v, range(id,id+len(v)))))
    jsondata["links"] += (list(map(lambda x: {"source": x, "target": x+1}, range(id, id+len(v)-1))))
    id = id+len(v)
    return data

shardmap = dict(map(mapper, datafile.items()))

for parent, children in masterfile.items():
    for child in children:
        if shardmap[child][-1] != shardmap[parent][0]:
            jsondata["links"].append({
                "source": shardmap[child][-1],
                "target": shardmap[parent][0]
            })

with open("data/khan.json", "w") as outfile:
    outfile.write(json.dumps(jsondata, indent=4))