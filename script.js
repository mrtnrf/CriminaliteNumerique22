const dataSource = "test.csv";

let csv = [
    ["a/x/y", "900"],
    ["a/x", "3000"],
    ["a/z", "1000"],
    ["b/x", "1500"]
]
    
let data = buildHierarchy(csv);
console.log(data)

const root = d3.hierarchy(data)
  .sum(d => d.value);

const partition = d3.partition()
  .padding(1)
  .size([800,600]);

partition(root);


console.log(root);


d3.select(graph)
  .selectAll("rect.node")
  .data(root.descendants())
  .enter()
  .append("rect")
  .classed("node", true)
  .attr("x", d => d.x0)
  .attr("y", d => d.y0)
  .attr("width", d => d.x1 - d.x0)
  .attr("height", d => d.y1 - d.y0)
  .attr("fill", "blue");




        

function buildHierarchy(csv) {
    // Transformation du csv en json dans un format hiérarchique
    const root = { name: "root", children: [] };
    for (let i = 0; i < csv.length; i++) {
      const sequence = csv[i][0];
      const size = +csv[i][1];
      const parts = sequence.split("/");
      let currentNode = root;
      for (let j = 0; j < parts.length; j++) {
        const children = currentNode["children"];
        const nodeName = parts[j];
        let childNode = null;
        if (j + 1 < parts.length) {
          // Not yet at the end of the sequence; move down the tree.
          let foundChild = false;
          for (let k = 0; k < children.length; k++) {
            if (children[k]["name"] == nodeName) {
              childNode = children[k];
              foundChild = true;
              break;
            }
          }
          // S'il n'y a pas de noeud descendant pour cette branche, une nouvelle branche est alors crée.
          if (!foundChild) {
            childNode = { name: nodeName, children: [] };
            children.push(childNode);
          }
          currentNode = childNode;
        } else {
          // Une fois à la fin de la branche, on crée le noeud final.
          childNode = { name: nodeName, value: size };
          children.push(childNode);
        }
      }
    }
    return root;
}
