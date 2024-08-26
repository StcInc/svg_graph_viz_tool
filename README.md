# Graph visualization tool
## Supports 
- graph creation via json editing in src file
- moving graph nodes around

## Graph description
```
{
"nodes": [
    {
        // node label will be "{id}: {type}"
        "id": "Text identifier - will be displayed inside node",
        "type": "Text description - will be displayed inside node"
    }
],
"relationships": [
    {
        "source_node_id": "should match source node id field",
        "source_node_type": "should match source node type field",
        "target_node_id": "should match target node id field",
        "target_node_type": "should match target node type field",
        "type": "text description of relationship between source and target node - will be displayed as label for the edge"
    }
]
}
```
