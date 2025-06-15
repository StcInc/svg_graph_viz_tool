# Graph visualization tool
- rendering to svg
- panning, zoom, dragging nodes around with mouse
- searching/filtering by node name and edge type
- animate node positioning

# See online demo
https://stcinc.github.io/svg_graph_viz_tool/

## Define Your Graph
- mock graph data in `index.html`
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
        {
            src: "three",
            tgt: "two",
            type: "relation 3-2",
        }
    ],
};
```
- you can also look at another example - `graph_data.js` - build on Project Gutenberg text
```html
remove <!-- and --> around
<!-- <script src="graph_data.js"></script> -->

and delete mock data
<!-- Mock data -->
<script>...</script>

be careful not to delete
<!-- Visualization logic -->
<script src="graph_viz.js"></script>
```

# To see graph visualization - open `index.html` in your browser
![Screenshot.png](https://github.com/StcInc/svg_graph_viz_tool/raw/master/Screenshot.png "Screenshot.png")
