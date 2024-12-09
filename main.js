// const faces = [[ 14, 16, 22, 15 ], [ 16, 18, 21, 22 ], [ 2, 7, 14, 15 ], [ 2, 15, 8, 3 ], [ 11, 17, 20, 21 ], [ 11, 21, 18, 12 ], [ 2, 6, 9, 7 ], 
//                [ 6, 11, 12, 9 ], [ 0, 10, 5 ], [ 0, 5, 1 ], [ 3, 8, 4 ], [ 7, 13, 14 ], [ 12, 18, 13 ], [ 17, 19, 20 ], [ 1, 5, 6, 2 ], 
//                [ 5, 10, 11, 6 ], [ 7, 9, 13 ], [ 9, 12, 13 ], [ 13, 18, 16 ], [ 13, 16, 14 ] ]

// console.log("hello world")

const uploadFile = (event) => {
    const fr = new FileReader();

    fr.onload = function () {
        const FOLD = JSON.parse(fr.result);

        const displayOuterEdgeNodes = () => {
            const facesVertices = FOLD["faces_vertices"];
            const faceOrders = FOLD["faceOrders"]
            const outerEdgeNodes = findOuterEdgeNodes(facesVertices);
            document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            let leftOrRight = "edge -> [leftFace, rightFace]";
            findLeftRight(facesVertices, faceOrders).forEach((value, key) => {
                leftOrRight += `\n${key} -> [${value.join(", ")}]`;
            });
            document.getElementById('leftOrRight').textContent = leftOrRight;
        }

        const submit = document.getElementById("submit");
        submit.addEventListener("click", displayOuterEdgeNodes);
    };

    fr.readAsText(event.target.files[0]); // Use event.target for file input reference
}

// Attach the uploadFile function to the file input
document.getElementById("foldFile").addEventListener("change", uploadFile);

// FV = faces vertices
const findOuterEdgeNodes = (FV) => {
    const nonRepeatingEdges = new Map();
    const ans = new Set();

    for (const F of FV) {
        for (let i = 0; i < F.length; i++) {
            const current = F[i];
            const next = F[(i + 1) % F.length];

            // Ensure current < next without sorting
            const edge = current < next ? [current, next] : [next, current];
            const tempText = `${edge[0]},${edge[1]}`;

            // Track edges in nonRepeatingEdges map
            if (nonRepeatingEdges.has(tempText)) {
                nonRepeatingEdges.delete(tempText);
            } else {
                nonRepeatingEdges.set(tempText, edge);
            }
        }
    }

    // Collect outer edge nodes
    for (const edge of nonRepeatingEdges.values()) {
        for (const node of edge) {
            ans.add(node);
        }
    }

    return ans;
}

const findLeftRight = (FV, FO) => {
    const edgeFaceAdjacency = new Map();
    FV.forEach((face, i) => {
        face.forEach((current, j) => {
            const next = face[(j + 1) % face.length];
            const edgeKey = [current, next].toString();
            const reverseEdgeKey = [next, current].toString();

            if (edgeFaceAdjacency.has(reverseEdgeKey)) {
                // If reverse edge exists, assign `i` as the left face
                edgeFaceAdjacency.get(reverseEdgeKey)[0] = i;
            } else {
                // Otherwise, set current edge with `i` as the right face
                edgeFaceAdjacency.set(edgeKey, [, i, ]);
            }

    ///////// this portion was chatgptd
            // if (FO.some(innerArray => `${innerArray[0]},${innerArray[1]}` === edgeKey)) {
            //     // Check if edgeKey exists in the map
            //     if (!edgeFaceAdjacency.has(edgeKey)) {
            //         // Initialize edgeFaceAdjacency with a default value (e.g., an array with 3 null values)
            //         edgeFaceAdjacency.set(edgeKey, [null, null, null]);
            //     }
            //     // Update the third element of the array for the matching edgeKey
            //     edgeFaceAdjacency.get(edgeKey)[2] = FO.find(innerArray => `${innerArray[0]},${innerArray[1]}` === edgeKey)[2];
            // } else if (FO.some(innerArray => `${innerArray[1]},${innerArray[0]}` === edgeKey)) {
            //     // Check if edgeKey exists in the map
            //     if (!edgeFaceAdjacency.has(edgeKey)) {
            //         // Initialize edgeFaceAdjacency with a default value (e.g., an array with 3 null values)
            //         edgeFaceAdjacency.set(edgeKey, [null, null, null]);
            //     }
            //     // Update the third element of the array for the matching edgeKey
            //     edgeFaceAdjacency.get(edgeKey)[2] = FO.find(innerArray => `${innerArray[0]},${innerArray[1]}` === edgeKey)[2];
            // }
            // // } else if (FO.some(innerArray => `${innerArray[0]},${innerArray[1]}` === reverseEdgeKey)) {
            // //     edgeFaceAdjacency.get
            // // } 
            // else {
            //     edgeFaceAdjacency.get(edgeKey)[2] = 0
            // }
            // if (qwe) {
            // }

        });
    });
    return edgeFaceAdjacency;
};
 
// console.log(findLeftRight(faces))

