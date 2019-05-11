import requests
from bs4 import BeautifulSoup
import yaml

class websiteTreeNode:
    def __init__(self, name, level, link = None):
        self.children = []
        self.name = name
        self.level = level
        self.link = link
        if link:
            tempSpan1 = link.find('span', {'class':'_hwx354t'})
            tempSpan2 = link.find('span', {'class':'_ys4bp9t'})
            if tempSpan1:
                self.label = tempSpan1.text
            elif tempSpan2:
                self.label = tempSpan2.text
            else:
                self.label = None

    def printTree(self):
        print(self.name + "->")
        for i in self.children:
            tempSpan1 = i.link.find('span', {'class':'_hwx354t'})
            tempSpan2 = i.link.find('span', {'class':'_ys4bp9t'})
            if tempSpan1:
                print(tempSpan1.text, i.name)
            elif tempSpan2:
                print(tempSpan2.text, i.name)
        for i in self.children:
            i.printTree()

level = 0

def web(maxPages,parent,child,branchFactor=10):
    url = parent + child
    numberVisited = 0
    webTree = websiteTreeNode(url, level)
    pagesToVisit = [webTree]
    pagesVisited = []

    while pagesToVisit != []:
        tempNode = pagesToVisit[0]
        if tempNode.level >= maxPages:
            break
        pagesVisited += [tempNode.name]
        pagesToVisit = pagesToVisit[1:]
        numberVisited += 1

        print(numberVisited,"Visiting:", tempNode.name)

        code = requests.get(tempNode.name)
        plain = code.text
        s = BeautifulSoup(plain, "html.parser")
        for link in s.findAll('a'):
            if not(link.img):
                linkName = link.get('href')
                label = link.get('aria-label')
                if linkName:
                    linkName = parent + linkName
                    if not(linkName in pagesVisited):
                        if not '#' in linkName and linkName.startswith(parent + child + '/') and not 'staff_picks' in linkName:
                            tempNode.children += [websiteTreeNode(linkName, tempNode.level + 1, link)]
                        pagesVisited.append(linkName)

        pagesToVisit += tempNode.children

    # webTree.printTree()
    return webTree

def treetojson(tree):
    json = {}
    for i in tree.children:
        if i.label:
            json[i.label] = list(map(lambda x: x.label, filter(lambda x: x.label, i.children)))
    print(json)
    return json

links = input().split(",")

for link in links:

    tree = web(2,'https://khanacademy.org', link)

    filename = link.split("/")[-1]
    with open('khandata/' + filename + '.yml', 'w') as file:
        yaml.dump(treetojson(tree), file, default_flow_style=False)

