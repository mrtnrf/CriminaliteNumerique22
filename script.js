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

  // Checkbox pour afficher le pourcentage de résolution
  let checkbox = d3.select("#pctToggle");

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
      // Activer la fonction survol si la checkbox n'est pas cochée
      if (checkbox.property("checked")) {
        return;
      }
      const ancestors = d.ancestors().reverse().slice(1);
      updateText(d, ancestors, hierarchyTxt, pctTxt);
      path.attr("fill-opacity", node =>
        ancestors.indexOf(node) >= 0 ? 1.0 : 0.3
      );
    });

  // Rectangle correspondant au pourcentage de résolution
  const pctRect = svg.append("rect")
    .classed("node", true)
    .attr("x", d => d.x0)
    .attr("y", d => {
      let [resolved, infractions] = getResolvedAndInfractions(d);
      let pct = resolved / infractions * 100;
      // On met le rectangle en bas du rectangle parent
      // et on le réduit en fonction du pourcentage
      return d.y1 - pct / 100 * (d.y1 - d.y0);
    })
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => {
      let [resolved, infractions] = getResolvedAndInfractions(d);
      let pct = resolved / infractions * 100;
      return pct / 100 * (d.y1 - d.y0);
    })
    .attr("fill", d => colors[d.depth - 1])
    .attr("visibility", "hidden");



  path.on("mouseleave", () => {
    // Activer la fonction survol si la checkbox n'est pas cochée
    if (checkbox.property("checked")) {
      return;
    }
    path.attr("fill-opacity", 1);
    hierarchyTxt.style("visibility", "hidden");
    pctTxt.style("visibility", "hidden");
  });

  // Activation de la taille des rectangles en fonction du taux de résolution
  checkbox.on("change", () => {
      // Si la checkbox est cochée, on met a jour la taille des rectangles
      // Sinon, on remet la taille par défaut
      updateRectangle(path, pctRect, checkbox.property("checked"));
    }
  );
  // Au début, on n'affiche pas le pourcentage
  updateRectangle(path, pctRect, false);
}

function updateRectangle(path, pctRect, showPct) {
  // Rendre tous les rectangles légèrement transparents si la checkbox est cochée
  path.attr("fill-opacity", d => showPct ? 0.3 : 1.0);
  // Afficher le rectangle correspondant au pourcentage de résolution
  pctRect.attr("visibility", d => showPct ? "visible" : "hidden");
}

function updateText(d, ancestors, title, pctText) {
  // Prendre la hierarchie du noeud (sans root)
  const text = ancestors.map(d => "<span style='color: " + colors[d.depth - 1] + "'>" + d.data.name + "</span>")
    .join(" > ");
  // Mettre a jour le texte
  title
    .style("visibility", "visible")
    .html(text);

  // Calculer le pourcentage de résolution
  let [resolved, infractions] = getResolvedAndInfractions(d);
  let pct = resolved / infractions * 100;

  pctText
    .style("visibility", "visible")
    .html("Pourcentage de résolution: " + d3.format(".2f")(pct) + "%");
}

function getResolvedAndInfractions(d) {
  if (d.children) {
    // Si le noeud a des enfants, on additionne les résolutions et infractions recursivement
    return d.children.reduce((acc, child) => {
      let [resolved, infractions] = getResolvedAndInfractions(child);
      return [acc[0] + resolved, acc[1] + infractions];
    }, [0, 0]);
  } else {
    return [d.data.resolved, d.data.infractions];
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
