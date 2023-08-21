const dataSource = "cyber-infraction_2022.csv";

d3.csv(dataSource).then(createVisualization);

function createVisualization(dataPath) {
  let data = buildHierarchy(dataPath);
  const partition = data =>
    d3.partition()
      .padding(1)
      .size([800, 600])(
        d3.hierarchy(data)
          .sum(d => d.value) 
          .sort((a, b) => b.value - a.value)
    )

  const root = partition(data);
  const svg = d3.select(graph)
    .selectAll("rect.node")
    .data(
      root.descendants().filter(d => {
        // Pas besoin de mettre le noeud racine
        return d.depth;
      }
     ) 
    )
    .enter();

  // Ajout des rectangles
  const path = svg.append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", "blue");
}

const minimumWidth = 100;
function buildHierarchy(data) {
    // Transformation du csv en json dans un format hiérarchique
    const root = { name: "root", children: [] };
    for (let i = 0; i < data.length; i++) {
      const sequence = data[i].nom;
      const nbInfractions = +data[i].nbInfractions;
      const nbResolved = +data[i].nbResolutions;

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
          // S'il n'y a pas de noeud descendant pour cette branche, 
          // une nouvelle branche est alors crée.
          if (!foundChild) {
            childNode = { name: nodeName, children: [] };
            children.push(childNode);
          }
          currentNode = childNode;
        } else {
          // Une fois à la fin de la branche, on crée le noeud final.
          childNode = { name: nodeName, value: nbInfractions + minimumWidth, infractions: nbInfractions,  resolved: nbResolved };
          children.push(childNode);
        }
      }
    }
    return root;
}
