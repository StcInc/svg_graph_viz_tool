var visualSettings = {
  nodeColor: "blue",
  nodeTextColor: "white",
  nodeOutlineColor: "blue",
  nodeOutlineWidth: 2,
  nodeCornerRadius: 15,
  edgeColor: "black",
  edgeWidth: 2,
  showArrows: true,
  arrowSize: 21,
  arrowOutlineWidth: 1,
  arrowColor: "black",
  arrowOutlineColor: "black",

  edgeTextColor: "black",
  edgeTextBackground: "white",
  edgeLabelOutlineColor: "white",
  showEdgeLabels: true,

  backgroundColor: "white",
  fontSize: "1em",
  fontFamily: "Arial, Helvetica, sans-serif",
};

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}
function getArrowPoints(x1, y1, x2, y2) {
  // rotate x1 around x2 by +-angle radians
  let angle = 0.15;
  let x3 = x2 + (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle);
  let y3 = y2 + (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle);
  let x4 = x2 + (x1 - x2) * Math.cos(-angle) - (y1 - y2) * Math.sin(-angle);
  let y4 = y2 + (x1 - x2) * Math.sin(-angle) + (y1 - y2) * Math.cos(-angle);

  // scale arrow
  var dx = x2 - x3;
  var dy = y2 - y3;
  let dlen = Math.sqrt(dx * dx + dy * dy);

  let scale = (1.0 - visualSettings.arrowSize / dlen) * dlen;

  dx /= dlen;
  dy /= dlen;
  x3 = x3 + scale * dx;
  y3 = y3 + scale * dy;

  dx = x2 - x4;
  dy = y2 - y4;
  dx /= dlen;
  dy /= dlen;
  x4 = x4 + scale * dx;
  y4 = y4 + scale * dy;

  return `${x2}, ${y2} ${x3}, ${y3} ${x4}, ${y4}`;
}
function create_edge(svg, x1, y1, x2, y2) {
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(g);
  var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  g.appendChild(line);

  if (visualSettings.showArrows) {
    var arrow = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon",
    );
    g.appendChild(arrow);
    arrow.setAttribute("points", getArrowPoints(x1, y1, x2, y2));
    arrow.style.fill = visualSettings.arrowColor;
    arrow.setAttribute("stroke", visualSettings.arrowOutlineColor);
    arrow.setAttribute("stroke-width", visualSettings.arrowOutlineWidth);
  }

  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", visualSettings.edgeColor);
  line.setAttribute("stroke-width", visualSettings.edgeWidth);

  return g;
}

function create_edge_label(svg, name, x1, y1, x2, y2) {
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  var text = document.createElementNS("http://www.w3.org/2000/svg", "text");

  g.appendChild(rect);
  g.appendChild(text);
  svg.appendChild(g);

  let x = (parseFloat(x1) + parseFloat(x2)) / 2;
  let y = (parseFloat(y1) + parseFloat(y2)) / 2;

  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", visualSettings.edgeTextColor);
  text.setAttribute("font-family", visualSettings.fontFamily);
  text.setAttribute("font-size", visualSettings.fontSize);
  text.textContent = name;

  let width = text.getBBox().width + 20;
  let height = text.getBBox().height + 20;

  rect.setAttribute("x", x - width / 2);
  rect.setAttribute("y", y - height / 2);
  rect.setAttribute("height", height);
  rect.setAttribute("width", width);
  rect.setAttribute("fill", visualSettings.edgeTextBackground);
  rect.setAttribute("stroke", visualSettings.edgeLabelOutlineColor);

  return g;
}

function create_node(svg, name, x, y) {
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  g.appendChild(rect);
  g.appendChild(text);
  svg.appendChild(g);

  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", visualSettings.nodeTextColor);
  text.setAttribute("font-family", visualSettings.fontFamily);
  text.setAttribute("font-size", visualSettings.fontSize);
  text.textContent = name;

  let bb = text.getBBox();
  let width = bb.width + 20;
  let height = bb.height + 20;

  rect.setAttribute("x", x - width / 2);
  rect.setAttribute("y", y - height / 2);

  rect.setAttribute("width", width);
  rect.setAttribute("height", height);

  rect.setAttribute("fill", visualSettings.nodeColor);
  rect.setAttribute("stroke", visualSettings.nodeOutlineColor);
  rect.setAttribute("stroke-width", visualSettings.nodeOutlineWidth);
  rect.setAttribute("rx", visualSettings.nodeCornerRadius);
  return g;
}

function getMidPoint(e) {
  let bb = e.getBBox();
  return {
    x: bb.x + bb.width / 2,
    y: bb.y + bb.height / 2,
  };
}

function createSVGs(svg, graph_data) {
  // console.log("Total nodes: ", graph_data.nodes.length);
  // console.log("Total edges: ", graph_data.edges.length);

  var node_index = {};
  // index nodes and init positions
  for (n of graph_data.nodes) {
    let k = n.id;
    node_index[k] = n;

    // n.x = randInt(-2000, 2000);
    // n.y = randInt(-2000, 2000);
    n.in_edges = [];
    n.out_edges = [];
  }

  // link edges with nodes
  for (e of graph_data.edges) {
    e.src_node = node_index[e.src];
    e.target_node = node_index[e.tgt];
  }

  // draw edge lines first - to draw them behind nodes
  for (e of graph_data.edges) {
    if (e.src_node && e.target_node) {
      e.g = create_edge(
        svg,
        e.src_node.x,
        e.src_node.y,
        e.target_node.x,
        e.target_node.y,
      );
      e.g.e = e;
      e.src_node.out_edges.push(e);
      e.target_node.in_edges.push(e);
    }
  }
  // draw edge labels on top of edge lines
  for (e of graph_data.edges) {
    if (visualSettings.showEdgeLabels && e.src_node && e.target_node) {
      e.lg = create_edge_label(
        svg,
        e.type,
        e.src_node.x,
        e.src_node.y,
        e.target_node.x,
        e.target_node.y,
      );
    }
  }

  // draw nodes last on top of everything else
  for (n of graph_data.nodes) {
    n.g = create_node(svg, n.id, n.x, n.y);
    n.g.n = n;
  }
  for (n of graph_data.nodes) {
    update_edges(n.g.children[0], 0, 0);
  }
}

function edgeNodeBorderIntersect(x1, y1, x2, y2, width, height) {
  var w = width / 2;
  var h = height / 2;

  var dx = x1 - x2;
  var dy = y1 - y2;

  if (Math.sqrt(dx * dx + dy * dy) < Math.min(w, h)) {
    // not intersecting borders
    return {
      x: x2,
      y: y2,
    };
  }

  var tan_phi = h / w;
  var tan_theta = Math.abs(dy / dx);

  var qx = Math.sign(dx);
  var qy = Math.sign(dy);

  if (tan_theta > tan_phi) {
    return {
      x: x2 + (h / tan_theta) * qx,
      y: y2 + h * qy,
    };
  }
  return {
    x: x2 + w * qx,
    y: y2 + w * tan_theta * qy,
  };
}

function update_edges(node, x, y) {
  let bb = node.getBBox();

  for (e of node.parentElement.n.in_edges) {
    e.g.children[0].setAttribute("x2", bb.x + x + bb.width / 2);
    e.g.children[0].setAttribute("y2", bb.y + y + bb.height / 2);

    if (visualSettings.showArrows) {
      let borderPoint = edgeNodeBorderIntersect(
        parseFloat(e.g.children[0].getAttribute("x1")),
        parseFloat(e.g.children[0].getAttribute("y1")),
        bb.x + x + bb.width / 2,
        bb.y + y + bb.height / 2,
        bb.width,
        bb.height,
      );
      e.g.children[1].setAttribute(
        "points",
        getArrowPoints(
          parseFloat(e.g.children[0].getAttribute("x1")),
          parseFloat(e.g.children[0].getAttribute("y1")),
          borderPoint.x,
          borderPoint.y,
        ),
      );
    }

    let m = getMidPoint(e.g.children[0]);

    // update white rect for label background
    e.lg.children[0].setAttribute(
      "x",
      m.x - e.lg.children[0].getBBox().width / 2,
    );
    e.lg.children[0].setAttribute(
      "y",
      m.y - e.lg.children[0].getBBox().height / 2,
    );

    // update label text
    e.lg.children[1].setAttribute("x", m.x);
    e.lg.children[1].setAttribute("y", m.y);
  }

  for (e of node.parentElement.n.out_edges) {
    e.g.children[0].setAttribute("x1", bb.x + x + bb.width / 2);
    e.g.children[0].setAttribute("y1", bb.y + y + bb.height / 2);

    if (visualSettings.showArrows) {
      let tgtbb = e.target_node.g.getBBox();
      let borderPoint = edgeNodeBorderIntersect(
        bb.x + x + bb.width / 2,
        bb.y + y + bb.height / 2,
        parseFloat(e.g.children[0].getAttribute("x2")),
        parseFloat(e.g.children[0].getAttribute("y2")),
        tgtbb.width,
        tgtbb.height,
      );

      e.g.children[1].setAttribute(
        "points",
        getArrowPoints(
          bb.x + x + bb.width / 2,
          bb.y + y + bb.height / 2,
          borderPoint.x,
          borderPoint.y,
        ),
      );
    }

    let m = getMidPoint(e.g.children[0]);

    e.lg.children[0].setAttribute(
      "x",
      m.x - e.lg.children[0].getBBox().width / 2,
    );
    e.lg.children[0].setAttribute(
      "y",
      m.y - e.lg.children[0].getBBox().height / 2,
    );

    e.lg.children[1].setAttribute("x", m.x);
    e.lg.children[1].setAttribute("y", m.y);
  }
}

function greyout(el, undo = false) {
  if (undo) {
    el.classList.remove("greyed");
  } else {
    // TODO: infill color needs to be greyed out too and then restored
    // maybe we can define css classes for everything and not bother with all that
    el.classList.add("greyed");
  }
}

function main() {
  // sourceData - full graph awailable != graph_data - subgraph being displayed
  var graph_data = {
    nodes: [],
    edges: [],
  };

  // search index to select subgraph being displayed
  var _full_node_index = {};
  for (n of sourceData.nodes) {
    // for quick search
    let k = n.id;
    _full_node_index[k] = n;
  }

  //const svg = document.querySelector("svg")
  const svg = document.getElementById("my-svg");
  const active_area = document.getElementById("active_area");
  const searchText = document.getElementById("search-text");
  const clearBtn = document.getElementById("clear");

  // ============================================================

  // init subgraph being displayed with everything in full graph

  // TODO: refactor everything related to state into state object
  // TOOD: make node-edge browser to see displayed nodes as a list
  // TODO: display scrolls bars to show where camera is or where is the active area (ocupied by nodes)
  // TODO: show minimap for easier navigation

  // area occupied by graph
  let activeArea = {
    min_x: Infinity,
    max_x: -Infinity,
    min_y: Infinity,
    max_y: -Infinity,
  };
  let MARGIN = 50;

  function updateOccupiedArea() {
    activeArea.min_x = Infinity;
    activeArea.max_x = -Infinity;
    activeArea.min_y = Infinity;
    activeArea.max_y = -Infinity;

    for (n of graph_data.nodes) {
      let x = n.x;
      let y = n.y;

      // consider node's size + some margin
      let bb = n.g.getBBox();
      activeArea.min_x = Math.min(x - bb.width / 2 - MARGIN, activeArea.min_x);
      activeArea.max_x = Math.max(x + bb.width / 2 + MARGIN, activeArea.max_x);
      activeArea.min_y = Math.min(y - bb.height / 2 - MARGIN, activeArea.min_y);
      activeArea.max_y = Math.max(y + bb.height / 2 + MARGIN, activeArea.max_y);
    }

    if (activeArea.min_x < Infinity) {
      active_area.setAttribute("x", activeArea.min_x);
      active_area.setAttribute("width", activeArea.max_x - activeArea.min_x);
    }
    if (activeArea.min_y < Infinity) {
      active_area.setAttribute("y", activeArea.min_y);
      active_area.setAttribute("height", activeArea.max_y - activeArea.min_y);
    }
  }

  for (n of sourceData.nodes) {
    graph_data.nodes.push({
      id: n.id,
      x: n.x,
      y: n.y,
    });
  }

  for (e of sourceData.edges) {
    graph_data.edges.push({
      src: e.src,
      tgt: e.tgt,
      type: e.type,
    });
  }
  createSVGs(svg, graph_data);

  updateOccupiedArea();
  console.log("Occupied area:", activeArea);

  // move to active area's center
  let center_x =
    (activeArea.min_x + activeArea.max_x) / 2 - svg.clientWidth / 2;
  let center_y =
    (activeArea.min_y + activeArea.max_y) / 2 - svg.clientHeight / 2;

  let initial_scale =
    svg.clientWidth / (activeArea.max_x - activeArea.min_x) / 2;

  console.log(
    `Initial scale(${initial_scale}, ${initial_scale}) translate(${-center_x}px, ${-center_y}px)`,
  );
  svg.style.transform = `scale(${initial_scale}, ${initial_scale}) translate(${-center_x}px, ${-center_y}px)`;

  // ============================================================

  function pan(dx, dy) {
    const match = svg.style.transform.match(
      /scale\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)\s*translate\((-?\d+(\.\d+)?)px,\s*(-?\d+(\.\d+)?)px\)/,
    );
    var x = 0;
    var y = 0;
    var sx = 1.0;

    if (match) {
      sx = Number(match[1]);
      x = Number(match[5]);
      y = Number(match[7]);
    }

    x += dx;
    y += dy;

    svg.style.transform = `scale(${sx}, ${sx}) translate(${x}px, ${y}px)`;
  }

  function zoom(scale) {
    const match = svg.style.transform.match(
      /scale\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)\s*translate\((-?\d+(\.\d+)?)px,\s*(-?\d+(\.\d+)?)px\)/,
    );
    var x = 0;
    var y = 0;
    var sx = 1.0;

    if (match) {
      sx = Number(match[1]);
      x = Number(match[5]);
      y = Number(match[7]);
    }

    sx *= scale;
    currentScale.value = sx;
    svg.style.transform = `scale(${sx}, ${sx}) translate(${x}px, ${y}px)`;
  }

  // ============================================================

  let selectedElement = null;
  var currentScale = { value: initial_scale };

  let mousedown = (e) => {
    var target = e.target;
    if (selectedElement) {
      selectedElement.classList.remove("selected");
    }
    if (target.tagName.toLowerCase() == "svg") {
      return;
    }
    if (target.tagName !== "g") {
      target = target.parentElement;
    }
    if (!target.hasOwnProperty("n")) {
      // check if we are moving node
      return;
    }
    // hide all nodes
    for (n of graph_data.nodes) {
      for (child of n.g.children) {
        greyout(child);
      }
    }
    // hide all edges
    for (edge of graph_data.edges) {
      for (child of edge.g.children) {
        greyout(child);
      }
    }

    // hide all edge labels
    for (edge of graph_data.edges) {
      for (child of edge.lg.children) {
        greyout(child);
      }
    }

    // reenable selected node
    for (child of target.children) {
      greyout(child, true);
    }

    selectedElement = target.children[0];
    selectedElement.classList.add("selected");

    // reenable connected nodes, edges, edge labels
    for (edge of selectedElement.parentElement.n.out_edges) {
      for (child of edge.g.children) {
        greyout(child, true);
      }
      for (child of edge.lg.children) {
        greyout(child, true);
      }
      for (child of edge.target_node.g.children) {
        greyout(child, true);
      }
    }
    for (edge of selectedElement.parentElement.n.in_edges) {
      for (child of edge.g.children) {
        greyout(child, true);
      }
      for (child of edge.lg.children) {
        greyout(child, true);
      }
      for (child of edge.src_node.g.children) {
        greyout(child, true);
      }
    }

    // get mousedown info
    var mouse = {
      x: e.clientX,
      y: e.clientY,
    };

    // move affected node
    let mousemoveHandler = (e) => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      let x = dx / currentScale.value;
      let y = dy / currentScale.value;

      // update node's position in graph_data
      selectedElement.parentElement.n.x =
        parseFloat(child.getAttribute("x")) + x;
      selectedElement.parentElement.n.y =
        parseFloat(child.getAttribute("y")) + y;

      for (child of selectedElement.parentElement.children) {
        child.setAttribute("x", parseFloat(child.getAttribute("x")) + x);
        child.setAttribute("y", parseFloat(child.getAttribute("y")) + y);
      }

      update_edges(selectedElement, x, y);

      updateOccupiedArea();
    };

    const mouseupHandler = () => {
      if (selectedElement) {
        selectedElement.classList.remove("selected");
        selectedElement = null;
      }
      // hide all nodes
      for (n of graph_data.nodes) {
        for (child of n.g.children) {
          greyout(child, true);
        }
      }
      // unhide all edges
      for (edge of graph_data.edges) {
        for (child of edge.g.children) {
          greyout(child, true);
        }
      }

      // unhide all edge labels
      for (edge of graph_data.edges) {
        for (child of edge.lg.children) {
          greyout(child, true);
        }
      }
      document.removeEventListener("mousemove", mousemoveHandler);
      document.removeEventListener("mouseup", mouseupHandler);

      document.removeEventListener("touchmove", mousemoveHandler);
      document.removeEventListener("touchend", mouseupHandler);
    };

    document.addEventListener("mousemove", mousemoveHandler);
    document.addEventListener("mouseup", mouseupHandler);
  };

  svg.addEventListener("mousedown", mousedown);

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // zoom
        if (e.wheelDelta > 0) {
          zoom(1.05);
        } else {
          zoom(0.95);
        }
      } else {
        pan(-e.deltaX / currentScale.value, -e.deltaY / currentScale.value);
      }
    },
    { passive: false },
  );

  let close = (term, name) => {
    return name.trim().toLowerCase().indexOf(term.trim().toLowerCase()) !== -1;
  };

  let searchTerm = (term) => {
    for (n of graph_data.nodes) {
      n.g.remove();
    }
    graph_data.nodes = [];

    for (e of graph_data.edges) {
      e.g.remove();
      e.lg.remove();
    }

    // filter
    graph_data.edges = [];
    let node_list = {};
    for (e of sourceData.edges) {
      if (
        !term.length ||
        close(term, e.src) ||
        close(term, e.tgt) ||
        close(term, e.type)
      ) {
        graph_data.edges.push({
          src: e.src,
          tgt: e.tgt,
          type: e.type,
        });
        node_list[e.src] = _full_node_index[e.src];
        node_list[e.tgt] = _full_node_index[e.tgt];
      }
    }
    for (n of sourceData.nodes) {
      if (!term.length || close(term, n.id)) {
        node_list[n.id] = n;
      }
    }

    // add all affected nodes
    for (k in node_list) {
      let n = node_list[k];
      graph_data.nodes.push({
        id: n.id,
        x: n.x,
        y: n.y,
      });
    }

    createSVGs(svg, graph_data);
    updateOccupiedArea();
  };

  clearBtn.onclick = function (e) {
    e.preventDefault();
    console.log("Clear button pressed");
    searchText.value = "";
    clearBtn.style.display = "none";

    console.log("Searching:", searchText.value);
    searchTerm(searchText.value);
  };

  document.addEventListener(
    "keydown",
    function (event) {
      event.preventDefault();

      // TODO: do not block command + r

      if (event.key == "ArrowLeft") {
        pan(10 / currentScale.value, 0);
        return;
      } else if (event.key == "ArrowRight") {
        pan(-10 / currentScale.value, 0);
        return;
      } else if (event.key == "ArrowUp") {
        pan(0, 10 / currentScale.value);
        return;
      } else if (event.key == "ArrowDown") {
        pan(0, -10 / currentScale.value);
        return;
      } else if (event.key == "Enter") {
        // pass
      } else if (event.key == "Backspace") {
        searchText.value = searchText.value.substring(
          0,
          searchText.value.length - 1,
        );
      } else if (event.key.length == 1) {
        searchText.value = searchText.value + event.key;
      }

      if (searchText.value) {
        clearBtn.style.display = "inline";
      } else {
        clearBtn.style.display = "none";
      }
      console.log("Searching:", searchText.value);
      searchTerm(searchText.value);
    },
    { passive: false },
  );
}

document.addEventListener("DOMContentLoaded", main);
