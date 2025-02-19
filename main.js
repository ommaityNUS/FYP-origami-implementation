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
            const FV = FOLD["faces_vertices"];
            let EV = FOLD["edges_vertices"];
            if (!EV) {
                EV = constructEdgesVertices(FV);
            }
            const VC = FOLD["vertices_coords"]
            const FO = FOLD["faceOrders"];
            edgeFaceAdjacency = findLeftRightFO(FV, FO);
            const EA = createEdgesAssignment(edgeFaceAdjacency, EV);
            const FD = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[1]   
     
            const outerEdgeNodes = findOuterEdgeNodes(FV);
            document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            
            let leftOrRight = "edge -> [leftFace, rightFace]";
            findLeftRightFO(FV, FO).forEach((value, key) => {
                leftOrRight += `\n${key} -> [${value.join(", ")}]`;
            });
            document.getElementById('leftOrRight').textContent = leftOrRight;

            let globalFO = "face -> [up?]" 
            FD.forEach((value, key) => {
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
            if (!EV) {
                EV = constructEdgesVertices(FV);
            }
            let FO = FOLD["faceOrders"];
            edgeFaceAdjacency = findLeftRightFO(FV, FO);
            let EA = createEdgesAssignment(edgeFaceAdjacency, EV); // edge assignment
            let FD = '' // face direction
            
            const svgSize = 500;
            const padding = 20;
            const effectiveSize = svgSize - (2 * padding);
            const svgNameSpace = 'http://www.w3.org/2000/svg';

            // logic for if you want to display an unfolded state
            if (folded == "unfolded") {
                VC = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[0]; 
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
        

            // const innerEdges = classifyEdges(edgeFaceAdjacency, EV)[0];
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
                    
                    // Use the helper function to determine start and end faces
                    const { startFace, endFace } = getArrowDirection(f1, f2, orientation, f2Orientation);
            
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

            const highlightOuterEdges = (edgeFaceAdjacency, EV, VC) => {
                for (const [edgeIndex, adjacency] of Object.entries(edgeFaceAdjacency)) {
                    if (adjacency.length === 1) { // Outer edge condition
                        let [ev1, ev2] = EV[edgeIndex];
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
                        line.setAttribute('stroke', 'yellow'); // Highlight outer edges in yellow
                        line.setAttribute('stroke-width', '2'); // Make it more visible
                        svg.appendChild(line);
                    }
                }
            };
            
            
            // Append the SVG element to the container
            if (folded == "unfolded"){
                container1.appendChild(svg);
                drawArrows(edgeFaceAdjacency, FD)
                highlightOuterEdges(edgeFaceAdjacency, EV, VC);
            } else if (folded == 'folded') {
                container2.appendChild(svg)
            }
            
        };

        // const submit = document.getElementById("submit");
        // submit.addEventListener("click", () => displayOuterEdgeNodes(FOLD));
        // submit.addEventListener("click", () => drawSVG("unfolded", FOLD, edgeFaceAdjacency))
        // submit.addEventListener("click", () => drawSVG("folded", FOLD, edgeFaceAdjacency)) 


        displayOuterEdgeNodes(FOLD);
        drawSVG("unfolded", FOLD, edgeFaceAdjacency); 
        drawSVG("folded", FOLD, edgeFaceAdjacency);
        classifyEdges(edgeFaceAdjacency);
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

const createEdgesAssignment = (edgeFaceAdjacency, EV) => {
    // Initialize EA with "U" (unassigned) for all edges
    const EA = new Array(EV.length).fill("B");
    
    // Helper function to check if two edges match (regardless of order)
    const edgesMatch = (edge1, edge2) => {
        return (edge1[0] === edge2[0] && edge1[1] === edge2[1]) ||
               (edge1[0] === edge2[1] && edge1[1] === edge2[0]);
    };
    
    // Iterate through edgeFaceAdjacency
    for (const [edgeKey, faceData] of edgeFaceAdjacency.entries()) {
        // Convert edge key string back to array of vertices
        const ev = edgeKey.split(',').map(Number);
        
        // Find matching edge in EV
        const edgeIndex = EV.findIndex(edge => 
            edgesMatch(edge, ev)
        );
        
        // If we found a matching edge
        if (edgeIndex !== -1) {
            // Get the face order value (third element in faceData)
            const order = faceData[2];
            
            // Assign M/V based on order
            if (order === 1) {
                EA[edgeIndex] = "V";  // Valley fold
            } else if (order === -1) {
                EA[edgeIndex] = "M";  // Mountain fold
            }
        }
    }
    return EA;
};

const getArrowDirection = (f1, f2, orientation, f2Orientation) => {
    let startFace, endFace;

    if (f2Orientation === false) {
        startFace = (orientation === 1) ? f1 : f2;
        endFace = (orientation === 1) ? f2 : f1;
    } else {
        startFace = (orientation === 1) ? f2 : f1;
        endFace = (orientation === 1) ? f1 : f2;
    }

    return { startFace, endFace };
};

const constructEdgesVertices = (faces_vertices) => {
    const edgeSet = new Set();  // Use Set to store unique edges
    const edges_vertices = [];
    
    // Helper function to create consistent edge representation
    const createEdgeKey = (v1, v2) => {
        // Always store edge with smaller vertex number first
        return [Math.min(v1, v2), Math.max(v1, v2)].toString();
    };
    
    // Go through each face
    faces_vertices.forEach(face => {
        // Look at each consecutive pair of vertices
        for (let i = 0; i < face.length; i++) {
            const v1 = face[i];
            const v2 = face[(i + 1) % face.length];  // Wrap around to first vertex
            
            const edgeKey = createEdgeKey(v1, v2);
            
            // If we haven't seen this edge before
            if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                // Add edge to edges_vertices array
                edges_vertices.push([Math.min(v1, v2), Math.max(v1, v2)]);
            }
        }
    });
    
    return edges_vertices;
};

const classifyEdges = (edgeFaceAdjacency) => {
    const innerEdges = new Set();
    const outerEdges = new Set();
    
    for (const [edge, faceData] of edgeFaceAdjacency.entries()) {
        const [face1, face2, foldOrder] = faceData;
        // console.log("face1 is "+ face1)
        
        if (face1 !== undefined && face2 !== undefined) {
            // Edge has two adjacent faces
            if (foldOrder === undefined) {
                // If no fold order, it's an unfolded inner edge
                innerEdges.add(edge);
            }
        } else {
            // Edge has only one face, it's an outer edge
            outerEdges.add(edge);
        }
    }
    
    console.log("inner edges are ", innerEdges)
    console.log("outer edges are ",  outerEdges)
    return {
        innerEdges: Array.from(innerEdges),
        outerEdges: Array.from(outerEdges)
    };
};