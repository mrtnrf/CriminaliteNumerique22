/*
  Une partie de ce code est inspirée de l'exemple suivant:
  https://observablehq.com/@kerryrodden/sequences-icicle
*/

const dataSource = "cyber-infraction_2022.csv";
const colors = ["#61afef", "#8ebd6b", "#e55561", "#e2b86b", "#bf68d9", "#cc9057", "#48b0bd"];

d3.csv(dataSource).then(createVisualization);

function createVisualization(dataPath) {
  // Textes informatifs
  const hierarchyTxt = d3.select("#title");
  const pctTxt = d3.select("#pourcentage");

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
    .attr("fill", d => colors[d.depth - 1])
    // Ajout de l'affichage de la hierarchie au survol
    .on("mouseenter", (_, d) => { 
      const ancestors = d.ancestors().reverse().slice(1);
      updateText(d, ancestors, hierarchyTxt, pctTxt);
      path.attr("fill-opacity", node =>
        ancestors.indexOf(node) >= 0 ? 1.0 : 0.3
      );
    });

  path.on("mouseleave", () => {
    path.attr("fill-opacity", 1);
    hierarchyTxt.style("visibility", "hidden");
    pctTxt.style("visibility", "hidden");
  });
}

function updateText(d, ancestors, title, pctText) {
  // Prendre la hierarchie du noeud (sans root)
  const text = ancestors.map(d => "<span style='color: " + colors[d.depth - 1] + "'>" + d.data.name + "</span>")
    .join(" > ");
  // Mettre a jour le texte
  title
    .style("visibility", "visible")
    .html(text);

  // Mettre a jour le pourcentage si c'est une feuille
  if (!d.children) {
    let pct = d3.format(".2f")(100 * d.data.resolved / d.data.infractions);
    if (pct == "NaN") pct = "0.00";

    pctText
      .style("visibility", "visible")
      .html("Pourcentage de résolution: " + pct + "%");
  } else {
    pctText.style("visibility", "hidden");
  }
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
