import { Observable, Scene } from '@babylonjs/core';
import { read, MidiFile, NoteOnEvent, NoteOffEvent } from 'midifile-ts';

export class MidiPlayback
{
    private _midiFile: MidiFile;
    private _bpm: number = 120;
    private _playing: boolean = false;
    private _dt: number = 0;
    private _secondsPerTick = 0;
    private _noteOnEvents: Array<NoteOnEvent> = new Array<NoteOnEvent>();
    private _currentNoteOnIndex: number = 0;
    private _noteOffEvents: Array<NoteOffEvent> = new Array<NoteOffEvent>();
    private _currentNoteOffIndex: number = 0;

    noteOnObservable: Observable<NoteOnEvent> = new Observable<NoteOnEvent>();
    noteOffObservable: Observable<NoteOffEvent> = new Observable<NoteOffEvent>();

    constructor(midiFileData: ArrayBuffer, bpm: number, readonly _scene: Scene){
        this._update = this._update.bind(this);
        this._scene.onBeforeRenderObservable.add(this._update);

        this._midiFile = read(midiFileData);
        this._bpm = bpm;
        const secondsPerBeat = 1.0 / (this._bpm / 60.0);
        this._secondsPerTick = secondsPerBeat / this._midiFile.header.ticksPerBeat;

        for (let m = 0; m < this._midiFile.tracks.length; m++) {
            let trackDT = 0;
            for (let n = 0; n < this._midiFile.tracks[m].length; n++)
            {
                trackDT += 1000.0 * this._secondsPerTick * this._midiFile.tracks[m][n].deltaTime;
                let type = this._midiFile.tracks[m][n].type;
                let subtype = 'none';
                if (type === 'channel')
                {
                    subtype = (<any>this._midiFile.tracks[m][n]).subtype;
                }
                
                // Note: below we convert the delta time to a global delta time compared to deltas between notes
                // This is assuming well have a static bpm
                if (subtype === 'noteOn')
                {
                    const noteOn = <NoteOnEvent>this._midiFile.tracks[m][n];
                    noteOn.deltaTime = trackDT;
                    this._noteOnEvents.push(noteOn);
                }
                else if (subtype === 'noteOff')
                {
                    const noteOff = <NoteOffEvent>this._midiFile.tracks[m][n];
                    noteOff.deltaTime = trackDT;
                    this._noteOffEvents.push(noteOff);
                }
            }
        }
    }

    dispose(): void {
        this._scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    play(): void {
        this._playing = true;
    }

    stop(): void {
        this._playing = false;
    }
    
    reset(): void {
        this._dt = 0;
        this._currentNoteOnIndex = 0;
        this._currentNoteOffIndex = 0;
    }

    private _update(scene: Scene) : void {
        if (!this._playing)
        {
            return;
        }

        this._dt += scene.deltaTime;

        let nextNoteOn = this._noteOnEvents[this._currentNoteOnIndex];
        while(!!nextNoteOn && nextNoteOn.deltaTime < this._dt)
        {
            this.noteOnObservable.notifyObservers(nextNoteOn);
            this._currentNoteOnIndex++;
            nextNoteOn = this._noteOnEvents[this._currentNoteOnIndex];
        }

        let nextNoteOff = this._noteOffEvents[this._currentNoteOffIndex];
        while(!!nextNoteOff && nextNoteOff.deltaTime < this._dt)
        {
            this.noteOffObservable.notifyObservers(nextNoteOff);
            this._currentNoteOffIndex++;
            nextNoteOff = this._noteOffEvents[this._currentNoteOffIndex];
        }
    }
}