// from the starting node, you can travel to any node
//  that is NOT and adjacent outer edge

// after you reach the second node,
// if the node is on the outer edge, return the path taken
// else, if the node is not on the outer edge, move to any other connected node that isn't any of the previously travelled nodes





// let removeOuterEdge = function (graph) {
//     let outerSet = new Set(outerEdgeNodes);
//     for (let node of outerNodes) {
//         graph[node] = graph[node].filter(neighbor => !outerSet.has(neighbor));
//     }
//     return graph
// }

let allPathsSourceTarget = function (graph, start, target) {
    let result = [];
    let n = graph.length;

    let dfs = function (node, curr) {
        if (node === target) {
            if (curr.length > 2) {
                result.push(curr);
            }
            return;
        }

        for (let i = 0; i < graph[node].length; i++) {
            dfs(graph[node][i], [...curr, graph[node][i]]);
        }
    }

    dfs(start, [start]);

    return result;
};