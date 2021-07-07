import { Color3, Scene, StandardMaterial } from "@babylonjs/core";
import { NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { MidiPlayback } from "./midiPlayback";

export class MidiPlaybackMaterial{
    material: StandardMaterial;
    private _midiPlayback: MidiPlayback;

    constructor(readonly _name: string, readonly _scene: Scene, midiFileData: ArrayBuffer, bpm: number){
        this._midiPlayback = new MidiPlayback(midiFileData, bpm, this._scene);
        this._onNoteOn = this._onNoteOn.bind(this);
        this._onNoteOff = this._onNoteOff.bind(this);
        this._midiPlayback.noteOnObservable.add(this._onNoteOn);
        this._midiPlayback.noteOffObservable.add(this._onNoteOff);
        
        this.material = new StandardMaterial(this._name, this._scene);
    }

    dispose(): void {
        this._midiPlayback.noteOnObservable.removeCallback(this._onNoteOn);
        this._midiPlayback.noteOffObservable.removeCallback(this._onNoteOff);
        this._midiPlayback.dispose();
        this.material.dispose();
    }

    play(): void {
        this._midiPlayback.play();
    }

    stop(): void {
        this._midiPlayback.stop();
    }

    private _onNoteOn(event: NoteOnEvent) {
        console.log(`NOTEON:${event.deltaTime}`);
        this.material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
    }

    private _onNoteOff(event: NoteOffEvent) {
        // TODO
    }
}