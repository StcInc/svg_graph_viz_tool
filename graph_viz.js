function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function create_edge(svg, x1, y1, x2, y2) {
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

  g.appendChild(line);
  svg.appendChild(g);

  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "purple");
  line.setAttribute("stroke-width", 2);

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
  text.setAttribute("fill", "red");
  text.textContent = name;

  let width = text.getBBox().width + 20;
  let height = text.getBBox().height + 20;

  rect.setAttribute("x", x - width / 2);
  rect.setAttribute("y", y - height / 2);
  rect.setAttribute("height", height);
  rect.setAttribute("width", width);
  rect.setAttribute("fill", "white");
  rect.setAttribute("stroke", "white");

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
  text.setAttribute("fill", "black");
  text.textContent = name;

  let bb = text.getBBox();
  let width = bb.width + 20;
  let height = bb.height + 20;

  rect.setAttribute("x", x - width / 2);
  rect.setAttribute("y", y - height / 2);

  rect.setAttribute("width", width);
  rect.setAttribute("height", height);

  rect.setAttribute("fill", "white");
  rect.setAttribute("stroke", "black");
  rect.setAttribute("stroke-width", 2);
  rect.setAttribute("rx", 15);
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
    if (e.src_node && e.target_node) {
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
}

function update_edges(node, x, y) {
  let bb = node.getBBox();

  for (e of node.parentElement.n.in_edges) {
    // update line
    e.g.children[0].setAttribute("x2", bb.x + x + bb.width / 2);
    e.g.children[0].setAttribute("y2", bb.y + y + bb.height / 2);

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

  // area occupied by graph
  let activeArea = {
    min_x: Infinity,
    max_x: -Infinity,
    min_y: Infinity,
    max_y: -Infinity,
  };
  let MARGIN = 50;

  function updateActiveArea() {
    activeArea.min_x = Infinity;
    activeArea.max_x = -Infinity;
    activeArea.min_y = Infinity;
    activeArea.max_y = -Infinity;

    for (n of graph_data.nodes) {
      let x = n.x;
      let y = n.y;

      // consider node's transform
      const match = n.g.children[0].style.transform.match(
        /translate\((-?\d+(\.\d+)?)px,\s*(-?\d+(\.\d+)?)px\)/,
      );
      if (match) {
        x += Number(match[1]);
        y += Number(match[3]);
      }

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

  updateActiveArea();
  console.log("Active area", activeArea);

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
        child.classList.add("greyed");
      }
    }
    // hide all edges
    for (edge of graph_data.edges) {
      for (child of edge.g.children) {
        child.classList.add("greyed");
      }
    }

    // reenable selected node
    for (child of target.children) {
      child.classList.remove("greyed");
    }

    selectedElement = target.children[0];
    selectedElement.classList.add("selected");

    // reenable connected edges and nodes
    for (edge of selectedElement.parentElement.n.out_edges) {
      for (child of edge.g.children) {
        child.classList.remove("greyed");
      }
      for (child of edge.target_node.g.children) {
        child.classList.remove("greyed");
      }
    }
    for (edge of selectedElement.parentElement.n.in_edges) {
      for (child of edge.g.children) {
        child.classList.remove("greyed");
      }
      for (child of edge.src_node.g.children) {
        child.classList.remove("greyed");
      }
    }

    // get mousedown info
    const startX = e.clientX;
    const startY = e.clientY;
    const match = selectedElement.style.transform.match(
      /translate\((-?\d+(\.\d+)?)px,\s*(-?\d+(\.\d+)?)px\)/,
    );

    // move affected node
    let mousemoveHandler = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let x = dx / currentScale.value;
      let y = dy / currentScale.value;
      if (match) {
        x += Number(match[1]);
        y += Number(match[3]);
      }
      for (child of selectedElement.parentElement.children) {
        child.style.transform = `translate(${x}px, ${y}px)`;
      }

      // console.log("Upd edges: ", selectedElement, x, y);
      update_edges(selectedElement, x, y);

      updateActiveArea();
    };

    const mouseupHandler = () => {
      if (selectedElement) {
        selectedElement.classList.remove("selected");
        selectedElement = null;
      }
      // hide all nodes
      for (n of graph_data.nodes) {
        for (child of n.g.children) {
          child.classList.remove("greyed");
        }
      }
      // unhide all edges
      for (edge of graph_data.edges) {
        for (child of edge.g.children) {
          child.classList.remove("greyed");
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
      const match = svg.style.transform.match(
        // /translate\((-?\d+)px,\s*(-?\d+)px\)/,
        /scale\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)\s*translate\((-?\d+(\.\d+)?)px,\s*(-?\d+(\.\d+)?)px\)/,
      );

      // console.log("Match", match);

      var x = 0;
      var y = 0;
      var sx = 1.0;

      if (match) {
        sx = Number(match[1]);
        x = Number(match[5]);
        y = Number(match[7]);
      }

      // console.log("Parsed transform: ", x, y, sx);
      // console.log(e.wheelDelta);
      // console.log(e.deltaX, e.deltaY);

      if (e.ctrlKey) {
        // zoom
        if (e.wheelDelta > 0) {
          sx *= 1.05;
        } else {
          sx *= 0.95;
        }
        currentScale.value = sx;
        // console.log("Scaling", sx);
      } else {
        // translate
        x -= e.deltaX / currentScale.value;
        y -= e.deltaY / currentScale.value;
        // console.log("translating", x, y);
      }
      svg.style.transform = `scale(${sx}, ${sx}) translate(${x}px, ${y}px)`;
    },
    { passive: false },
  );

  let close = (term, name) => {
    return name.trim().toLowerCase().indexOf(term.trim().toLowerCase()) !== -1;
  };

  let searchTerm = (term) => {
    // console.log(graph_data.nodes);
    for (n of graph_data.nodes) {
      n.g.remove();
    }
    graph_data.nodes = [];

    // console.log(graph_data.edges);
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
    updateActiveArea();
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

      if (event.key == "Enter") {
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
