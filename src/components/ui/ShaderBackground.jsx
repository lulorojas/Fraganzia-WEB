import { useEffect, useRef } from 'react';

export function ShaderBackground({ className = '', opacity = 0.6 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // Sync size
    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const observer = new ResizeObserver(syncSize);
    observer.observe(canvas);
    syncSize();

    // Vertex shader
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader con orbes violetas animados
    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = v_texCoord;
        float time = u_time * 0.2;
        
        // Base dark violet
        vec3 color = vec3(0.02, 0.01, 0.05);
        
        // Large soft radial gradients (orbs)
        float d1 = distance(uv, vec2(0.5 + 0.3 * sin(time), 0.5 + 0.2 * cos(time * 0.8)));
        float d2 = distance(uv, vec2(0.8 + 0.2 * cos(time * 0.5), 0.2 + 0.3 * sin(time * 1.2)));
        float d3 = distance(uv, vec2(0.2 * sin(time * 0.7), 0.8 + 0.1 * cos(time)));
        
        // Deep violet and lila glows
        color += vec3(0.12, 0.05, 0.25) * (1.0 - smoothstep(0.0, 0.8, d1));
        color += vec3(0.08, 0.04, 0.20) * (1.0 - smoothstep(0.0, 0.6, d2));
        color += vec3(0.15, 0.08, 0.30) * (1.0 - smoothstep(0.0, 0.7, d3));
        
        // Subtle noise
        float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
        color += noise * 0.02;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');

    function render(t) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    }

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-0 ${className}`} style={{ opacity }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/80 to-bg pointer-events-none" />
    </div>
  );
}
