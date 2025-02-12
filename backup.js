import { M } from "./math.js";
import { SVG } from "./svg.js";
import { X } from "./conversion.js";

// const faces = [[ 14, 16, 22, 15 ], [ 16, 18, 21, 22 ], [ 2, 7, 14, 15 ], [ 2, 15, 8, 3 ], [ 11, 17, 20, 21 ], [ 11, 21, 18, 12 ], [ 2, 6, 9, 7 ], 
//                [ 6, 11, 12, 9 ], [ 0, 10, 5 ], [ 0, 5, 1 ], [ 3, 8, 4 ], [ 7, 13, 14 ], [ 12, 18, 13 ], [ 17, 19, 20 ], [ 1, 5, 6, 2 ], 
//                [ 5, 10, 11, 6 ], [ 7, 9, 13 ], [ 9, 12, 13 ], [ 13, 18, 16 ], [ 13, 16, 14 ] ]

const uploadFile = (event) => {
    const fr = new FileReader();

    fr.onload = function () {
        const FOLD = JSON.parse(fr.result);
        let edgeFaceAdjacency = ''

        // const displayOuterEdgeNodes = (FOLD) => {
        //     const faces_vertices = FOLD["faces_vertices"];
        //     const edges_vertices = FOLD["edges_vertices"];
        //     const edges_assignment = FOLD["edges_assignment"];
        //     const vertices_coords = FOLD["vertices_coords"]
        //     const faceOrders = X.V_FV_EV_EA_2_Vf_Ff(vertices_coords, faces_vertices, edges_vertices, edges_assignment)[1]
        //     const foldedStateV = X.V_FV_EV_EA_2_Vf_Ff(vertices_coords, faces_vertices, edges_vertices, edges_assignment)[0]
     
        //     const outerEdgeNodes = findOuterEdgeNodes(faces_vertices);
        //     document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            
        //     let leftOrRight = "edge -> [leftFace, rightFace]";
        //     findLeftRightFO(faces_vertices, faceOrders).forEach((value, key) => {
        //         leftOrRight += `\n${key} -> [${value.join(", ")}]`;
        //     });
        //     document.getElementById('leftOrRight').textContent = leftOrRight;

        //     let globalFO = "face -> [up?]" 
        //     faceOrders.forEach((value, key) => {
        //         globalFO += `\n${key} -> [${value}]`;
        //     })
        //     document.getElementById('globalFO').textContent = globalFO
        // }

        const drawSVG = (folded, FOLD, edgeFaceAdjacency) => {
            let VC = FOLD["vertices_coords"]; // Vertex coordinates
            let EV = FOLD["edges_vertices"]; // Edge definitions
            let FV = FOLD["faces_vertices"]; // Replace with your actual logic to get faces
            let FO = FOLD["faceOrders"];
            let EA = FOLD["edges_assignment"];
            const scale = 500
            const adjustedScale = 490
            const svgNameSpace = 'http://www.w3.org/2000/svg';
            // let edgeFaceAdjacency = ''

            if (document.getElementById('container2')) {
                document.getElementById('container2').remove()
                document.getElementById('container1').remove()
            } 

            if (folded == "unfolded") {
                VC = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[0]; // Vertex coordinates
                edgeFaceAdjacency = findLeftRightFO(FV);
            }

            // Create container and SVG element
            let container1 = document.getElementById('container1');
            let container2 = document.getElementById('container2');
            if (container1) {
                container2 = document.createElement('div')
                container2.id = 'container2'
                container2.style.display = 'inline-block';
                document.getElementById('outerEdgeNodes').insertAdjacentElement('beforebegin', container2);
            } else {
                container1 = document.createElement('div')
                container1.id = 'container1'
                container1.style.display = 'inline-block';
                document.getElementById('outerEdgeNodes').insertAdjacentElement('beforebegin', container1);
            }
            
            const svg = document.createElementNS(svgNameSpace, 'svg');
            svg.setAttribute('width', '500');
            svg.setAttribute('height', '500');
            svg.setAttribute('viewBox', '-10 -10 520 520');
            svg.setAttribute('style', 'border: none');
        
            // Draw vertices
            VC.forEach((vc, i) => {
                const [x, y] = vc;
                const circle = document.createElementNS(svgNameSpace, 'circle');
                circle.setAttribute('id', `vertex_${i}`);
                circle.setAttribute('cx', x * adjustedScale);
                circle.setAttribute('cy', y * adjustedScale);
                circle.setAttribute('r', '2');
                circle.setAttribute('fill', 'black');
                svg.appendChild(circle);
            });
        
            // Draw edges
            const colors = new Map();
            colors.set('M', 'red')
            colors.set('V', 'blue')
            colors.set('B', 'grey')
            EV.forEach((ev, index) => {
                let [ev1, ev2] = ev;
                let [x1, y1] = VC[ev1];
                let [x2, y2] = VC[ev2];
                x1 = x1 * adjustedScale;
                y1 = y1 * adjustedScale;
                x2 = x2 * adjustedScale;
                y2 = y2 * adjustedScale;
        
                const line = document.createElementNS(svgNameSpace, 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                if (folded == "unfolded") {
                    line.setAttribute('stroke', colors.get(EA[index]));
                } else {
                    line.setAttribute('stroke', 'grey');
                }
                line.setAttribute('stroke-width', '1');
                svg.appendChild(line);
            });
        
            // Add arrow marker
            const marker = document.createElementNS(svgNameSpace, 'marker');
            marker.setAttribute('id', 'arrow');
            marker.setAttribute('viewBox', '0 0 10 10');
            marker.setAttribute('refX', '5');
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('orient', 'auto');
        
            const path = document.createElementNS(svgNameSpace, 'path');
            path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 Z');
            path.setAttribute('fill', 'green');
            marker.appendChild(path);
            svg.appendChild(marker);
        
            // Draw arrows
            const drawArrows = (edgeFaceAdjacency) => {
                for (const af of edgeFaceAdjacency.values()) {
                    const [f1, f2] = af;
                    if (f1 == null || f2 == null) continue;
        
                    // Calculate centroids as before
                    const f1vc = [];
                    FV[f1].forEach((v) => f1vc.push(VC[v]));
                    const f2vc = [];
                    FV[f2].forEach((v) => f2vc.push(VC[v]));
        
                    const centroid1 = M.centroid(f1vc);
                    const centroid2 = M.centroid(f2vc);
        
                    // Scale the coordinates
                    const [x1, y1] = centroid1.map((coord) => coord * adjustedScale);
                    const [x2, y2] = centroid2.map((coord) => coord * adjustedScale);
        
                    // Calculate the direction vector
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    
                    // Calculate the length of the vector
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    // Normalize the direction vector
                    const nx = dx / length;
                    const ny = dy / length;
                    
                    // Calculate the end point that's shorter
                    const shortenAmount = 20; // Number of pixels to shorten by
                    const endX = x2 - (nx * shortenAmount);
                    const endY = y2 - (ny * shortenAmount);
        
                    // Draw the arrow
                    const line = document.createElementNS(svgNameSpace, 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', endX);
                    line.setAttribute('y2', endY);
                    line.setAttribute('stroke', 'green');
                    line.setAttribute('stroke-width', '1');
                    line.setAttribute('marker-end', 'url(#arrow)');
                    svg.appendChild(line);
                }
            };
            
        
            // // Call the drawArrows function
        
            // Append the SVG element to the container
            if (folded == "unfolded"){
                container1.appendChild(svg);
                drawArrows(edgeFaceAdjacency)
            } else if (folded == 'folded') {
                container2.appendChild(svg)
            }
            
        };

        const submit = document.getElementById("submit");
        // submit.addEventListener("click", displayOuterEdgeNodes);
        
        submit.addEventListener("click", () => drawSVG("unfolded", FOLD, edgeFaceAdjacency))
        submit.addEventListener("click", () => drawSVG("folded", FOLD, edgeFaceAdjacency)) 
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

//seperate everything into functions within functions
const findLeftRightFO = (FV, FO) => {
    const localFaceOrder = new Map()
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

    // // Build a lookup map for FO
    // const FOMap = new Map();
    // FO.forEach(fo => {
    //     const key = [fo[0], fo[1]].toString();
    //     FOMap.set(key, fo[2]);
    //     const reverseKey = [fo[1], fo[0]].toString();
    //     FOMap.set(reverseKey, -fo[2]);
    // });

    // for (const f of edgeFaceAdjacency.values()) {
    //     const edgeKey = [f[0], f[1]].toString();
    //     if (FOMap.has(edgeKey)) {
    //         f.push(FOMap.get(edgeKey));
    //     }
    // }

    // for (const f of edgeFaceAdjacency.values()) {
    //     let init = 1
    //     for (const a of f.slice(0,2)) {
    //         if (!localFaceOrder.has(a)) {
    //             if (a || a == 0) {
    //                 localFaceOrder.set(a, init)
    //                 if (f.length == 3) {
    //                     init = init*-1
    //                 }
    //             }
    //         } else if (localFaceOrder.has(a)) {
    //         }
    //     }
    // }
    // console.log(localFaceOrder)
    return edgeFaceAdjacency;    
};

