main();

/************************************
 * MAIN
 ************************************/

function main() {

    console.log("Setting up the canvas");

    // Find the canavas tag in the HTML document
    const canvas = document.querySelector("#exampleCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");
 
    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    // Create a state for our scene
    var state = {
        camera: {
            position: vec3.fromValues(0.0, 30.0, 15.0),
            center: vec3.fromValues(0.0, 0.0, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
        },
        lights: [
            {
                position: vec3.fromValues(0.0, 5.0, 5.0),
                colour: vec3.fromValues(1.0, 1.0, 1.0),
                strength: 10.0,
            }
        ],
        // IF ADDING OBJECTS REMEMBER TO GIVE ID'S, ALSO LAST OBJECT NEEDS TO BE THE PLAYER
        objects: [
            {
                model: { // red
                    position: vec3.fromValues(0.0, 0.0, 0.0),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                    id: 0,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(1.0, 0.0, 0.0, 1.0),
            },
            {
                model: { //blue 
                    position: vec3.fromValues(5.5, 0.0, 5.5),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                    id: 1,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.0, 0.0, 1.0, 1.0),
            },
            
            {
                model: { // left wall
                    position: vec3.fromValues(-25.5, 0.0, 0.0),
                    rotation: mat4.create(),
                    scale: vec3.fromValues(3.0, 1.0, 30.0),
                    id: 2,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.8, 0.8, 0.2, 1.0),
            },
            {
                model: { // right wall
                    position: vec3.fromValues(22.5, 0.0, 0.0),
                    rotation: mat4.create(),
                    scale: vec3.fromValues(1.0, 2.0, 30.0),
                    id: 3,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.8, 0.2, 0.8, 1.0),
            },
            {
                model: { // bottom wall
                    position: vec3.fromValues(0.0, 0.0, 16.0),
                    rotation: mat4.create(),
                    scale: vec3.fromValues(30.0, 1.0, 1.0),
                    id: 4,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.2, 0.8, 0.8, 1.0),
            },
            {
                model: { // top wall
                    position: vec3.fromValues(0.0, 0.0, -25.0),
                    rotation: mat4.create(),
                    scale: vec3.fromValues(40.0, 3.0, 1.0),
                    id: 5,
                },
                programInfo: simpleShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.3, 0.1, 0.5, 1.0),
            },
            {
                model: { // this one is the player (highest id num is player)
                    position: vec3.fromValues(-5.5, 0.0, -5.5),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                    id: 6,
                },
                //programInfo: simpleShader(gl),
                programInfo: textureShader(gl),
                buffers: null,
                texture: null,
                colour: vec4.fromValues(0.0, 1.0, 0.0, 1.0),
            },
        ],
        canvas: canvas,
        selectedIndex: 0,
    };

    state.objects.forEach((object) => {
        initQuadBuffers(gl, object);
    });

    state.objects[6].texture = loadTexture(gl, 0, null);
    setupUploadButton(gl);

    console.log(state)
    setupKeypresses(state);

    console.log("Starting rendering loop");
    startRendering(gl, state);
}


/************************************
 * RENDERING CALLS
 ************************************/

function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        updateState(deltaTime, state);

        // Draw our scene
        drawScene(gl, state);

        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}

function updateState(deltaTime, state) {
    state.objects.forEach((object) => {
        if (!object.velocity) {
            // Initialize velocity for the object if not already set
            object.velocity = [
                (Math.random() - 0.5) * 20, // Random velocity along X
                0,                          // No movement along Y
                (Math.random() - 0.5) * 20  // Random velocity along Z
            ];
        }

        if (object.model.id < 2) {

            // Update the position based on velocity
            object.model.position[0] += object.velocity[0] * deltaTime; // Update X position
            object.model.position[2] += object.velocity[2] * deltaTime; // Update Z position

            // Check for collisions with camera view bounds
            const cameraBounds = {
                left: -21,  //  left bound
                right: 20,  //  right bound
                top: 14,    //  bottom bound THESE ARE REVERSED SO COMMENT NAMES ARE CORRECT VARIABLES ARE NOT
                bottom: -22 //  top bound   RENAMING THEM BREAKS VELOCITY FOR SOME REASON
            };

            // Bounce off the left or right edges
            if (
                object.model.position[0] <= cameraBounds.left ||
                object.model.position[0] >= cameraBounds.right
            ) {
                object.velocity[0] *= -1; // Invert X velocity
            }

            // Bounce off the top or bottom edges
            if (
                object.model.position[2] <= cameraBounds.bottom ||
                object.model.position[2] >= cameraBounds.top
            ) {
                object.velocity[2] *= -1; // Invert Z velocity
            }

            // check collision
            if (object.model.position[0] == state.objects[2].model.position[0] && 
                object.model.position[2] == state.objects[2].model.position[2]) {
                console.log(`Object collision`);

            }
        }
        
    });
}



function drawScene(gl, state) {

    var xLimit = 10.0;
    // Set clear colour
    // This is a Red-Green-Blue-Alpha colour
    // See https://en.wikipedia.org/wiki/RGB_color_model
    // Here we use floating point values. In other places you may see byte representation (0-255).
    gl.clearColor(0.55686, 0.54902, 0.52157, 1.0);
    

    // Depth testing allows WebGL to figure out what order to draw our objects such that the look natural.
    // We want to draw far objects first, and then draw nearer objects on top of those to obscure them.
    // To determine the order to draw, WebGL can test the Z value of the objects.
    // The z-axis goes out of the screen

    // TODO add correct settings for drawing transparent objects
    // turn off depth mask and enable blending
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFunc(gl.ONE_MINUS_CONSTANT_ALPHA,gl.ONE_MINUS_SRC_ALPHA);



    // TODO Clear the color and depth buffer with specified clear colour.
    // This will replace everything that was in the previous frame with the clear colour.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    var sortedObjects = state.objects.sort((a, b) => {
        // TODO: Add an object comparison function
        
        // Compute the distance of a and b from the cam
        var distA = a.model.id;
        var distB = b.model.id;

        // return (A first wasnt working)
        return distB - distA;
    });

    sortedObjects.forEach((object) => {
        // Choose to use our shader
        gl.useProgram(object.programInfo.program);

            // Update uniforms
        {
            var projectionMatrix = mat4.create();
            var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
            var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
            var near = 0.1; // Near clipping plane
            var far = 100.0; // Far clipping plane
            // Generate the projection matrix using perspective
            mat4.perspective(projectionMatrix, fovy, aspect, near, far);

            gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);
        
            var viewMatrix = mat4.create();
            mat4.lookAt(
                viewMatrix,
                state.camera.position,
                state.camera.center,
                state.camera.up,
            );
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);


            
            
            var modelMatrix = mat4.create();
            mat4.translate(modelMatrix, modelMatrix, object.model.position);
            mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
            mat4.scale(modelMatrix, modelMatrix, object.model.scale);
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);

            gl.uniform4fv(object.programInfo.uniformLocations.colour, object.colour);

            
        }

        // Draw 
        {
            // Bind the buffer we want to draw
            gl.bindVertexArray(object.buffers.vao);

            if(object.texture != null) {
                gl.uniform1i(object.programInfo.uniformLocations.sampler, object.texture);
            }

            // Draw the object
            const offset = 0; // Number of elements to skip before starting
            gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }

    });
}


/************************************
 * UI EVENTS
 ************************************/

function setupKeypresses(state){
    const keysPressed = {};
    const index = 0;
    document.addEventListener("keydown", (event) => {
        console.log(event.code);

        var object = state.objects[state.selectedIndex];

        keysPressed[event.code] = true;
        
        
        if(keysPressed["KeyW"]&&keysPressed["KeyA"]){
            // Move Object in the Uper-left diagonal
            vec3.add(object.model.position, object.model.position, vec3.fromValues(-0.4, 0.0, -0.4));
        } else if(keysPressed["KeyW"]&&keysPressed["KeyD"]){
            // Move Object in the Uper-right diagonal
            vec3.add(object.model.position, object.model.position, vec3.fromValues(0.4, 0.0, -0.4));
        } else if(keysPressed["KeyS"]&&keysPressed["KeyA"]){
            // Move Object in the Lower-left diagonal
            vec3.add(object.model.position, object.model.position, vec3.fromValues(-0.4, 0.0, 0.4));
        } else if(keysPressed["KeyS"]&&keysPressed["KeyD"]){
            // Move Object in the Lower-right diagonal
            vec3.add(object.model.position, object.model.position, vec3.fromValues(0.4, 0.0, 0.4));
        } else if(keysPressed["KeyD"]){
            // translate object along X (right)
            vec3.add(object.model.position, object.model.position, vec3.fromValues(0.4, 0.0, 0.0));
        } else if (keysPressed["KeyA"]){
            // translate object along X (left)
            vec3.add(object.model.position, object.model.position, vec3.fromValues(-0.4, 0.0, 0.0));
        } else if(keysPressed["KeyW"]){
            // Move object about Z-axis (forward)
            vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0, -0.4));
        } else if(keysPressed["KeyS"]){
            // Move object Down Z-axis (backwards)
            vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0, 0.4));
        } else if(keysPressed["Equal"]){
            // Reset the object
            object.model.position = vec3.fromValues(0.0, 0.0, 0.0);
            object.model.rotation = mat4.create(); // Identity matrix
            object.model.scale = vec3.fromValues(1.0, 1.0, 1.0);

            
            // Reset camera to original position
            state.camera.position = vec3.fromValues(0.0, 30.0, 15.0); // Example default position
            state.camera.center = vec3.fromValues(0.0, 0.0, 0.0); // Example default center
            state.camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        }

        document.addEventListener("keyup", (event) => {
            delete keysPressed[event.code];
        })
    });
}


function setupUploadButton(gl) {
    const fileSubmitButton = document.querySelector("#fileSubmitButton");
    fileSubmitButton.addEventListener("click", () => {
        console.log("Submitting file...");
        let fileInput  = document.getElementById('textureInputFile');
        let files = fileInput.files;
        
        let url = URL.createObjectURL(files[0]);

        loadTexture(gl, 0, url);
    });
}


/************************************
 * SHADER SETUP
 ************************************/

function simpleShader(gl){

    // Vertex shader source code
    const vsSource =
    `#version 300 es
    in vec3 aPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;

    uniform vec4 uColor;

    out vec4 oColor;

    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);

        oColor = uColor;
    }
    `;

    // Fragment shader source code
    const fsSource =
    `#version 300 es
    precision highp float;

    out vec4 fragColor;

    in vec4 oColor;

    void main() {
        // oColor is a 4D vector 
        // TODO add the alpha value from the oColor to correctly render its transparency
        fragColor = vec4(oColor.rgb, oColor.a);
    }
    `;


    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            colour: gl.getUniformLocation(shaderProgram, 'uColor'),
        },
    };

       // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ||
        programInfo.uniformLocations.color === -1 ) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

function textureShader(gl){

    // Vertex shader source code
    const vsSource =
    `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    in vec2 aUV;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;

    uniform vec3 uCameraPosition;

    out vec3 oNormal;
    out vec3 oFragPosition;
    out vec3 oCameraPosition;
    out vec2 oUV;

    void main() {
        // Position needs to be a vec4 with w as 1.0
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
        
        // Postion of the fragment in world space
        oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;

        // Pass the colour to the fragment shader
        oNormal = normalize((uModelMatrix * vec4(aNormal, 0.0)).xyz);  // !!! Need to make the normal into world space
        oCameraPosition = uCameraPosition;
        oUV = aUV;
    }
    `;

    // Fragment shader source code
    const fsSource =
    `#version 300 es
    precision highp float;

    out vec4 fragColor;

    in vec3 oNormal;
    in vec3 oFragPosition;
    in vec3 oCameraPosition;
    in vec2 oUV;

    uniform sampler2D uTexture;

    uniform vec3 uLight0Position;
    uniform vec3 uLight0Colour;
    uniform float uLight0Strength;

    void main() {
        // Get the dirction of the light relative to the object
        vec3 lightDirection = normalize(uLight0Position - oFragPosition);
        
        // Diffuse lighting
        float diff = max(dot(oNormal, lightDirection), 0.0);
        vec3 diffuse = diff * uLight0Colour;

        vec3 ambient = vec3(0.3, 0.3, 0.3);

        vec4 textureColor = texture(uTexture, oUV); // NOTE: This is where the texture is accessed

        fragColor = vec4((diffuse + ambient) * textureColor.rgb, 1.0);
    }
    `;


    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
            vertexUV: gl.getAttribLocation(shaderProgram, 'aUV'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
            light0Position: gl.getUniformLocation(shaderProgram, 'uLight0Position'),
            light0Colour: gl.getUniformLocation(shaderProgram, 'uLight0Colour'),
            light0Strength: gl.getUniformLocation(shaderProgram, 'uLight0Strength'),
        },
    };

       // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.attribLocations.vertexColour === -1 ||
        programInfo.attribLocations.vertexNormal === -1 ||
        programInfo.attribLocations.vertexUV === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ||
        programInfo.uniformLocations.light0Position === -1 ||
        programInfo.uniformLocations.light0Colour === -1 ||
        programInfo.uniformLocations.light0Strength === -1 ||
        programInfo.uniformLocations.cameraPosition === -1 || 
        programInfo.uniformLocations.sampler === -1) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

function normalTextureShader(gl){

    // Vertex shader source code
    const vsSource =
    `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    in vec2 aUV;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;

    uniform vec3 uCameraPosition;

    out vec4 oColor;
    out vec3 oFragPosition;
    out vec3 oCameraPosition;
    out vec2 oUV;
    out vec3 oNormal;
    out vec3 oTangent;

    void main() {
        // Position needs to be a vec4 with w as 1.0
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
        
        // Postion of the fragment in world space
        oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;

        // Pass the colour to the fragment shader
        oColor = vec4(1.0, 1.0, 1.0, 1.0);
        oCameraPosition = uCameraPosition;
        oUV = aUV;
        oNormal = normalize(vec3(uModelMatrix * vec4(aNormal, 0.0)).xyz);
        oTangent = normalize(vec3(uModelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz); // We are assuming the tangent lies on the x axis in model
    }
    `;

    // Fragment shader source code
    const fsSource =
    `#version 300 es
    precision highp float;

    out vec4 fragColor;

    in vec4 oColor;
    in vec3 oFragPosition;
    in vec3 oCameraPosition;
    in vec3 oNormal;
    in vec3 oTangent;
    in vec2 oUV;

    uniform vec3 uLight0Position;
    uniform vec3 uLight0Colour;
    uniform float uLight0Strength;

    uniform sampler2D uTexture;

    void main() {
        // Get the dirction of the light relative to the object
        vec3 lightDirection = normalize(uLight0Position - oFragPosition);
        
        
        // this is the normal displacement that you will use
        vec3 normVector = texture(uTexture, oUV).xyz;
        
        // TODO: Need to move from range [0.0, 1.0] to [-1.0, 1.0]
        normVector = 2.0 * normVector - 1.0;
        


        // TODO: scale the normVector to increases the visual effect
        // recomended scale : float uNormalScale = 5.0;
        float uNormalScale = 5.0;
        //normVector *= uNormalScale;
        normVector = normVector * vec3(uNormalScale, uNormalScale, uNormalScale);

        // TODO calculate bitangent as NxT
        vec3 biTangent = cross(oNormal, oTangent);

        // TODO make the TBN matrix as a mat3
        mat3 TBN = mat3(oTangent, biTangent, oNormal);
      
        // TODO: Apply the TBN matrix to the normal vector and normalize
        normVector = normalize(TBN * normVector);
        
        // Diffuse lighting
        float diff = max(dot(normVector, lightDirection), 0.0);
        vec3 diffuse = diff * uLight0Colour;

        vec3 ambient = vec3(0.3, 0.3, 0.3);

        fragColor = vec4((diffuse + ambient) * oColor.rgb, 1.0);

        // Debug example
        //fragColor = vec4(normVector, 1.0);
    }
    `;


    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
            vertexUV: gl.getAttribLocation(shaderProgram, 'aUV'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
            cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
            light0Position: gl.getUniformLocation(shaderProgram, 'uLight0Position'),
            light0Colour: gl.getUniformLocation(shaderProgram, 'uLight0Colour'),
            light0Strength: gl.getUniformLocation(shaderProgram, 'uLight0Strength'),
            sampler: gl.getUniformLocation(shaderProgram, 'uTexture'),
        },
    };

       // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.attribLocations.vertexUV === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ||
        programInfo.uniformLocations.light0Position === -1 ||
        programInfo.uniformLocations.light0Colour === -1 ||
        programInfo.uniformLocations.light0Strength === -1 ||
        programInfo.uniformLocations.cameraPosition === -1 ||
        programInfo.uniformLocations.sampler === -1
        ) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

/************************************
 * BUFFER SETUP
 ************************************/

function initQuadBuffers(gl, object) {

     // We have 3 vertices with x, y, and z values
     const positionArray = new Float32Array([
         // Front face
         -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
         -1.0,  1.0,  1.0,
         
         // Back face
         -1.0, -1.0, -1.0,
         -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
         
         // Top face
         -1.0,  1.0, -1.0,
         -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
         
         // Bottom face
         -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
         -1.0, -1.0,  1.0,
         
         // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
         
         // Left face
         -1.0, -1.0, -1.0,
         -1.0, -1.0,  1.0,
         -1.0,  1.0,  1.0,
         -1.0,  1.0, -1.0,
    ]);

    const normalArray = new Float32Array([
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ]);

    const textureCoordArray = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
      ];

    // We are using gl.UNSIGNED_SHORT to enumerate the indices
    const indicesArray = new Uint16Array([
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ]);

    initBuffers(gl, object, positionArray, normalArray, null, textureCoordArray, indicesArray);


}

function initCubeBuffers(gl, object) {

    // We have 3 vertices with x, y, and z values
    const positionArray = new Float32Array([
       // Front face
       -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
       -1.0,  1.0,  1.0,
       
       // Back face
       -1.0, -1.0, -1.0,
       -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
       
       // Top face
       -1.0,  1.0, -1.0,
       -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
       
       // Bottom face
       -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
       -1.0, -1.0,  1.0,
       
       // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
       
       // Left face
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0,
       -1.0,  1.0,  1.0,
       -1.0,  1.0, -1.0,
   ]);

   const normalArray = new Float32Array([
       // Front
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,

       // Back
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,

       // Top
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,

       // Bottom
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,

       // Right
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,

       // Left
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0,
       -1.0,  0.0,  0.0
   ]);

   const textureCoordArray = [
       // Front
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
       // Back
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
       // Top
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
       // Bottom
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
       // Right
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
       // Left
       0.0,  0.0,
       1.0,  0.0,
       1.0,  1.0,
       0.0,  1.0,
     ];

   // We are using gl.UNSIGNED_SHORT to enumerate the indices
   const indicesArray = new Uint16Array([
       0,  1,  2,      0,  2,  3,    // front
       4,  5,  6,      4,  6,  7,    // back
       8,  9,  10,     8,  10, 11,   // top
       12, 13, 14,     12, 14, 15,   // bottom
       16, 17, 18,     16, 18, 19,   // right
       20, 21, 22,     20, 22, 23,   // left
   ]);

   initBuffers(gl, object, positionArray, normalArray, null, textureCoordArray, indicesArray);
}

function initBuffers(gl, object, positionArray, normalArray, colourArray, textureCoordArray, indicesArray) {

    // We have 3 vertices with x, y, and z values
    const positions = new Float32Array(positionArray);

    const normals = new Float32Array(normalArray);

    const colours = new Float32Array(colourArray);

    const textureCoords = new Float32Array(textureCoordArray);

    // We are using gl.UNSIGNED_SHORT to enumerate the indices
    const indices = new Uint16Array(indicesArray);

    // Allocate and assign a Vertex Array Object to our handle
    var vertexArrayObject = gl.createVertexArray();

    // Bind our Vertex Array Object as the current used object
    gl.bindVertexArray(vertexArrayObject);

    object.buffers = {
        vao: vertexArrayObject,
        attributes: {
            position: initPositionAttribute(gl, object.programInfo, positions),
            normal: initNormalAttribute(gl, object.programInfo, normals),
            //uv: initTextureCoords(gl,  object.programInfo, textureCoords),

        },
        indices: initIndexBuffer(gl, indices),
        numVertices: indices.length,
    };
}

function initPositionAttribute(gl, programInfo, positionArray) {
    if(positionArray != null && positionArray.length > 0 && programInfo.attribLocations.vertexPosition != null){
        // Create a buffer for the positions.
        const positionBuffer = gl.createBuffer();

        // Select the buffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(
            gl.ARRAY_BUFFER, // The kind of buffer this is
            positionArray, // The data in an Array object
            gl.STATIC_DRAW // We are not going to change this data, so it is static
        );

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
            const numComponents = 3; // pull out 3 values per iteration, ie vec3
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize between 0 and 1
            const stride = 0; // how many bytes to get from one set of values to the next
            // Set stride to 0 to use type and numComponents above
            const offset = 0; // how many bytes inside the buffer to start from


            // Set the information WebGL needs to read the buffer properly
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            // Tell WebGL to use this attribute
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        return positionBuffer;
    }
}


function initColourAttribute(gl, programInfo, colourArray) {

    if(colourArray != null && colourArray.length > 0 && programInfo.attribLocations.vertexColour != null) {
        // Create a buffer for the positions.
        const colourBuffer = gl.createBuffer();

        // Select the buffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(
            gl.ARRAY_BUFFER, // The kind of buffer this is
            colourArray, // The data in an Array object
            gl.STATIC_DRAW // We are not going to change this data, so it is static
        );

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
            const numComponents = 4; // pull out 4 values per iteration, ie vec4
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize between 0 and 1
            const stride = 0; // how many bytes to get from one set of values to the next
            // Set stride to 0 to use type and numComponents above
            const offset = 0; // how many bytes inside the buffer to start from

            // Set the information WebGL needs to read the buffer properly
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColour,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            // Tell WebGL to use this attribute
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColour);
        }

        return colourBuffer;
    }
}


function initNormalAttribute(gl, programInfo, normalArray) {
    if(normalArray != null && normalArray.length > 0 && programInfo.attribLocations.vertexNormal != null){
        // Create a buffer for the positions.
        const normalBuffer = gl.createBuffer();

        // Select the buffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(
            gl.ARRAY_BUFFER, // The kind of buffer this is
            normalArray, // The data in an Array object
            gl.STATIC_DRAW // We are not going to change this data, so it is static
        );

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
            const numComponents = 3; // pull out 4 values per iteration, ie vec3
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize between 0 and 1
            const stride = 0; // how many bytes to get from one set of values to the next
            // Set stride to 0 to use type and numComponents above
            const offset = 0; // how many bytes inside the buffer to start from

            // Set the information WebGL needs to read the buffer properly
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            // Tell WebGL to use this attribute
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexNormal);
        }

        return normalBuffer;
    }
}

function initTextureCoords(gl, programInfo, textureCoords) {
    if(textureCoords != null && textureCoords.length > 0){
        // Create a buffer for the positions.
        const textureCoordBuffer = gl.createBuffer();

        // Select the buffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(
            gl.ARRAY_BUFFER, // The kind of buffer this is
            textureCoords, // The data in an Array object
            gl.STATIC_DRAW // We are not going to change this data, so it is static
        );

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
            const numComponents = 2; 
            const type = gl.FLOAT; // the data in the buffer is 32bit floats
            const normalize = false; // don't normalize between 0 and 1
            const stride = 0; // how many bytes to get from one set of values to the next
            // Set stride to 0 to use type and numComponents above
            const offset = 0; // how many bytes inside the buffer to start from

            // Set the information WebGL needs to read the buffer properly
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexUV,
                numComponents,
                type,
                normalize,
                stride,
                offset
            );
            // Tell WebGL to use this attribute
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexUV);
        }

        return textureCoordBuffer;
    }
}

function initIndexBuffer(gl, elementArray) {

    // Create a buffer for the positions.
    const indexBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, // The kind of buffer this is
        elementArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    return indexBuffer;
}

/*****************************
 * TEXTURES
 *****************************/

function loadTexture(gl, textureId, url) {
    var texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + textureId);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = new Uint8Array([
        0, 255, 255, 255,
    ]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                format, type, data);

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    if(url != null) {
        console.log("Loading...");
        var image = new Image();
        image.addEventListener('load', () => {
            console.log("Loaded ")
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                format, type, image);
                
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        });
        image.src = url;
    }

    return textureId;
}


/* 
<fieldset>
                    <!-- File chooser form -->
                    <div class="form-group">
                        <div class="input-group mb-3">
                            <input type="file" class="form-control-file" id="textureInputFile" accept="*.jpg, *.png">
                            <label for="textureInputFile">Choose file</label>
                          </div>
                          <div class="input-group-append">
                            <span class="input-group-text" id="fileSubmitButton">Upload</span>
                          </div>
                      </div>
                </fieldset>

*/