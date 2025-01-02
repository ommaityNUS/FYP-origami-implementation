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
            
            let leftOrRight = "edge -> [leftFace, rightFace, localFaceOrder, globalFaceOrder]";
            findLeftRightFO(faces_vertices, faceOrders).forEach((value, key) => {
                leftOrRight += `\n${key} -> [${value.join(", ")}]`;
            });
            document.getElementById('leftOrRight').textContent = leftOrRight;

            let globalFO = "face -> orientation" 
            findGlobalFO(faces_vertices, faceOrders).forEach((value, key) => {
                globalFO += `\n${key} -> [${value}]`;
            })
            document.getElementById('globalFO').textContent = globalFO
        }

        const drawSVG = () => {
            const VC = FOLD["vertices_coords"]
            const EV = FOLD["edges_vertices"]
            const scale = 500
            const adjustedScale = 490

            const container = document.createElement('div');
            container.id = 'svg-container';
            // document.body.appendChild(container);
            document.getElementById('outerEdgeNodes').prepend(container)

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '500');
            svg.setAttribute('height', '500');
            svg.setAttribute('style', 'border: none');
            // svg.setAttribute('viewBox', '-10 -10 10 10'); // Add padding of 10 units around
            // svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

            VC.forEach(vc => {
                const [x, y] = vc;
                console.log( [x, y]) 
                // Destructure x and y from the inner list
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x*(adjustedScale));
                circle.setAttribute('cy', y*(adjustedScale));
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', 'blue');
                svg.appendChild(circle);
            });

            EV.forEach(([ev1, ev2]) => {
            let [x1, y1] = VC[ev1];
            let [x2, y2] = VC[ev2];
            x1 = x1 * adjustedScale;
            y1 = y1 * adjustedScale;
            x2 = x2 * adjustedScale;
            y2 = y2 * adjustedScale;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '1');

            svg.appendChild(line)
            })

            container.appendChild(svg)
        }

        const submit = document.getElementById("submit");
        submit.addEventListener("click", displayOuterEdgeNodes);
        submit.addEventListener("click", drawSVG)
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
    FO.forEach(fo => {
        const key = [fo[0], fo[1]].toString();
        FOMap.set(key, fo[2]);
        const reverseKey = [fo[1], fo[0]].toString();
        FOMap.set(reverseKey, -fo[2]);
    });

    for (const fv of edgeFaceAdjacency.values()) {
        const edgeKey = [fv[0], fv[1]].toString();
        if (FOMap.has(edgeKey)) {
            fv.push(FOMap.get(edgeKey));
        }
    }
    return edgeFaceAdjacency;
};

const findGlobalFO = (FV, FO) => {
    ans = new Map()
    const up = 1
    const down = -1
    let direction = down
    for (let i = 0; i < FV.length; i++) {    
        // console.log(i, i+1)    
        const foExists = FO.some(fo => 
            (fo[0] === i && fo[1] === (i+1) % FV.length) ||
            (fo[1] === i && fo[0] === (i+1) % FV.length)
        );
        if (foExists) {
            // console.log(direction)
            if (direction == up) {
                direction = down
                ans.set(i, direction)
            } else if (direction == down) {
                direction = up
                ans.set(i, direction)
            }
        } else ans.set(i, direction)
    } return ans
}



 
// console.log(findLeftRight(faces))

