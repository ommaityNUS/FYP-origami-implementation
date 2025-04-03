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
        const arrowset = []

        const displayOuterEdgeNodes = (FOLD) => {
            const FV = FOLD["faces_vertices"];
            let EV = FOLD["edges_vertices"];
            if (!EV) {
                EV = constructEdgesVertices(FV);
            }
            const VC = FOLD["vertices_coords"]
            const FO = FOLD["faceOrders"];
            edgeFaceAdjacency = findAdjacentFaces(FV, FO);
            const EA = createEdgesAssignment(edgeFaceAdjacency, EV);
            const FD = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[1]   
     
            const outerEdgeNodes = findOuterEdgeNodes(FV);
            document.getElementById('outerEdgeNodes').textContent = "Outer edge nodes are: " + Array.from(outerEdgeNodes);
            
            let adjacentFaces = "edge -> [f1, f2, order]";
            findAdjacentFaces(FV, FO).forEach((value, key) => {
                adjacentFaces += `\n${key} -> [${value.join(", ")}]`;
            });
            document.getElementById('adjacentFaces').textContent = adjacentFaces;

            let globalFO = "face -> [up?]" 
            FD.forEach((value, key) => {
                globalFO += `\n${key} -> [${value}]`;
            })
            document.getElementById('globalFO').textContent = globalFO
        }

        const drawSVG = (folded, FOLD, edgeFaceAdjacency, movingAndNotMovingFaces) => {
            
            if (document.getElementById('container2')) {
                document.getElementById('container2').remove()
                document.getElementById('container1').remove()
            } 
            const displayFacegraph = document.getElementById('faceGraph');
            // const labelVertices = document.getElementById('labelVertices');
            let VC = FOLD["vertices_coords"]; 
            let EV = FOLD["edges_vertices"]; 
            let FV = FOLD["faces_vertices"]; 
            if (!EV) {
                EV = constructEdgesVertices(FV);
            }
            let FO = FOLD["faceOrders"];
            edgeFaceAdjacency = findAdjacentFaces(FV, FO);
            let EA = createEdgesAssignment(edgeFaceAdjacency, EV); // edge assignment
            let FD = '' // face direction
            let greenArrows = [];
            
            const svgSize = 500;
            const padding = 20;
            const effectiveSize = svgSize - (2 * padding);
            const svgNameSpace = 'http://www.w3.org/2000/svg';
        
            // State variables for toggle features
            let showVertexLabels = true;
            let showGreenArrows = true;
            let showFaceLabels = true;
        
            // logic for if you want to display an unfolded state
            if (folded == "unfolded") {
                VC = X.V_FV_EV_EA_2_Vf_Ff(VC, FV, EV, EA)[0]; 
                edgeFaceAdjacency = findAdjacentFaces(FV, FO);
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
                
            let highlightedCircle = null; // Keep track of the currently highlighted circle
        
            const handleVertexClick = (event) => {
                const vertexId = event.target.dataset.vertexId; // Get the vertex ID from the invisible circle
                if (!vertexId) return;
            
                // Reset all highlights completely
                const existingHighlightedCircles = svg.querySelectorAll('[id^="highlight_"]');
                existingHighlightedCircles.forEach(circle => {
                    circle.setAttribute('fill', 'transparent');
                });
            
                // Highlight the newly selected circle
                const newHighlightedCircle = document.getElementById(`highlight_${vertexId}`);
                newHighlightedCircle.setAttribute('fill', '#ffb43d'); // Yellow color
            
                // Remove ALL highlighted edge lines (without relying on a specific attribute)
                const highlightedEdges = svg.querySelectorAll('line[stroke="pink"], line[stroke="orange"]');
                highlightedEdges.forEach(line => line.remove());
            
                // Call the search function and capture visited edges
                const edgeLeftOrRight = setLeftRightOrderFO(FOLD["faces_vertices"], arrowset);
                const visitedEdges = dfsLeftToRightEdges(vertexId, edgeLeftOrRight, unfoldedVertices);
                
                // const colorsort = dfsFaceTraversal(FOLD, vertexId, visitedEdges, movingAndNotMovingFaces);
                const colorsort = colorMovingFaces(FOLD, vertexId, visitedEdges, movingAndNotMovingFaces);

                const reverseFolds = findSimilarAngleEdges(visitedEdges, FOLD["vertices_coords"]);
            
                // Highlight visited edges if in unfolded state
                // if (folded === "unfolded") {
                highlightVisitedEdges(visitedEdges, EV, VC, transformCoord, minX, maxX, minY, maxY, svg);
                
            };
        
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
                line.setAttribute('stroke-width', '0.5');
                svg.appendChild(line);
            });
        
            // Store all vertex labels in a group for easy toggling
            const vertexLabelsGroup = document.createElementNS(svgNameSpace, 'g');
            vertexLabelsGroup.setAttribute('id', 'vertex-labels');
            svg.appendChild(vertexLabelsGroup);

            const faceLabelsGroup = document.createElementNS(svgNameSpace, 'g');
            faceLabelsGroup.setAttribute('id', 'face-labels');
            svg.appendChild(faceLabelsGroup);
        
            // Modify the vertex drawing loop to add event listeners
            VC.forEach((vc, i) => {
                const [x, y] = vc;
                const transformedX = transformCoord(x, minX, maxX);
                const transformedY = transformCoord(y, minY, maxY);
            
                // Only create and append the highlight circle if "unfolded"
                if (folded === "unfolded") {
                    const highlightCircle = document.createElementNS(svgNameSpace, 'circle');
                    highlightCircle.setAttribute('id', `highlight_${i}`);
                    highlightCircle.setAttribute('cx', transformedX);
                    highlightCircle.setAttribute('cy', transformedY);
                    highlightCircle.setAttribute('r', '12.5'); // Bigger circle around the vertex
                    highlightCircle.setAttribute('fill', 'transparent'); // Start as invisible
                    highlightCircle.setAttribute('opacity', '0.5'); // Slight transparency
                    highlightCircle.style.cursor = 'pointer'; // Indicate it's clickable
                    highlightCircle.dataset.vertexId = i; // Store ID in dataset for easy retrieval
                    
                    // Add click event listener
                    highlightCircle.addEventListener('click', handleVertexClick);
                    
                    // Add hover effects
                    highlightCircle.addEventListener('mouseenter', (event) => {
                        // Only change to grey if not already highlighted (not yellow)
                        if (event.target.getAttribute('fill') !== '#ffb43d') {
                            event.target.setAttribute('fill', 'grey');
                        }
                    });
                    
                    highlightCircle.addEventListener('mouseleave', (event) => {
                        // Only change back to transparent if not highlighted (not yellow)
                        if (event.target.getAttribute('fill') !== '#ffb43d') {
                            event.target.setAttribute('fill', 'transparent');
                        }
                    });
        
                    // Append highlight circle
                    svg.appendChild(highlightCircle);
                }
            
                // Only add text labels if "unfolded"
                if (folded === "unfolded") {
                    const text = document.createElementNS(svgNameSpace, 'text');
                    text.setAttribute('x', transformedX + 5);
                    text.setAttribute('y', transformedY - 5);
                    text.setAttribute('font-size', '10');
                    text.setAttribute('fill', 'black');
                    text.textContent = i;
                    text.classList.add('vertex-label');
                    vertexLabelsGroup.appendChild(text);
                }
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
        
            // Create a group for green arrows to make them toggleable
            const greenArrowsGroup = document.createElementNS(svgNameSpace, 'g');
            greenArrowsGroup.setAttribute('id', 'green-arrows');
            svg.appendChild(greenArrowsGroup);
        
            // Draw arrows
            const drawArrows = (edgeFaceAdjacency, FD) => {
                const fixedOffset = 10; // Fixed number of pixels to shorten by
                
                for (const af of edgeFaceAdjacency.values()) {
                    const [f1, f2, orientation] = af;
                    if (f1 == null || f2 == null || orientation == null) continue;
            
                    const f2Orientation = FD[f2]; // true is up, false is down
                    
                    // Use the helper function to determine start and end faces
                    const { startFace, endFace } = getArrowDirection(f1, f2, orientation, f2Orientation);
                    arrowset.push([startFace, endFace])
            
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
                    line.setAttribute('stroke-width', '0.6');
                    line.setAttribute('marker-end', 'url(#arrow)');
                    line.classList.add('green-arrow');
                    greenArrowsGroup.appendChild(line);
                }
            };
            
            const highlightVisitedEdges = (visitedEdges, EV, VC, transformCoord, minX, maxX, minY, maxY, svg) => {
                // First, define the arrowhead marker
                const defs = document.createElementNS(svgNameSpace, 'defs');
                svg.appendChild(defs);
                
                // Create two markers - one for each color
                const createMarker = (id, color) => {
                    const marker = document.createElementNS(svgNameSpace, 'marker');
                    marker.setAttribute('id', id);
                    marker.setAttribute('viewBox', '0 0 10 10');
                    marker.setAttribute('refX', '5');
                    marker.setAttribute('refY', '5');
                    marker.setAttribute('markerWidth', '2.5');
                    marker.setAttribute('markerHeight', '2.5');
                    marker.setAttribute('orient', 'auto');
                    
                    const path = document.createElementNS(svgNameSpace, 'path');
                    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
                    path.setAttribute('fill', color);
                    
                    marker.appendChild(path);
                    return marker;
                };
                
                defs.appendChild(createMarker('arrowPink', 'pink'));
                defs.appendChild(createMarker('arrowOrange', 'orange'));
                
                visitedEdges.forEach((edgeData, edgeKey) => {
                    // Parse the edge key back to vertex indices
                    const [v1, v2] = edgeKey.split(",").map(Number);
                    
                    // Find the corresponding edge in EV
                    const edgeIndex = EV.findIndex(edge =>
                        (edge[0] === v1 && edge[1] === v2) ||
                        (edge[0] === v2 && edge[1] === v1)
                    );
                    
                    if (edgeIndex !== -1) {
                        // Get vertex coordinates
                        let [x1, y1] = VC[v1];
                        let [x2, y2] = VC[v2];
            
                        const transformedX1 = transformCoord(x1, minX, maxX);
                        const transformedY1 = transformCoord(y1, minY, maxY);
                        const transformedX2 = transformCoord(x2, minX, maxX);
                        const transformedY2 = transformCoord(y2, minY, maxY);
            
                        // Determine color based on edge direction
                        const lineColor = edgeData[2] === 1 ? 'pink' : 'orange';
                        const arrowMarkerId = edgeData[2] === 1 ? 'arrowPink' : 'arrowOrange';
                        
                        // Instead of using a line with marker-end, use a path to place the marker in the middle
                        // Calculate midpoint of the line
                        const midX = (transformedX1 + transformedX2) / 2;
                        const midY = (transformedY1 + transformedY2) / 2;
                        
                        // Create two line segments - one from start to middle, one from middle to end
                        const line1 = document.createElementNS(svgNameSpace, 'line');
                        line1.setAttribute('x1', transformedX1);
                        line1.setAttribute('y1', transformedY1);
                        line1.setAttribute('x2', midX);
                        line1.setAttribute('y2', midY);
                        line1.setAttribute('stroke', lineColor);
                        line1.setAttribute('stroke-width', '5');
                        line1.setAttribute('opacity', '0.8');
                        
                        const line2 = document.createElementNS(svgNameSpace, 'line');
                        line2.setAttribute('x1', midX);
                        line2.setAttribute('y1', midY);
                        line2.setAttribute('x2', transformedX2);
                        line2.setAttribute('y2', transformedY2);
                        line2.setAttribute('stroke', lineColor);
                        line2.setAttribute('stroke-width', '5');
                        line2.setAttribute('opacity', '0.8');
                        line2.setAttribute('marker-start', `url(#${arrowMarkerId})`); // Add arrowhead at the start of second segment
                        
                        svg.appendChild(line1);
                        svg.appendChild(line2);
                    }
                });
            };

            // Function to draw face labels
            const drawFaceLabels = (FV, VC) => {
                // For each face
                FV.forEach((faceVertices, faceIndex) => {
                    // Calculate centroid of the face
                    const facePoints = faceVertices.map(v => VC[v]);
                    const centroid = M.centroid(facePoints);
                    
                    // Transform coordinates
                    const x = transformCoord(centroid[0], minX, maxX);
                    const y = transformCoord(centroid[1], minY, maxY);
                    
                    // Create label
                    const text = document.createElementNS(svgNameSpace, 'text');
                    text.setAttribute('x', x);
                    text.setAttribute('y', y);
                    text.setAttribute('font-size', '12');
                    text.setAttribute('fill', 'purple');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = faceIndex;
                    text.classList.add('face-label');
                    
                    // Add to face labels group
                    faceLabelsGroup.appendChild(text);
                });
            };
        
            // Create toggle controls only for unfolded state
            if (folded == "unfolded") {
                // Create a control panel for toggle buttons
                const controlPanel = document.createElement('div');
                controlPanel.style.marginTop = '10px';
                controlPanel.style.display = 'flex';
                controlPanel.style.gap = '10px';
                controlPanel.style.justifyContent = 'center';
        
                // Create toggle button for vertex labels
                const toggleLabelsBtn = document.createElement('button');
                toggleLabelsBtn.textContent = 'Toggle Vertex Labels';
                toggleLabelsBtn.style.padding = '5px 10px';
                toggleLabelsBtn.style.cursor = 'pointer';
                
                toggleLabelsBtn.addEventListener('click', () => {
                    showVertexLabels = !showVertexLabels;
                    vertexLabelsGroup.style.display = showVertexLabels ? 'block' : 'none';
                });
                
                // Create toggle button for green arrows
                const toggleArrowsBtn = document.createElement('button');
                toggleArrowsBtn.textContent = 'Toggle Green Arrows';
                toggleArrowsBtn.style.padding = '5px 10px';
                toggleArrowsBtn.style.cursor = 'pointer';
                
                toggleArrowsBtn.addEventListener('click', () => {
                    showGreenArrows = !showGreenArrows;
                    greenArrowsGroup.style.display = showGreenArrows ? 'block' : 'none';
                });

                const toggleFaceLabelsBtn = document.createElement('button');
                toggleFaceLabelsBtn.textContent = 'Toggle Face Labels';
                toggleFaceLabelsBtn.style.padding = '5px 10px';
                toggleFaceLabelsBtn.style.cursor = 'pointer';

                toggleFaceLabelsBtn.addEventListener('click', () => {
                    showFaceLabels = !showFaceLabels;
                    faceLabelsGroup.style.display = showFaceLabels ? 'block' : 'none';
                });

                const toggleMovingFacesBtn = document.createElement('button');
                toggleMovingFacesBtn.textContent = 'Swap Moving Faces';
                toggleMovingFacesBtn.style.padding = '5px 10px';
                toggleMovingFacesBtn.style.cursor = 'pointer';
                
                toggleMovingFacesBtn.addEventListener('click', () => {
                    // Swap the moving and not moving faces
                    movingAndNotMovingFaces = swapMovingAndNotMovingFaces(movingAndNotMovingFaces);
                    
                    // Remove existing face shadings
                    const existingFaceShadings = svg.querySelectorAll('path[fill="rgba(128, 128, 128, 0.3)"]');
                    existingFaceShadings.forEach(shading => shading.remove());
                    
                    // Shade the new moving faces
                    if (movingAndNotMovingFaces && movingAndNotMovingFaces.movingFaces) {
                        shadeFaces(FV, VC, movingAndNotMovingFaces.movingFaces, minX, maxX, minY, maxY);
                    }
                });
                
            
                // Add buttons to control panel
                controlPanel.appendChild(toggleLabelsBtn);
                controlPanel.appendChild(toggleArrowsBtn);
                controlPanel.appendChild(toggleFaceLabelsBtn);
                // Add the new toggle button here
                controlPanel.appendChild(toggleMovingFacesBtn);
                
                // Append SVG and controls to container
                container1.appendChild(svg);
                container1.appendChild(controlPanel);
                
                // Draw arrows
                drawArrows(edgeFaceAdjacency, FD);
                drawFaceLabels(FV, VC);
            } else if (folded == 'folded') {
                container2.appendChild(svg);
            }
            
            // Function to shade moving faces
            const shadeFaces = (FV, VC, movingFaces, minX, maxX, minY, maxY) => {
                movingFaces.forEach(faceIndex => {
                    // Get vertices of the face
                    const faceVertices = FV[faceIndex].map(v => VC[v]);
                    
                    // Create a polygon path for the face
                    const path = document.createElementNS(svgNameSpace, 'path');
                    
                    // Generate the path data
                    const pathData = faceVertices.map((vertex, index) => {
                        const x = transformCoord(vertex[0], minX, maxX);
                        const y = transformCoord(vertex[1], minY, maxY);
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ') + ' Z';
                    
                    path.setAttribute('d', pathData);
                    path.setAttribute('fill', 'rgba(128, 128, 128, 0.3)'); // Light grey with some transparency
                    path.setAttribute('stroke', 'none');
                    
                    // Insert the path before other elements to not obstruct them
                    svg.insertBefore(path, svg.firstChild);
                });
            };

            // Modify the existing drawing logic to call this function
            if (folded == "unfolded") {
                // Existing unfolded state drawing code...
                
                // Add this line to shade moving faces
                if (movingAndNotMovingFaces && movingAndNotMovingFaces.movingFaces) {
                    shadeFaces(FV, VC, movingAndNotMovingFaces.movingFaces, minX, maxX, minY, maxY);
                }
            } else if (folded == 'folded') {
                // Existing folded state drawing code...
                
                // Add this line to shade moving faces in folded state as well
                if (movingAndNotMovingFaces && movingAndNotMovingFaces.movingFaces) {
                    shadeFaces(FV, VC, movingAndNotMovingFaces.movingFaces, minX, maxX, minY, maxY);
                }
            }
        }

        displayOuterEdgeNodes(FOLD);
        const movingAndNotMovingFaces = findAlternatingGroups(FOLD, 0);
        drawSVG("unfolded", FOLD, edgeFaceAdjacency, movingAndNotMovingFaces); 
        drawSVG("folded", FOLD, edgeFaceAdjacency, movingAndNotMovingFaces);
        const unfoldedVertices = findUnfoldedVertices(edgeFaceAdjacency);
        setLeftRightOrderFO(FOLD["faces_vertices"], arrowset);
        // const coloredFaces = colorMovingFaces(FOLD, movingAndNotMovingFaces);

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
const findAdjacentFaces = (FV, FO) => {
    const edgeFaceAdjacency = new Map();
    
    // Build initial edge-face adjacency
    FV.forEach((face, i) => {
        face.forEach((current, j) => {
            const next = face[(j + 1) % face.length];
            const edgeKey = [current, next].toString();
            const reverseEdgeKey = [next, current].toString();
            const adjacentFaces = edgeFaceAdjacency.get(reverseEdgeKey);
            if (adjacentFaces) {
                adjacentFaces[0] = i;
            } else {
                edgeFaceAdjacency.set(edgeKey, [undefined, i]);
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
    // Initialize EA with "B" (Border) for all edges
    const EA = new Array(EV.length).fill("B");
    
    // Create a lookup map for faster edge matching
    const edgeToIndexMap = new Map();
    EV.forEach((edge, index) => {
        const forwardKey = edge.toString();
        const reverseKey = [edge[1], edge[0]].toString();
        edgeToIndexMap.set(forwardKey, index);
        edgeToIndexMap.set(reverseKey, index);
    });
    
    // Iterate through edgeFaceAdjacency
    for (const [edgeKey, faceData] of edgeFaceAdjacency.entries()) {
        // Get the edge index directly from the map
        const edgeIndex = edgeToIndexMap.get(edgeKey);
        
        // If we found a matching edge
        if (edgeIndex !== undefined) {
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

const findUnfoldedVertices = (edgeFaceAdjacency) => {
    const innerEdges = new Set();
    const outerEdges = new Set();
    const unfoldedVertices = new Set();
    
    for (const [edge, faceData] of edgeFaceAdjacency.entries()) {
        const [face1, face2, foldOrder] = faceData;
        
        if (face1 !== undefined && face2 !== undefined) {
            // Edge has two adjacent faces
            if (foldOrder === undefined) {
                // If no fold order, it's an unfolded inner edge
                innerEdges.add(edge);
                edge.split(',').map(num => Number(num.trim())).forEach(num => unfoldedVertices.add(num));
            }
        } else {
            // Edge has only one face, it's an outer edge
            outerEdges.add(edge);
            edge.split(',').map(num => Number(num.trim())).forEach(num => unfoldedVertices.add(num));
        }
        
    }
    
    const sortedUnfoldedVertices = [...unfoldedVertices].sort((a, b) => a - b);
    // console.log("sorted unfolded vertices", sortedUnfoldedVertices)
    return unfoldedVertices
};

const setLeftRightOrderFO = (FV, arrowset) => {
    const edgeLeftOrRight = new Map();
    
    // Build initial edge-face adjacency
    FV.forEach((face, i) => {
        face.forEach((current, j) => {
            const next = face[(j + 1) % face.length];
            const edgeKey = [current, next].toString();
            const reverseEdgeKey = [next, current].toString();
            const leftRight = edgeLeftOrRight.get(reverseEdgeKey);
            if (leftRight) {
                leftRight[0] = i;
            } else {
                edgeLeftOrRight.set(edgeKey, [undefined, i]);
            }
        });
    });
    
    // Check edges in arrowset
    edgeLeftOrRight.forEach((faces, edgeKey) => {
        if (faces.length === 2 && faces[0] !== undefined && faces[1] !== undefined) {
            const [f1, f2] = faces;
            // Create a lookup structure:
            const arrowDirections = new Map();
            arrowset.forEach(([start, end]) => {
                arrowDirections.set(`${start},${end}`, 1);
                arrowDirections.set(`${end},${start}`, -1);
            });

            // Then use:
            const direction = arrowDirections.get(`${f1},${f2}`);
            if (direction) {
                edgeLeftOrRight.set(edgeKey, [...faces, direction]);
            }
        }
    });
    
    // Add reversed edges (handling empty slots correctly)
    const reversedEntries = new Map();
    edgeLeftOrRight.forEach((faces, edgeKey) => {
        const [f1, f2, direction] = faces;
        const reversedEdgeKey = edgeKey.split(",").reverse().toString();
        const reversedDirection = direction === 1 ? -1 : direction === -1 ? 1 : undefined;
        
        // Create the reversed faces array
        let reversedFaces;
        
        // Only add a direction if both f1 and f2 are defined
        if (f1 === undefined) {
            reversedFaces = [f2, undefined];
        } else if (f2 === undefined) {
            reversedFaces = [undefined, f1];
        } else {
            // Both faces are defined, so include direction if it exists
            reversedFaces = direction ? [f2, f1, reversedDirection] : [f2, f1];
        }
        
        reversedEntries.set(reversedEdgeKey, reversedFaces);
    });
    
    // Merge the reversed entries into edgeLeftOrRight
    reversedEntries.forEach((value, key) => {
        edgeLeftOrRight.set(key, value);
    });
    
    return edgeLeftOrRight;
};

const dfsLeftToRightEdges = (startVertex, edgeLeftOrRight, unfoldedVertices) => {
    startVertex = Number(startVertex);
   
    const validEdges = new Map(); // Stores only edges in valid paths
    const knownGoodVertices = new Set(); // Vertices known to reach valid endpoints
    
    // Add all unfolded vertices to known good
    for (const vertex of unfoldedVertices) {
        knownGoodVertices.add(vertex);
    }
    
    const exploreFrom = (vertex, direction, path, edgesInPath) => {
        // If this vertex is already known to reach a valid endpoint
        if (knownGoodVertices.has(vertex) && vertex !== startVertex) {
            // Add all edges from this path to valid edges
            for (const [edgeKey, edgeData] of edgesInPath.entries()) {
                validEdges.set(edgeKey, edgeData);
            }
            // Mark all vertices in path as known good
            for (const v of path) {
                knownGoodVertices.add(v);
            }
            return true; // Valid path found
        }
        
        let foundValidPath = false;
        
        // Try all possible next edges
        for (const [edgeKey, edgeData] of edgeLeftOrRight.entries()) {
            const [v1, v2] = edgeKey.split(",").map(Number);
            
            // Only consider edges from current vertex
            if (v1 !== vertex) continue;
            
            // Validate edge data and direction
            if (!Array.isArray(edgeData) || edgeData[2] === undefined) continue;
            
            // Check direction compatibility
            const newDirection = direction === null ? edgeData[2] : direction;
            if (newDirection !== edgeData[2]) continue;
            
            // Avoid cycles - skip if destination is already in path
            if (path.has(v2)) continue;
            
            // Create new path and edges collection
            const newPath = new Set(path);
            newPath.add(v2);
            
            const newEdges = new Map(edgesInPath);
            newEdges.set(edgeKey, edgeData);
            
            // Explore from the new vertex
            if (exploreFrom(v2, newDirection, newPath, newEdges)) {
                foundValidPath = true;
                // We don't return early to ensure we find all valid paths
            }
        }
        
        // If this vertex leads to a valid path, mark it as known good
        if (foundValidPath) {
            knownGoodVertices.add(vertex);
        }
        
        return foundValidPath;
    };
    
    // Start DFS from the starting vertex
    exploreFrom(startVertex, null, new Set([startVertex]), new Map());
    
    console.log("Valid edges found:", validEdges);
    return validEdges;
};

function labelFaces(FOLD, startFaceIndex) {
    const FV = FOLD.faces_vertices;
    const edgeFaceAdjacency = findAdjacentFaces(FV, FOLD.faceOrders);
    
    // Initialize face labels
    const faceLabels = new Map();
    const visitedFaces = new Set();
    
    // Queue for faces to process
    const faceQueue = [{ faceIndex: startFaceIndex, label: 1 }];
    
    // Process faces until queue is empty
    while (faceQueue.length > 0) {
        const current = faceQueue.shift();
        const { faceIndex, label } = current;
        
        // Skip if already visited
        if (visitedFaces.has(faceIndex)) continue;
        
        // Mark as visited and label
        visitedFaces.add(faceIndex);
        faceLabels.set(faceIndex, label);
        
        // Get adjacent faces
        const adjacentFaces = getAdjacentFaces(faceIndex);
        
        // Process each adjacent face
        for (const { adjacentFace, isUnfolded } of adjacentFaces) {
            if (visitedFaces.has(adjacentFace)) continue;
            
            // Determine the label for the adjacent face
            let adjacentLabel;
            if (isUnfolded) {
                // Unfolded line - use opposite label
                adjacentLabel = label === 1 ? -1 : 1;
            } else {
                // Regular fold - use same label
                adjacentLabel = label;
            }
            
            // Add to queue
            faceQueue.push({ faceIndex: adjacentFace, label: adjacentLabel });
        }
    }
    
    // Function to get adjacent faces
    function getAdjacentFaces(faceIndex) {
        const adjacentFaces = [];
        
        // For each edge of the current face
        FV[faceIndex].forEach((v1, i) => {
            const v2 = FV[faceIndex][(i + 1) % FV[faceIndex].length];
            const edgeKey = [v1, v2].toString();
            const reverseEdgeKey = [v2, v1].toString();
            
            // Get the edge data
            const edgeData = edgeFaceAdjacency.get(edgeKey) || edgeFaceAdjacency.get(reverseEdgeKey);
            
            if (!edgeData) return;
            
            // Find the adjacent face
            const [f1, f2, foldOrder] = edgeData;
            const adjacentFace = f1 === faceIndex ? f2 : f1;
            
            // Skip if no adjacent face
            if (adjacentFace === undefined) return;
            
            // Check if it's an unfolded line
            const isUnfolded = foldOrder === undefined;
            
            adjacentFaces.push({ adjacentFace, isUnfolded });
        });
        
        return adjacentFaces;
    }
    
    return faceLabels;
}

// Helper function to find alternating connected components
function findAlternatingGroups(FOLD, startFaceIndex) {
    const faceLabels = labelFaces(FOLD, startFaceIndex);
   
    const movingFaces = [];
    const notMovingFaces = [];
   
    // Group faces by label
    for (const [faceIndex, label] of faceLabels.entries()) {
        if (label === 1) {
            movingFaces.push(faceIndex);
        } else {
            notMovingFaces.push(faceIndex);
        }
    }
   
    // Sort faces numerically
    movingFaces.sort((a, b) => a - b);
    notMovingFaces.sort((a, b) => a - b);
   
    // console.log("Moving faces:", movingFaces);
    // console.log("Not moving faces:", notMovingFaces);
   
    return { movingFaces, notMovingFaces };
}

function swapMovingAndNotMovingFaces(faceLabels) {
    // Destructure the existing face labels
    const { movingFaces, notMovingFaces } = faceLabels;

    // Return with arrays swapped
    return {
      movingFaces: notMovingFaces,
      notMovingFaces: movingFaces
    };
}

function dfsFaceTraversal(FOLD, startVertex, dfsLeftToRightEdges, movingAndNotMovingFaces) {
    // Validate inputs
    if (!FOLD || !FOLD.faces_vertices) {
        console.error('Invalid FOLD object');
        return {
            visitedFaces: new Set(),
            traversalPath: [],
            coloredFaces: new Set()
        };
    }
    const FV = FOLD.faces_vertices;
   
    // Ensure startVertex is a number
    startVertex = Number(startVertex);

    // Find faces containing the starting vertex that are also in movingFaces
    const adjacentFacesOfVertex = FV.reduce((faces, face, faceIndex) => {
        if (face.includes(startVertex) && 
            movingAndNotMovingFaces.movingFaces.includes(faceIndex)) {
            faces.add(faceIndex);
        }
        return faces;
    }, new Set());

    // If no adjacent faces found, return empty results
    if (adjacentFacesOfVertex.size === 0) {
        console.warn(`No moving faces found containing vertex ${startVertex}`);
        return {
            visitedFaces: new Set(),
            traversalPath: [],
            coloredFaces: new Set()
        };
    }

    // Safely get edge face adjacency
    let edgeFaceAdjacency;
    try {
        edgeFaceAdjacency = findAdjacentFaces(FV, FOLD.faceOrders || []);
    } catch (error) {
        console.error('Error finding adjacent faces:', error);
        return {
            visitedFaces: new Set(),
            traversalPath: [],
            coloredFaces: new Set()
        };
    }

    // Select the first face to start DFS
    const startFace = [...adjacentFacesOfVertex][0];
   
    // Track visited faces and traversal path
    const visitedFaces = new Set();
    const traversalPath = [];
    const coloredFaces = new Set();

    // Stack for DFS traversal
    const stack = [{
        currentFace: startFace,
        parentFace: null,
        depth: 0
    }];

    const MAX_DEPTH = FV.length * 2; // Prevent infinite loops
    while (stack.length > 0) {
        const {
            currentFace,
            parentFace,
            depth
        } = stack.pop();

        // Prevent infinite loops
        if (depth > MAX_DEPTH) {
            console.warn('Max depth reached, stopping traversal');
            break;
        }

        // Skip already visited faces
        if (visitedFaces.has(currentFace)) continue;

        // Mark current face as visited and colored
        visitedFaces.add(currentFace);
        coloredFaces.add(currentFace);
        traversalPath.push(currentFace);

        // Explore edges of the current face
        for (let i = 0; i < FV[currentFace].length; i++) {
            const v1 = FV[currentFace][i];
            const v2 = FV[currentFace][(i + 1) % FV[currentFace].length];
           
            // Create edge keys
            const edgeKey = [v1, v2].toString();
            const reverseEdgeKey = [v2, v1].toString();
           
            // Get the edge data
            const edgeData = edgeFaceAdjacency.get(edgeKey) ||
                             edgeFaceAdjacency.get(reverseEdgeKey);
           
            if (!edgeData) continue;
           
            // Find the adjacent face
            const [f1, f2, foldOrder] = edgeData;
            const adjacentFace = f1 === currentFace ? f2 : f1;
           
            // Skip if no adjacent face or is the parent face
            if (adjacentFace === undefined || adjacentFace === parentFace) continue;
           
            // Skip if already visited
            if (visitedFaces.has(adjacentFace)) continue;

            // Only continue if the adjacent face is in movingFaces
            if (!movingAndNotMovingFaces.movingFaces.includes(adjacentFace)) continue;
           
            // Check if it's an unfolded edge
            const isUnfoldedEdge = foldOrder === undefined;
           
            // Check if the edge is in dfsLeftToRightEdges
            let isLeftToRightEdge = false;
            if (dfsLeftToRightEdges) {
                const leftToRightEdgeKey = [v1, v2].toString();
                const reverseLeftToRightEdgeKey = [v2, v1].toString();
                isLeftToRightEdge =
                    dfsLeftToRightEdges.has(leftToRightEdgeKey) ||
                    dfsLeftToRightEdges.has(reverseLeftToRightEdgeKey);
            }
           
            // If unfolded edge or left-to-right edge, backtrack
            if (isUnfoldedEdge || isLeftToRightEdge) {
                // Do not add this face to the stack
                continue;
            }
           
            // Add to stack for further exploration
            stack.push({
                currentFace: adjacentFace,
                parentFace: currentFace,
                depth: depth + 1
            });
        }
    }

    // console.log('Visited faces:', visitedFaces);
    // console.log('Traversal path:', traversalPath);
    // console.log('Colored faces:', coloredFaces);
    return {
        visitedFaces,
        traversalPath,
        coloredFaces
    };
}

function colorMovingFaces(FOLD, startVertex, dfsLeftToRightEdges, movingAndNotMovingFaces) {
    // Create a copy of moving faces to track uncolored faces
    const movingFaces = [...movingAndNotMovingFaces.movingFaces];
    
    // Map to store colored faces
    const coloredFacesMap = {};
    
    // Function to get the next color name
    const getNextColor = () => {
        const colorCount = Object.keys(coloredFacesMap).length;
        return `color${colorCount + 1}`;
    };
    
    // Function to check if a face is already colored
    const isFaceColored = (faceIndex) => {
        return Object.values(coloredFacesMap).some(faces => faces.includes(faceIndex));
    };
    
    // Find the first uncolored moving face
    const findUncoloredMovingFace = () => {
        return movingFaces.find(face => !isFaceColored(face));
    };
    
    // Main coloring loop
    while (true) {
        // Find an uncolored moving face to start the search
        const startFace = findUncoloredMovingFace();
        
        // If no uncolored faces remain, we're done
        if (startFace === undefined) break;
        
        // Determine the current color
        const currentColor = getNextColor();
        
        // Perform DFS traversal
        const { visitedFaces } = dfsFaceTraversal(
            FOLD, 
            FOLD.faces_vertices[startFace].find(v => movingAndNotMovingFaces.movingFaces.includes(startFace)), 
            dfsLeftToRightEdges, 
            {
                movingFaces: movingFaces.filter(face => !isFaceColored(face))
            }
        );
        
        // Store the visited faces under the current color
        coloredFacesMap[currentColor] = [...visitedFaces];
    }
    
    console.log('Colored faces map:', coloredFacesMap);
    return coloredFacesMap;
}

function findSimilarAngleEdges(dfsLeftToRightEdges, verticesCoords, angleThreshold = 0.1) {
    // Convert dfsLeftToRightEdges to an array of edges (vertex pairs)
    const edges = Array.from(dfsLeftToRightEdges.keys()).map(edgeKey => 
        edgeKey.split(',').map(Number)
    );

    // Function to calculate angle between two vertices
    const calculateAngle = (v1Coords, v2Coords) => {
        // Calculate the vector from v1 to v2
        const dx = v2Coords[0] - v1Coords[0];
        const dy = v2Coords[1] - v1Coords[1];
        
        // Calculate the angle using arctangent
        return Math.atan2(dy, dx);
    };

    // If no edges, return empty set
    if (edges.length === 0) return new Set();

    // Use the first edge to establish reference angle
    const [firstV1, firstV2] = edges[0];
    const firstV1Coords = verticesCoords[firstV1];
    const firstV2Coords = verticesCoords[firstV2];
    const referenceAngle = calculateAngle(firstV1Coords, firstV2Coords);

    // Set to store edges with similar angles
    const similarAngleEdges = new Set([edges[0].toString()]);

    // Iterate through remaining edges
    for (let i = 1; i < edges.length; i++) {
        const [v1, v2] = edges[i];
        const v1Coords = verticesCoords[v1];
        const v2Coords = verticesCoords[v2];
        
        // Calculate current edge's angle
        const currentAngle = calculateAngle(v1Coords, v2Coords);
        
        // Compare angles
        const angleDifference = Math.abs(currentAngle - referenceAngle);
        
        // Check if angle is similar (within threshold)
        if (angleDifference < angleThreshold || 
            Math.abs(angleDifference - Math.PI) < angleThreshold) {
            similarAngleEdges.add(edges[i].toString());
        }
    }

    console.log('similar angle edges:', similarAngleEdges);
    return similarAngleEdges;
}






