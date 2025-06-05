# Graph visualization tool
- rendering to svg
- graph definition via json editing in `graph_data.js`
- panning, zoom moving graph nodes around
- searching/filtering by node name and edge type

## Graph description
- can be saved to `graph_data.js` - then imported in index.html
- see `position_nodes.py` for example of how it's done for `Project Gutenberg` example graph
```js
var sourceData = {
    nodes: [
        // id will be used as node label
        { id: "one", x: 150, y: 150 },
        { id: "two", x: 450, y: 450 },
        { id: "three", x: 450, y: 150 },
        { id: "four", x: 150, y: 450 },
    ],
    edges: [
        {
            // source node id
            src: "one",

            // target node id
            tgt: "two",

            // type- will be displayed on top of the edge between "one" and "two"
            type: "relation 1-2",
        },
        {
            src: "one",
            tgt: "three",
            type: "relation 1-3",
        },
        {
            src: "two",
            tgt: "four",
            type: "relation 2-4",
        },
    ],
};
```

# To see graph visualization - open `index.html` in your browser
