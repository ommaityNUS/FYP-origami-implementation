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

        const displayOuterEdgeNodes = (FOLD) => {
            const faces_vertices = FOLD["faces_vertices"];
            const edges_vertices = FOLD["edges_vertices"];
            const edges_assignment = FOLD["edges_assignment"];
            const vertices_coords = FOLD["vertices_coords"]
            const faceDirections = X.V_FV_EV_EA_2_Vf_Ff(vertices_coords, faces_vertices, edges_vertices, edges_assignment)[1]
            
            
            let faceOrders = FOLD["faceOrders"];
            if (FOLD["faceOrders"] == undefined) {
                faceOrders = determineFaceOrders(FOLD);
            }
            // const foldedStateV = X.V_FV_EV_EA_2_Vf_Ff(vertices_coords, faces_vertices, edges_vertices, edges_assignment)[0]
     
            const outerEdgeNodes = findOuterEdgeNodes(faces_vertices);
            document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            
            let leftOrRight = "edge -> [leftFace, rightFace]";
            findLeftRightFO(faces_vertices, faceOrders).forEach((value, key) => {
                leftOrRight += `\n${key} -> [${value.join(", ")}]`;
            });
            document.getElementById('leftOrRight').textContent = leftOrRight;

            let globalFO = "face -> [up?]" 
            faceDirections.forEach((value, key) => {
                globalFO += `\n${key} -> [${value}]`;
            })
            document.getElementById('globalFO').textContent = globalFO
        }

        const drawSVG = (folded, FOLD, edgeFaceAdjacency) => {
            
            if (document.getElementById('container2')) {
                document.getElementById('container2').remove()
                document.getElementById('container1').remove()
            } 
            let VC = FOLD["vertices_coords"]; 
            let EV = FOLD["edges_vertices"]; 
            let FV = FOLD["faces_vertices"]; 
            let FO = FOLD["faceOrders"];
            if (FOLD["faceOrders"] == undefined) {
                FO = determineFaceOrders(FOLD);
            }
            let EA = FOLD["edges_assignment"];
            let FD = '' // face direction
            
            const svgSize = 500;
            const padding = 20;
            const effectiveSize = svgSize - (2 * padding);
            const svgNameSpace = 'http://www.w3.org/2000/svg';

            // logic for if you want to display an unfolded state
            if (folded == "unfolded") {
                if (isFoldedState(FOLD) == true) {
                    console.log("this file is not folded")
                    VC = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[0]; 
                } else if (isFoldedState(FOLD) == false) {
                    console.log("this file is already unfolded")
                }
                edgeFaceAdjacency = findLeftRightFO(FV, FO);
                FD = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[1];
            }

            

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            VC.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });

            // Calculate scaling factor to fit the drawing
            const width = maxX - minX;
            const height = maxY - minY;
            const scale = Math.min(effectiveSize / width, effectiveSize / height);

            const transformCoord = (coord, min, max) => {
                const centered = coord - min;
                const scaled = centered * scale;
                const offset = padding + (effectiveSize - (max - min) * scale) / 2;
                return scaled + offset;
            };

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
            svg.setAttribute('width', svgSize);
            svg.setAttribute('height', svgSize);
            svg.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
            svg.setAttribute('style', 'border: none');
                
            // Draw vertices
            VC.forEach((vc, i) => {
                const [x, y] = vc;
                const transformedX = transformCoord(x, minX, maxX);
                const transformedY = transformCoord(y, minY, maxY);
                const circle = document.createElementNS(svgNameSpace, 'circle');
                circle.setAttribute('id', `vertex_${i}`);
                circle.setAttribute('cx', transformedX);
                circle.setAttribute('cy', transformedY);
                circle.setAttribute('r', '2');
                circle.setAttribute('fill', 'black');
                svg.appendChild(circle);
            });
        
            // Draw edges
            const colors = new Map([
                ['M', 'red'],
                ['V', 'blue'],
                ['B', 'grey']
            ]);
            EV.forEach((ev, index) => {
                let [ev1, ev2] = ev;
                let [x1, y1] = VC[ev1];
                let [x2, y2] = VC[ev2];

                const transformedX1 = transformCoord(x1, minX, maxX);
                const transformedY1 = transformCoord(y1, minY, maxY);
                const transformedX2 = transformCoord(x2, minX, maxX);
                const transformedY2 = transformCoord(y2, minY, maxY);
        
                const line = document.createElementNS(svgNameSpace, 'line');
                line.setAttribute('x1', transformedX1);
                line.setAttribute('y1', transformedY1);
                line.setAttribute('x2', transformedX2);
                line.setAttribute('y2', transformedY2);
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
            const drawArrows = (edgeFaceAdjacency, FD) => {
                const fixedOffset = 10; // Fixed number of pixels to shorten by
            
                for (const af of edgeFaceAdjacency.values()) {
                    const [f1, f2, orientation] = af;
                    if (f1 == null || f2 == null || orientation == null) continue;
            
                    const f2Orientation = FD[f2]; // true is up, false is down
                    let startFace, endFace;
            
                    // Determine start and end faces based on orientation
                    if (f2Orientation === false) {
                        startFace = (orientation === 1) ? f1 : f2;
                        endFace = (orientation === 1) ? f2 : f1;
                    } else {
                        startFace = (orientation === 1) ? f2 : f1;
                        endFace = (orientation === 1) ? f1 : f2;
                    }
            
                    // Compute centroids
                    const startVerts = FV[startFace].map(v => VC[v]);
                    const endVerts = FV[endFace].map(v => VC[v]);
                    const startCentroid = M.centroid(startVerts);
                    const endCentroid = M.centroid(endVerts);
            
                    // Transform coordinates
                    const x1 = transformCoord(startCentroid[0], minX, maxX);
                    const y1 = transformCoord(startCentroid[1], minY, maxY);
                    const x2 = transformCoord(endCentroid[0], minX, maxX);
                    const y2 = transformCoord(endCentroid[1], minY, maxY);
            
                    // Compute direction vector
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const length = Math.sqrt(dx * dx + dy * dy);
            
                    if (length < fixedOffset) continue; // Prevent arrows from disappearing if too short
            
                    // Normalize vector
                    const nx = dx / length;
                    const ny = dy / length;
            
                    // Move endpoint back by a fixed amount
                    const endX = x2 - nx * fixedOffset;
                    const endY = y2 - ny * fixedOffset;
            
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
            
        
            // Append the SVG element to the container
            if (folded == "unfolded"){
                container1.appendChild(svg);
                drawArrows(edgeFaceAdjacency, FD)
            } else if (folded == 'folded') {
                container2.appendChild(svg)
            }
            
        };

        const submit = document.getElementById("submit");
        submit.addEventListener("click", () => displayOuterEdgeNodes(FOLD));
        
        submit.addEventListener("click", () => drawSVG("unfolded", FOLD, edgeFaceAdjacency))
        submit.addEventListener("click", () => drawSVG("folded", FOLD, edgeFaceAdjacency)) 
        submit.addEventListener("click", () => determineFaceOrders(FOLD)) 
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
    const localFaceOrder = new Map();
    const edgeFaceAdjacency = new Map();
    
    // Build initial edge-face adjacency
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

    // For each pair of adjacent faces, check if they exist in FO
    for (const [edge, faces] of edgeFaceAdjacency.entries()) {
        const [face1, face2] = faces;
        if (face1 === undefined || face2 === undefined) continue;

        // Check each FO entry
        for (const [f1, f2, orientation] of FO) {
            // If we find these faces in FO (in either order)
            if ((face1 === f1 && face2 === f2) || (face1 === f2 && face2 === f1)) {
                // Replace the faces array with the ordered version from FO
                edgeFaceAdjacency.set(edge, [f1, f2, orientation]);
                break;
            }
        }
    }

    return edgeFaceAdjacency;
};

function determineFaceOrders(FOLD) {
    let faces_vertices = FOLD["faces_vertices"];
    let edges_vertices = FOLD["edges_vertices"];
    let edges_assignment = FOLD["edges_assignment"];
    let faceOrders = [];

    // Step 1: Build adjacency map (which faces share an edge)
    let edgeToFaces = new Map();
    faces_vertices.forEach((face, fIndex) => {
        for (let i = 0; i < face.length; i++) {
            let edge = [face[i], face[(i + 1) % face.length]].sort((a, b) => a - b).join(',');
            if (!edgeToFaces.has(edge)) edgeToFaces.set(edge, []);
            edgeToFaces.get(edge).push(fIndex);
        }
    });

    // Step 2: Assign relative stacking orders
    edges_vertices.forEach(([v1, v2], eIndex) => {
        let edgeKey = [v1, v2].sort((a, b) => a - b).join(',');
        let adjacentFaces = edgeToFaces.get(edgeKey) || [];

        if (adjacentFaces.length === 2) {
            let [f, g] = adjacentFaces;
            let assignment = edges_assignment[eIndex];
            let s = 0; // Default unknown stacking order

            if (assignment === 'M') {
                s = -1;  // f is above g
            } else if (assignment === 'V') {
                s = 1; // f is below g
            }

            faceOrders.push([f, g, s]);
        }
    });

    return faceOrders;
}

function isFoldedState(FOLD) {
    // Check if faceOrders exist
    if (FOLD["faceOrders"] && FOLD["faceOrders"].length > 0) {
        return true; // Explicit stacking order exists
    }

    if (FOLD["vertices_coords"] && FOLD["vertices_coords"].some(v => v[0] === 0 && v[1] === 0)) {
        return false; // Presence of [0,0] means it's not folded
    }
    return false;
}

