import { Engine, Scene, MeshBuilder, Color3, Sound } from '@babylonjs/core';
import { MidiPlaybackMaterial } from "midi-materials";

const AUDIO_FILE_PATH: string = 'https://allotropeijk.blob.core.windows.net/2021summerexhibit/recording.6.shortened.mp3';
const MIDI_FILE_PATH: string = 'https://allotropeijk.blob.core.windows.net/2021summerexhibit/recording.6.shortened.mid';

const renderCanvas = <HTMLCanvasElement> document.getElementById("renderCanvas");
const engine = new Engine(renderCanvas);
const scene = new Scene(engine);

async function run(): Promise<any> {
    scene.createDefaultCamera(true);
    scene.createDefaultLight(true);
    scene.clearColor = Color3.Black().toColor4();
    const cube = MeshBuilder.CreateBox("box", {size: 1}, scene);
    cube.position.z = 5;
    
    const data = await new Promise<ArrayBuffer | undefined>((resolve) => {
        const request = new XMLHttpRequest();
        request.open("GET", MIDI_FILE_PATH, true);
        request.responseType = "arraybuffer";
        request.onload = () => {
            resolve(request.response);
        };
        request.send();
    });
 
    if (!data) {
        throw new Error("Failed to load midi file");
    }

    const midiPlaybackMaterial = new MidiPlaybackMaterial("test", scene, data, 80.1);
    cube.material = midiPlaybackMaterial.material;

    const sound = new Sound("music", AUDIO_FILE_PATH, scene, () => {
        sound.play();
        midiPlaybackMaterial.play();
    }, {loop:false, autoplay:false});
}

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});

run();