import math
import random
import json


# square spiral around (x,y) in whole numbers
def nearest_positions(x, y): # no limitations
    radius = 1
    while True:
        _x, _y = x + radius, y + radius
        # go down
        while _y > y - radius:
            yield _x, _y
            _y -= 1;

        # go left
        while _x > x - radius:
            yield _x, _y
            _x -= 1

        # go up
        while _y < y + radius:
            yield _x, _y
            _y += 1

        # go right
        while _x < x + radius:
            yield _x, _y
            _x += 1
        radius += 1

def dist(n1, n2):
    if type(n1) is dict:
        if type(n2) is dict:
            return math.sqrt((n1["x"] - n2["x"]) ** 2 + (n1["y"] - n2["y"]) ** 2)
        else:
            return math.sqrt((n1["x"] - n2[0]) ** 2 + (n1["y"] - n2[1]) ** 2)
    else:
        if type(n2) is dict:
            return math.sqrt((n1[0] - n2["x"]) ** 2 + (n1[1] - n2["y"]) ** 2)
        else:
            return math.sqrt((n1[0] - n2[0]) ** 2 + (n1[1] - n2[1]) ** 2)


def compute_avg_pos(rel_nodes):
    assert len(rel_nodes)
    xs = []
    ys = []
    for n2 in rel_nodes:
        xs.append(n2["x"])
        ys.append(n2["y"])
    avg_pos = sum(xs) / len(xs), sum(ys) / len(ys)
    return avg_pos


# TODO: rename this
def build_node_edge_index(edges):
    node_edges = {} # node_id: [ node_ids ...]
    for e in edges:

        node_edges[e["src"]] = node_edges.get(e["src"], [])
        node_edges[e["src"]].append(e["tgt"])

        node_edges[e["tgt"]] = node_edges.get(e["tgt"], [])
        node_edges[e["tgt"]].append(e["src"])
    return node_edges


def _dfs(n_id, node_edges, component):
    if n_id in component:
        return
    component.add(n_id)
    for n in node_edges[n_id]:
        _dfs(n, node_edges, component)

def find_connected_components_of_graph(nodes, node_edges):
    components = []
    node_to_component = {}
    for n in nodes:
        if n["id"] in node_edges:
            if n["id"] not in node_to_component:
                components.append(set())
                _dfs(n["id"], node_edges, components[-1])
                for nid in components[-1]:
                    node_to_component[nid] = components[-1]
        else:
            # no edges to/from node - means it's separate component
            components.append({n["id"]})

    return components

def find_close_free_spot(p, pos_idx):
    if type(p) is dict:
        x, y = p["x"], p["y"]
    else:
        x, y = p
    x = int(x)
    y = int(y)

    if (x, y) not in pos_idx:
        return x, y
    elif (x+1, y) not in pos_idx:
        return (x+1, y)
    elif (x, y+1) not in pos_idx:
        return (x, y+1)
    elif (x-1, y) not in pos_idx:
        return (x-1, y)
    elif (x, y-1) not in pos_idx:
        return (x, y-1)

    # otherwise - try to find closest free spot near p
    for x, y in nearest_positions(x, y):
        # TODO: in theory can get out of bounds, but shouldn't
        if (x, y) not in pos_idx:
            return x, y
    return None

def move_to_pos(n, p, pos_idx):
    if type(p) is dict:
        x, y = p['x'], p['y']
    else:
        x, y = p

    del pos_idx[(n["x"], n["y"])]
    n["x"], n["y"] = x, y
    pos_idx[(x, y)] = n


def _bfs(n_id, node_idx, node_edges, pos_idx, finalized):

    to_process = []
    for n in node_edges[n_id]:
        if n not in finalized:
            to_process.append(n)

    # pull connected closer & finilize them
    for n in to_process:
        # find averaged position of all fixed nodes n is connected
        fixed = [nc for nc in node_edges[n] if nc in finalized]
        avg_pos = compute_avg_pos([node_idx[nc] for nc in fixed])
        free_spot = find_close_free_spot(avg_pos, pos_idx)
        if dist(free_spot, avg_pos) < dist(node_idx[n], avg_pos):
            # move n closer to averaged coord
            move_to_pos(node_idx[n], free_spot, pos_idx)
        finalized.add(n) # mark n as fixed/finilized

    # then go through again and - call _bfs for those
    for n in to_process:
        _bfs(n, node_idx, node_edges, pos_idx, finalized)


def compute_envelope(component, node_idx):
    min_x = None
    max_x = None
    min_y = None
    max_y = None
    for n_id in component:
        n = node_idx[n_id]
        if min_x is None or n["x"] < min_x:
            min_x = n["x"]
        if max_x is None or n["x"] > max_x:
            max_x = n["x"]
        if min_y is None or n["y"] < min_y:
            min_y = n["y"]
        if max_y is None or n["y"] > max_y:
            max_y = n["y"]
    return min_x, max_x, min_y, max_y


def position_nodes(nodes, edges):

    # TODO: pick better positions for nodes to minimize cases when edge between n1 and n2 passes through n3

    node_idx = {n["id"]: n for n in nodes}

    # node_edges: {n_id: [ n_id2, ...]}
    node_edges = build_node_edge_index(edges)

    components = find_connected_components_of_graph(nodes, node_edges)

    for component in components:
        # (N x N) grid
        N = len(component)
        pos_idx = {} # (x, y): n
        for n_id in component:
            n = node_idx[n_id]
            n["x"] = random.randint(0, N)
            n["y"] = random.randint(0, N)

            while (n["x"], n["y"]) in pos_idx:
                # have to find a new spot
                n["x"] = random.randint(0, N)
                n["y"] = random.randint(0, N)
            pos_idx[(n["x"], n["y"])] = n

        if len(component) < 3:
            # if only 1-2 nodes in component- they are already placed adequately
            continue

        center = (N / 2, N / 2)
        min_dist = math.sqrt(2)

        # pick most connected node, place it in center
        most_connected = max(component, key=lambda nid: len(node_edges[nid]))
        most_connected = node_idx[most_connected]

        # move to center position
        free_spot = find_close_free_spot(center, pos_idx)
        if free_spot is None:
            print(f"Failed to find close position to the center {center}!!!")
            break

        if dist(free_spot, center) < dist(most_connected, center):
            # print(f"Moving center node {most_connected['id']} from {(most_connected['x'], most_connected['y'])} to {free_spot}")
            move_to_pos(most_connected, free_spot, pos_idx)

        finalized = {most_connected["id"]}
        _bfs(most_connected["id"], node_idx, node_edges, pos_idx, finalized)


    # TODO: move components closer together

    # find tallest component
    tallest = 0
    max_effective_height = 1
    offset_x = 0
    for i, component in enumerate(components):
        min_x, max_x, min_y, max_y = compute_envelope(component, node_idx)

        assert min_x is not None
        assert max_x is not None
        assert min_y is not None
        assert max_y is not None

        if max_y - min_y > max_effective_height:
            tallest = i
            max_effective_height = max_y - min_y
            offset_x = max_x - min_x

    # stack multi-node components to the right from tallest
    offset_y = 0
    max_effective_width = 1
    for i, component in enumerate(components):
        if len(component) == 1: # single-node components will be stacked in the end
            continue

        min_x, max_x, min_y, max_y = compute_envelope(component, node_idx)
        assert min_x is not None
        assert max_x is not None
        assert min_y is not None
        assert max_y is not None

        if i == tallest:
            # just shift all nodes to top-left corner
            for n_id in component:
                n = node_idx[n_id]
                n["x"] -= min_x
                n["y"] -= min_y
            continue

        # otherwise - stack vertically / horizontally

        if max_x - min_x > max_effective_width:
            max_effective_width = max_x - min_x

        # move each node of component to the top-left & add offsets
        for n_id in component:
            n = node_idx[n_id]
            n["x"] += offset_x - min_x
            n["y"] += offset_y - min_y

        offset_y += max_y - min_y + 1
        if offset_y >= max_effective_height:
            # shift to the right & go up
            offset_x += max_effective_width
            max_effective_width = 1
            offset_y = 0

    # stack single-node components
    for i, component in enumerate(components):
        if len(component) > 1:
            continue

        min_x, max_x, min_y, max_y = compute_envelope(component, node_idx)
        assert min_x is not None
        assert max_x is not None
        assert min_y is not None
        assert max_y is not None

        if i == tallest:
            # just shift all nodes to top-left corner
            for n_id in component:
                n = node_idx[n_id]
                n["x"] -= min_x
                n["y"] -= min_y
            continue

        # otherwise - stack vertically / horizontally

        if max_x - min_x > max_effective_width:
            max_effective_width = max_x - min_x

        # move each node of component to the top-left & add offsets
        for n_id in component:
            n = node_idx[n_id]
            n["x"] += offset_x - min_x
            n["y"] += offset_y - min_y

        offset_y += max_y - min_y + 1
        if offset_y >= max_effective_height:
            # shift to the right & go up
            offset_x += max_effective_width
            max_effective_width = 1
            offset_y = 0

    # convert cell indices to coords
    cell_size = 500.0
    for n in nodes:
        n["x"] = (n["x"]) * cell_size
        n["y"] = (n["y"]) * cell_size

    return {"nodes": nodes, "edges": edges}


if __name__ == "__main__":
    # mock graph data
    graph_data = {
        "nodes": [
            { "id": "one"},
            { "id": "two"},
            { "id": "three"},
            { "id": "four"},
        ],
        "edges": [
            {
                "src": "one",
                "tgt": "two",
                "type": "relation 1-2",
            },
            {
                "src": "one",
                "tgt": "three",
                "type": "relation 1-3",
            },
            {
                "src": "two",
                "tgt": "four",
                "type": "relation 2-4",
            },
        ]
    }

    # generate (x, y) positions for each node
    graph_data = position_nodes(
        nodes=graph_data["nodes"],
        edges=graph_data["edges"]
    )

    # save graph data for visualization
    with open("graph_data.js", 'w') as out:
        s = json.dumps(graph_data)
        out.write(f"var sourceData = {s};\n")
