var settings = {
  nodeColor: "blue",
  nodeTextColor: "white",
  nodeOutlineColor: "blue",
  nodeOutlineWidth: 2,
  nodeCornerRadius: 15,
  edgeColor: "black",
  edgeWidth: 2,
  showArrows: true,
  showEdgeAttachPoints: false,

  // TODO: orbs intersect node clicks depending on z-order
  showOrbs: false,
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

  auto_pan_to_center: true,

  // TODO: populate settings from ui
  // TODO: add all settings to ui

  showResultingForceVectors: false,

  radius: 200,
  speed: 1,

  repulsion_force: 1.0,
  attraction_force: 1.0,
  gravitational_force: 1.0,
  randomize_move: false,
};

function getArrowPoints(x1, y1, x2, y2) {
  // rotate x1 around x2 by +-angle radians

  // TODO: angle to settings
  let angle = 0.15;
  let x3 = x2 + (x1 - x2) * Math.cos(angle) - (y1 - y2) * Math.sin(angle);
  let y3 = y2 + (x1 - x2) * Math.sin(angle) + (y1 - y2) * Math.cos(angle);
  let x4 = x2 + (x1 - x2) * Math.cos(-angle) - (y1 - y2) * Math.sin(-angle);
  let y4 = y2 + (x1 - x2) * Math.sin(-angle) + (y1 - y2) * Math.cos(-angle);

  // scale arrow
  var dx = x2 - x3;
  var dy = y2 - y3;
  let dlen = Math.max(Math.sqrt(dx * dx + dy * dy), 1e-4);

  let scale = (1.0 - settings.arrowSize / dlen) * dlen;

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

function edgeNodeBorderIntersect(x1, y1, x2, y2, bbox) {
  var w = bbox.width / 2;
  var h = bbox.height / 2;

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

function getMidPoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function Edge(src_node, tgt_node, label, svg) {
  this.src_node = src_node;
  this.tgt_node = tgt_node;
  this.label = label;

  this.createSVG = function (svg) {
    this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.g.e = this;
    svg.appendChild(this.g);

    this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.line.setAttribute("stroke", settings.edgeColor);
    this.line.setAttribute("stroke-width", settings.edgeWidth);
    this.g.appendChild(this.line);

    // create edge label

    // create edge label background rect
    this.rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    this.rect.setAttribute("fill", settings.edgeTextBackground);
    this.rect.setAttribute("stroke", settings.edgeLabelOutlineColor);
    this.g.appendChild(this.rect);

    // then create edge label text on top of background rect
    this.text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    this.text.setAttribute("dominant-baseline", "middle");
    this.text.setAttribute("text-anchor", "middle");
    this.text.setAttribute("fill", settings.edgeTextColor);
    this.text.setAttribute("font-family", settings.fontFamily);
    this.text.setAttribute("font-size", settings.fontSize);
    this.text.textContent = this.label;
    this.g.appendChild(this.text);

    let midPoint = getMidPoint(this.src_node, this.tgt_node);
    this.text.setAttribute("x", midPoint.x);
    this.text.setAttribute("y", midPoint.y);

    // measure text size
    let bb = this.text.getBBox();
    this.text_width = bb.width + 20;
    this.text_height = bb.height + 20;

    // and adjust rect's size
    this.rect.setAttribute("width", this.text_width);
    this.rect.setAttribute("height", this.text_height);
    this.rect.setAttribute("x", midPoint.x - this.text_width / 2);
    this.rect.setAttribute("y", midPoint.y - this.text_height / 2);

    // create arrow
    if (settings.showArrows) {
      this.arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon",
      );
      this.arrow.style.fill = settings.arrowColor;
      this.arrow.setAttribute("stroke", settings.arrowOutlineColor);
      this.arrow.setAttribute("stroke-width", settings.arrowOutlineWidth);
      this.g.appendChild(this.arrow);
    }

    if (settings.showEdgeAttachPoints) {
      //draw attachment point to each node
      this.p1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );

      this.p1.setAttribute("r", 5);
      this.p1.setAttribute("fill", "red");
      this.g.appendChild(this.p1);

      this.p2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      this.p2.setAttribute("r", 5);
      this.p2.setAttribute("fill", "lime");
      this.g.appendChild(this.p2);
    }
  };
  this.createSVG(svg);
  this.update = function () {
    // only show edge if both src and tgt nodes are visible
    if (this.src_node.visible && this.tgt_node.visible) {
      this.g.setAttribute("visibility", "visible");
    } else {
      this.g.setAttribute("visibility", "hidden");
    }

    // update line
    this.line.setAttribute("x1", this.src_node.x);
    this.line.setAttribute("y1", this.src_node.y);
    this.line.setAttribute("x2", this.tgt_node.x);
    this.line.setAttribute("y2", this.tgt_node.y);

    // update edge label
    let midPoint = getMidPoint(this.src_node, this.tgt_node);
    this.text.setAttribute("x", midPoint.x);
    this.text.setAttribute("y", midPoint.y);
    this.rect.setAttribute("x", midPoint.x - this.text_width / 2);
    this.rect.setAttribute("y", midPoint.y - this.text_height / 2);

    let bp_src = edgeNodeBorderIntersect(
      this.tgt_node.x,
      this.tgt_node.y,
      this.src_node.x,
      this.src_node.y,
      this.src_node.getBbox(),
    );
    let bp_tgt = edgeNodeBorderIntersect(
      this.src_node.x,
      this.src_node.y,
      this.tgt_node.x,
      this.tgt_node.y,
      this.tgt_node.getBbox(),
    );

    // update arrow points
    if (settings.showArrows) {
      this.arrow.setAttribute(
        "points",
        getArrowPoints(bp_src.x, bp_src.y, bp_tgt.x, bp_tgt.y),
      );
    }
    // update attachment points
    if (settings.showEdgeAttachPoints) {
      this.p1.setAttribute("cx", bp_src.x);
      this.p1.setAttribute("cy", bp_src.y);
      this.p2.setAttribute("cx", bp_tgt.x);
      this.p2.setAttribute("cy", bp_tgt.y);
    }
  };
  this.update();
}

function Node(id, x, y, svg) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.edges = [];
  this.visible = true;

  this.createSVG = function (svg) {
    this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.g.n = this;
    this.rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    this.text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    this.orb = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    svg.appendChild(this.g);
    this.g.appendChild(this.rect);
    this.g.appendChild(this.text);
    this.g.appendChild(this.orb);

    this.text.setAttribute("x", this.x);
    this.text.setAttribute("y", this.y);
    this.text.setAttribute("dominant-baseline", "middle");
    this.text.setAttribute("text-anchor", "middle");
    this.text.setAttribute("fill", settings.nodeTextColor);
    this.text.setAttribute("font-family", settings.fontFamily);
    this.text.setAttribute("font-size", settings.fontSize);
    this.text.textContent = this.id;

    let bb = this.text.getBBox();
    let width = bb.width + 20;
    let height = bb.height + 20;

    this.rect.setAttribute("x", this.x - width / 2);
    this.rect.setAttribute("y", this.y - height / 2);

    this.rect.setAttribute("width", width);
    this.rect.setAttribute("height", height);

    this.rect.setAttribute("fill", settings.nodeColor);
    this.rect.setAttribute("stroke", settings.nodeOutlineColor);
    this.rect.setAttribute("stroke-width", settings.nodeOutlineWidth);
    this.rect.setAttribute("rx", settings.nodeCornerRadius);

    if (settings.showOrbs) {
      // used to show node dynamics
      this.orb.setAttribute("cx", this.x);
      this.orb.setAttribute("cy", this.y);
      this.orb.setAttribute("r", settings.radius);
      this.orb.setAttribute("stroke-width", "1");
      this.orb.setAttribute("fill", "transparent");
      this.orb.setAttribute("class", "selected");
    }

    this.forceVector = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    this.g.appendChild(this.forceVector);

    this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.line.setAttribute("stroke", "red");
    this.line.setAttribute("stroke-width", 3);
    this.forceVector.appendChild(this.line);

    // create an arrow
    this.arrow = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon",
    );
    this.arrow.style.fill = "red";
    this.arrow.setAttribute("stroke", "red");
    this.arrow.setAttribute("stroke-width", settings.arrowOutlineWidth);
    this.forceVector.appendChild(this.arrow);
  };

  this.createSVG(svg);

  this.move = function (nx, ny) {
    this.x = nx;
    this.y = ny;

    let bbox = this.rect.getBBox();
    this.rect.setAttribute("x", this.x - bbox.width / 2);
    this.rect.setAttribute("y", this.y - bbox.height / 2);
    this.text.setAttribute("x", this.x);
    this.text.setAttribute("y", this.y);
    if (settings.showOrbs) {
      this.orb.setAttribute("cx", this.x);
      this.orb.setAttribute("cy", this.y);
    }
  };
  this.getBbox = function () {
    return this.rect.getBBox();
  };
  this.select = function (selected) {
    if (selected) {
      this.rect.classList.add("selected");
    } else {
      this.rect.classList.remove("selected");
    }
  };
  this.setVisible = function (isVisible) {
    if (this.visible && !isVisible) {
      this.visible = isVisible;
      this.g.setAttribute("visibility", "hidden");
    } else if (!this.visible && isVisible) {
      this.visible = isVisible;
      this.g.setAttribute("visibility", "visible");
    }
  };
  this.updateForceVector = function (v) {
    if (!this.visible) {
      return;
    }
    if (settings.showResultingForceVectors) {
      this.forceVector.setAttribute("visibility", "visible");

      // update arrow
      this.arrow.setAttribute(
        "points",
        getArrowPoints(this.x, this.y, this.x + v.x, this.y + v.y),
      );

      // update line
      this.line.setAttribute("x1", this.x);
      this.line.setAttribute("y1", this.y);
      this.line.setAttribute("x2", this.x + v.x);
      this.line.setAttribute("y2", this.y + v.y);
    } else {
      this.forceVector.setAttribute("visibility", "hidden");
    }
  };
}

function dist(n1, n2) {
  return Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
}

function computeForces(state) {
  var forces = {};
  let nids = Object.keys(state.nodes);
  for (nid of nids) {
    forces[nid] = { x: 0, y: 0, c: 0 };
  }

  // move nodes apart
  if (settings.repulsion_force) {
    for (var i = 0; i < nids.length; ++i) {
      let n1 = state.nodes[nids[i]];

      // TODO: optimize this with introduction of spatial indexing
      for (var j = i + 1; j < nids.length; ++j) {
        let n2 = state.nodes[nids[j]];

        let d = dist(n1, n2);

        if (2 * settings.radius - d > 1) {
          // move overlaping nodes apart
          forces[n1.id].x +=
            (settings.repulsion_force * (n1.x - n2.x) * settings.radius) /
            Math.pow(Math.max(d, 1e-4), 2);
          forces[n1.id].y +=
            (settings.repulsion_force * (n1.y - n2.y) * settings.radius) /
            Math.pow(Math.max(d, 1e-4), 2);
          forces[n1.id].c += 1;

          forces[n2.id].x +=
            (settings.repulsion_force * (n2.x - n1.x) * settings.radius) /
            Math.pow(Math.max(d, 1e-4), 2);
          forces[n2.id].y +=
            (settings.repulsion_force * (n2.y - n1.y) * settings.radius) /
            Math.pow(Math.max(d, 1e-4), 2);
          forces[n2.id].c += 1;
        }
      }

      if (settings.randomize_move) {
        // introduce random vector to get system unstuck
        forces[n1.id].x += Math.random();
        forces[n1.id].y += Math.random();
        forces[n1.id].c += 1;
      }
    }
  }

  // moves connected nodes closer
  if (settings.attraction_force) {
    for (e of state.edges) {
      let d = dist(e.src_node, e.tgt_node);
      if (d - 2 * settings.radius > 1) {
        forces[e.src_node.id].x +=
          (settings.attraction_force *
            (e.tgt_node.x - e.src_node.x) *
            Math.max(d, 1e-4)) /
          (Math.max(d, 1e-4) * settings.radius);
        forces[e.src_node.id].y +=
          (settings.attraction_force *
            (e.tgt_node.y - e.src_node.y) *
            Math.max(d, 1e-4)) /
          (Math.max(d, 1e-4) * settings.radius);
        forces[e.src_node.id].c += 1;

        forces[e.tgt_node.id].x +=
          (settings.attraction_force *
            (e.src_node.x - e.tgt_node.x) *
            Math.max(d, 1e-4)) /
          (Math.max(d, 1e-4) * settings.radius);
        forces[e.tgt_node.id].y +=
          (settings.attraction_force *
            (e.src_node.y - e.tgt_node.y) *
            Math.max(d, 1e-4)) /
          (Math.max(d, 1e-4) * settings.radius);
        forces[e.tgt_node.id].c += 1;
      }
    }
  }

  // TODO: prevent edges from intersecting other nodes
  // TODO: try to exponentiate forces instead of linear increase

  if (settings.gravitational_force) {
    let center = { x: 0, y: 0 };
    for (nid in state.nodes) {
      let n = state.nodes[nid];
      let d = dist(n, center);
      forces[nid].x +=
        (settings.gravitational_force * -n.x * Math.max(d, 1e-4)) /
        (Math.max(d, 1e-4) * settings.radius);
      forces[nid].y +=
        (settings.gravitational_force * -n.y * Math.max(d, 1e-4)) /
        (Math.max(d, 1e-4) * settings.radius);
      forces[nid].c += 1;
    }
  }
  return forces;
}

function applyForces(state, forces) {
  // apply forces
  for (nid in state.nodes) {
    if (forces[nid].c) {
      let n = state.nodes[nid];
      n.move(
        n.x + (settings.speed * forces[n.id].x) / forces[n.id].c,
        n.y + (settings.speed * forces[n.id].y) / forces[n.id].c,
      );
    }
  }
}

function computeGraphCenter(state) {
  let x = 0;
  let y = 0;
  let num = Object.keys(state.nodes).length + 1e-4;
  for (nid in state.nodes) {
    let n = state.nodes[nid];
    x += n.x / num;
    y += n.y / num;
  }
  return {
    x: x,
    y: y,
  };
}

function pan(state, dx, dy) {
  state.viewPoint.x += dx;
  state.viewPoint.y += dy;
  state.svg.style.transform = `scale(${state.scale}, ${state.scale}) translate(${state.viewPoint.x}px, ${state.viewPoint.y}px)`;
}

function zoom(state, scale) {
  state.scale *= scale;
  state.svg.style.transform = `scale(${state.scale}, ${state.scale}) translate(${state.viewPoint.x}px, ${state.viewPoint.y}px)`;
}

function searchTerm(state, term) {
  console.log("Searching:", term);
  let close = (name) => {
    return name.trim().toLowerCase().indexOf(term.trim().toLowerCase()) !== -1;
  };

  let matching = {}; // nid: true/false

  for (e of state.edges) {
    // if either of the nodes connected with edge e or edge label is close to search term, we keep both nodes and all edges connecting them
    if (close(e.src_node.id) || close(e.tgt_node.id) || close(e.label)) {
      matching[e.src_node.id] = true;
      matching[e.tgt_node.id] = true;
    }
  }

  // some nodes may not have any edges at all
  for (nid in state.nodes) {
    if (close(nid)) {
      matching[nid] = true;
    }
  }

  // set nodes that were marked as matching to be visible, hide the rest
  for (nid in state.nodes) {
    if (matching[nid]) {
      state.nodes[nid].setVisible(true);
    } else {
      state.nodes[nid].setVisible(false);
    }
  }
  // update all edges
  for (e of state.edges) {
    e.update();
  }
}

function updateForces(state) {
  state.forces = computeForces(state);

  for (nid in state.nodes) {
    let n = state.nodes[nid];
    n.updateForceVector({
      x: (50 * (settings.speed * state.forces[n.id].x)) / state.forces[n.id].c,
      y: (50 * (settings.speed * state.forces[n.id].y)) / state.forces[n.id].c,
    });
  }
}

function main() {
  var state = {
    svg: document.getElementById("my-svg"),

    nodes: {}, // n.id: Node(n.id, x:, y:, g: )
    edges: [],
    node_edges: {}, // n.id: []
    animate: false,

    searching: false,

    scale: 1.0,
    viewPoint: {
      x: 0,
      y: 0,
    },

    mouse: {
      x: 0,
      y: 0,
      active: false,
      selectedNode: null,
    },
  };

  x_max = 1000;
  y_max = 800;

  // create all nodes
  for (n of sourceData.nodes) {
    state.nodes[n.id] = new Node(
      n.id,
      -x_max / 2 + Math.random() * x_max,
      -y_max / 2 + Math.random() * y_max,
      state.svg,
    );
  }

  // create all edges
  for (e of sourceData.edges) {
    let edge = new Edge(
      state.nodes[e.src],
      state.nodes[e.tgt],
      e.label,
      state.svg,
    );
    state.edges.push(edge);
    state.node_edges[e.src] = state.node_edges[e.src] || [];
    state.node_edges[e.src].push(edge);
    state.node_edges[e.tgt] = state.node_edges[e.tgt] || [];
    state.node_edges[e.tgt].push(edge);
  }

  // z-order fix
  // re-add all edge labels to draw them on top of edge lines
  for (e of state.edges) {
    e.g.appendChild(e.rect);
    e.g.appendChild(e.text);
  }
  // re-add all nodes to draw them on top of everything else
  for (nid in state.nodes) {
    state.svg.appendChild(state.nodes[nid].g);
  }

  // center of the graph
  // let centerMarker = document.createElementNS(
  //   "http://www.w3.org/2000/svg",
  //   "circle",
  // );
  // state.svg.appendChild(centerMarker);
  // centerMarker.setAttribute("r", 10);
  // centerMarker.setAttribute("fill", "red");
  // centerMarker.setAttribute("visibility", "visible");

  function panToCenter(state) {
    if (settings.auto_pan_to_center) {
      let center = computeGraphCenter(state);

      // TODO: add to settings
      // centerMarker.setAttribute("visibility", "visible");
      // centerMarker.setAttribute("cx", center.x);
      // centerMarker.setAttribute("cy", center.y);

      state.viewPoint.x = 0;
      state.viewPoint.y = 0;

      // move center point to 0, 0
      center.x = -center.x;
      center.y = -center.y;

      // add half the screen coords to center inside svg
      center.x += state.svg.clientWidth / 2;
      center.y += state.svg.clientHeight / 2;

      pan(state, center.x, center.y);
    }
  }

  panToCenter(state);

  // if (settings.showResultingForceVectors) {
  //   for (nid in state.nodes) {
  //     let n = state.nodes[nid];
  //     n.updateForceVector({
  //       x: Math.random() * 100,
  //       y: Math.random() * 100,
  //     });
  //   }
  // }

  updateForces(state);

  function updateStep(state) {
    state.forces = computeForces(state);
    applyForces(state, state.forces);

    // update edges to match new node positions
    for (e of state.edges) {
      e.update();
    }
    panToCenter(state);
    updateForces(state);
  }

  // animate node positioning
  setInterval(function () {
    if (state.animate) {
      updateStep(state);
    }
  }, 10);

  // event handlers --------------------------------------------

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // zoom
        if (e.wheelDelta > 0) {
          zoom(state, 1.05);
        } else {
          zoom(state, 0.95);
        }
      } else {
        pan(state, -e.deltaX / state.scale, -e.deltaY / state.scale);
      }
    },
    { passive: false },
  );

  let searchBar = document.getElementById("search-text");

  searchBar.addEventListener("focus", function (event) {
    state.searching = true;
    console.log("Searching");
  });
  searchBar.addEventListener("change", function (event) {
    state.searching = true;
    searchTerm(state, event.target.value);
  });
  document.getElementById("clear").addEventListener("click", function () {
    console.log("Clear");
    searchTerm(state, "");
  });

  state.svg.addEventListener("mousedown", function (event) {
    var target = event.target;
    if (state.searching) {
      state.searching = false;
      console.log("Interacting with the graph");
    }

    if (event.button == 2) {
      // skip right click
      return;
    }

    state.mouse.active = true;
    state.mouse.x = event.clientX;
    state.mouse.y = event.clientY;

    if (target == state.svg) {
      // just pan around
    } else {
      // pressed on node
      if (target.parentElement.n) {
        state.mouse.selectedNode = target.parentElement.n;
        state.mouse.selectedNode.select(true);
      }
    }
  });

  document.addEventListener("mousemove", function (event) {
    if (!state.mouse.active) {
      return;
    }

    const dx = event.clientX - state.mouse.x;
    const dy = event.clientY - state.mouse.y;
    state.mouse.x = event.clientX;
    state.mouse.y = event.clientY;

    let x = dx / state.scale;
    let y = dy / state.scale;

    if (state.mouse.selectedNode) {
      state.mouse.selectedNode.move(
        state.mouse.selectedNode.x + x,
        state.mouse.selectedNode.y + y,
      );

      if (state.node_edges[state.mouse.selectedNode.id]) {
        for (e of state.node_edges[state.mouse.selectedNode.id]) {
          e.update();
        }
      }
    } else {
      // TODO: works slower and worse than wheel for some reason
      // pan(state, x, y);
    }
  });

  document.addEventListener("mouseup", function (event) {
    if (!state.mouse.active) {
      return;
    }

    if (state.mouse.selectedNode) {
      state.mouse.selectedNode.select(false);
      state.mouse.selectedNode = null;
    }
    state.mouse.active = false;
  });

  document.addEventListener(
    "keydown",
    function (event) {
      if (state.searching) {
        if (event.key == "Enter") {
          console.log("Enter");
          searchTerm(state, event.target.value);

          // do not clear the search bar to keep search term intact
          event.preventDefault();
        }
        return;
      }
      event.preventDefault();
      if (event.key == " ") {
        state.animate = !state.animate;
        console.log("state.animate:", state.animate);
        return;
      } else if (event.key == "s") {
        settings.repulsion_force = Math.abs(1.0 - settings.repulsion_force);
        console.log("Repulsion", settings.repulsion_force);
        return;
      } else if (event.key == "a") {
        settings.attraction_force = Math.abs(1.0 - settings.attraction_force);
        console.log("Attraction:", settings.attraction_force);
        return;
      } else if (event.key == "r") {
        settings.randomize_move = !settings.randomize_move;
        console.log("Random moves:", settings.randomize_move);
        return;
      }
      // TODO: handle multiple arrow keys pressed at once
      if (event.key == "ArrowLeft") {
        pan(state, 10 / state.scale, 0);
      }
      if (event.key == "ArrowRight") {
        pan(state, -10 / state.scale, 0);
      }
      if (event.key == "ArrowUp") {
        pan(state, 0, 10 / state.scale);
      }
      if (event.key == "ArrowDown") {
        pan(state, 0, -10 / state.scale);
      }
    },
    { passive: false },
  );

  document
    .getElementById("animate_off")
    .addEventListener("change", function () {
      state.animate = false;
      console.log("state.animate:", state.animate);
    });

  document.getElementById("animate_on").addEventListener("change", function () {
    state.animate = true;
    console.log("state.animate:", state.animate);
  });

  document.getElementById("update-step").onclick = function () {
    updateStep(state);
  };

  document.getElementById("attraction_force").oninput = function () {
    settings.attraction_force = this.value;
    console.log("attraction_force", settings.attraction_force);

    document.getElementById("attraction-indicator").innerText =
      `Attraction force: ${settings.attraction_force}`;
    updateForces(state);
  };
  document.getElementById("repulsion_force").oninput = function () {
    settings.repulsion_force = this.value;
    console.log("repulsion_force", settings.repulsion_force);

    document.getElementById("repulsion-indicator").innerText =
      `Repulsion force: ${settings.repulsion_force}`;
    updateForces(state);
  };
  document.getElementById("gravitational_force").oninput = function () {
    settings.gravitational_force = this.value;
    console.log("gravitational_force", settings.gravitational_force);

    document.getElementById("gravity-indicator").innerText =
      `Gravitational force: ${settings.gravitational_force}`;
    updateForces(state);
  };

  document
    .getElementById("randomize_off")
    .addEventListener("change", function () {
      settings.randomize_move = false;
      console.log("settings.randomize_move:", settings.randomize_move);
      updateForces(state);
    });

  document
    .getElementById("randomize_on")
    .addEventListener("change", function () {
      settings.randomize_move = true;
      console.log("settings.randomize_move:", settings.randomize_move);
      updateForces(state);
    });

  document.getElementById("radius").oninput = function () {
    settings.radius = this.value;
    console.log("settings.radius", settings.radius);
    document.getElementById("radius-indicator").innerText =
      `Minimal distance between nodes(radius): ${settings.radius}`;

    // update orb radius for all nodes
    if (settings.showOrbs) {
      for (nid in state.nodes) {
        let n = state.nodes[nid];
        n.orb.setAttribute("r", settings.radius);
      }
    }
    updateForces(state);
  };

  document.getElementById("update-speed").oninput = function () {
    settings.speed = this.value;
    document.getElementById("speed-indicator").innerText =
      `Update step(speed): ${settings.speed}`;
    console.log("settings.speed", settings.speed);

    updateForces(state);
  };

  document.getElementById("center_off").addEventListener("change", function () {
    settings.auto_pan_to_center = false;
    console.log("settings.auto_pan_to_center:", settings.auto_pan_to_center);
  });

  document.getElementById("center_on").addEventListener("change", function () {
    settings.auto_pan_to_center = true;
    console.log("settings.auto_pan_to_center:", settings.auto_pan_to_center);
    panToCenter(state);
  });

  document
    .getElementById("show_forces_off")
    .addEventListener("change", function () {
      settings.showResultingForceVectors = false;
      console.log(
        "settings.showResultingForceVectors:",
        settings.showResultingForceVectors,
      );
      updateForces(state);
    });

  document
    .getElementById("show_forces_on")
    .addEventListener("change", function () {
      settings.showResultingForceVectors = true;
      console.log(
        "settings.showResultingForceVectors:",
        settings.showResultingForceVectors,
      );
      updateForces(state);
    });
}

document.addEventListener("DOMContentLoaded", main);

// TODO: export graph with adjusted positions as json?
