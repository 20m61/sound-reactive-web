// シェーダーマテリアルの定義
const glitchShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
            vec2 p = -1.0 + 2.0 * vUv;
            float a = time * 40.0;
            float d, e, f, g = 1.0 / 40.0, h, i, r, q;
            e = 400.0 * p.x - 200.0;
            f = 400.0 * p.y - 200.0;
            i = 200.0 + sin(e * g + a / 150.0) * 20.0;
            d = 200.0 + cos(f * g / 2.0) * 18.0 + cos(e * g) * 7.0;
            r = sqrt(pow(i - e, 2.0) + pow(d - f, 2.0));
            q = f / r;
            e = (r * cos(q)) - a / 2.0;
            f = (r * sin(q)) - a / 2.0;
            d = sin(e * g) * 176.0 + sin(e * g) * 164.0 + r;
            h = ((f + d) + a / 2.0) * g;
            i = cos(h + r * p.x / 1.3) * 100.0 + cos(q * a / 4.0) * 88.0 + r;
            h = sin(f * g) * 176.0 + sin(e * g) * 164.0 + r;
            d = (h + a / 2.0) * g;
            e = cos(d * f) * 100.0 + cos(e * g * a / 4.0) * 88.0 + r;
            d = sin(q * g) * 176.0 + sin(f * g) * 164.0 + r;
            f = sin(d / 2.0) * 176.0 + sin(d * g) * 164.0 + r;
            d = cos(f * g) * 100.0 + cos(d * g) * 88.0 + r;
            d = d * 0.5 / r;
            gl_FragColor = vec4(vec3(d * e * i * h / 10000.0), 1.0);
        }
    `
});

// 砂嵐用のシェーダーマテリアルの定義
const sandShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        audioData: { value: 1.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        particleSize: { value: 1.0 }, // 粒の大きさを制御するuniform変数
    },
    vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform float audioData;
        uniform vec2 resolution;
        uniform float particleSize;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main() {
            vec2 st = gl_FragCoord.xy / resolution.xy;
            vec3 color = vec3(random(st + time) * particleSize);
            color *= audioData; // 音声データに基づいて色を調整
            gl_FragColor = vec4(color, 1.0);
        }
    `
});

// ユーザーのマイクからの入力を取得
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function (stream) {
        // ここから下は、Web Audio APIを使った音声解析のコードです。
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        // ここから下は、Three.jsを使った3Dオブジェクトのセットアップとアニメーションのコードです。
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // キューブを作成
        const geometry = new THREE.BoxGeometry();
        const cube = new THREE.Mesh(geometry, glitchShaderMaterial);
        cube.position.z = 1;
        scene.add(cube);

        // 砂嵐用の平面を作成
        const sandGeometry = new THREE.PlaneBufferGeometry(2, 2); // 正しいgeometryを使用
        const sandPlane = new THREE.Mesh(sandGeometry, sandShaderMaterial); // sandGeometryを使用してsandPlaneを作成
        sandPlane.position.z = -20;
        scene.add(sandPlane);

        // カメラの位置を設定
        camera.position.z = 5;


        function animate() {
            // アニメーションを再生
            requestAnimationFrame(animate);

            // シェーダーマテリアルの時間を更新
            const currentTime = audioContext.currentTime;
            glitchShaderMaterial.uniforms.time.value = currentTime;
            sandShaderMaterial.uniforms.time.value = currentTime;

            // FFTデータを取得
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // FFTデータに基づいてキューブを動かす
            cube.rotation.x += dataArray[10] / 1000;
            cube.rotation.y += dataArray[20] / 1000;
            cube.rotation.z += dataArray[30] / 1000;

            // キューブのサイズを変更
            cube.scale.x = dataArray[40] / 10;
            cube.scale.y = dataArray[50] / 10;
            cube.scale.z = dataArray[60] / 10;

            // FFTデータに基づいて砂嵐用の平面を動かす
            sandShaderMaterial.uniforms.audioData.value = dataArray[70] / 100;

            // キューブの色を変更
            const color = new THREE.Color(`rgb(${dataArray[80]}, ${dataArray[90]}, ${dataArray[100]})`);
            glitchShaderMaterial.color = color; // キューブの色を変更

            // レンダリング
            renderer.render(scene, camera);
        }

        animate();
    })
    .catch(function (err) {
        console.log('The following gUM error occured: ' + err);
    });
