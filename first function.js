// setup
// 1. figure out all the nodes involved in the moving region
// 2. figure out all the edge nodes involve in the moving region

// search
// 1. start from a given edge node
// 2. go to a random connected node (non adjacent edge)
// 3. from the 2 nodes, figure out all the faces involved.
// 4. check the ordering between the faces
// 5. set this ordering as the check for the rest of the Path
// 6. while you haven't reached another edge node
//     1. go to a random connected node
//     2. from the 2 nodes, figure our all the faces involved
//     3. check the ordering of the faces against the current check
//     4. if the ordering is incorrect
//        move to the previous node, and try checking a different node
//     5. if the ordering is correct
//         store the node number in a list 
// 7. return the list

// figure out the faces involved in the nodes that you are checking
let facesInvolved = function (node1, node2) {
    ans = []

    // loop through every face in the moving region. The face is represented as a collection of vertices
    //**figure out all the faces in the moving region */
    for (let i = 0; i < movingFaces.length; i++) {

        // if node1, and node2 are in the face of the faces_vertices list, add the index of the list to the ans
        // the index represents the face number
        if (faces_vertices[i].includes(node1) && faces_vertices[i].includes(node2)) {
            ans.push(i)
        }

    // if you only get 1 face, it means that it's on the outer edge. Return a blank list because there are no faces involved
    } if (ans.length == 1) {
        return []
    } else {
        return ans
    }
}

// figure out the face ordering of the face involved in the check
let findFaceOrder = function (facesInvolved) {

    // loop through a list of face orders in the moving region
    for (let faceOrder of movingFaceOrders) {

        // if the faceorder includes the faces involved. return the relation of the faces.
        if (faceOrder.includes(facesInvolved)) {
            return(faceOrder[2])
        }
    }
}

// function to find every path from the start to the target
let allPathsSourceTarget = function (graph, start, end) {
    let result = [];
    let n = graph.length;

    let dfs = function (node, curr) {
        if (node === end) {
            result.push(curr);
            return;
        }

        for (let i = 0; i < graph[node].length; i++) {
            dfs(graph[node][i], [...curr, graph[node][i]]);
        }
    }

    dfs(start, [start]);

    return result;
};

// function to find valid paths
let validPath = function (allPaths) {
    ans = []
    
    // loop through every path in allPaths
    for (let path of allPaths) {
        // at the first loop of each path, set the check value to null
        let tempFaceOrder = null
        
        // loop through the nodes in the path
        for (let i = 0; i < path.length; i++) {
                
            // set a to be the face order between 2 consective nodes
            let a = findFaceOrder(facesInvolved(path[i],path[i+1]))
            
            // if tempFaceOrder == null, change tempFaceOrder to be the check for the rest of the loop
            if (tempFaceOrder == null) {
                tempFaceOrder = a
            }
            // if tempFaceOrder exists, check if the faceorder is different from the check value. if it is, break
            else if (tempFaceOrder != a) {
                break
            }
        }
        // if you manage to get through the inner for loop, add the path to the ans
        ans.push(path)
    } return ans
}

