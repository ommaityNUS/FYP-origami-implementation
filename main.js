// const faces = [[ 14, 16, 22, 15 ], [ 16, 18, 21, 22 ], [ 2, 7, 14, 15 ], [ 2, 15, 8, 3 ], [ 11, 17, 20, 21 ], [ 11, 21, 18, 12 ], [ 2, 6, 9, 7 ], 
//                [ 6, 11, 12, 9 ], [ 0, 10, 5 ], [ 0, 5, 1 ], [ 3, 8, 4 ], [ 7, 13, 14 ], [ 12, 18, 13 ], [ 17, 19, 20 ], [ 1, 5, 6, 2 ], 
//                [ 5, 10, 11, 6 ], [ 7, 9, 13 ], [ 9, 12, 13 ], [ 13, 18, 16 ], [ 13, 16, 14 ] ]

// console.log("hello world")

const uploadFile = (event) => {
    const fr = new FileReader();

    fr.onload = function () {
        const FOLD = JSON.parse(fr.result);

        const displayOuterEdgeNodes = () => {
            const faces_vertices = FOLD["faces_vertices"];
            const faceOrders = FOLD["faceOrders"]
            const outerEdgeNodes = findOuterEdgeNodes(faces_vertices);
            document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            let leftOrRight = "edge -> [leftFace, rightFace, faceOrder]";
            findLeftRightFO(faces_vertices, faceOrders).forEach((value, key) => {
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

const findLeftRightFO = (FV, FO) => {
    const edgeFaceAdjacency = new Map();
    FV.forEach((face, i) => {
        face.forEach((current, j) => {
            const next = face[(j + 1) % face.length];
            const edgeKey = [current, next].toString();
            const reverseEdgeKey = [next, current].toString();

            if (edgeFaceAdjacency.has(reverseEdgeKey)) {
                edgeFaceAdjacency.get(reverseEdgeKey)[0] = i;
            } else {
                edgeFaceAdjacency.set(edgeKey, [, i]);
            }
        });
    });

    // Build a lookup map for FO
    const FOMap = new Map();
    FO.forEach(innerArray => {
        const key = [innerArray[0], innerArray[1]].toString();
        FOMap.set(key, innerArray[2]);
        const reverseKey = [innerArray[1], innerArray[0]].toString();
        FOMap.set(reverseKey, -innerArray[2]);
    });

    for (const a of edgeFaceAdjacency.values()) {
        const edgeKey = [a[0], a[1]].toString();
        if (FOMap.has(edgeKey)) {
            a.push(FOMap.get(edgeKey));
        }
    }

    return edgeFaceAdjacency;
};

 
// console.log(findLeftRight(faces))

