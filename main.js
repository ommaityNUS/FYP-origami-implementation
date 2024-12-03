// const faces = [[ 14, 16, 22, 15 ], [ 16, 18, 21, 22 ], [ 2, 7, 14, 15 ], [ 2, 15, 8, 3 ], [ 11, 17, 20, 21 ], [ 11, 21, 18, 12 ], [ 2, 6, 9, 7 ], 
//                [ 6, 11, 12, 9 ], [ 0, 10, 5 ], [ 0, 5, 1 ], [ 3, 8, 4 ], [ 7, 13, 14 ], [ 12, 18, 13 ], [ 17, 19, 20 ], [ 1, 5, 6, 2 ], 
//                [ 5, 10, 11, 6 ], [ 7, 9, 13 ], [ 9, 12, 13 ], [ 13, 18, 16 ], [ 13, 16, 14 ] ]

console.log("hello world")
let foldFile = document.getElementById("foldFile")
let submit = document.getElementById("submit")

foldFile.addEventListener("change", uploadFile)
function uploadFile() {
    let fr = new FileReader();
    fr.onload = function () {
        // document.getElementById('output')
        //     .textContent = fr.result;
        FOLD = JSON.parse(fr.result)
    }
    fr.readAsText(this.files[0]);
}

submit.addEventListener("click", displayOuterEdgeNodes) 
function displayOuterEdgeNodes() {
    let facesVertices = FOLD["faces_vertices"]
    let outerEdgeNodes = findOuterEdgeNodes(facesVertices)
    document.getElementById('output').textContent = Array.from(outerEdgeNodes)
}

function findOuterEdgeNodes(faces) {
    let nonRepeatingEdges = new Map();
    let ans = new Set();

    for (let face of faces) {
        for (let i = 0; i < face.length; i++) {
            let current = face[i];
            let next = face[(i + 1) % face.length];

            // Ensure current < next without sorting
            let edge = current < next ? [current, next] : [next, current];
            let tempText = `${edge[0]},${edge[1]}`;

            // Track edges in nonRepeatingEdges map
            if (nonRepeatingEdges.has(tempText)) {
                nonRepeatingEdges.delete(tempText);
            } else {
                nonRepeatingEdges.set(tempText, edge);
            }
        }
    }

    // Collect outer edge nodes
    for (let edge of nonRepeatingEdges.values()) {
        for (let node of edge) {
            ans.add(node);
        }
    }

    return ans;
}
 
// console.log(findOuterEdgeNodes(faces))

